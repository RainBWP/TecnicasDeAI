import os

def read_matrix_from_file(file_path):
    """Read a binary matrix from a file."""
    matrix = []
    with open(file_path, 'r') as f:
        for line in f:
            if line.strip():  # Skip empty lines
                row = [int(val) for val in line.strip().split(',')]
                matrix.append(row)
    return matrix

def resize_matrix(matrix, target_rows, target_cols):
    """Resize a matrix to the target dimensions using majority vote."""
    original_rows = len(matrix)
    original_cols = len(matrix[0]) if matrix else 0
    
    # Calculate block sizes for mapping
    block_height = original_rows / target_rows
    block_width = original_cols / target_cols
    
    resized_matrix = []
    for i in range(target_rows):
        # Calculate the range of rows in the original matrix for this block
        start_row = int(i * block_height)
        end_row = int((i + 1) * block_height)
        end_row = min(end_row, original_rows)  # Avoid going out of bounds
        
        row = []
        for j in range(target_cols):
            # Calculate the range of columns in the original matrix for this block
            start_col = int(j * block_width)
            end_col = int((j + 1) * block_width)
            end_col = min(end_col, original_cols)  # Avoid going out of bounds
            
            # Count the 0s and 1s in this block for majority voting
            count_0 = 0
            count_1 = 0
            for r in range(start_row, end_row):
                for c in range(start_col, end_col):
                    if matrix[r][c] == 0:
                        count_0 += 1
                    else:
                        count_1 += 1
            
            # Determine cell value by majority
            row.append(1 if count_1 >= count_0 else 0)
        
        resized_matrix.append(row)
    
    return resized_matrix

def write_matrix_to_file(matrix, file_path):
    """Write a binary matrix to a file."""
    with open(file_path, 'w') as f:
        for row in matrix:
            f.write(','.join(str(val) for val in row) + '\n')

def visualize_matrix(matrix):
    """Visualize a binary matrix using ASCII characters for preview."""
    result = ""
    for row in matrix:
        result += ''.join(['██' if val == 1 else '  ' for val in row]) + '\n'
    return result

# Main execution
def main():
    codePath = os.path.dirname(os.path.abspath(__file__)) + '/'
    
    input_file = codePath+'base2.txt'
    output_file = codePath+'base2-reconstruct.txt'
    target_dimensions = (29, 29)
    
    print("Reading the QR code matrix from file...")
    matrix = read_matrix_from_file(input_file)
    
    print(f"Original matrix size: {len(matrix)}x{len(matrix[0])}")
    print(f"Resizing to {target_dimensions[0]}x{target_dimensions[1]}...")
    
    resized_matrix = resize_matrix(matrix, target_dimensions[0], target_dimensions[1])
    
    print("Writing result to file...")
    write_matrix_to_file(resized_matrix, output_file)
    
    print("Done! Here's a preview of the resized QR code:")
    print(visualize_matrix(resized_matrix))
    
    print(f"The result has been saved to {output_file}")

if __name__ == "__main__":
    main()