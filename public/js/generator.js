// Funcionalidad del generador de videos
function initGeneratorForm() {
    const generatorForm = document.getElementById('generator-form');
    if (!generatorForm) return;
    
    const descriptionInput = document.getElementById('video-description');
    const providerSelect = document.getElementById('ai-provider');
    const styleSelect = document.getElementById('visual-style');
    const durationSlider = document.getElementById('duration-slider');
    const durationValue = document.getElementById('duration-value');
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const generationStatus = document.getElementById('generation-status');
    
    // Actualizar valor de duración
    if (durationSlider && durationValue) {
        durationValue.textContent = durationSlider.value + 's';
        
        durationSlider.addEventListener('input', function() {
            durationValue.textContent = this.value + 's';
        });
    }
    
    // Limpiar formulario
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (descriptionInput) descriptionInput.value = '';
            if (providerSelect) providerSelect.selectedIndex = 0;
            if (styleSelect) styleSelect.selectedIndex = 0;
            if (durationSlider) {
                durationSlider.value = 4;
                if (durationValue) durationValue.textContent = '4s';
            }
        });
    }
    
    // Generar video
    if (generatorForm) {
        generatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar formulario
            if (!descriptionInput || !descriptionInput.value.trim()) {
                showNotification('Por favor, describe el video que quieres generar', 'error');
                return;
            }
            
            // Mostrar estado de generación
            if (generationStatus) {
                generationStatus.classList.remove('hidden');
                generationStatus.innerHTML = `
                    <div class="loading-spinner"></div>
                    <h3>Generando video...</h3>
                    <p>Procesando tu solicitud...</p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress" style="width: 0%"></div>
                        </div>
                        <div class="progress-status">Iniciando...</div>
                    </div>
                    <button class="btn btn-cancel" id="cancel-generation">Cancelar</button>
                `;
                
                // Ocultar formulario
                generatorForm.classList.add('hidden');
                
                // Configurar botón de cancelar
                const cancelBtn = document.getElementById('cancel-generation');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function() {
                        cancelGeneration();
                    });
                }
            }
            
            // Recopilar datos del formulario
            const formData = new FormData(generatorForm);
            const data = {
                description: formData.get('description'),
                provider: formData.get('provider'),
                style: formData.get('style'),
                duration: formData.get('duration')
            };
            
            // Iniciar generación
            generateVideo(data);
        });
    }
}

// Generar video
function generateVideo(data) {
    const progressBar = document.querySelector('.progress');
    const progressStatus = document.querySelector('.progress-status');
    let generationId = null;
    
    // Iniciar generación
    fetch('/api/generate-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                showGenerationError(result.error);
                return;
            }
            
            generationId = result.generationId;
            
            // Iniciar verificación de estado
            checkGenerationStatus(generationId);
        })
        .catch(error => {
            console.error('Error al generar video:', error);
            showGenerationError('Error al comunicarse con el servidor');
        });
    
    // Verificar estado de generación
    function checkGenerationStatus(id) {
        const statusCheck = setInterval(() => {
            fetch(`/api/generation-status/${id}`)
                .then(response => response.json())
                .then(status => {
                    // Actualizar progreso
                    if (progressBar && status.progress) {
                        progressBar.style.width = `${status.progress}%`;
                    }
                    
                    if (progressStatus && status.message) {
                        progressStatus.textContent = status.message;
                    }
                    
                    // Verificar si ha terminado
                    if (status.status === 'completed') {
                        clearInterval(statusCheck);
                        showGenerationComplete(status.videoUrl, status.videoId);
                    } else if (status.status === 'error') {
                        clearInterval(statusCheck);
                        showGenerationError(status.error || 'Error durante la generación');
                    }
                })
                .catch(error => {
                    console.error('Error al verificar estado:', error);
                    // No detener la verificación por un error temporal
                });
        }, 2000);
    }
    
    // Cancelar generación
    function cancelGeneration() {
        if (generationId) {
            fetch(`/api/cancel-generation/${generationId}`, {
                method: 'POST'
            })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        showNotification('Generación cancelada', 'info');
                        resetGeneratorUI();
                    } else {
                        showNotification('Error al cancelar: ' + result.error, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error al cancelar generación:', error);
                    showNotification('Error al cancelar generación', 'error');
                });
        } else {
            resetGeneratorUI();
        }
    }
}

// Mostrar error de generación
function showGenerationError(errorMessage) {
    const generationStatus = document.getElementById('generation-status');
    if (generationStatus) {
        generationStatus.innerHTML = `
            <div class="video-error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error al generar el video</h3>
                <p>${errorMessage}</p>
                <button class="btn btn-primary" id="retry-generation">Intentar de nuevo</button>
            </div>
        `;
        
        const retryBtn = document.getElementById('retry-generation');
        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                resetGeneratorUI();
            });
        }
    }
}

// Mostrar generación completa
function showGenerationComplete(videoUrl, videoId) {
    const generationStatus = document.getElementById('generation-status');
    if (generationStatus) {
        generationStatus.innerHTML = `
            <h3>¡Video generado con éxito!</h3>
            <div class="video-container">
                <video id="generated-video" controls>
                    <source src="${videoUrl}" type="video/mp4">
                    Tu navegador no soporta la reproducción de videos.
                </video>
            </div>
            <div class="video-actions">
                <a href="${videoUrl}" download class="btn btn-primary">
                    <i class="fas fa-download"></i> Descargar
                </a>
                <button class="btn btn-primary" id="view-in-gallery">
                    <i class="fas fa-photo-video"></i> Ver en galería
                </button>
                <button class="btn btn-primary" id="generate-new">
                    <i class="fas fa-plus"></i> Generar nuevo
                </button>
            </div>
        `;
        
        // Configurar botones
        const galleryBtn = document.getElementById('view-in-gallery');
        if (galleryBtn) {
            galleryBtn.addEventListener('click', function() {
                window.location.href = '/gallery';
            });
        }
        
        const newBtn = document.getElementById('generate-new');
        if (newBtn) {
            newBtn.addEventListener('click', function() {
                resetGeneratorUI();
            });
        }
    }
}

// Restablecer UI del generador
function resetGeneratorUI() {
    const generatorForm = document.getElementById('generator-form');
    const generationStatus = document.getElementById('generation-status');
    
    if (generatorForm) {
        generatorForm.classList.remove('hidden');
    }
    
    if (generationStatus) {
        generationStatus.classList.add('hidden');
    }
}

/**
 * Video Generator functionality
 */
class VideoGenerator {
    constructor() {
        this.description = '';
        this.style = 'realistic';
        this.duration = 10;
        this.resolution = '720p';
        this.isGenerating = false;
        this.progress = 0;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Generate button
        const generateBtn = document.getElementById('generate-video');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.startGeneration();
            });
        }
        
        // Duration slider
        const durationSlider = document.getElementById('video-duration');
        const durationValue = document.getElementById('duration-value');
        if (durationSlider && durationValue) {
            durationSlider.addEventListener('input', () => {
                this.duration = durationSlider.value;
                durationValue.textContent = this.duration;
            });
        }
        
        // Style selection
        document.querySelectorAll('input[name="style"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.style = radio.value;
                }
            });
        });
        
        // Resolution selection
        const resolutionSelect = document.getElementById('video-resolution');
        if (resolutionSelect) {
            resolutionSelect.addEventListener('change', () => {
                this.resolution = resolutionSelect.value;
            });
        }
        
        // Video actions
        const downloadBtn = document.getElementById('download-video');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadVideo();
            });
        }
        
        const shareBtn = document.getElementById('share-video');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareVideo();
            });
        }
        
        const saveBtn = document.getElementById('save-video');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveToGallery();
            });
        }
    }
    
    startGeneration() {
        // Get description
        const descriptionTextarea = document.getElementById('video-description');
        if (!descriptionTextarea || !descriptionTextarea.value.trim()) {
            alert('Por favor, describe tu video antes de generarlo.');
            return;
        }
        
        this.description = descriptionTextarea.value.trim();
        
        // Check if FFmpeg is installed
        if (typeof ffmpegDetector !== 'undefined') {
            ffmpegDetector.checkInstallation().then(installed => {
                if (!installed) {
                    alert('FFmpeg es necesario para generar videos. Por favor, instálalo primero.');
                    ffmpegDetector.showManualInstructions();
                    return;
                }
                
                // Continue with generation
                this.processGeneration();
            });
        } else {
            // Continue with generation (FFmpeg check will be done by the server)
            this.processGeneration();
        }
    }
    
    processGeneration() {
        // Show progress UI
        document.getElementById('generation-progress').style.display = 'block';
        document.getElementById('video-result').style.display = 'none';
        
        // Reset progress
        this.progress = 0;
        this.isGenerating = true;
        this.updateProgressUI('Inicializando...');
        
        // Send generation request to server
        fetch('/api/generate-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: this.description,
                style: this.style,
                duration: this.duration,
                resolution: this.resolution
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la generación del video');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Start polling for progress
                this.pollGenerationProgress(data.jobId);
            } else {
                throw new Error(data.message || 'Error en la generación del video');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.isGenerating = false;
            this.updateProgressUI('Error: ' + error.message);
        });
    }
    
    pollGenerationProgress(jobId) {
        if (!this.isGenerating) return;
        
        fetch(`/api/generation-progress/${jobId}`)
            .then(response => response.json())
            .then(data => {
                if (data.completed) {
                    // Generation completed
                    this.isGenerating = false;
                    this.progress = 100;
                    this.updateProgressUI('¡Completado!');
                    this.showResult(data.videoUrl);
                } else if (data.error) {
                    // Error occurred
                    this.isGenerating = false;
                    this.updateProgressUI('Error: ' + data.error);
                } else {
                    // Update progress
                    this.progress = data.progress;
                    this.updateProgressUI(data.status);
                    
                    // Continue polling
                    setTimeout(() => {
                        this.pollGenerationProgress(jobId);
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Error polling progress:', error);
                this.isGenerating = false;
                this.updateProgressUI('Error al verificar el progreso');
            });
    }
    
    updateProgressUI(status) {
        const progressFill = document.querySelector('.progress-fill');
        const progressStatus = document.getElementById('progress-status');
        
        if (progressFill) {
            progressFill.style.width = `${this.progress}%`;
        }
        
        if (progressStatus) {
            progressStatus.textContent = status;
        }
    }
    
    showResult(videoUrl) {
        // Hide progress UI
        document.getElementById('generation-progress').style.display = 'none';
        
        // Show result UI
        const resultContainer = document.getElementById('video-result');
        resultContainer.style.display = 'block';
        
        // Set video source
        const videoElement = document.getElementById('result-video');
        if (videoElement) {
            videoElement.src = videoUrl;
            videoElement.load();
        }
        
        // Store video URL for later use
        this.generatedVideoUrl = videoUrl;
    }
    
    downloadVideo() {
        if (!this.generatedVideoUrl) {
            alert('No hay video para descargar');
            return;
        }
        
        // Create a temporary link to download the video
        const a = document.createElement('a');
        a.href = this.generatedVideoUrl;
        a.download = `visionai-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    shareVideo() {
        if (!this.generatedVideoUrl) {
            alert('No hay video para compartir');
            return;
        }
        
        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: 'Mi video generado con VisionAI',
                text: this.description,
                url: this.generatedVideoUrl
            })
            .then(() => console.log('Video compartido exitosamente'))
            .catch(error => console.error('Error al compartir:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            prompt('Copia este enlace para compartir tu video:', this.generatedVideoUrl);
        }
    }
    
    saveToGallery() {
        if (!this.generatedVideoUrl) {
            alert('No hay video para guardar');
            return;
        }
        
        // Check if user is logged in
        const user = localStorage.getItem('user');
        if (!user) {
            alert('Debes iniciar sesión para guardar videos en tu galería');
            if (typeof navigation !== 'undefined') {
                navigation.showLoginModal();
            }
            return;
        }
        
        // Save video to gallery
        fetch('/api/save-to-gallery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl: this.generatedVideoUrl,
                description: this.description,
                style: this.style,
                duration: this.duration,
                resolution: this.resolution
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Video guardado en tu galería');
            } else {
                alert(data.message || 'Error al guardar el video');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar el video');
        });
    }
    
    // Método para compartir en redes sociales específicas
    shareToSocialMedia(platform) {
        if (!this.generatedVideoUrl) {
            alert('No hay video para compartir');
            return;
        }
        
        let shareUrl = '';
        const videoUrl = encodeURIComponent(this.generatedVideoUrl);
        const description = encodeURIComponent('Video generado con VisionAI: ' + this.description);
        
        switch(platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${videoUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${videoUrl}&text=${description}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${videoUrl}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${description}%20${videoUrl}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${videoUrl}&text=${description}`;
                break;
            default:
                alert('Plataforma no soportada');
                return;
        }
        
        // Abrir ventana de compartir
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    // Método para exportar video con diferentes configuraciones
    exportVideo(format = 'mp4', quality = 'high') {
        if (!this.generatedVideoUrl) {
            alert('No hay video para exportar');
            return;
        }
        
        // Mostrar indicador de progreso
        this.updateProgressUI('Preparando exportación...');
        document.getElementById('generation-progress').style.display = 'block';
        
        // Enviar solicitud de exportación al servidor
        fetch('/api/export-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl: this.generatedVideoUrl,
                format: format,
                quality: quality
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('generation-progress').style.display = 'none';
            
            if (data.success) {
                // Crear enlace de descarga
                const a = document.createElement('a');
                a.href = data.exportedUrl;
                a.download = `visionai-video-${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert(data.message || 'Error al exportar el video');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('generation-progress').style.display = 'none';
            alert('Error al exportar el video');
        });
    }
    
    // Método para aplicar filtros al video generado
    applyFilter(filterType) {
        if (!this.generatedVideoUrl) {
            alert('No hay video para aplicar filtros');
            return;
        }
        
        // Mostrar indicador de progreso
        this.updateProgressUI('Aplicando filtro...');
        document.getElementById('generation-progress').style.display = 'block';
        
        // Enviar solicitud para aplicar filtro
        fetch('/api/apply-filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl: this.generatedVideoUrl,
                filterType: filterType
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('generation-progress').style.display = 'none';
            
            if (data.success) {
                // Actualizar video con filtro aplicado
                this.generatedVideoUrl = data.filteredUrl;
                
                // Actualizar reproductor de video
                const videoElement = document.getElementById('result-video');
                if (videoElement) {
                    videoElement.src = this.generatedVideoUrl;
                    videoElement.load();
                }
                
                alert('Filtro aplicado correctamente');
            } else {
                alert(data.message || 'Error al aplicar el filtro');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('generation-progress').style.display = 'none';
            alert('Error al aplicar el filtro');
        });
    }
    
    // Método para añadir subtítulos al video
    addSubtitles(language = 'es') {
        if (!this.generatedVideoUrl) {
            alert('No hay video para añadir subtítulos');
            return;
        }
        
        // Mostrar indicador de progreso
        this.updateProgressUI('Generando subtítulos...');
        document.getElementById('generation-progress').style.display = 'block';
        
        // Enviar solicitud para generar subtítulos
        fetch('/api/generate-subtitles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl: this.generatedVideoUrl,
                language: language
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('generation-progress').style.display = 'none';
            
            if (data.success) {
                // Actualizar video con subtítulos
                this.generatedVideoUrl = data.videoWithSubtitles;
                
                // Actualizar reproductor de video
                const videoElement = document.getElementById('result-video');
                if (videoElement) {
                    videoElement.src = this.generatedVideoUrl;
                    videoElement.load();
                }
                
                alert('Subtítulos añadidos correctamente');
            } else {
                alert(data.message || 'Error al generar subtítulos');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('generation-progress').style.display = 'none';
            alert('Error al generar subtítulos');
        });
    }
    
    // Método para añadir narración por voz
    addVoiceover(voice = 'neutral', speed = 'normal') {
        if (!this.generatedVideoUrl) {
            alert('No hay video para añadir narración');
            return;
        }
        
        // Mostrar indicador de progreso
        this.updateProgressUI('Generando narración...');
        document.getElementById('generation-progress').style.display = 'block';
        
        // Enviar solicitud para generar narración
        fetch('/api/generate-voiceover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl: this.generatedVideoUrl,
                description: this.description,
                voice: voice,
                speed: speed
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('generation-progress').style.display = 'none';
            
            if (data.success) {
                // Actualizar video con narración
                this.generatedVideoUrl = data.videoWithVoiceover;
                
                // Actualizar reproductor de video
                const videoElement = document.getElementById('result-video');
                if (videoElement) {
                    videoElement.src = this.generatedVideoUrl;
                    videoElement.load();
                }
                
                alert('Narración añadida correctamente');
            } else {
                alert(data.message || 'Error al generar narración');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('generation-progress').style.display = 'none';
            alert('Error al generar narración');
        });
    }
    
    // Método para cambiar la música de fondo
    changeBackgroundMusic(musicStyle) {
        if (!this.generatedVideoUrl) {
            alert('No hay video para cambiar la música');
            return;
        }
        
        // Mostrar indicador de progreso
        this.updateProgressUI('Cambiando música de fondo...');
        document.getElementById('generation-progress').style.display = 'block';
        
        // Enviar solicitud para cambiar música
        fetch('/api/change-music', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoUrl: this.generatedVideoUrl,
                musicStyle: musicStyle
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('generation-progress').style.display = 'none';
            
            if (data.success) {
                // Actualizar video con nueva música
                this.generatedVideoUrl = data.videoWithMusic;
                
                // Actualizar reproductor de video
                const videoElement = document.getElementById('result-video');
                if (videoElement) {
                    videoElement.src = this.generatedVideoUrl;
                    videoElement.load();
                }
                
                alert('Música cambiada correctamente');
            } else {
                alert(data.message || 'Error al cambiar la música');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('generation-progress').style.display = 'none';
            alert('Error al cambiar la música');
        });
    }
}

// Initialize generator
function initGenerator() {
    if (!window.videoGenerator) {
        window.videoGenerator = new VideoGenerator();
    }
    
    // Inicializar selectores de orientación
    const orientationButtons = document.querySelectorAll('input[name="orientation"]');
    if (orientationButtons.length > 0) {
        orientationButtons.forEach(button => {
            button.addEventListener('change', function() {
                const previewContainer = document.querySelector('.video-preview');
                if (previewContainer) {
                    // Cambiar aspecto de la previsualización según orientación
                    if (this.value === 'vertical') {
                        previewContainer.style.aspectRatio = '9/16';
                    } else if (this.value === 'horizontal') {
                        previewContainer.style.aspectRatio = '16/9';
                    } else if (this.value === 'both') {
                        // Mostrar ambos formatos (podría implementarse con dos contenedores)
                        previewContainer.style.aspectRatio = '16/9';
                    }
                }
            });
        });
    }
    
    // Inicializar selector de idioma
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            // Actualizar idioma de la interfaz o del video según selección
            const selectedLanguage = this.value;
            console.log('Idioma seleccionado:', selectedLanguage);
            // Implementar cambio de idioma si es necesario
        });
    }
    
    // Inicializar botones de compartir en redes sociales
    const socialShareButtons = document.querySelectorAll('.social-share-btn');
    if (socialShareButtons.length > 0) {
        socialShareButtons.forEach(button => {
            button.addEventListener('click', function() {
                const platform = this.getAttribute('data-platform');
                if (window.videoGenerator) {
                    window.videoGenerator.shareToSocialMedia(platform);
                }
            });
        });
    }
    
    // Inicializar opciones adicionales (subtítulos, narración)
    const subtitlesCheckbox = document.getElementById('include-subtitles');
    if (subtitlesCheckbox) {
        subtitlesCheckbox.addEventListener('change', function() {
            if (this.checked && window.videoGenerator && window.videoGenerator.generatedVideoUrl) {
                window.videoGenerator.addSubtitles();
            }
        });
    }
    
    const voiceoverCheckbox = document.getElementById('include-voiceover');
    if (voiceoverCheckbox) {
        voiceoverCheckbox.addEventListener('change', function() {
            if (this.checked && window.videoGenerator && window.videoGenerator.generatedVideoUrl) {
                window.videoGenerator.addVoiceover();
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize generator form
    initGeneratorForm();
    
    // Initialize video generator
    initGenerator();
    
    // Initialize if we're on the generator page
    if (document.getElementById('generador-page') && document.getElementById('generador-page').style.display !== 'none') {
        initGenerator();
    }
    
    // Also initialize the "Start Now" button on the home page
    const startNowBtn = document.getElementById('start-now');
    if (startNowBtn) {
        startNowBtn.addEventListener('click', () => {
            if (typeof navigation !== 'undefined') {
                navigation.navigateTo('generador');
            } else {
                window.location.href = '/generador.html';
            }
        });
    }
    
    // Inicializar botones de duración personalizada
    const durationCustom = document.getElementById('duration-custom');
    const customDurationContainer = document.getElementById('custom-duration-container');
    
    if (durationCustom && customDurationContainer) {
        durationCustom.addEventListener('change', function() {
            if (this.checked) {
                customDurationContainer.style.display = 'block';
            } else {
                customDurationContainer.style.display = 'none';
            }
        });
        
        // Manejar todos los botones de radio de duración
        const durationRadios = document.querySelectorAll('input[name="duration"]');
        durationRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'custom') {
                    customDurationContainer.style.display = 'block';
                } else {
                    customDurationContainer.style.display = 'none';
                }
            });
        });
    }
    
    // Añadir manejadores para los enlaces al generador
    setupGeneratorLinks();
});

// Configurar enlaces al generador
function setupGeneratorLinks() {
    // Enlaces en la navegación principal
    const generatorNavLinks = document.querySelectorAll('.nav-item[data-page="generador"], a[href*="generador"]');
    generatorNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof navigation !== 'undefined') {
                navigation.navigateTo('generador');
            } else {
                window.location.href = '/generador.html';
            }
        });
    });
    
    // Botón "Comenzar ahora" en la página de inicio
    const startNowButtons = document.querySelectorAll('.btn-start-now, .btn-primary:contains("Comenzar ahora")');
    startNowButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof navigation !== 'undefined') {
                navigation.navigateTo('generador');
            } else {
                window.location.href = '/generador.html';
            }
        });
    });
    
    // Botón "Ir al Generador" en cualquier parte del sitio
    const goToGeneratorButtons = document.querySelectorAll('.go-to-generator, a[href*="generador"]');
    goToGeneratorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof navigation !== 'undefined') {
                navigation.navigateTo('generador');
            } else {
                window.location.href = '/generador.html';
            }
        });
    });
}