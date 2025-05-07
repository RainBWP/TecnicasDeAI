import DataAJugar
import os

if __name__ == "__main__":
    # Initialize or load data
    path_del_codigo = os.path.dirname(os.path.abspath(__file__)) + '\\'
    
    nombre_archivo_base = path_del_codigo + 'base2.txt'
    nombre_archivo_resultado = path_del_codigo + 'resultado2_test.txt'
    
    print(nombre_archivo_base)
    
    archivo = DataAJugar.DataAJugar()
    archivo.cargar_archivo(nombre_archivo_base)

    archivo.mostrar_archivo()
    archivo.exportar_archivo(nombre_archivo_resultado)


    # comparar archivos 
    with open(nombre_archivo_base, 'r') as file1, open(nombre_archivo_resultado, 'r') as file2:
        lines1 = file1.readlines()
        lines2 = file2.readlines()
        if lines1 == lines2:
            print("Los archivos son iguales.")
        else:
            print("Los archivos son diferentes.")