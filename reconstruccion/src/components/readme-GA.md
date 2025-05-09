# Explicación del código
Este código implementa un algoritmo genético completo que:

1. Lectura de archivos: Puede procesar el contenido de los archivos base y resultado.
2. Inicialización: Crea una población inicial basada en el archivo base (o aleatoria si está vacío).
3. Evaluación: Calcula la aptitud comparando cada individuo con el archivo resultado.
4. Evolución genética: Implementa selección por torneo, cruce uniforme y mutación.
5. Estadísticas: Muestra información detallada sobre el proceso:
    - Mejor valor de aptitud en cada iteración
    - Media y desviación estándar de todos los valores de aptitud
    - Media y desviación estándar de los mejores valores
6. Resultado: Genera un archivo con el mismo formato que el original.


## Características ajustables
Puedes modificar los siguientes parámetros para experimentar con el algoritmo:

- populationSize: Tamaño de la población (mayor = más diversidad pero más lento)
- maxGenerations: Número máximo de iteraciones
- crossoverRate: Probabilidad de cruce (0.0-1.0)
- mutationRate: Probabilidad de mutación (0.0-1.0)
- elitismCount: Número de mejores individuos que pasan directamente a la siguiente generación
- tournamentSize: Tamaño del torneo para selección (mayor = más presión selectiva)

## Uso
Para integrar esto en tu aplicación React:

1. Crea componentes para cargar los archivos y mostrar los resultados
2. Utiliza la función runGeneticAlgorithm para ejecutar el algoritmo
3. Muestra el progreso en tiempo real con la función onGenerationComplete
4. Visualiza las estadísticas utilizando gráficos
5. Permite descargar el resultado final
La implementación completa permitirá visualizar todo el proceso de evolución y ajustar parámetros para obtener mejores resultados.