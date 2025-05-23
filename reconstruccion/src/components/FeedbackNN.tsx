// npm install @tensorflow/tfjs

import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface DataSet {
  inputs: number[][];
  outputs: number[][];
  raw: string;
}

interface ExperimentResult {
  fold: number;
  error: number;
  accuracy: number;
}

// Add interfaces for network configuration
interface Layer {
  neurons: number;
  activation: string;
}

function FeedbackNN() {
  const [trained, setTrained] = useState(false);
  const [dataset, setDataset] = useState<DataSet | null>(null);
  const [normalize, setNormalize] = useState<boolean>(true);
  const [kFolds, setKFolds] = useState<number>(5);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [avgError, setAvgError] = useState<number | null>(null);
  const [avgAccuracy, setAvgAccuracy] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Actualizar para tener 3 capas fijas
  const [hiddenLayers, setHiddenLayers] = useState<Layer[]>([
    { neurons: 10, activation: 'relu' },
    { neurons: 8, activation: 'relu' },
    { neurons: 5, activation: 'sigmoid' }
  ]);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Procesar archivo subido por el usuario
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const dataset = processData(content);
        setDataset(dataset);
      }
    };

    reader.readAsText(file);
  };

  // Procesamiento de datos
  const processData = (content: string): DataSet => {
    // Dividir por líneas y luego por comas
    const rows = content.split("\n").filter(row => row.trim() !== "");

    // Para este ejemplo simple, asumimos que cada fila es un ejemplo
    // y las columnas son características, con la última columna como etiqueta
    const data = rows.map(row =>
      row.split(",").map(val => parseFloat(val.trim()))
    );

    // Asumimos que los primeros N-1 valores son entradas y el último es la salida
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    data.forEach(row => {
      if (row.length > 1) {
        const inputFeatures = row.slice(0, row.length - 1);
        const outputValues = [row[row.length - 1]];
        inputs.push(inputFeatures);
        outputs.push(outputValues);
      }
    });

    return { inputs, outputs, raw: content };
  };

  // Normalización de datos
  const normalizeData = (data: number[][]): [number[][], { min: number, max: number }] => {
    const stats = { min: -1, max: 1 }; // Por defecto
    const minmax = { min: -1, max: 1 }

    if (normalize) {
      const allValues = data.flat();
      stats.min = Math.min(...allValues);
      stats.max = Math.max(...allValues);

      // Normalizar datos entre -1 y 1 con min-max scaling
      // v' = (v - minA) / (maxA - minA) (newMaxA - newMinA) + newMinA
      const normalizedData = data.map(row =>
        row.map(val => ((val - stats.min) / (stats.max - stats.min)) * (minmax.max - (minmax.min)) + (minmax.min))
      );

      return [normalizedData, stats];
    }

    return [data, stats]; // Sin normalizar
  };

  // Crear el modelo de la red neuronal
  const createModel = (inputShape: number): tf.Sequential => {
    const model = tf.sequential();

    // Capa oculta 1 (con inputShape)
    model.add(tf.layers.dense({
      units: hiddenLayers[0].neurons,
      inputShape: [inputShape],
    }));

    // Capa oculta 2
    model.add(tf.layers.dense({
      units: hiddenLayers[1].neurons,
    }));

    // Capa oculta 3
    model.add(tf.layers.dense({
      units: hiddenLayers[2].neurons,
    }));

    // Capa de salida
    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));

    // Compilar el modelo
    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    return model;
  };

  // Modificar esta función para actualizar solo la activación
  const updateLayerActivation = (index: number, activationType: string) => {
    const newLayers = [...hiddenLayers];
    newLayers[index].activation = activationType;
    setHiddenLayers(newLayers);
  };

  // Función para actualizar el número de neuronas
  const updateLayerNeurons = (index: number, neurons: number) => {
    const newLayers = [...hiddenLayers];
    newLayers[index].neurons = neurons;
    setHiddenLayers(newLayers);
  };

  // Implementar k-fold cross validation
  const runCrossValidation = async () => {
    if (!dataset) return;

    setIsLoading(true);
    setResults([]);
    setAvgError(null);
    setAvgAccuracy(null);

    const allInputs = dataset.inputs;
    const allOutputs = dataset.outputs;

    // Normalizar datos si está habilitado
    const [normalizedInputs,] = normalizeData(allInputs);
    const [normalizedOutputs, outputStats] = normalizeData(allOutputs);

    // Preparar los datos para k-fold
    const foldSize = Math.floor(normalizedInputs.length / kFolds);
    const totalError: number[] = [];
    const totalAccuracy: number[] = [];
    const newResults: ExperimentResult[] = [];

    // Ejecutar k-fold cross validation
    for (let fold = 0; fold < kFolds; fold++) {
      // Dividir en conjunto de entrenamiento y validación
      const validationIndicesStart = fold * foldSize;
      const validationIndicesEnd = (fold + 1) * foldSize;

      const trainInputs: number[][] = [];
      const trainOutputs: number[][] = [];
      const validationInputs: number[][] = [];
      const validationOutputs: number[][] = [];

      for (let i = 0; i < normalizedInputs.length; i++) {
        if (i >= validationIndicesStart && i < validationIndicesEnd) {
          validationInputs.push(normalizedInputs[i]);
          validationOutputs.push(normalizedOutputs[i]);
        } else {
          trainInputs.push(normalizedInputs[i]);
          trainOutputs.push(normalizedOutputs[i]);
        }
      }

      // Convertir a tensores
      const xTrain = tf.tensor2d(trainInputs);
      const yTrain = tf.tensor2d(trainOutputs);
      const xVal = tf.tensor2d(validationInputs);
      const yVal = tf.tensor2d(validationOutputs);

      // Crear y entrenar el modelo
      const model = createModel(trainInputs[0].length);

      await model.fit(xTrain, yTrain, {
        epochs: 50,
        batchSize: 32,
        validationData: [xVal, yVal]
      });

      // Evaluar el modelo
      const evaluation = model.evaluate(xVal, yVal) as tf.Tensor[];
      const error = evaluation[0].dataSync()[0];

      // Calcular una métrica de precisión simple (1 - error normalizado)
      const accuracy = 1 - (error / (outputStats.max - outputStats.min));

      // Guardar resultados
      totalError.push(error);
      totalAccuracy.push(accuracy);

      newResults.push({
        fold: fold + 1,
        error,
        accuracy
      });

      setResults([...newResults]);

      // Limpiar tensores
      xTrain.dispose();
      yTrain.dispose();
      xVal.dispose();
      yVal.dispose();
      model.dispose();
    }

    // Calcular promedios
    const avgErr = totalError.reduce((a, b) => a + b, 0) / kFolds;
    const avgAcc = totalAccuracy.reduce((a, b) => a + b, 0) / kFolds;

    setAvgError(avgErr);
    setAvgAccuracy(avgAcc);
    setTrained(true);
    setIsLoading(false);
  };

  return (
    <div>
      <h1>Red Neuronal Feedback</h1>

      <div>
        <h2>Cargar archivo de datos</h2>
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt"
          onChange={handleFileUpload}
        />
        {fileName && <p>Archivo cargado: {fileName}</p>}

        {dataset && (
          <div>
            <p>Muestras: {dataset.inputs.length}</p>
            <p>Características: {dataset.inputs[0]?.length || 0}</p>
          </div>
        )}
      </div>

      <div>
        <div>
          <button
            onClick={() => {
              setNormalize(!normalize);
            }}
          >
            {normalize ? "No Normalizar" : "Normalizar con MinMax"}
          </button>
        </div>

        <div>
          <label>
            K-Folds:
            <input
              type="number"
              min="2"
              max="10"
              value={kFolds}
              onChange={(e) => setKFolds(parseInt(e.target.value))}
            />
          </label>
        </div>

        <div>
          <h2>Configuración de la Topología (3 Capas Ocultas)</h2>
          <div>
            <label>
              Tasa de Aprendizaje:
              <input 
                type="number" 
                min="0.0001" 
                max="1" 
                step="0.001" 
                value={learningRate} 
                onChange={(e) => setLearningRate(parseFloat(e.target.value))} 
              />
            </label>
          </div>
          
          <h3>Configuración de Capas Ocultas</h3>
          {hiddenLayers.map((layer, index) => (
            <div key={index}>
              <h4>Capa {index + 1}</h4>
              <div>
                <label>
                  Neuronas:
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={layer.neurons} 
                    onChange={(e) => updateLayerNeurons(index, parseInt(e.target.value))} 
                  />
                </label>
              </div>
              <div>
                <label>
                  Función de Activación:
                  <select 
                    value={layer.activation} 
                    onChange={(e) => updateLayerActivation(index, e.target.value)}
                  >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="tanh">Tanh</option>
                    <option value="linear">Linear</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={runCrossValidation}
          disabled={!dataset || isLoading}
        >
          {isLoading ? "Procesando..." : "Ejecutar K-Fold Cross Validation"}
        </button>
      </div>

      {trained && (
        <div>
          <h2>Resultados</h2>

          <table>
            <thead>
              <tr>
                <th>Fold</th>
                <th>Error (MSE)</th>
                <th>Exactitud</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.fold}>
                  <td>{result.fold}</td>
                  <td>{result.error.toFixed(4)}</td>
                  <td>{(result.accuracy * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Promedio</th>
                <th>{avgError !== null ? avgError.toFixed(4) : '-'}</th>
                <th>{avgAccuracy !== null ? (avgAccuracy * 100).toFixed(2) + '%' : '-'}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default FeedbackNN;
