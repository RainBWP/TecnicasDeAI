# FeedbackNN Component Documentation

This document provides an overview of the `FeedbackNN` component, its implementation, and its key functionalities. The component is designed to process datasets, train a simple neural network using k-fold cross-validation, and display the results.

## Key Features

1. **File Upload and Dataset Processing**:
    - The component allows users to upload a dataset file in `.txt` format.
    - The uploaded file is processed to extract input features and output labels.
    - The dataset is split into inputs (features) and outputs (labels), assuming the last column represents the output.

2. **Data Normalization**:
    - The component includes an option to normalize the dataset using min-max scaling.
    - Normalization ensures that the data values are scaled between a specified range (default: -1 to 1).

3. **Neural Network Model**:
    - A simple feedforward neural network is implemented using TensorFlow.js.
    - The model consists of:
      - An input layer with 10 neurons and ReLU activation.
      - A hidden layer with 5 neurons and ReLU activation.
      - An output layer with 1 neuron and linear activation.
    - The model is compiled with the Adam optimizer and Mean Squared Error (MSE) loss function.

4. **K-Fold Cross-Validation**:
    - The component supports k-fold cross-validation to evaluate the model's performance.
    - The dataset is divided into `k` folds, and the model is trained and validated on different subsets of the data.
    - Results for each fold, including error (MSE) and accuracy, are calculated and displayed.

5. **Results Display**:
    - The component displays the results of the k-fold cross-validation in a table format.
    - Average error and accuracy across all folds are also calculated and shown.

---

## Code Breakdown

### 1. **State Management**
The component uses React's `useState` to manage various states:
- `trained`: Indicates whether the model has been trained.
- `dataset`: Stores the processed dataset.
- `normalize`: Toggles data normalization.
- `kFolds`: Specifies the number of folds for cross-validation.
- `results`: Stores the results of each fold.
- `avgError` and `avgAccuracy`: Store the average error and accuracy.
- `fileName`: Stores the name of the uploaded file.
- `isLoading`: Indicates whether the training process is in progress.

### 2. **File Upload and Dataset Processing**
- The `handleFileUpload` function reads the uploaded file and processes its content using the `processData` function.
- `processData` splits the file content into rows and columns, extracting input features and output labels.

### 3. **Data Normalization**
- The `normalizeData` function scales the dataset values between a specified range (default: -1 to 1) if normalization is enabled.

### 4. **Neural Network Model**
- The `createModel` function defines the architecture of the neural network and compiles it with the Adam optimizer and MSE loss.

### 5. **K-Fold Cross-Validation**
- The `runCrossValidation` function implements the k-fold cross-validation process:
  - Splits the dataset into training and validation sets for each fold.
  - Trains the model on the training set and evaluates it on the validation set.
  - Calculates error and accuracy for each fold and stores the results.

### 6. **Results Display**
- The results of each fold, along with the average error and accuracy, are displayed in a table format.

---

## How to Use

1. Upload a dataset file in `.txt` format.
2. Configure the options:
    - Enable or disable data normalization.
    - Set the number of folds for cross-validation.
3. Click the "Ejecutar K-Fold Cross Validation" button to train the model and evaluate its performance.
4. View the results in the table.

---

## Example Dataset Format

The dataset should be in a comma-separated format, where:
- Each row represents a data sample.
- The last column is the output label, and the preceding columns are input features.

Example:
```
1.0, 2.0, 3.0, 0.5
4.0, 5.0, 6.0, 1.0
7.0, 8.0, 9.0, 0.0
```

---

## Dependencies

- React
- TensorFlow.js (`@tensorflow/tfjs`)

---

## Conclusion

The `FeedbackNN` component provides a simple yet powerful interface for training and evaluating a neural network using k-fold cross-validation. It is designed to be user-friendly and flexible, making it suitable for educational and experimental purposes.  