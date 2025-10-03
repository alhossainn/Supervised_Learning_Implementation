import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import numpy as np
import cv2
import torch.nn.functional as F

class BrainCancerModel:
    def __init__(self, model_path):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.load_model(model_path)
        self.class_names = ['brain_glioma', 'brain_menin', 'brain_tumor']
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Sample data for the info panel (replace with your actual data)
        self.class_info = {
            'brain_glioma': {
                'samples': 3500,
                'accuracy': 0.997,
                'description': 'Glioma is a tumor in the brain or spinal cord.'
            },
            'brain_menin': {
                'samples': 3500,
                'accuracy': 0.996,
                'description': 'Meningioma is a tumor from the meninges surrounding the brain and spinal cord.'
            },
            'brain_tumor': {
                'samples': 3500,
                'accuracy': 1.00,
                'description': 'Pituitary tumor is an abnormal growth in the pituitary gland.'
            }
        }
    
    def load_model(self, model_path):
        model = models.resnet50(pretrained=False)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, 3)
        
        checkpoint = torch.load(model_path, map_location=self.device)
        model.load_state_dict(checkpoint["model_weight"])
        model.to(self.device)
        model.eval()
        return model
    
    def predict(self, image):
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
        return {
            'class': self.class_names[predicted.item()],
            'confidence': confidence.item(),
            'probabilities': probabilities.cpu().numpy()[0].tolist()
        }