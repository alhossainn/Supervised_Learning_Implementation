from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
from PIL import Image
import base64
import io
import numpy as np
import cv2
import traceback

from model import BrainCancerModel
from gradcam import apply_gradcam, create_gradcam_visualization

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}

# Initialize model
try:
    model_handler = BrainCancerModel('model.pt')
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model_handler = None

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def pil_to_base64(image):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

@app.route('/')
def index():
    if model_handler:
        return render_template('index.html', class_info=model_handler.class_info)
    else:
        return render_template('error.html', message="Model failed to load. Please check the server logs.")

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/classify', methods=['POST'])
def classify():
    if model_handler is None:
        return jsonify({'error': 'Model not loaded. Please check server configuration.'}), 500
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Read and process image
            image = Image.open(file.stream).convert('RGB')
            
            # Get prediction
            prediction = model_handler.predict(image)
            
            # Prepare image tensor for Grad-CAM
            image_tensor = model_handler.transform(image).unsqueeze(0).to(model_handler.device)
            
            # Get target class index
            target_class = model_handler.class_names.index(prediction['class'])
            
            # Generate Grad-CAM
            cam = apply_gradcam(model_handler.model, image_tensor, target_class)
            
            # Create visualization
            gradcam_image = create_gradcam_visualization(image, cam)
            gradcam_pil = Image.fromarray(gradcam_image)
            
            # Convert images to base64
            original_b64 = pil_to_base64(image.resize((400, 400)))
            gradcam_b64 = pil_to_base64(gradcam_pil.resize((400, 400)))
            
            # Prepare probabilities for chart
            probabilities = []
            for i, class_name in enumerate(model_handler.class_names):
                probabilities.append({
                    'class': class_name,
                    'probability': prediction['probabilities'][i],
                    'isPredicted': class_name == prediction['class']
                })
            
            return jsonify({
                'success': True,
                'prediction': {
                    'class': prediction['class'],
                    'confidence': round(prediction['confidence'] * 100, 2)
                },
                'probabilities': probabilities,
                'images': {
                    'original': original_b64,
                    'gradcam': gradcam_b64
                }
            })
            
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            print(traceback.format_exc())
            return jsonify({'error': f'Error processing image: {str(e)}'}), 500
    
    return jsonify({'error': 'Invalid file type. Please upload an image file (PNG, JPG, JPEG, GIF, BMP, TIFF).'}), 400

@app.route('/class-info')
def get_class_info():
    if model_handler:
        return jsonify(model_handler.class_info)
    else:
        return jsonify({'error': 'Model not loaded'}), 500

# Error handler
@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Please upload an image smaller than 16MB.'}), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error. Please try again later.'}), 500

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000)