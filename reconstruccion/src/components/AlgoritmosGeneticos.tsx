import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GeneticoFileShow from './GeneticoFileShow';
import './AlgoritmosGeneticos.css'

// Definición de tipos
type Individual = number[][]; 
type Population = Individual[]; 

/* // Interfaz para parámetros configurables del algoritmo genético
interface GeneticParams {
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  tournamentSize: number;
} */

// Interfaz para Memetico Algorithm
interface MemeticoParams {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  noiseRate: number;
  maxIntentos: number;
}

// Interfaz para las estadísticas
interface Statistics {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  stdDevFitness: number;
}

export function AlgoritmosGenetico() {
  const navigate = useNavigate();
  // Estados para los archivos
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [, setBaseContent] = useState<string>('');
  const [, setResultContent] = useState<string>('');
  const [baseMatrix, setBaseMatrix] = useState<number[][]>([]);
  const [resultMatrix, setResultMatrix] = useState<number[][]>([]);
  
/*   // Estados para el algoritmo genético
  const [params, setParams] = useState<GeneticParams>({
    populationSize: 100,
    maxGenerations: 500,
    crossoverRate: 0.8,
    mutationRate: 0.02,
    tournamentSize: 3
  }); */

  const [memeticoParams, setMemeticoParams] = useState<MemeticoParams>({
    populationSize: 20,
    maxGenerations: 1000,
    mutationRate: 0.01,
    crossoverRate: 0.4,
    noiseRate: 0.5,
    maxIntentos: 10
  });
  
  // Estados para los resultados
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentGeneration, setCurrentGeneration] = useState<number>(0);
  const [bestIndividual, setBestIndividual] = useState<Individual | null>(null);
  const [bestFitness, setBestFitness] = useState<number>(0);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [outputContent, setOutputContent] = useState<string>('');
  const [generationsWithNoImprovement, setGenerationsWithNoImprovement] = useState<number>(0);
  
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
    setMemeticoParams({
      ...memeticoParams,
      [name]: parseFloat(value)
    });
  };


  // Manejar cambios en los parámetros de Memetico
  const runMemeticoAlgorithm = async () => {
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
      let poblacion = initializePopulation(memeticoParams.populationSize, resultMatrix, baseMatrix);
      let fitnessScores: number[] = [];
      let mejorIndividuoEncontrado: Individual = poblacion[0];
      let mejorFitnessEncontrado = 0;
      let estadisticasGeneracion: Statistics[] = [];

      let nuevaPoblacion: Population = [];
      let padre1: Individual;
      let padre2: Individual;
      let off1: Individual;
      let off2: Individual;
      let fitnessOff1: number;
      let fitnessOff2: number;


      // Empezar memetico
      for (let gen = 0; gen < memeticoParams.maxGenerations && runningRef.current; gen++) {
        // Evaluar población
        fitnessScores = evaluatePopulation(poblacion, resultMatrix);

        // Encontrar el mejor y el peor individuo de esta generación
        let mejorGenIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
        let peorGenIndex = fitnessScores.indexOf(Math.min(...fitnessScores));
        let mejorGenFitness = fitnessScores[mejorGenIndex];
        let peorGenFitness = fitnessScores[peorGenIndex];
        let mejorGenIndividuo = poblacion[mejorGenIndex];
        // let peorGenIndividuo = poblacion[peorGenIndex];

        // Actualizar el mejor individuo global si es necesario
        if (mejorGenFitness > mejorFitnessEncontrado) {
          mejorFitnessEncontrado = mejorGenFitness;
          mejorIndividuoEncontrado = cloneIndividual(mejorGenIndividuo);
          setGenerationsWithNoImprovement(0);
        } else {
          const newGenerationsWithNoImprovement = generationsWithNoImprovement + 1;
          setGenerationsWithNoImprovement(newGenerationsWithNoImprovement);
        }

        // Resetear nueva población
        nuevaPoblacion = [];

        // Mantener el elitismo (mejor individuo pasa directamente)
        nuevaPoblacion.push(cloneIndividual(mejorGenIndividuo));

        while (nuevaPoblacion.length < memeticoParams.populationSize) {
          // 3. Utilizar torneo binario para seleccionar padres
          padre1 = binaryTournamentSelection(poblacion, fitnessScores);
          padre2 = binaryTournamentSelection(poblacion, fitnessScores);
  
          // 4. Aplicar operador de cruce para crear descendencia
          off1 = crossover(padre1, padre2, memeticoParams.crossoverRate);
          off2 = crossoverSinglePoint(padre1, padre2);
  
          // 5. Aplicar mutación a Off1 y Off2
          mutacion(off1, memeticoParams.mutationRate);
          mutacion(off2, memeticoParams.mutationRate);
  
          // 6. Evaluar Off1 y Off2
          fitnessOff1 = calcularFitness(off1, resultMatrix);
          fitnessOff2 = calcularFitness(off2, resultMatrix);
  
          // 7-12. Para cada descendiente, invocar mecanismo adaptativo PLS
          const offspring = [
            { individual: off1, fitness: fitnessOff1 },
            { individual: off2, fitness: fitnessOff2 }
          ];
  
          for (const off of offspring) {
            // 8. Invocar mecanismo adaptativo PLS
            // Si el descendiente es mejor que el peor, PLS = 1, de lo contrario PLS = 0.0625
            const pls = off.fitness > peorGenFitness ? 1 : 0.0625;
  
            // 9-11. Si PLS cumple la condición, realizar optimización de meme
            if (Math.random() < pls) {
              // 10. Realizar optimización de meme para el descendiente
              memeOptimization(off.individual, resultMatrix);
              
              // Reevaluar después de la optimización
              off.fitness = calcularFitness(off.individual, resultMatrix);
            }
  
            // 13. Emplear reemplazo estándar para Off1 y Off2
            if (nuevaPoblacion.length < memeticoParams.populationSize && off.fitness > peorGenFitness) {
              nuevaPoblacion.push(off.individual);
            }
          }
        }

        // Reemplazar la población con la nueva generación
        poblacion = nuevaPoblacion;

        // Calcular estadísticas
        fitnessScores = evaluatePopulation(poblacion, resultMatrix);
        const avgFitness = fitnessScores.reduce((sum, fit) => sum + fit, 0) / fitnessScores.length;
        const variance = fitnessScores.reduce((sum, fit) => sum + Math.pow(fit - avgFitness, 2), 0) / fitnessScores.length;
        const stdDevFitness = Math.sqrt(variance);

        // Agregar estadísticas de esta generación
        const genStats: Statistics = {
          generation: gen + 1,
          bestFitness: mejorGenFitness,
          avgFitness,
          stdDevFitness
        };
        estadisticasGeneracion.push(genStats);

        // Actualizar UI
        setCurrentGeneration(gen + 1);
        setBestFitness(mejorFitnessEncontrado);
        setBestIndividual(mejorIndividuoEncontrado);
        setStatistics([...estadisticasGeneracion]);

        // Esperar brevemente para no bloquear la UI
        await new Promise(resolve => setTimeout(resolve, 0));

        // Condición de terminación temprana si alcanzamos fitness perfecto
        if (mejorGenFitness === 1) {
          break;
        }

        // 15. Retornar el mejor cromosoma
        setOutputContent(matrixToString(mejorIndividuoEncontrado));
      }
    } finally {
      setIsRunning(false);
      runningRef.current = false;
    }
  }
/*   
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
  }; */
  
  // Detener el algoritmo
  const stopAlgorithm = () => {
    runningRef.current = false;
  };
  
  // Inicializar población
  const initializePopulation = (size: number, targetMatrix: number[][], baseMatrix: number[][]): Population => {
    const resultRows = targetMatrix.length;
    const resultCols = targetMatrix[0].length;
    const baseRows = baseMatrix.length;
    const baseCols = baseMatrix[0].length;
    const population: Population = [];
    const noise = memeticoParams.noiseRate; // Ruido para la inicialización
    
    if (resultRows !== baseRows || resultCols !== baseCols) {
      console.error("Las matrices de entrada no tienen las mismas dimensiones. Se usan aleatorios.");
      for (let i = 0; i < size; i++) {
        const individual: Individual = [];
        for (let r = 0; r < resultRows; r++) {
          individual[r] = [];
          for (let c = 0; c < resultCols; c++) {
            // Inicializar con valores aleatorios (0 o 1)
            individual[r][c] = Math.random() < 0.5 ? 0 : 1;
          }
        }
        population.push(individual);
      }
    } else {
      // Si las dimensiones son iguales, inicializar con la matriz base
      for (let i = 0; i < size; i++) {
        const individual: Individual = [];
        for (let r = 0; r < resultRows; r++) {
          individual[r] = [];
          for (let c = 0; c < resultCols; c++) {
            // Decidir si usar el valor de la matriz base o ruido
            if (Math.random() < noise) {
              individual[r][c] = baseMatrix[r][c] === 0 ? 1 : 0; // Invertir el bit
            } else {
              individual[r][c] = baseMatrix[r][c]; // Usar el valor de la matriz base
            }
          }
        }
        population.push(individual);
      }
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
  
  // Operador de cruce
  const crossover = (padre1: Individual, padre2: Individual, crossoverRate: number): Individual => {
    const hijo: Individual = [];
    
    for (let i = 0; i < padre1.length; i++) {
      hijo[i] = [];
      for (let j = 0; j < padre1[i].length; j++) {
        hijo[i][j] = Math.random() < crossoverRate ? padre1[i][j] : padre2[i][j];
      }
    }
    
    return hijo;
  };
  
  // Operador de mutación
  const mutacion = (individual: Individual, mutationRate: number): void => {
    for (let i = 0; i < individual.length; i++) {
      if (Math.random() < mutationRate) {
        // Aplicar ruido a la fila completa
        for (let j = 0; j < individual[i].length; j++) {
          if (Math.random() < mutationRate) {
            // Invertir el bit
            individual[i][j] = individual[i][j] === 0 ? 1 : 0;
          }
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

  // Función de selección por torneo de 4 individuos (luchando 2 y 2)
  const binaryTournamentSelection = (population: Population, fitnessScores: number[]): Individual => {
    // Seleccionar cuatro individuos al azar
    const idx1 = Math.floor(Math.random() * population.length);
    let idx2 = Math.floor(Math.random() * population.length);
    while (idx2 === idx1 && population.length > 1) {
      idx2 = Math.floor(Math.random() * population.length);
    }

    const idx3 = Math.floor(Math.random() * population.length);
    let idx4 = Math.floor(Math.random() * population.length);
    while ((idx4 === idx3 || idx4 === idx1 || idx4 === idx2) && population.length > 1) {
      idx4 = Math.floor(Math.random() * population.length);
    }

    // Realizar torneo entre los pares
    const winner1 = fitnessScores[idx1] > fitnessScores[idx2] ? idx1 : idx2;
    const winner2 = fitnessScores[idx3] > fitnessScores[idx4] ? idx3 : idx4;


    // Retornar el mejor entre los ganadores
    return fitnessScores[winner1] > fitnessScores[winner2]
      ? cloneIndividual(population[winner1])
      : cloneIndividual(population[winner2]);
  };

  // Función de optimización de meme (búsqueda local)
  const memeOptimization = (individual: Individual, target: Individual): void => {
    // Implementación de una búsqueda local que invierte bits en una fila completa
    const rows = individual.length;
    const cols = individual[0].length;
    
    // Número de intentos para mejorar
    const maxAttempts = memeticoParams.maxIntentos;
    let attempts = 0;
    
    // Fitness actual
    let currentFitness = calcularFitness(individual, target);
    
    while (attempts < maxAttempts) {
      // Seleccionar posición aleatoria para modificar
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      // Invertir el bit en esa posición
      individual[row][col] = individual[row][col] === 0 ? 1 : 0;
      
      // Calcular nuevo fitness
      const newFitness = calcularFitness(individual, target);
      
      
      // Si empeora, revertir el cambio
      if (newFitness <= currentFitness) {
        individual[row][col] = individual[row][col] === 0 ? 1 : 0;
        attempts++;
      } else {
        // Si mejora, actualizar fitness y reiniciar intentos
        currentFitness = newFitness;
        attempts = 0; // Reiniciar intentos para permitir más mejoras
        // Si alcanzamos el fitness perfecto, terminar
        if (currentFitness === 1) {
          setBestIndividual(cloneIndividual(individual));
          break;
        }
      }
    }
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
      <button
        onClick={() => navigate('/')} >
        Regresar
      </button>
      
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
              value={memeticoParams.populationSize} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="10"
              inputMode='numeric'
            />
          </div>
          <div>
            <label>Generaciones máximas</label>
            <input 
              type="number" 
              name="maxGenerations" 
              value={memeticoParams.maxGenerations} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="10"
              step="5"
              inputMode='numeric'
            />
          </div>
          <div>
            <label>Tasa de mutación</label>
            <input 
              type="number" 
              name="mutationRate" 
              value={memeticoParams.mutationRate} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
              max="1"
              step="0.001"
              inputMode="numeric"
            />
          </div>
          <div>
            <label>Ruido en Base</label>
            <input 
              type="number" 
              name="noiseRate" 
              value={memeticoParams.noiseRate} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
              max="1"
              step="0.1"
              inputMode="numeric"
            />
          </div>
          <div>
            <label>Maximo de Intentos en Meme</label>
            <input 
              type="number" 
              name="maxIntentos" 
              value={memeticoParams.maxIntentos} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
              max="1000"
              step="1"
              inputMode='numeric'
            />
          </div>
          <div>
            <label>Tasa de Cruza</label>
            <input 
              type="number" 
              name="crossoverRate" 
              value={memeticoParams.crossoverRate} 
              onChange={handleParamChange}
              disabled={isRunning}
              min="0"
              max="1"
              step="0.01"
              inputMode='numeric'
            />
          </div>
        </div>
      </div>
      
      {/* Botones de control */}
      <div className='botones-ejecutar'>
        <button 
          onClick={runMemeticoAlgorithm}
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
              <p>Mejor aptitud: {bestFitness}</p>
              <p>Media de Generacion Actual : {statistics[currentGeneration-1].avgFitness.toFixed(4)}</p>
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
                    {statistics.slice(0, 5).map((stat, index) => (
                    <tr key={`first-${index}`}>
                      <td>{stat.generation}</td>
                      <td>{stat.bestFitness.toFixed(8)}</td>
                      <td>{stat.avgFitness.toFixed(4)}</td>
                      <td>{stat.stdDevFitness.toFixed(4)}</td>
                    </tr>
                    ))}
                    {statistics.length > 10 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center' }}>...</td>
                    </tr>
                    )}
                    {statistics.slice(-5).map((stat, index) => (
                    <tr key={`last-${index}`}>
                      <td>{stat.generation}</td>
                      <td>{stat.bestFitness.toFixed(8)}</td>
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