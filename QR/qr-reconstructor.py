from PIL import Image
import os

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

def simplify_qr_test1(matrix: list, dimensions:int) -> list:
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

def removing_empty_rows(matrix: list) -> list:
    # Remove the first and last 10 rows
    trimmed_matrix = matrix[9:-9]
    # Remove the first and last 10 columns from each remaining row
    simplified_matrix = [row[9:-9] for row in trimmed_matrix]
    return simplified_matrix

def simplify_qr_test2(matrix: list, dimensions:int) -> list:
    # Remove the first and last 10 rows
    trimmed_matrix = matrix[9:-9]
    # Remove the first and last 10 columns from each remaining row
    simplified_matrix = [row[9:-9] for row in trimmed_matrix]
    
    # Create a new empty matrix of the target size
    new_simplified_matrix = [[False for _ in range(dimensions)] for _ in range(dimensions)]

    # Iterate over the matrix in 4x4 blocks
    for i in range(0, len(simplified_matrix), 4):
        for j in range(0, len(simplified_matrix[i]), 4):
            # Ensure the block stays within the target dimensions
            if i // 4 < dimensions and j // 4 < dimensions:
                # Count the number of True values in the 4x4 block
                true_count = 0
                for x in range(4):
                    for y in range(4):
                        if i + x < len(simplified_matrix) and j + y < len(simplified_matrix[i]):
                            if simplified_matrix[i + x][j + y]:
                                true_count += 1
                # Decide if the block should be True or False
                new_simplified_matrix[i // 4][j // 4] = true_count >= 5

    return new_simplified_matrix

"""""Created by Claude 3.7 Sonnet Thinking for Improved Code"""
def resize_qr(matrix: list, target_size: int) -> list:
    """
    Resize a QR code matrix to the specified dimensions using sampling.
    
    Args:
        matrix: The source binary matrix
        target_size: Desired dimensions of output (square matrix)
        
    Returns:
        A resized binary matrix of the target size
    """
    # First, trim the quiet zone (typically the outer border)
    # Detect if we need to trim - look for all 1s in border
    if all(matrix[0][i] for i in range(len(matrix[0]))) and all(matrix[i][0] for i in range(len(matrix))):
        # Trim border (using the same 9 row/col trimming logic as in your functions)
        trimmed = matrix[9:-9]
        trimmed = [row[9:-9] for row in trimmed]
    else:
        trimmed = matrix
    
    source_size = len(trimmed)
    
    # Create the target matrix
    result = [[False for _ in range(target_size)] for _ in range(target_size)]
    
    # Calculate the mapping factor (how many cells in source map to one cell in target)
    scale_factor = source_size / target_size
    
    for i in range(target_size):
        for j in range(target_size):
            # Find corresponding region in source
            source_start_i = int(i * scale_factor)
            source_end_i = int((i + 1) * scale_factor)
            source_start_j = int(j * scale_factor)
            source_end_j = int((j + 1) * scale_factor)
            
            # Ensure bounds
            source_end_i = min(source_end_i, source_size)
            source_end_j = min(source_end_j, source_size)
            
            # Count True cells in this region
            true_count = 0
            total_cells = 0
            
            for si in range(source_start_i, source_end_i):
                for sj in range(source_start_j, source_end_j):
                    total_cells += 1
                    if trimmed[si][sj]:
                        true_count += 1
            
            # Set target cell based on majority (>50% of cells are True)
            result[i][j] = (true_count / total_cells) > 0.3
    
    return result

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

def read_qr_code(image_path: str) -> None:
    """
    Read QR code from an image file and print its content
    """
    try:
        from pyzbar.pyzbar import decode
        from PIL import Image
        
        # Open the image
        img = Image.open(image_path)
        
        # Decode the QR code
        result = decode(img)
        
        if result:
            print("QR Code content:")
            for item in result:
                print(f"- {item.data.decode('utf-8')}")
        else:
            print("No QR code found in the image")
    except ImportError:
        print("Please install 'pyzbar' package: pip install pyzbar")

if __name__ == "__main__":
    # Example usage
    codePath = os.path.dirname(os.path.abspath(__file__))
    
    pathQrToReconstruct = codePath+'/base2.txt'
    qrDimensions = 29
    qrToReconstruct = loadfile(pathQrToReconstruct)
    
    # Show the trimmed original QR
    print("Original QR (trimmed):")
    print_qr_fullsize(removing_empty_rows(invert_qr(qrToReconstruct)))
    
    # Resize using the new function
    print("\nResized QR (29x29):")
    resized_qr = resize_qr(invert_qr(qrToReconstruct), qrDimensions)
    print_qr_fullsize(resized_qr)
    
    # Save the resized QR code as an image
    output_image_path = codePath+'/resized_qr.png'
    save_qr_to_image(resized_qr, output_image_path)
    print(f"Resized QR code saved to {output_image_path}")
    
    # Save the resized QR as a text file
    output_text_path = codePath+'/resized_qr.txt'
    with open(output_text_path, 'w') as file:
        for row in resized_qr:
            file.write(','.join(['1' if cell else '0' for cell in row]) + '\n')
    print(f"Resized QR matrix saved to {output_text_path}")
    
    read_qr_code(output_image_path)
    read_qr_code(codePath+"/simplified_qr.png")