// Definición de tipos
type Individual = number[][]; // Un individuo es una matriz 2D de 0s y 1s
type Population = Individual[]; // Una población es un conjunto de individuos

// Interfaz para parámetros configurables del algoritmo genético
interface GeneticParams {
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  elitismCount: number;
  tournamentSize: number;
}

// Clase principal del algoritmo genético
export class GeneticAlgorithm {
  private params: GeneticParams;
  private population: Population;
  private fitnessScores: number[];
  private bestIndividual: Individual;
  private bestFitness: number;
  private target: Individual;
  private base: Individual;
  private generations: number;
  private bestFitnessHistory: number[];
  private avgFitnessHistory: number[];
  private stdDevFitnessHistory: number[];
  
  // Función de callback para actualizar UI
  private onGenerationComplete: (data: {
    generation: number,
    bestFitness: number,
    avgFitness: number,
    stdDevFitness: number,
    bestIndividual: Individual
  }) => void;
  
  constructor(
    params: GeneticParams, 
    target: Individual, 
    base: Individual,
    onGenerationComplete?: (data: any) => void
  ) {
    this.params = params;
    this.target = target;
    this.base = base;
    this.population = [];
    this.fitnessScores = [];
    this.bestIndividual = [];
    this.bestFitness = -Infinity;
    this.generations = 0;
    this.bestFitnessHistory = [];
    this.avgFitnessHistory = [];
    this.stdDevFitnessHistory = [];
    this.onGenerationComplete = onGenerationComplete || (() => {});
  }

  // Inicializar población con individuos aleatorios
  initialize(): void {
    this.population = [];
    for (let i = 0; i < this.params.populationSize; i++) {
      this.population.push(this.generateIndividual());
    }
    this.evaluatePopulation();
  }

  // Generar un individuo aleatorio basado en base
  generateIndividual(): Individual {
    // Si base está vacío, crear una matriz de tamaño adecuado
    const rows = this.target.length;
    const cols = this.target[0].length;
    const individual: Individual = [];

    for (let i = 0; i < rows; i++) {
      individual[i] = [];
      for (let j = 0; j < cols; j++) {
        // Inicializar con una probabilidad del 50% para 0 o 1
        individual[i][j] = Math.random() < 0.5 ? 0 : 1;
      }
    }

    return individual;
  }

  // Evaluar la aptitud de un individuo (% de similitud con el objetivo)
  evaluateFitness(individual: Individual): number {
    let matches = 0;
    const totalCells = this.target.length * this.target[0].length;

    for (let i = 0; i < this.target.length; i++) {
      for (let j = 0; j < this.target[i].length; j++) {
        if (individual[i][j] === this.target[i][j]) {
          matches++;
        }
      }
    }

    return matches / totalCells;
  }

  // Evaluar toda la población
  evaluatePopulation(): void {
    this.fitnessScores = [];
    let bestFitnessThisGen = -Infinity;
    let bestIndividualIndex = 0;

    for (let i = 0; i < this.population.length; i++) {
      const fitness = this.evaluateFitness(this.population[i]);
      this.fitnessScores[i] = fitness;

      if (fitness > bestFitnessThisGen) {
        bestFitnessThisGen = fitness;
        bestIndividualIndex = i;
      }
    }

    // Actualizar el mejor individuo global si es necesario
    if (bestFitnessThisGen > this.bestFitness) {
      this.bestFitness = bestFitnessThisGen;
      this.bestIndividual = this.cloneIndividual(this.population[bestIndividualIndex]);
    }

    // Calcular estadísticas
    const avgFitness = this.fitnessScores.reduce((sum, fit) => sum + fit, 0) / this.fitnessScores.length;
    const variance = this.fitnessScores.reduce((sum, fit) => sum + Math.pow(fit - avgFitness, 2), 0) / this.fitnessScores.length;
    const stdDevFitness = Math.sqrt(variance);

    this.bestFitnessHistory.push(bestFitnessThisGen);
    this.avgFitnessHistory.push(avgFitness);
    this.stdDevFitnessHistory.push(stdDevFitness);
  }

  // Método de selección por torneo
  tournamentSelection(): Individual {
    let bestIndex = Math.floor(Math.random() * this.population.length);
    let bestFitness = this.fitnessScores[bestIndex];

    for (let i = 1; i < this.params.tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      if (this.fitnessScores[randomIndex] > bestFitness) {
        bestIndex = randomIndex;
        bestFitness = this.fitnessScores[randomIndex];
      }
    }

    return this.cloneIndividual(this.population[bestIndex]);
  }

  // Operador de cruce (crossover)
  crossover(parent1: Individual, parent2: Individual): Individual {
    if (Math.random() > this.params.crossoverRate) {
      return this.cloneIndividual(parent1);
    }

    const child: Individual = [];
    
    for (let i = 0; i < parent1.length; i++) {
      child[i] = [];
      for (let j = 0; j < parent1[i].length; j++) {
        // Cruce uniforme: 50% de probabilidad para cada gen de cada padre
        child[i][j] = Math.random() < 0.5 ? parent1[i][j] : parent2[i][j];
      }
    }

    return child;
  }

  // Operador de mutación
  mutate(individual: Individual): void {
    for (let i = 0; i < individual.length; i++) {
      for (let j = 0; j < individual[i].length; j++) {
        if (Math.random() < this.params.mutationRate) {
          // Invertir el bit (0->1, 1->0)
          individual[i][j] = individual[i][j] === 0 ? 1 : 0;
        }
      }
    }
  }

  // Clonar un individuo (para evitar problemas de referencia)
  cloneIndividual(individual: Individual): Individual {
    return individual.map(row => [...row]);
  }

  // Proceso principal de evolución
  evolve(): void {
    this.initialize();

    for (let generation = 0; generation < this.params.maxGenerations; generation++) {
      this.generations = generation + 1;
      
      // Crear nueva población
      const newPopulation: Population = [];

      // Elitismo: mantener los mejores individuos
      const elites = this.getElites();
      for (const elite of elites) {
        newPopulation.push(this.cloneIndividual(elite));
      }

      // Generar resto de la población mediante selección, cruce y mutación
      while (newPopulation.length < this.params.populationSize) {
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        const offspring = this.crossover(parent1, parent2);
        this.mutate(offspring);
        newPopulation.push(offspring);
      }

      // Reemplazar la población anterior
      this.population = newPopulation;
      this.evaluatePopulation();

      // Callback con datos de esta generación
      this.onGenerationComplete({
        generation: this.generations,
        bestFitness: this.bestFitnessHistory[this.generations - 1],
        avgFitness: this.avgFitnessHistory[this.generations - 1],
        stdDevFitness: this.stdDevFitnessHistory[this.generations - 1],
        bestIndividual: this.bestIndividual
      });

      // Condición de terminación anticipada si se encuentra solución perfecta
      if (this.bestFitness === 1) {
        break;
      }
    }
  }

  // Obtener mejores individuos para elitismo
  getElites(): Individual[] {
    // Crear un array de objetos {index, fitness} para ordenar
    const indexedFitness = this.fitnessScores.map((fitness, index) => ({ index, fitness }));
    
    // Ordenar por fitness en orden descendente
    indexedFitness.sort((a, b) => b.fitness - a.fitness);
    
    // Extraer los mejores individuos
    const elites: Individual[] = [];
    for (let i = 0; i < this.params.elitismCount && i < this.population.length; i++) {
      elites.push(this.cloneIndividual(this.population[indexedFitness[i].index]));
    }
    
    return elites;
  }

  // Estadísticas finales
  getStatistics() {
    // Media y desviación de todos los valores de aptitud
    const allFitnessMean = this.fitnessScores.reduce((sum, fit) => sum + fit, 0) / this.fitnessScores.length;
    const allFitnessVariance = this.fitnessScores.reduce((sum, fit) => sum + Math.pow(fit - allFitnessMean, 2), 0) / this.fitnessScores.length;
    const allFitnessStdDev = Math.sqrt(allFitnessVariance);
    
    // Media y desviación de los mejores valores de aptitud
    const bestFitnessMean = this.bestFitnessHistory.reduce((sum, fit) => sum + fit, 0) / this.bestFitnessHistory.length;
    const bestFitnessVariance = this.bestFitnessHistory.reduce((sum, fit) => sum + Math.pow(fit - bestFitnessMean, 2), 0) / this.bestFitnessHistory.length;
    const bestFitnessStdDev = Math.sqrt(bestFitnessVariance);
    
    return {
      generations: this.generations,
      bestFitness: this.bestFitness,
      allFitnessMean,
      allFitnessStdDev,
      bestFitnessMean,
      bestFitnessStdDev,
      bestFitnessHistory: this.bestFitnessHistory,
      avgFitnessHistory: this.avgFitnessHistory,
      stdDevFitnessHistory: this.stdDevFitnessHistory
    };
  }

  // Obtener el mejor individuo encontrado
  getBestIndividual(): Individual {
    return this.bestIndividual;
  }

  // Convertir individuo a formato de texto para guardarlo
  individualToString(individual: Individual): string {
    return individual.map(row => row.join(',')).join('\n');
  }
}

// Funciones de utilidad para procesar archivos
export function parseFileContent(content: string): number[][] {
  if (!content.trim()) {
    return []; // Manejar archivo vacío
  }
  
  const lines = content.trim().split('\n');
  return lines.map(line => 
    line.trim().split(',').map(val => parseInt(val.trim(), 10))
  );
}

// Función para ejecutar el algoritmo completo
export async function runGeneticAlgorithm(
  baseContent: string, 
  resultContent: string, 
  params: GeneticParams,
  onGenerationComplete: (data: any) => void
): Promise<{
  bestIndividual: number[][],
  statistics: any,
  outputText: string
}> {
  // Parsear archivos
  const baseMatrix = parseFileContent(baseContent);
  const resultMatrix = parseFileContent(resultContent);
  
  // Si base está vacío, crear una matriz del mismo tamaño que result
  const inputMatrix = baseMatrix.length > 0 ? baseMatrix : 
    Array(resultMatrix.length).fill(0).map(() => 
      Array(resultMatrix[0].length).fill(0)
    );
  
  // Crear instancia del algoritmo genético
  const ga = new GeneticAlgorithm(params, resultMatrix, inputMatrix, onGenerationComplete);
  
  // Ejecutar evolución
  ga.evolve();
  
  // Obtener resultados
  const bestIndividual = ga.getBestIndividual();
  const statistics = ga.getStatistics();
  const outputText = ga.individualToString(bestIndividual);
  
  return {
    bestIndividual,
    statistics,
    outputText
  };
}

// Componente React para la interfaz de usuario
export function GeneticAlgorithmComponent() {
  // Aquí implementarías tu interfaz de usuario con React
  // Este es un ejemplo básico de cómo podrías usar el algoritmo desde un componente

  const runAlgorithm = async (baseFile: File, resultFile: File) => {
    try {
      // Leer contenido de archivos
      const baseContent = await readFileAsText(baseFile);
      const resultContent = await readFileAsText(resultFile);
      
      // Parámetros configurables desde la UI
      const params: GeneticParams = {
        populationSize: 100,
        maxGenerations: 500,
        crossoverRate: 0.8,
        mutationRate: 0.01,
        elitismCount: 5,
        tournamentSize: 3
      };
      
      // Función de callback para actualizar UI con progreso
      const onGenerationComplete = (data: any) => {
        console.log(`Generación ${data.generation}, Aptitud: ${data.bestFitness.toFixed(4)}`);
        // Actualizar UI con estos datos
      };
      
      // Ejecutar algoritmo
      const { bestIndividual, statistics, outputText } = await runGeneticAlgorithm(
        baseContent, resultContent, params, onGenerationComplete
      );
      
      // Mostrar resultados y estadísticas en la UI
      console.log("Estadísticas finales:", statistics);
      
      // Descargar archivo de resultado
      downloadTextFile(outputText, "genetic_output.txt");
      
    } catch (error) {
      console.error("Error al ejecutar el algoritmo:", error);
    }
  };
  
  // Leer archivo como texto
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  };
  
  // Descargar archivo de texto
  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Retornar el JSX para la interfaz de usuario
  return null; // Implementar UI según necesidades
}