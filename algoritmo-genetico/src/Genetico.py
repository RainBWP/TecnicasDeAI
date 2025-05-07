import DataAJugar
import algoritmos_geneticos

def genetico_prueba_1(DataAJugar:DataAJugar, iteraciones=10, probabilidad_mutacion=0.1):
    # Obtener la matriz de datos
    matriz = DataAJugar.obtener_archivo()
    
    # Inicializar la población
    poblacion = [matriz]  # Iniciar con la matriz original
    
    for i in range(iteraciones):
        # Aplicar el algoritmo genético (ejemplo: invertir bits)
        nueva_poblacion = []
        for individuo in poblacion:
            nuevo_individuo = algoritmos_geneticos.inversion_de_bits(individuo)
            nueva_poblacion.append(nuevo_individuo)
        
        # Mutación (ejemplo: invertir algunos bits aleatoriamente)
        algoritmos_geneticos.mutacion(nueva_poblacion, probabilidad_mutacion)
        
        # Actualizar la población
        poblacion = nueva_poblacion
    
    return poblacion[0]  # Retornar el primer individuo como resultado final
    