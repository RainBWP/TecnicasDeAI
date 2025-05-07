class DataAJugar:
    def __init__(self):
        self.raw_data = [bool]
        self.filas = 0
        self.columnas = 0
        
        
    def cargar_archivo(self, file_path):
        with open(file_path, 'r') as file:
            lines = file.readlines()
            matrix = []
            for line in lines:
                # Split the line by ',' and convert '1' to True and '0' to False
                row = [True if char == '1' else False for char in line.strip().split(',')]
                matrix.append(row)
            self.raw_data = matrix
        # Obtener el tamaño de la matriz
        self.filas = len(self.raw_data)
        self.columnas = len(self.raw_data[0]) if self.raw_data else 0
        
    def exportar_archivo(self, file_path):
        matrix = self.raw_data
        with open(file_path, 'w') as file:
            for row in matrix:
                line = ','.join(['1' if col else '0' for col in row])
                file.write(line + '\n')
                
    def mostrar_archivo(self):
        matrix = self.raw_data
        for row in matrix:
            line = ''.join("██" if col else "  " for col in row)
            print(line)
            
    def obtener_archivo(self):
        return self.raw_data
    
    def obtener_filas(self):
        return self.filas
    
    def obtener_columnas(self):
        return self.columnas
    