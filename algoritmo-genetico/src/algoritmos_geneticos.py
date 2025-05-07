import random


def inversion_de_bits(matriz):
    return [[1 - bit for bit in fila] for fila in matriz]

def mutacion(matriz, probabilidad_mutacion):
    for fila in matriz:
        for j in range(len(fila)):
            if random.random() < probabilidad_mutacion:
                fila[j] = not fila[j]  # Invertir el valor booleano
    return matriz