import torch
import torch.nn.functional as F
import numpy as np
import cv2

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.hook_handles = []
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        forward_handle = self.target_layer.register_forward_hook(forward_hook)
        backward_handle = self.target_layer.register_backward_hook(backward_hook)

        self.hook_handles.append(forward_handle)
        self.hook_handles.append(backward_handle)

    def remove_hooks(self):
        for handle in self.hook_handles:
            handle.remove()

    def generate_cam(self, input_tensor, target_class):
        self.model.eval()
        input_tensor.requires_grad_()
    
        output = self.model(input_tensor)
        self.model.zero_grad()
    
        class_score = output[:, target_class]
        class_score.backward()
    
        gradients = self.gradients
        activations = self.activations
    
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
    
        cam = torch.sum(weights * activations, dim=1)
        cam = F.relu(cam)
        cam = cam.squeeze().cpu().numpy()
        cam -= np.min(cam)
        cam /= (np.max(cam) + 1e-8)
        cam = np.power(cam, 0.5)
        cam = cv2.resize(cam, (224, 224))
    
        return cam

def apply_gradcam(model, image_tensor, target_class):
    # Use the last convolutional layer of ResNet50
    target_layer = model.layer4
    gradcam = GradCAM(model, target_layer)
    
    cam = gradcam.generate_cam(image_tensor, target_class)
    gradcam.remove_hooks()
    
    return cam

def create_gradcam_visualization(original_image, cam, alpha=0.4):
    # Convert PIL image to numpy array
    img_np = np.array(original_image.resize((224, 224)))
    
    # Convert to uint8
    img_uint8 = np.uint8(img_np)
    
    # Create heatmap
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    
    # Resize heatmap to match image size
    heatmap = cv2.resize(heatmap, (img_uint8.shape[1], img_uint8.shape[0]))
    
    # Convert image to RGB for proper overlay
    if len(img_uint8.shape) == 2:  # Grayscale
        img_uint8 = cv2.cvtColor(img_uint8, cv2.COLOR_GRAY2RGB)
    else:
        img_uint8 = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2BGR)
    
    # Overlay heatmap on original image
    overlay = cv2.addWeighted(heatmap, alpha, img_uint8, 1 - alpha, 0)
    overlay = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)
    
    return overlay