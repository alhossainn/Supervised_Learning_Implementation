class BrainCancerApp {
    constructor() {
        this.currentFile = null;
        this.chart = null;
        this.initializeEventListeners();
        this.initializeChart();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const classifyBtn = document.getElementById('classifyBtn');

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Click to upload - only if no file is selected
        uploadArea.addEventListener('click', (e) => {
            // Only trigger file input if clicking on the upload area itself, not on buttons or other elements
            if (e.target === uploadArea || e.target.classList.contains('upload-icon') || e.target.tagName === 'P') {
                fileInput.click();
            }
        });

        // Classify button
        classifyBtn.addEventListener('click', () => this.classifyImage());

        // Tooltips
        this.initializeTooltips();
    }

    initializeTooltips() {
        const classItems = document.querySelectorAll('.class-item');
        const tooltip = document.getElementById('tooltip');

        classItems.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const description = item.getAttribute('data-tooltip');
                tooltip.textContent = description;
                tooltip.classList.add('show');
                
                const rect = item.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.bottom + 10) + 'px';
            });

            item.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });

            item.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
            });
        });
    }

    initializeChart() {
        const ctx = document.getElementById('probabilityChart').getContext('2d');
        
        // Register a plugin for background color
        Chart.register({
            id: 'customBackground',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        });

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Confidence',
                    data: [],
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return;
                        
                        const isPredicted = context.dataIndex === 
                            context.dataset.data.indexOf(Math.max(...context.dataset.data));
                        
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        if (isPredicted) {
                            gradient.addColorStop(0, '#10b981');
                            gradient.addColorStop(1, '#34d399');
                        } else {
                            gradient.addColorStop(0, '#64748b');
                            gradient.addColorStop(1, '#94a3b8');
                        }
                        return gradient;
                    },
                    borderColor: (context) => {
                        const isPredicted = context.dataIndex === 
                            context.dataset.data.indexOf(Math.max(...context.dataset.data));
                        return isPredicted ? '#059669' : '#475569';
                    },
                    borderWidth: 2,
                    borderRadius: {
                        topLeft: 0,
                        topRight: 0,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(100, 116, 139, 0.1)',
                            drawBorder: false,
                        },
                        ticks: {
                            callback: (value) => value + '%',
                            color: '#64748b',
                            font: {
                                size: 11,
                                family: "'Inter', sans-serif"
                            },
                            padding: 8
                        }
                    },
                    y: {
                        grid: {
                            display: false,
                            drawBorder: false,
                        },
                        ticks: {
                            color: '#1e293b',
                            font: {
                                size: 12,
                                family: "'Inter', sans-serif",
                                weight: '500'
                            },
                            padding: 12
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 12
                        },
                        bodyFont: {
                            family: "'Inter', sans-serif", 
                            size: 11
                        },
                        padding: 12,
                        cornerRadius: 8,
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: (items) => items[0].label,
                            label: (context) => `Confidence: ${context.raw.toFixed(1)}%`
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 15,
                        bottom: 10
                    }
                }
            }
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.match('image.*')) {
            this.showError('Please select a valid image file.');
            return;
        }

        // Update UI to show file is selected
        this.updateFileUI(file.name);
        
        // Store file reference
        this.currentFile = file;
        
        // Preview image (optional)
        this.previewImage(file);
    }

    updateFileUI(fileName) {
        document.getElementById('fileName').textContent = fileName;
        document.getElementById('fileInfo').style.display = 'flex';
        document.getElementById('classifyBtn').disabled = false;
        
        // Update upload area appearance to show file is selected
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <i class="fas fa-check-circle upload-icon" style="color: #10b981;"></i>
            <p>File selected: ${fileName}</p>
            <p class="file-ready">Click "Classify Image" to analyze</p>
        `;
        uploadArea.style.borderColor = '#10b981';
        uploadArea.style.background = '#f0fdf4';
    }

    previewImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // You can add image preview here if needed
            console.log('Image loaded for preview');
        };
        reader.readAsDataURL(file);
    }

    clearFile() {
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('classifyBtn').disabled = true;
        document.getElementById('resultsSection').style.display = 'none';
        
        // Reset upload area
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <p>Drag & drop your image here or click to browse</p>
            <button class="browse-btn" onclick="document.getElementById('fileInput').click()">
                Browse Files
            </button>
        `;
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        
        this.currentFile = null;
    }

    async classifyImage() {
        if (!this.currentFile) {
            this.showError('Please select an image first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', this.currentFile);

        // Show loading
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('classifyBtn').disabled = true;

        try {
            const response = await fetch('/classify', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Classification failed');
            }

            if (result.success) {
                this.displayResults(result);
            } else {
                throw new Error(result.error || 'Classification failed');
            }
        } catch (error) {
            console.error('Classification error:', error);
            this.showError(error.message || 'Network error occurred. Please try again.');
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('classifyBtn').disabled = false;
        }
    }

    displayResults(result) {
        // Update prediction badge
        document.getElementById('predictionClass').textContent = 
            result.prediction.class.replace(/_/g, ' ').toUpperCase();
        document.getElementById('confidenceScore').textContent = 
            result.prediction.confidence + '% Confidence';

        // Display images
        document.getElementById('originalImage').src = result.images.original;
        document.getElementById('gradcamImage').src = result.images.gradcam;

        // Update chart
        this.updateChart(result.probabilities);

        // Show results section
        document.getElementById('resultsSection').style.display = 'block';

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    updateChart(probabilities) {
        const labels = probabilities.map(p => 
            p.class.replace(/_/g, ' ').toUpperCase()
        );
        const data = probabilities.map(p => p.probability * 100);
        const backgroundColors = probabilities.map(p => 
            p.isPredicted ? '#10b981' : '#64748b'
        );
        const borderColors = probabilities.map(p => 
            p.isPredicted ? '#0da271' : '#475569'
        );

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].backgroundColor = backgroundColors;
        this.chart.data.datasets[0].borderColor = borderColors;
        this.chart.update();
    }

    showError(message) {
        // Create a more elegant error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;">
                <strong>Error:</strong> ${message}
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; margin-left: 10px; cursor: pointer;">×</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BrainCancerApp();
});