from PIL import Image

def loadfile(path: str) -> list:
    with open(path, 'r') as file:
        lines = file.readlines()
        matrix = []
        for line in lines:
            # Split the line by ',' and convert '1' to True and '0' to False
            row = [True if char == '1' else False for char in line.strip().split(',')]
            matrix.append(row)
        return matrix
    
def invert_qr(matrix: list) -> list:
    # Invert the QR code by flipping True to False and vice versa
    inverted_matrix = [[not col for col in row] for row in matrix]
    return inverted_matrix

def print_qr_fullsize(matrix: list) -> None:
    for row in matrix:
        line = ''.join("██" if col else "  " for col in row)
        print(line)

def simplify_qr_test2(matrix: list) -> list:
    # get real matriz size
    rows = len(matrix)/3
    cols = len(matrix[0])/3
    # create empty matrix
    simplified_matrix = [[False for _ in range(int(cols))] for _ in range(int(rows))]
    # fill the new matrix
    new_row = 0
    new_col = 0
    for i in range(int(rows)):

        for j in range(int(cols)):
            if j % 3 == 1 and i % 3 == 1:
                simplified_matrix[new_row][new_col] = matrix[i][j]
                new_col += 1
        if i % 3 == 1:
            # Only increment new_row if we are in a row that is not ignored
            new_col = 0
            new_row += 1
            
    return simplified_matrix

def simplify_qr_test1(matrix: list) -> list:
    # Remove the first and last 10 rows
    trimmed_matrix = matrix[9:-9]
    # Remove the first and last 10 columns from each remaining row
    simplified_matrix = [row[9:-9] for row in trimmed_matrix]

    # ignore each 1,3 and 4 row and each 1, 3 and 4 column
    new_simplified_matrix = []
    for i in range(len(simplified_matrix)):
        if i % 4 == 2:
            new_simplified_matrix.append(simplified_matrix[i])
            new_simplified_matrix[-1] = [col for j, col in enumerate(new_simplified_matrix[-1]) if j % 4 == 1]

    simplified_matrix = new_simplified_matrix
    
    return simplified_matrix

def save_qr_to_image(matrix: list, output_path: str) -> None:
        # Define the size of each cell in the QR code
        cell_size = 10
        # Calculate the size of the image
        img_size = (len(matrix[0]) * cell_size, len(matrix) * cell_size)
        # Create a new image with a white background
        img = Image.new('RGB', img_size, 'white')
        pixels = img.load()

        # Draw the QR code on the image
        for y, row in enumerate(matrix):
            for x, col in enumerate(row):
                color = (0, 0, 0) if col else (255, 255, 255)
                for i in range(cell_size):
                    for j in range(cell_size):
                        pixels[x * cell_size + i, y * cell_size + j] = color

        # Save the image
        img.save(output_path)



if __name__ == "__main__":
    # Example usage
    pathQrToReconstruct = '/workspaces/TecnincasDeIA/QR/result2.txt'
    qrToReconstruct = loadfile(pathQrToReconstruct)
    #print("QR Code Full Size:")
    print_qr_fullsize(invert_qr(qrToReconstruct))
    
    print_qr_fullsize(simplify_qr_test2(invert_qr(qrToReconstruct)))
    
    # Save the simplified QR code as an image
    output_image_path = '/workspaces/TecnincasDeIA/QR/simplified_qr.png'
    save_qr_to_image(qrToReconstruct, output_image_path)
    print(f"Simplified QR code saved to {output_image_path}")