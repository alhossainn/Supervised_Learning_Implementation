# Supervised Learning for Image Classification
![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![Framework](https://img.shields.io/badge/Framework-Flask-green)
![Deep Learning](https://img.shields.io/badge/Deep%20Learning-PyTorch-red)

### Introduction to Supervised Learning 
Supervised learning is a type of machine learning where a model is trained on a **labeled dataset**, meaning that each input is paired with the correct output. In the context of image classification, the input is an image, and the output is a label that describes what is in the image. 

- The dataset contains input **features (X)** and their corresponding **target labels (Y)**.
- The model learns the mapping function **f: X → Y**, so that it can predict the output for unseen inputs.

In short, supervised learning for image classification is about teaching a model to recognize patterns in labeled images so it can predict the correct category for new, unseen images. Deep learning has made this process much more effective by automatically learning complex features from raw pixels.

### Repository Overview

This project implements and compares two supervised learning models (ResNet50 and BrainCancerNet) for classifying brain tumors into three categories:
- **Glioma**
- **Meningioma** 
- **Brain Tumor**

This project also provides a user-friendly web interface integrated with the best-performing model for medical professionals to upload MRI scans and get instant predictions with model interpretability.

### 📊 Dataset & Models

#### Dataset
- **Source**: [Multi-Cancer Dataset from Kaggle](https://www.kaggle.com/datasets/obulisainaren/multi-cancer)
- **Classes**: 3 (brain_glioma, brain_menin, brain_tumor)
- **Total Images**: 15,000
- **Split**: 70% Train (10,500), 15% Test (2,250), 15% Validation (2,250)

#### Model Architecture
1. **ResNet50** (trained from scratch)
2. **BrainCancerNet** (Custom CNN architecture)

### Repository Structure
```bash
brain-tumor-classification/
├── notebooks/
│   ├── resnet50.ipynb       # ResNet50 model training
│   └── custom_cnn.ipynb     # BrainCancerNet training
├── brain_cancer_app/
│   ├── app.py                 # Main Flask application
│   ├── model.py               # Best model integration
│   ├── gradcam.py             # Grad-CAM implementation
│   ├── requirements.txt       # Dependencies
│   ├── static/
│   │   ├── css/style.css     # Styling
│   │   └── js/script.js      # Frontend logic
│   ├── templates/            # HTML templates
|   |   ├── base.html
|   |   ├── index.html
|   |   ├── about.html
|   |   ├── error.html 
│   └── uploads/              # User upload directory
├── model.pt                  # Trained model weights
├── README.md
└── requirements.txt
```

### 🚀 Key Features

- **Comparative Analysis**: Detailed comparison of ResNet50 vs custom CNN performance
- **Grad-CAM Integration**: Visual model explanations for transparent predictions
- **Web Application**: Flask-based intuitive interface with best model integration
- **Real-time Classification**: Instant MRI analysis and results
- **Medical Focus**: Designed for potential clinical applications and research

### 📈 Performance Results

| Model | Overall Accuracy | Glioma Accuracy | Meningioma Accuracy | Tumor Accuracy |
|-------|------------------|-----------------|---------------------|----------------|
| ResNet50 | 99.80% | 99.70% | 99.60% | 100.00% |
| BrainCancerNet | 99.50% | 99.50% | 99.90% | 99.20% |

### ⏱ Training & Testing Time
| Model          | Training Time       | Testing Time                  |
| -------------- | ------------------- | ----------------------------- |
| ResNet50       | 109.60 min          | 0.08 sec                      |
| BrainCancerNet | 79.78 min           | 0.05 sec                      |

*Integrated ResNet50 model into web application, [download link](https://drive.google.com/file/d/1vtnt25oZMPGluTuME5HFdSiJHT2KnhCD/view?usp=sharing)*

### 🔬 Technical Implementation
#### Model Development
- **Framework:** PyTorch
- **Training Environment:** Kaggle with Tesla P100-PCIE-16GB

#### Web Application
- **Backend:** Flask with integrated best-performing model
- **Frontent:** HTML, CSS, JavaScript
- **Features:** File upload, real-time prediction, Grad-CAM visualization
