// Funcionalidad de la galería de videos
function initGallery() {
    const galleryContainer = document.querySelector('.gallery-container');
    if (!galleryContainer) return;
    
    const refreshBtn = document.querySelector('.btn-refresh');
    const videosGrid = document.querySelector('.videos-grid');
    
    // Cargar videos al iniciar
    loadVideos();
    
    // Configurar botón de actualizar
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadVideos();
        });
    }
    
    // Cargar videos
    function loadVideos() {
        if (videosGrid) {
            // Mostrar cargando
            videosGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando videos...</p>
                </div>
            `;
            
            // Obtener videos
            fetch('/api/videos')
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showGalleryError(data.error);
                        return;
                    }
                    
                    if (data.videos && data.videos.length > 0) {
                        renderVideos(data.videos);
                    } else {
                        showEmptyState();
                    }
                })
                .catch(error => {
                    console.error('Error al cargar videos:', error);
                    showGalleryError('Error al cargar videos');
                });
        }
    }
    
    // Renderizar videos
    function renderVideos(videos) {
        if (videosGrid) {
            videosGrid.innerHTML = '';
            
            videos.forEach(video => {
                const videoCard = document.createElement('div');
                videoCard.className = 'video-card';
                videoCard.innerHTML = `
                    <div class="video-thumbnail" style="background-image: url('${video.thumbnail || '/img/thumbnail-placeholder.jpg'}')">
                        <div class="play-button" data-video-id="${video.id}">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    <div class="video-info">
                        <h3>${video.title || 'Video sin título'}</h3>
                        <p>${formatDate(video.createdAt)}</p>
                        <div class="video-actions">
                            <button class="btn btn-sm btn-primary view-video" data-video-id="${video.id}">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            <a href="${video.url}" download class="btn btn-sm btn-primary">
                                <i class="fas fa-download"></i> Descargar
                            </a>
                            <button class="btn btn-sm btn-danger delete-video" data-video-id="${video.id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                `;
                
                videosGrid.appendChild(videoCard);
                
                // Configurar hover para el botón de reproducción
                const thumbnail = videoCard.querySelector('.video-thumbnail');
                const playButton = videoCard.querySelector('.play-button');
                
                thumbnail.addEventListener('mouseenter', function() {
                    playButton.style.opacity = '1';
                });
                
                thumbnail.addEventListener('mouseleave', function() {
                    playButton.style.opacity = '0';
                });
                
                // Configurar clic en el botón de reproducción
                playButton.addEventListener('click', function() {
                    const videoId = this.getAttribute('data-video-id');
                    openVideoModal(videoId);
                });
                
                // Configurar botones de acción
                const viewBtn = videoCard.querySelector('.view-video');
                if (viewBtn) {
                    viewBtn.addEventListener('click', function() {
                        const videoId = this.getAttribute('data-video-id');
                        openVideoModal(videoId);
                    });
                }
                
                const deleteBtn = videoCard.querySelector('.delete-video');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        const videoId = this.getAttribute('data-video-id');
                        confirmDeleteVideo(videoId);
                    });
                }
            });
        }
    }
    
    // Mostrar estado vacío
    function showEmptyState() {
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>No tienes videos generados aún.</h3>
                    <p>Genera tu primer video para verlo aquí.</p>
                    <a href="/generator" class="btn btn-primary">Crear tu primer video</a>
                </div>
            `;
        }
    }
    
    // Mostrar error
    function showGalleryError(errorMessage) {
        if (videosGrid) {
            videosGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error al cargar videos</h3>
                    <p>${errorMessage}</p>
                    <button class="btn btn-primary retry-load">Intentar de nuevo</button>
                </div>
            `;
            
            const retryBtn = videosGrid.querySelector('.retry-load');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    loadVideos();
                });
            }
        }
    }
    
    // Abrir modal de video
    function openVideoModal(videoId) {
        fetch(`/api/videos/${videoId}`)
            .then(response => response.json())
            .then(video => {
                if (video.error) {
                    showNotification(video.error, 'error');
                    return;
                }
                
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.style.display = 'block';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>${video.title || 'Video sin título'}</h2>
                        <div class="video-container">
                            <video id="modal-video" controls autoplay>
                                <source src="${video.url}" type="video/mp4">
                                Tu navegador no soporta la reproducción de videos.
                            </video>
                        </div>
                        <div class="video-details">
                            <p><strong>Descripción:</strong> ${video.description || 'Sin descripción'}</p>
                            <p><strong>Estilo:</strong> ${video.style || 'No especificado'}</p>
                            <p><strong>Duración:</strong> ${video.duration || 'No especificada'} segundos</p>
                            <p><strong>Fecha de creación:</strong> ${formatDate(video.createdAt)}</p>
                        </div>
                        <div class="modal-actions">
                            <a href="${video.url}" download class="btn btn-primary">
                                <i class="fas fa-download"></i> Descargar
                            </a>
                            <button class="btn btn-danger delete-video-modal" data-video-id="${video.id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Configurar cierre del modal
                const closeBtn = modal.querySelector('.close');
                closeBtn.addEventListener('click', function() {
                    modal.remove();
                });
                
                // Configurar botón de eliminar
                const deleteBtn = modal.querySelector('.delete-video-modal');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        const videoId = this.getAttribute('data-video-id');
                        modal.remove();
                        confirmDeleteVideo(videoId);
                    });
                }
                
                // Cerrar modal al hacer clic fuera del contenido
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            })
            .catch(error => {
                console.error('Error al cargar detalles del video:', error);
                showNotification('Error al cargar detalles del video', 'error');
            });
    }
    
    // Confirmar eliminación de video
    function confirmDeleteVideo(videoId) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal';
        confirmModal.style.display = 'block';
        confirmModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Confirmar eliminación</h2>
                <p>¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary cancel-delete">Cancelar</button>
                    <button class="btn btn-danger confirm-delete" data-video-id="${videoId}">Eliminar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        // Configurar cierre del modal
        const closeBtn = confirmModal.querySelector('.close');
        const cancelBtn = confirmModal.querySelector('.cancel-delete');
        
        closeBtn.addEventListener('click', function() {
            confirmModal.remove();
        });
        
        cancelBtn.addEventListener('click', function() {
            confirmModal.remove();
        });
        
        // Configurar botón de confirmar
        const confirmBtn = confirmModal.querySelector('.confirm-delete');
        confirmBtn.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            deleteVideo(videoId);
            confirmModal.remove();
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                confirmModal.remove();
            }
        });
    }
    
    // Eliminar video
    function deleteVideo(videoId) {
        fetch(`/api/videos/${videoId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showNotification('Video eliminado correctamente', 'success');
                    loadVideos(); // Recargar la galería
                } else {
                    showNotification('Error al eliminar video: ' + result.error, 'error');
                }
            })
            .catch(error => {
                console.error('Error al eliminar video:', error);
                showNotification('Error al eliminar video', 'error');
            });
    }
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para compartir videos
function shareVideo(videoId, platform) {
    fetch(`/api/videos/${videoId}`)
        .then(response => response.json())
        .then(video => {
            if (video.error) {
                showNotification(video.error, 'error');
                return;
            }
            
            let shareUrl = '';
            const videoUrl = encodeURIComponent(window.location.origin + video.url);
            const title = encodeURIComponent(video.title || 'Video generado con VisionAI');
            
            switch (platform) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${videoUrl}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${videoUrl}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${title}%20${videoUrl}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${videoUrl}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=${title}&body=${videoUrl}`;
                    break;
                default:
                    // Copiar al portapapeles
                    navigator.clipboard.writeText(window.location.origin + video.url)
                        .then(() => {
                            showNotification('URL del video copiada al portapapeles', 'success');
                        })
                        .catch(err => {
                            showNotification('Error al copiar URL', 'error');
                            console.error('Error al copiar:', err);
                        });
                    return;
            }
            
            // Abrir ventana de compartir
            window.open(shareUrl, '_blank', 'width=600,height=400');
        })
        .catch(error => {
            console.error('Error al obtener detalles del video:', error);
            showNotification('Error al compartir video', 'error');
        });
}

// Función para mostrar opciones de compartir
function showShareOptions(videoId) {
    const shareModal = document.createElement('div');
    shareModal.className = 'modal';
    shareModal.style.display = 'block';
    shareModal.innerHTML = `
        <div class="modal-content share-modal">
            <span class="close">&times;</span>
            <h2>Compartir video</h2>
            <div class="share-options">
                <button class="share-btn twitter" data-platform="twitter">
                    <i class="fab fa-twitter"></i> Twitter
                </button>
                <button class="share-btn facebook" data-platform="facebook">
                    <i class="fab fa-facebook"></i> Facebook
                </button>
                <button class="share-btn whatsapp" data-platform="whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="share-btn linkedin" data-platform="linkedin">
                    <i class="fab fa-linkedin"></i> LinkedIn
                </button>
                <button class="share-btn email" data-platform="email">
                    <i class="fas fa-envelope"></i> Email
                </button>
                <button class="share-btn copy" data-platform="copy">
                    <i class="fas fa-copy"></i> Copiar enlace
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(shareModal);
    
    // Configurar cierre del modal
    const closeBtn = shareModal.querySelector('.close');
    closeBtn.addEventListener('click', function() {
        shareModal.remove();
    });
    
    // Configurar botones de compartir
    const shareBtns = shareModal.querySelectorAll('.share-btn');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            shareVideo(videoId, platform);
            shareModal.remove();
        });
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    shareModal.addEventListener('click', function(e) {
        if (e.target === shareModal) {
            shareModal.remove();
        }
    });
}

// Función para editar metadatos del video
function editVideoMetadata(videoId) {
    // Primero obtener los datos actuales del video
    fetch(`/api/videos/${videoId}`)
        .then(response => response.json())
        .then(video => {
            if (video.error) {
                showNotification(video.error, 'error');
                return;
            }
            
            const editModal = document.createElement('div');
            editModal.className = 'modal';
            editModal.style.display = 'block';
            editModal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Editar información del video</h2>
                    <form id="edit-video-form">
                        <div class="form-group">
                            <label for="edit-title">Título</label>
                            <input type="text" id="edit-title" name="title" value="${video.title || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-description">Descripción</label>
                            <textarea id="edit-description" name="description" rows="4">${video.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-tags">Etiquetas (separadas por comas)</label>
                            <input type="text" id="edit-tags" name="tags" value="${video.tags ? video.tags.join(', ') : ''}">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary cancel-edit">Cancelar</button>
                            <button type="submit" class="btn btn-primary save-edit">Guardar cambios</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(editModal);
            
            // Configurar cierre del modal
            const closeBtn = editModal.querySelector('.close');
            const cancelBtn = editModal.querySelector('.cancel-edit');
            
            closeBtn.addEventListener('click', function() {
                editModal.remove();
            });
            
            cancelBtn.addEventListener('click', function() {
                editModal.remove();
            });
            
            // Configurar envío del formulario
            const form = editModal.querySelector('#edit-video-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
                };
                
                updateVideoMetadata(videoId, data);
                editModal.remove();
            });
            
            // Cerrar modal al hacer clic fuera del contenido
            editModal.addEventListener('click', function(e) {
                if (e.target === editModal) {
                    editModal.remove();
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar detalles del video:', error);
            showNotification('Error al cargar detalles del video', 'error');
        });
}

// Función para actualizar metadatos del video
function updateVideoMetadata(videoId, data) {
    fetch(`/api/videos/${videoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('Información del video actualizada correctamente', 'success');
                loadVideos(); // Recargar la galería
            } else {
                showNotification('Error al actualizar información: ' + result.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error al actualizar información del video:', error);
            showNotification('Error al actualizar información del video', 'error');
        });
}

// Función para filtrar y buscar videos
function setupVideoFilters() {
    const searchInput = document.getElementById('video-search');
    const filterSelect = document.getElementById('video-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterVideos();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterVideos();
        });
    }
    
    function filterVideos() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filterValue = filterSelect ? filterSelect.value : 'all';
        
        fetch('/api/videos')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showGalleryError(data.error);
                    return;
                }
                
                if (!data.videos || data.videos.length === 0) {
                    showEmptyState();
                    return;
                }
                
                // Filtrar videos
                let filteredVideos = data.videos;
                
                // Filtrar por término de búsqueda
                if (searchTerm) {
                    filteredVideos = filteredVideos.filter(video => {
                        return (
                            (video.title && video.title.toLowerCase().includes(searchTerm)) ||
                            (video.description && video.description.toLowerCase().includes(searchTerm)) ||
                            (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                        );
                    });
                }
                
                // Filtrar por tipo
                if (filterValue !== 'all') {
                    filteredVideos = filteredVideos.filter(video => {
                        return video.style === filterValue;
                    });
                }
                
                // Renderizar videos filtrados
                if (filteredVideos.length > 0) {
                    renderVideos(filteredVideos);
                } else {
                    const videosGrid = document.querySelector('.videos-grid');
                    if (videosGrid) {
                        videosGrid.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-search"></i>
                                <h3>No se encontraron videos</h3>
                                <p>No hay videos que coincidan con tu búsqueda.</p>
                                <button class="btn btn-primary clear-filters">Limpiar filtros</button>
                            </div>
                        `;
                        
                        const clearBtn = videosGrid.querySelector('.clear-filters');
                        if (clearBtn) {
                            clearBtn.addEventListener('click', function() {
                                if (searchInput) searchInput.value = '';
                                if (filterSelect) filterSelect.value = 'all';
                                loadVideos();
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error al cargar videos:', error);
                showGalleryError('Error al cargar videos');
            });
    }
}

// Inicializar filtros cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    setupVideoFilters();
});