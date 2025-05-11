from PIL import Image
import os

# https://stackoverflow.com/questions/75918431/how-to-convert-black-and-white-qr-code-to-string-of-ones-and-zeros

# Load the image
script_dir = os.path.dirname(__file__)  # Get the directory of the current script
image_name = "axtecsmol.png"  # Replace with your image name

image_path = f'{script_dir}/{image_name}'  # Replace with your image path
image = Image.open(image_path).convert('1')  # Convert to black and white

# Convert the image to a 2D array of booleans
print(image.size)

width, height = image.size
qr_data = list(image.getdata())
qr_str = ''

for i in range(height):
    row = qr_data[i * width:(i + 1) * width]
    qr_str += ','.join(['0' if pixel == 0 else '1' for pixel in row]) + '\n'

with open(f'{script_dir}/export-{image_name}.txt', 'w') as f:
    f.write(qr_str)