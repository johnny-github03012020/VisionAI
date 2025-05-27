/**
 * Navegación principal del sitio
 */
class Navigation {
    constructor() {
        this.currentPage = this.getCurrentPageFromUrl();
        this.pages = ['inicio', 'generador', 'galeria'];
        this.initEventListeners();
    }
    
    getCurrentPageFromUrl() {
        // Determine current page from URL
        const path = window.location.pathname;
        if (path.includes('generador.html')) return 'generador';
        if (path.includes('galeria.html')) return 'galeria';
        return 'inicio';
    }
    
    initEventListeners() {
        // Manejadores para los elementos de navegación
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                if (page) {
                    this.navigateTo(page);
                }
            });
        });
        
        // Manejador para el logo (vuelve al inicio)
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', () => {
                this.navigateTo('inicio');
            });
        }
        
        // Manejador para "Comenzar ahora"
        const comenzarAhora = document.getElementById('comenzar-ahora');
        if (comenzarAhora) {
            comenzarAhora.addEventListener('click', () => {
                this.navigateTo('generador');
            });
        }
        
        // Manejador para "Ir al Generador" en la sección CTA
        const irGenerador = document.getElementById('ir-generador');
        if (irGenerador) {
            irGenerador.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('generador');
            });
        }
        
        // Manejador para todos los enlaces con clase "go-to-generator"
        const goToGeneratorLinks = document.querySelectorAll('.go-to-generator');
        goToGeneratorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('generador');
            });
        });
    }
    
    navigateTo(page) {
        // Verificar si la página existe
        if (!this.pages.includes(page)) {
            console.error(`La página "${page}" no existe`);
            return;
        }
        
        // Manejar la navegación según la página de destino
        if (page === 'inicio') {
            // Navegar a la página principal (index.html o /)
            window.location.href = '/';
        } else {
            // Navegar a otras páginas
            window.location.href = `${page}.html`;
        }
    }
}

// Inicializar navegación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
    
    // Inicializar la galería si estamos en esa página
    if (window.location.pathname.includes('galeria.html')) {
        initGallery();
    }
});

// Función para inicializar la galería
function initGallery() {
    console.log('Inicializando galería...');
    
    // Cargar videos de la galería
    fetch('/api/gallery')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.videos && data.videos.length > 0) {
                displayGalleryVideos(data.videos);
            } else {
                showEmptyGalleryMessage();
            }
        })
        .catch(error => {
            console.error('Error al cargar la galería:', error);
            showGalleryError();
        });
}

// Función para mostrar los videos en la galería
function displayGalleryVideos(videos) {
    const galleryContainer = document.querySelector('.gallery-container') || document.querySelector('main');
    
    if (!galleryContainer) {
        console.error('No se encontró el contenedor de la galería');
        return;
    }
    
    // Limpiar el contenedor
    galleryContainer.innerHTML = '<h1>Galería de Videos</h1><div class="gallery-grid"></div>';
    const galleryGrid = galleryContainer.querySelector('.gallery-grid');
    
    // Añadir cada video a la galería
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <video src="${video.url}" controls></video>
            </div>
            <div class="video-info">
                <p class="video-description">${video.description}</p>
                <p class="video-metadata">Estilo: ${video.style} | Duración: ${video.duration}s</p>
                <div class="video-actions">
                    <button class="btn btn-sm btn-primary download-btn" data-url="${video.url}">Descargar</button>
                    <button class="btn btn-sm btn-secondary share-btn" data-url="${video.url}">Compartir</button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(videoCard);
    });
    
    // Añadir manejadores de eventos para los botones
    setupGalleryEventListeners();
}

// Función para mostrar mensaje de galería vacía
function showEmptyGalleryMessage() {
    const galleryContainer = document.querySelector('.gallery-container') || document.querySelector('main');
    
    if (galleryContainer) {
        galleryContainer.innerHTML = `
            <div class="empty-gallery">
                <h2>Tu galería está vacía</h2>
                <p>Aún no has generado ningún video. ¡Crea tu primer video ahora!</p>
                <button class="btn btn-primary go-to-generator">Ir al Generador</button>
            </div>
        `;
        
        // Añadir manejador para el botón
        const goToGeneratorBtn = galleryContainer.querySelector('.go-to-generator');
        if (goToGeneratorBtn && window.navigation) {
            goToGeneratorBtn.addEventListener('click', () => {
                window.navigation.navigateTo('generador');
            });
        }
    }
}

// Función para mostrar error en la galería
function showGalleryError() {
    const galleryContainer = document.querySelector('.gallery-container') || document.querySelector('main');
    
    if (galleryContainer) {
        galleryContainer.innerHTML = `
            <div class="gallery-error">
                <h2>Error al cargar la galería</h2>
                <p>Ha ocurrido un error al cargar tus videos. Por favor, intenta de nuevo más tarde.</p>
                <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}

// Configurar manejadores de eventos para la galería
function setupGalleryEventListeners() {
    // Manejadores para botones de descarga
    const downloadButtons = document.querySelectorAll('.download-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const videoUrl = this.getAttribute('data-url');
            if (videoUrl) {
                downloadVideo(videoUrl);
            }
        });
    });
    
    // Manejadores para botones de compartir
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const videoUrl = this.getAttribute('data-url');
            if (videoUrl) {
                showShareOptions(videoUrl);
            }
        });
    });
}

// Función para descargar video
function downloadVideo(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video-visionai-' + new Date().getTime() + '.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Función para mostrar opciones de compartir
function showShareOptions(videoUrl) {
    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal';
    shareModal.innerHTML = `
        <div class="share-modal-content">
            <h3>Compartir Video</h3>
            <div class="share-options">
                <button class="share-option" data-platform="facebook"><i class="fab fa-facebook-f"></i> Facebook</button>
                <button class="share-option" data-platform="twitter"><i class="fab fa-twitter"></i> Twitter</button>
                <button class="share-option" data-platform="whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                <button class="share-option" data-platform="telegram"><i class="fab fa-telegram"></i> Telegram</button>
            </div>
            <button class="close-modal">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(shareModal);
    
    // Manejador para cerrar modal
    const closeButton = shareModal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(shareModal);
    });
    
    // Manejadores para opciones de compartir
    const shareOptions = shareModal.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            shareToSocialMedia(platform, videoUrl);
            document.body.removeChild(shareModal);
        });
    });
}

// Función para compartir en redes sociales
function shareToSocialMedia(platform, videoUrl) {
    const encodedUrl = encodeURIComponent(videoUrl);
    const description = encodeURIComponent('Video generado con VisionAI');
    
    let shareUrl = '';
    
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${description}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${description}%20${encodedUrl}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${description}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank');
    }
}