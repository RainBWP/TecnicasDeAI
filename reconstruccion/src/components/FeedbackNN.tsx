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
                console.log("Datos cargados:", dataset);
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
    const normalizeData = (data: number[][]): [number[][], {min: number, max: number}] => {
        const stats = { min: -1, max: 1 }; // Por defecto

        if (normalize) {
            const allValues = data.flat();
            stats.min = Math.min(...allValues);
            stats.max = Math.max(...allValues);
            
            // Normalizar datos entre -1 y 1
            const normalizedData = data.map(row => 
                row.map(val => 2 * ((val - stats.min) / (stats.max - stats.min)) - 1)
            );
            
            return [normalizedData, stats];
        }
        
        return [data, stats]; // Sin normalizar
    };

    // Crear el modelo de la red neuronal
    const createModel = (inputShape: number): tf.Sequential => {
        const model = tf.sequential();
        
        // Capa de entrada (10 neuronas)
        model.add(tf.layers.dense({
            units: 10,
            inputShape: [inputShape],
            activation: 'relu'
        }));
        
        // Capa oculta (5 neuronas)
        model.add(tf.layers.dense({
            units: 5,
            activation: 'relu'
        }));
        
        // Capa de salida
        model.add(tf.layers.dense({
            units: 1,
            activation: 'linear'
        }));
        
        // Compilar el modelo
        model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError',
            metrics: ['mse']
        });
        
        return model;
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
        const [normalizedInputs, ] = normalizeData(allInputs);
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
        <div className="simple-nn-container">
            <h1>Red Neuronal con Validación Cruzada</h1>
            
            <div className="upload-section">
                <h2>Cargar archivo de datos</h2>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="file-input"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                >
                    Seleccionar archivo .txt
                </button>
                {fileName && <p>Archivo cargado: {fileName}</p>}
                
                {dataset && (
                    <div className="data-info">
                        <p>Muestras: {dataset.inputs.length}</p>
                        <p>Características: {dataset.inputs[0]?.length || 0}</p>
                    </div>
                )}
            </div>
            
            <div className="config-section">
                <div className="normalize-option">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={normalize} 
                            onChange={(e) => setNormalize(e.target.checked)} 
                        />
                        Normalizar datos
                    </label>
                </div>
                
                <div className="kfold-option">
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
                
                <button 
                    className="train-btn"
                    onClick={runCrossValidation}
                    disabled={!dataset || isLoading}
                >
                    {isLoading ? "Procesando..." : "Ejecutar K-Fold Cross Validation"}
                </button>
            </div>
            
            {trained && (
                <div className="results-section">
                    <h2>Resultados</h2>
                    
                    <table className="results-table">
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