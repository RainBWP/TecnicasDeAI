import React, { useState, useEffect, useRef } from 'react';
import GeneticoFileShow from './GeneticoFileShow';
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
    tournamentSize: 3
  });
  
  // Estados para los resultados
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentGeneration, setCurrentGeneration] = useState<number>(0);
  const [bestIndividual, setBestIndividual] = useState<Individual | null>(null);
  const [bestFitness, setBestFitness] = useState<number>(0);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [outputContent, setOutputContent] = useState<string>('');
  const [generationsWithNoImprovement, setGenerationsWithNoImprovement] = useState<number>(0);
  const [resetThreshold] = useState<number>(50); // Umbral para resetear (ajustable)
  
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
    
    // Validar para UI
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
          // Resetear contador cuando hay mejora
          setGenerationsWithNoImprovement(0);
        } else {
          // Incrementar contador cuando no hay mejora
          const newGenerationsWithNoImprovement = generationsWithNoImprovement + 1;
          setGenerationsWithNoImprovement(newGenerationsWithNoImprovement);
          
          // Verificar si debemos resetear parte de la población
          if (newGenerationsWithNoImprovement >= resetThreshold) {
            console.log(`Reseteando población después de ${resetThreshold} generaciones sin mejora`);
            
            // Mantener los top 10% de individuos, resetear el resto
            const eliteCount = Math.max(1, Math.floor(population.length * 0.1));
            
            // Ordenar índices por fitness
            const sortedIndices = fitnessScores
              .map((score, index) => ({ score, index }))
              .sort((a, b) => b.score - a.score)
              .map(item => item.index);
            
            // Crear nueva población con elites y el resto random
            const newPopulation: Population = [];
            
            // Mantener elites
            for (let i = 0; i < eliteCount; i++) {
              newPopulation.push(cloneIndividual(population[sortedIndices[i]]));
            }
            
            // Resetear el resto
            for (let i = eliteCount; i < population.length; i++) {
              newPopulation.push(createRandomIndividual(resultMatrix.length, resultMatrix[0].length));
            }
            
            // Reemplazar población
            population = newPopulation;
            
            // Resetear contador
            setGenerationsWithNoImprovement(0);
          }
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
    return population.map(individual => calcularFitness(individual, target));
  };
  
  // Calcular aptitud de un individuo (porcentaje de coincidencia)
  const calcularFitness = (individual: Individual, target: Individual): number => {
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
    tournamentSize: number
  ): Population => {
    const newPopulation: Population = [];
    
    
    // Generar la nueva población mediante selección, cruce y mutación
    while (newPopulation.length < population.length) {
      const padre1 = tournamentSelection(population, fitnessScores, tournamentSize);
      const padre2 = ruleta(population, fitnessScores);

      const offspring = crossover(padre1, padre2, crossoverRate);

      mutacion(offspring, mutationRate);

      const offspring2 = crossoverSinglePoint(padre1, padre2);

      mutacion(offspring2, mutationRate);

      newPopulation.push(offspring);
      if (newPopulation.length < population.length) {
      newPopulation.push(offspring2);
      }
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
  const crossover = (padre1: Individual, padre2: Individual, crossoverRate: number): Individual => {
    if (Math.random() > crossoverRate) {
      return cloneIndividual(padre1);
    }
    
    const hijo: Individual = [];
    
    for (let i = 0; i < padre1.length; i++) {
      hijo[i] = [];
      for (let j = 0; j < padre1[i].length; j++) {
        // Cruce uniforme: 50% de probabilidad para cada padre
        hijo[i][j] = Math.random() < 0.5 ? padre1[i][j] : padre2[i][j];
      }
    }
    
    return hijo;
  };
  
  // Operador de mutación
  const mutacion = (individual: Individual, mutationRate: number): void => {
    for (let i = 0; i < individual.length; i++) {
      for (let j = 0; j < individual[i].length; j++) {
        if (Math.random() < mutationRate) {
          // Invertir el bit
          individual[i][j] = individual[i][j] === 0 ? 1 : 0;
        }
      }
    }
  };

  // Operador Crossover de un punto
  const crossoverSinglePoint = (padre1: Individual, padre2: Individual): Individual => {
    const rows = padre1.length;
    const cols = padre1[0].length;
    const crossoverPoint = Math.floor(.5 * rows);
    
    const hijo: Individual = [];
    
    for (let i = 0; i < rows; i++) {
      hijo[i] = [];
      for (let j = 0; j < cols; j++) {
        if (i < crossoverPoint) {
          hijo[i][j] = padre1[i][j];
        } else {
          hijo[i][j] = padre2[i][j];
        }
      }
    }
    
    return hijo;
  };

  // Operador Ruleta 
  const ruleta = (population: Population,
    fitnessScores: number[]
  ): Individual => {
    const totalFitness = fitnessScores.reduce((sum, fit) => sum + fit, 0);
    const randomValue = Math.random() * totalFitness;
    
    let cumulativeSum = 0;
    for (let i = 0; i < fitnessScores.length; i++) {
      cumulativeSum += fitnessScores[i];
      if (cumulativeSum >= randomValue) {
        return cloneIndividual(population[i]);
      }
    }
    
    return cloneIndividual(population[fitnessScores.length - 1]); // En caso de error
  };

  // Crear individuo aleatorio
  const createRandomIndividual = (rows: number, cols: number): Individual => {
    const individual: Individual = [];
    for (let i = 0; i < rows; i++) {
      individual[i] = [];
      for (let j = 0; j < cols; j++) {
        individual[i][j] = Math.random() < 0.5 ? 0 : 1;
      }
    }
    return individual;
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
              accept=".txt"
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
            accept=".txt"
            disabled={isRunning}
          />
          {resultFile && (
            <div>
              Archivo cargado: {resultFile.name}
            </div>
          )}
        </div>
      </div>

      <div >
        { (baseFile && resultFile) && (
            <div className='botones-ejecutar'>
              <GeneticoFileShow matrix={baseMatrix} />
              <GeneticoFileShow matrix={resultMatrix} />
            </div>
        )}
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

        <h2>Vista Previa</h2>
        {resultMatrix.length > 0 && (
          <div>
            {bestIndividual ? (
              <GeneticoFileShow 
              matrix={bestIndividual} 
              modCellsize={4}/>
            ) : (
              <p>Ejecute el algoritmo para ver resultados</p>
            )}
            {bestFitness > 0 && <p><b>Fitness: </b> {bestFitness.toFixed(4)}</p>}
          </div>
        )}

        {/* Estadísticas finales */}
        {statistics.length > 0 && !isRunning && (
          <div>
            <h2>Estadísticas Finales</h2>
            <div className='estadisticas'>
              <div >
                <h3>Todos los valores</h3>
                <div className='resultados'>
                  <p>Generaciones ejecutadas: </p>
                  <b>{currentGeneration}</b>
                  <p>Mejor aptitud: </p>
                  <b>{bestFitness.toFixed(4)}</b>
                  <p>Media de aptitud: </p>
                  <b>{statistics[statistics.length - 1].avgFitness.toFixed(4)}</b>
                  <p>Desviación estándar: </p>
                  <b>{statistics[statistics.length - 1].stdDevFitness.toFixed(4)}</b>
                </div>
                
              </div>
              <div>
                <h3>Mejores valores</h3>
                <div className='resultados'>
                  <p>Media de los mejores: </p>
                  <b>
                    {(statistics.reduce((sum, stat) => sum + stat.bestFitness, 0) / statistics.length).toFixed(4)}
                  </b>
                  <p>Desviación de los mejores: </p>
                  <b>{
                    Math.sqrt(
                      statistics.reduce((sum, stat) => {
                        const mean = statistics.reduce((s, st) => s + st.bestFitness, 0) / statistics.length;
                        return sum + Math.pow(stat.bestFitness - mean, 2);
                      }, 0) / statistics.length
                    ).toFixed(4)
                  }</b>
                </div>
              </div>
            </div>
          </div>
        )}
          
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
        
        
      {/* <div>
        <h2>Mejor Individuo</h2>
        {bestIndividual && bestIndividual.length > 0 && (
          <div>
            <GeneticoFileShow matrix={bestIndividual} />
            <h3>Contenido:</h3>
            <pre>{matrixToString(bestIndividual)}</pre>
          </div>
        )}
        </div> */}
      </div>
      
      
    </div>
  );
}

export default AlgoritmosGenetico;