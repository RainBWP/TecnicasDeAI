import React, { useState, useEffect, useRef } from 'react';
import './AlgoritmosGeneticos.css'

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

// Interfaz para las estadísticas
interface Statistics {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  stdDevFitness: number;
}

export function AlgoritmosGenetico() {
  // Estados para los archivos
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [baseContent, setBaseContent] = useState<string>('');
  const [resultContent, setResultContent] = useState<string>('');
  const [baseMatrix, setBaseMatrix] = useState<number[][]>([]);
  const [resultMatrix, setResultMatrix] = useState<number[][]>([]);
  
  // Estados para el algoritmo genético
  const [params, setParams] = useState<GeneticParams>({
    populationSize: 100,
    maxGenerations: 500,
    crossoverRate: 0.8,
    mutationRate: 0.02,
    elitismCount: 5,
    tournamentSize: 3
  });
  
  // Estados para los resultados
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentGeneration, setCurrentGeneration] = useState<number>(0);
  const [bestIndividual, setBestIndividual] = useState<Individual | null>(null);
  const [bestFitness, setBestFitness] = useState<number>(0);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [outputContent, setOutputContent] = useState<string>('');
  
  // Referencias para cancelar la ejecución
  const runningRef = useRef<boolean>(false);

  // Manejar la carga del archivo base
  const handleBaseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setBaseFile(file);
      
      // Leer el contenido del archivo
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setBaseContent(content);
        const matrix = parseFileContent(content);
        setBaseMatrix(matrix);
      };
      reader.readAsText(file);
    }
  };

  // Manejar la carga del archivo resultado
  const handleResultFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setResultFile(file);
      
      // Leer el contenido del archivo
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setResultContent(content);
        const matrix = parseFileContent(content);
        setResultMatrix(matrix);
      };
      reader.readAsText(file);
    }
  };
  
  // Parsear el contenido del archivo a una matriz de números
  const parseFileContent = (content: string): number[][] => {
    if (!content.trim()) {
      return [];
    }
    
    const lines = content.trim().split('\n');
    return lines.map(line => 
      line.trim().split(',').map(val => parseInt(val.trim(), 10))
    );
  };
  
  // Convertir matriz a string
  const matrixToString = (matrix: number[][]): string => {
    return matrix.map(row => row.join(',')).join('\n');
  };
  
  // Manejar cambios en los parámetros
  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: parseFloat(value)
    });
  };
  
  // Ejecutar el algoritmo genético
  const runGeneticAlgorithm = async () => {
    if (!resultMatrix.length) {
      alert("Por favor, carga el archivo resultado primero.");
      return;
    }
    
    setIsRunning(true);
    runningRef.current = true;
    setStatistics([]);
    setCurrentGeneration(0);
    
    try {
      // Inicializar población
      let population = initializePopulation(params.populationSize, resultMatrix);
      let fitnessScores: number[] = [];
      let bestIndividualFound: Individual = population[0];
      let bestFitnessFound = 0;
      let generationStats: Statistics[] = [];
      
      // Empezar la evolución
      for (let gen = 0; gen < params.maxGenerations && runningRef.current; gen++) {
        // Evaluar población
        fitnessScores = evaluatePopulation(population, resultMatrix);
        
        // Encontrar el mejor individuo de esta generación
        let bestGenIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
        let bestGenFitness = fitnessScores[bestGenIndex];
        let bestGenIndividual = population[bestGenIndex];
        
        // Actualizar el mejor individuo global si es necesario
        if (bestGenFitness > bestFitnessFound) {
          bestFitnessFound = bestGenFitness;
          bestIndividualFound = cloneIndividual(bestGenIndividual);
        }
        
        // Calcular estadísticas
        const avgFitness = fitnessScores.reduce((sum, fit) => sum + fit, 0) / fitnessScores.length;
        const variance = fitnessScores.reduce((sum, fit) => sum + Math.pow(fit - avgFitness, 2), 0) / fitnessScores.length;
        const stdDevFitness = Math.sqrt(variance);
        
        // Agregar estadísticas de esta generación
        const genStats = {
          generation: gen + 1,
          bestFitness: bestGenFitness,
          avgFitness,
          stdDevFitness
        };
        generationStats.push(genStats);
        
        // Actualizar UI
        setCurrentGeneration(gen + 1);
        setBestFitness(bestFitnessFound);
        setBestIndividual(bestIndividualFound);
        setStatistics([...generationStats]);
        
        // Esperar brevemente para no bloquear la UI
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Condición de terminación temprana si alcanzamos fitness perfecto
        if (bestGenFitness === 1) {
          break;
        }
        
        // Crear nueva población para la siguiente generación
        population = evolvePopulation(
          population, 
          fitnessScores, 
          params.crossoverRate, 
          params.mutationRate, 
          params.elitismCount, 
          params.tournamentSize
        );
      }
      
      // Actualizar el contenido de salida
      setOutputContent(matrixToString(bestIndividualFound));
      
    } finally {
      setIsRunning(false);
      runningRef.current = false;
    }
  };
  
  // Detener el algoritmo
  const stopAlgorithm = () => {
    runningRef.current = false;
  };
  
  // Inicializar población
  const initializePopulation = (size: number, targetMatrix: number[][]): Population => {
    const rows = targetMatrix.length;
    const cols = targetMatrix[0].length;
    const population: Population = [];
    
    for (let i = 0; i < size; i++) {
      const individual: Individual = [];
      for (let r = 0; r < rows; r++) {
        individual[r] = [];
        for (let c = 0; c < cols; c++) {
          // Inicializar con valores aleatorios (0 o 1)
          individual[r][c] = Math.random() < 0.5 ? 0 : 1;
        }
      }
      population.push(individual);
    }
    
    return population;
  };
  
  // Evaluar la población
  const evaluatePopulation = (population: Population, target: Individual): number[] => {
    return population.map(individual => calculateFitness(individual, target));
  };
  
  // Calcular aptitud de un individuo (porcentaje de coincidencia)
  const calculateFitness = (individual: Individual, target: Individual): number => {
    let matches = 0;
    const totalCells = target.length * target[0].length;
    
    for (let i = 0; i < target.length; i++) {
      for (let j = 0; j < target[i].length; j++) {
        if (individual[i][j] === target[i][j]) {
          matches++;
        }
      }
    }
    
    return matches / totalCells;
  };
  
  // Evolucionar la población
  const evolvePopulation = (
    population: Population, 
    fitnessScores: number[], 
    crossoverRate: number, 
    mutationRate: number, 
    elitismCount: number, 
    tournamentSize: number
  ): Population => {
    const newPopulation: Population = [];
    
    // Elitismo: mantener los mejores individuos
    const elites = getElites(population, fitnessScores, elitismCount);
    for (const elite of elites) {
      newPopulation.push(cloneIndividual(elite));
    }
    
    // Generar el resto de la población mediante selección, cruce y mutación
    while (newPopulation.length < population.length) {
      const parent1 = tournamentSelection(population, fitnessScores, tournamentSize);
      const parent2 = tournamentSelection(population, fitnessScores, tournamentSize);
      const offspring = crossover(parent1, parent2, crossoverRate);
      mutate(offspring, mutationRate);
      newPopulation.push(offspring);
    }
    
    return newPopulation;
  };
  
  // Selección por torneo
  const tournamentSelection = (
    population: Population, 
    fitnessScores: number[], 
    tournamentSize: number
  ): Individual => {
    let bestIndex = Math.floor(Math.random() * population.length);
    let bestFitness = fitnessScores[bestIndex];
    
    for (let i = 1; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      if (fitnessScores[randomIndex] > bestFitness) {
        bestIndex = randomIndex;
        bestFitness = fitnessScores[randomIndex];
      }
    }
    
    return cloneIndividual(population[bestIndex]);
  };
  
  // Operador de cruce
  const crossover = (parent1: Individual, parent2: Individual, crossoverRate: number): Individual => {
    if (Math.random() > crossoverRate) {
      return cloneIndividual(parent1);
    }
    
    const child: Individual = [];
    
    for (let i = 0; i < parent1.length; i++) {
      child[i] = [];
      for (let j = 0; j < parent1[i].length; j++) {
        // Cruce uniforme: 50% de probabilidad para cada padre
        child[i][j] = Math.random() < 0.5 ? parent1[i][j] : parent2[i][j];
      }
    }
    
    return child;
  };
  
  // Operador de mutación
  const mutate = (individual: Individual, mutationRate: number): void => {
    for (let i = 0; i < individual.length; i++) {
      for (let j = 0; j < individual[i].length; j++) {
        if (Math.random() < mutationRate) {
          // Invertir el bit
          individual[i][j] = individual[i][j] === 0 ? 1 : 0;
        }
      }
    }
  };
  
  // Obtener los mejores individuos (élite)
  const getElites = (population: Population, fitnessScores: number[], count: number): Individual[] => {
    // Crear array de índices y ordenarlos por fitness
    const indices = Array.from({ length: population.length }, (_, i) => i);
    indices.sort((a, b) => fitnessScores[b] - fitnessScores[a]);
    
    // Obtener los mejores individuos
    return indices.slice(0, count).map(index => population[index]);
  };
  
  // Clonar un individuo para evitar referencias
  const cloneIndividual = (individual: Individual): Individual => {
    return individual.map(row => [...row]);
  };
  
  // Descargar el resultado como archivo de texto
  const downloadResult = () => {
    if (!outputContent) return;
    
    const blob = new Blob([outputContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado_genetico.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Algoritmo Genético</h1>
      
      {/* Carga de archivos */}
      <div className='carga-archivos'>
        <div >
          <h2>Archivo Base</h2>
          <div>
            <input 
              type="file" 
              onChange={handleBaseFileChange}
              accept=".txt,.csv"
              disabled={isRunning}
            />
            {baseFile && (
              <div>
                Archivo cargado: {baseFile.name}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2>Archivo Resultado</h2>
          <input 
            type="file" 
            onChange={handleResultFileChange}
            accept=".txt,.csv"
            disabled={isRunning}
          />
          {resultFile && (
            <div>
              Archivo cargado: {resultFile.name}
            </div>
          )}
        </div>
      </div>
      
      {/* Parámetros del algoritmo */}
      <div>
        <h2>Parámetros del Algoritmo</h2>
        <div className='parametros-geneticos'>
          <div>
            <label>Tamaño de población</label>
            <input 
              type="number" 
              name="populationSize" 
              value={params.populationSize} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="10"
            />
          </div>
          <div>
            <label>Generaciones máximas</label>
            <input 
              type="number" 
              name="maxGenerations" 
              value={params.maxGenerations} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="1"
            />
          </div>
          <div>
            <label>Tasa de cruce</label>
            <input 
              type="number" 
              name="crossoverRate" 
              value={params.crossoverRate} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
              max="1"
              step="0.01"
            />
          </div>
          <div>
            <label>Tasa de mutación</label>
            <input 
              type="number" 
              name="mutationRate" 
              value={params.mutationRate} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
              max="1"
              step="0.001"
            />
          </div>
          <div>
            <label>Número de élites</label>
            <input 
              type="number" 
              name="elitismCount" 
              value={params.elitismCount} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
            />
          </div>
          <div>
            <label>Tamaño de torneo</label>
            <input 
              type="number" 
              name="tournamentSize" 
              value={params.tournamentSize} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="2"
            />
          </div>
        </div>
      </div>
      
      {/* Botones de control */}
      <div className='botones-ejecutar'>
        <button 
          onClick={runGeneticAlgorithm}
          disabled={isRunning || !resultFile}
        >
          Ejecutar Algoritmo
        </button>
        
        {isRunning && (
          <button 
            onClick={stopAlgorithm}
          >
            Detener
          </button>
        )}
        
        {outputContent && (
          <button 
            onClick={downloadResult}
          >
            Descargar Resultado
          </button>
        )}
      </div>
      
      {/* Progreso y Resultados */}
      <div>
        {/* Estadísticas de ejecución */}
        <div>
          <h2>Estadísticas</h2>
          {isRunning && (
            <div>
              <p>Generación actual: {currentGeneration}</p>
              <p>Mejor aptitud: {bestFitness.toFixed(4)}</p>
            </div>
          )}
          
          {statistics.length > 0 && (
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Gen</th>
                    <th>Mejor</th>
                    <th>Media</th>
                    <th>Desv. Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat, index) => (
                    <tr key={index}>
                      <td>{stat.generation}</td>
                      <td>{stat.bestFitness.toFixed(4)}</td>
                      <td>{stat.avgFitness.toFixed(4)}</td>
                      <td>{stat.stdDevFitness.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Visualización del mejor individuo */}
        <div>
          <h2>Mejor Individuo</h2>
          {bestIndividual && (
            <div>
              <pre>
                {outputContent}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Estadísticas finales */}
      {statistics.length > 0 && !isRunning && (
        <div>
          <h2>Estadísticas Finales</h2>
          <div>
            <div>
              <h3>Todos los valores</h3>
              <p>Generaciones ejecutadas: {currentGeneration}</p>
              <p>Mejor aptitud: {bestFitness.toFixed(4)}</p>
              <p>Media de aptitud: {statistics[statistics.length - 1].avgFitness.toFixed(4)}</p>
              <p>Desviación estándar: {statistics[statistics.length - 1].stdDevFitness.toFixed(4)}</p>
            </div>
            <div>
              <h3>Mejores valores</h3>
              <p>Media de los mejores: {
                (statistics.reduce((sum, stat) => sum + stat.bestFitness, 0) / statistics.length).toFixed(4)
              }</p>
              <p>Desviación de los mejores: {
                Math.sqrt(
                  statistics.reduce((sum, stat) => {
                    const mean = statistics.reduce((s, st) => s + st.bestFitness, 0) / statistics.length;
                    return sum + Math.pow(stat.bestFitness - mean, 2);
                  }, 0) / statistics.length
                ).toFixed(4)
              }</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlgoritmosGenetico;