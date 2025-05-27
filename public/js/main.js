// Variables globales
let token = localStorage.getItem('token');
let currentUser = null;
let currentVideoId = null;
let pollingInterval = null;

// Elementos DOM
document.addEventListener('DOMContentLoaded', () => {
  // Navegación
  const navLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('.section');
  const getStartedBtn = document.getElementById('get-started');
  const createFirstVideoBtn = document.getElementById('create-first-video');
  
  // Formularios
  const videoForm = document.getElementById('video-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  // Tabs de autenticación
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  
  // Generación de video
  const durationInput = document.getElementById('duration');
  const durationValue = document.getElementById('duration-value');
  const generationStatus = document.getElementById('generation-status');
  const statusMessage = document.getElementById('status-message');
  const progressBar = document.querySelector('.progress');
  const cancelGenerationBtn = document.getElementById('cancel-generation');
  
  // Galería
  const videosContainer = document.getElementById('videos-container');
  const noVideos = document.getElementById('no-videos');
  const refreshGalleryBtn = document.getElementById('refresh-gallery');
  
  // Modal
  const videoModal = document.getElementById('video-modal');
  const closeModal = document.querySelector('.close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalVideo = document.getElementById('modal-video');
  const modalPrompt = document.getElementById('modal-prompt');
  const modalStyle = document.getElementById('modal-style');
  const modalDuration = document.getElementById('modal-duration');
  const modalProvider = document.getElementById('modal-provider');
  const modalDate = document.getElementById('modal-date');
  const modalDownload = document.getElementById('modal-download');
  const modalDelete = document.getElementById('modal-delete');
  
  // Inicialización
  init();
  
  // Funciones de inicialización
  function init() {
    // Verificar autenticación
    checkAuth();
    
    // Event listeners
    setupEventListeners();
    
    // Actualizar UI basado en estado de autenticación
    updateAuthUI();
    
    // Verificar FFmpeg solo una vez al inicio
    checkFFmpegOnce();
  }
  
  // Función para verificar FFmpeg solo una vez
  function checkFFmpegOnce() {
    // Usar el handler centralizado si está disponible
    if (window.FFmpegHandler && typeof window.FFmpegHandler.init === 'function') {
      // FFmpegHandler ya se encarga de verificar solo una vez
      console.log('Usando FFmpegHandler centralizado');
    } else {
      // Fallback: verificar FFmpeg directamente
      console.log('Verificando FFmpeg directamente');
      fetch('/api/system/check-ffmpeg')
        .then(response => response.json())
        .then(data => {
          console.log('Estado de FFmpeg:', data.found || data.installed ? 'Instalado' : 'No instalado');
          
          // Mostrar banner solo si no está instalado
          if (!(data.found || data.installed)) {
            const ffmpegCheck = document.getElementById('ffmpeg-check');
            if (ffmpegCheck) {
              ffmpegCheck.style.display = 'flex';
            }
          }
        })
        .catch(error => {
          console.error('Error al verificar FFmpeg:', error);
        });
    }
  }
  
  function setupEventListeners() {
    // Navegación
    navLinks.forEach(link => {
      link.addEventListener('click', handleNavigation);
    });
    
    getStartedBtn.addEventListener('click', () => {
      navigateTo('generator');
    });
    
    createFirstVideoBtn.addEventListener('click', () => {
      navigateTo('generator');
    });
    
    // Formularios
    videoForm.addEventListener('submit', handleVideoGeneration);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Tabs de autenticación
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginFormContainer.classList.add('active');
      registerFormContainer.classList.remove('active');
    });
    
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerFormContainer.classList.add('active');
      loginFormContainer.classList.remove('active');
    });
    
    // Control de duración
    durationInput.addEventListener('input', () => {
      durationValue.textContent = durationInput.value;
    });
    
    // Galería
    refreshGalleryBtn.addEventListener('click', loadVideos);
    
    // Modal
    closeModal.addEventListener('click', () => {
      videoModal.style.display = 'none';
      modalVideo.pause();
    });
    
    window.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        videoModal.style.display = 'none';
        modalVideo.pause();
      }
    });
    
    modalDownload.addEventListener('click', downloadCurrentVideo);
    modalDelete.addEventListener('click', deleteCurrentVideo);
    
    // Cancelar generación
    cancelGenerationBtn.addEventListener('click', cancelVideoGeneration);
    
    // Botones de FFmpeg
    const ffmpegInstallBtn = document.getElementById('ffmpeg-install');
    const ffmpegManualBtn = document.getElementById('ffmpeg-manual');
    
    if (ffmpegInstallBtn) {
      ffmpegInstallBtn.addEventListener('click', () => {
        if (window.FFmpegHandler) {
          window.FFmpegHandler.installFFmpeg();
        } else {
          installFFmpeg();
        }
      });
    }
    
    if (ffmpegManualBtn) {
      ffmpegManualBtn.addEventListener('click', () => {
        if (window.FFmpegHandler) {
          window.FFmpegHandler.showManualInstructions();
        } else {
          showFFmpegManualInstructions();
        }
      });
    }
  }
  
  // Función para instalar FFmpeg (fallback)
  function installFFmpeg() {
    const ffmpegCheck = document.getElementById('ffmpeg-check');
    if (ffmpegCheck) {
      ffmpegCheck.innerHTML = `
        <div class="notification-content">
          <h3>Instalando FFmpeg...</h3>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
          </div>
        </div>
      `;
      
      // Simular progreso
      const progressBar = ffmpegCheck.querySelector('.progress');
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress > 95) {
          clearInterval(interval);
        }
        progressBar.style.width = `${progress}%`;
      }, 1000);
      
      // Iniciar instalación
      fetch('/api/system/install-ffmpeg', {
        method: 'POST'
      })
        .then(response => response.json())
        .then(data => {
          clearInterval(interval);
          progressBar.style.width = '100%';
          
          if (data.success) {
            ffmpegCheck.innerHTML = `
              <div class="notification-content">
                <h3>FFmpeg instalado correctamente</h3>
                <p>Reiniciando aplicación...</p>
              </div>
            `;
            
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            ffmpegCheck.innerHTML = `
              <div class="notification-content">
                <h3>Error al instalar FFmpeg</h3>
                <p>${data.error || 'Error desconocido'}</p>
                <button id="ffmpeg-install" class="btn primary">Intentar de nuevo</button>
                <button id="ffmpeg-manual" class="btn secondary">Instalar manualmente</button>
              </div>
            `;
            
            document.getElementById('ffmpeg-install').addEventListener('click', installFFmpeg);
            document.getElementById('ffmpeg-manual').addEventListener('click', showFFmpegManualInstructions);
          }
        })
        .catch(error => {
          clearInterval(interval);
          ffmpegCheck.innerHTML = `
            <div class="notification-content">
              <h3>Error al instalar FFmpeg</h3>
              <p>${error.message}</p>
              <button id="ffmpeg-install" class="btn primary">Intentar de nuevo</button>
              <button id="ffmpeg-manual" class="btn secondary">Instalar manualmente</button>
            </div>
          `;
          
          document.getElementById('ffmpeg-install').addEventListener('click', installFFmpeg);
          document.getElementById('ffmpeg-manual').addEventListener('click', showFFmpegManualInstructions);
        });
    }
  }
  
  // Función para mostrar instrucciones manuales (fallback)
  function showFFmpegManualInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>Instalación manual de FFmpeg</h3>
        <div class="manual-instructions">
          <h4>Windows:</h4>
          <ol>
            <li>Descarga FFmpeg desde <a href="https://ffmpeg.org/download.html" target="_blank">ffmpeg.org</a></li>
            <li>Extrae el archivo ZIP a una carpeta (por ejemplo, C:\\ffmpeg)</li>
            <li>Añade la carpeta bin (C:\\ffmpeg\\bin) a tu PATH:
              <ul>
                <li>Abre Panel de Control > Sistema > Configuración avanzada del sistema</li>
                <li>Haz clic en "Variables de entorno"</li>
                <li>En "Variables del sistema", selecciona "Path" y haz clic en "Editar"</li>
                <li>Haz clic en "Nuevo" y añade la ruta a la carpeta bin</li>
                <li>Haz clic en "Aceptar" en todas las ventanas</li>
              </ul>
            </li>
            <li>Reinicia tu terminal o aplicación</li>
          </ol>
          
          <button id="verify-after-manual" class="btn primary">Verificar instalación</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar cierre del modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Configurar botón de verificación
    const verifyBtn = modal.querySelector('#verify-after-manual');
    verifyBtn.addEventListener('click', () => {
      modal.remove();
      checkFFmpegOnce();
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Funciones de navegación
  function handleNavigation(e) {
    e.preventDefault();
    const targetId = e.target.id.replace('nav-', '');
    navigateTo(targetId);
  }
  
  function navigateTo(sectionId) {
    // Si el usuario no está autenticado y trata de acceder a secciones protegidas
    if (!token && (sectionId === 'generator' || sectionId === 'gallery')) {
      sectionId = 'login';
    }
    
    // Actualizar navegación
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.remove('active');
      if (link.id === `nav-${sectionId}`) {
        link.classList.add('active');
      }
    });
    
    // Mostrar sección
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
      if (section.id === sectionId) {
        section.classList.add('active');
      }
    });
    
    // Acciones específicas por sección
    if (sectionId === 'gallery' && token) {
      loadVideos();
    }
  }
  
  // Funciones de autenticación
  async function checkAuth() {
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        currentUser = await response.json();
      } else {
        // Token inválido o expirado
        logout();
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      logout();
    }
    
    updateAuthUI();
  }
  
  function updateAuthUI() {
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout') || document.createElement('a');
    
    if (currentUser) {
      // Usuario autenticado
      navLogin.style.display = 'none';
      
      if (!document.getElementById('nav-logout')) {
        navLogout.id = 'nav-logout';
        navLogout.href = '#';
        navLogout.textContent = 'Cerrar Sesión';
        navLogout.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
        navLogin.parentNode.appendChild(navLogout);
      }
    } else {
      // Usuario no autenticado
      navLogin.style.display = 'block';
      if (document.getElementById('nav-logout')) {
        document.getElementById('nav-logout').remove();
      }
    }
  }
  
  async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        token = data.token;
        currentUser = data.user;
        
        // Guardar token
        localStorage.setItem('token', token);
        
        // Actualizar UI
        updateAuthUI();
        
        // Redirigir a generador
        navigateTo('generator');
        
        // Limpiar formulario
        loginForm.reset();
      } else {
        alert(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al conectar con el servidor');
    }
  }
  
  async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validación básica
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        token = data.token;
        currentUser = data.user;
        
        // Guardar token
        localStorage.setItem('token', token);
        
        // Actualizar UI
        updateAuthUI();
        
        // Redirigir a generador
        navigateTo('generator');
        
        // Limpiar formulario
        registerForm.reset();
      } else {
        alert(data.message || 'Error al registrarse');
      }
    } catch (error) {
      console.error('Error al registrarse:', error);
      alert('Error al conectar con el servidor');
    }
  }
  
  function logout() {
    // Eliminar token
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    
    // Actualizar UI
    updateAuthUI();
    
    // Redirigir a inicio
    navigateTo('home');
  }
  
  // Funciones de generación de video
  async function handleVideoGeneration(e) {
    e.preventDefault();
    
    const prompt = document.getElementById('prompt').value;
    const provider = document.getElementById('provider').value;
    const style = document.getElementById('style').value;
    const duration = document.getElementById('duration').value;
    
    if (!prompt) {
      alert('Por favor, ingresa una descripción para el video');
      return;
    }
    
    // Mostrar estado de generación
    videoForm.style.display = 'none';
    generationStatus.classList.remove('hidden');
    statusMessage.textContent = 'Procesando tu solicitud...';
    progressBar.style.width = '10%';
    
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, provider, style, duration })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        currentVideoId = data.videoId;
        statusMessage.textContent = 'Video en proceso de generación...';
        progressBar.style.width = '20%';
        
        // Iniciar polling para verificar estado
        startPolling(currentVideoId);
      } else {
        showGenerationError(data.message || 'Error al generar el video');
      }
    } catch (error) {
      console.error('Error al solicitar generación de video:', error);
      showGenerationError('Error al conectar con el servidor');
    }
  }
  
  function startPolling(videoId) {
    let progress = 20;
    
    pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          clearInterval(pollingInterval);
          showGenerationError('Error al obtener estado del video');
          return;
        }
        
        const data = await response.json();
        
        // Actualizar progreso simulado
        if (progress < 90) {
          progress += 5;
          progressBar.style.width = `${progress}%`;
        }
        
        // Actualizar mensaje
        statusMessage.textContent = `Generando video... ${data.status}`;
        
        // Verificar estado
        if (data.status === 'completed') {
          clearInterval(pollingInterval);
          progressBar.style.width = '100%';
          statusMessage.textContent = '¡Video generado exitosamente!';
          
          // Esperar un momento y redirigir a la galería
          setTimeout(() => {
            resetVideoForm();
            navigateTo('gallery');
          }, 2000);
        } else if (data.status === 'error') {
          clearInterval(pollingInterval);
          showGenerationError(data.error || 'Error al generar el video');
        }
      } catch (error) {
        console.error('Error al verificar estado del video:', error);
        clearInterval(pollingInterval);
        showGenerationError('Error al conectar con el servidor');
      }
    }, 3000);
  }
  
  function cancelVideoGeneration() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    resetVideoForm();
  }
  
  function resetVideoForm() {
    videoForm.style.display = 'block';
    generationStatus.classList.add('hidden');
    progressBar.style.width = '0%';
    currentVideoId = null;
  }
  
  function showGenerationError(message) {
    statusMessage.textContent = `Error: ${message}`;
    statusMessage.style.color = 'red';
    progressBar.style.backgroundColor = 'red';
    
    // Mostrar botón para volver al formulario
    cancelGenerationBtn.textContent = 'Volver';
  }
  
  // Funciones de galería
  async function loadVideos() {
    try {
      const response = await fetch('/api/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar videos');
      }
      
      const videos = await response.json();
      
      // Actualizar UI
      if (videos.length === 0) {
        videosContainer.innerHTML = '';
        noVideos.style.display = 'block';
      } else {
        noVideos.style.display = 'none';
        renderVideos(videos);
      }
    } catch (error) {
      console.error('Error al cargar videos:', error);
      alert('Error al cargar tus videos');
    }
  }
  
  function renderVideos(videos) {
    videosContainer.innerHTML = '';
    
    videos.forEach(video => {
      const videoCard = document.createElement('div');
      videoCard.className = 'video-card';
      
      const date = new Date(video.createdAt);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      
      videoCard.innerHTML = `
        <div class="video-thumbnail">
          <video src="${video.path}" preload="metadata"></video>
          <div class="play-button">▶</div>
        </div>
        <div class="video-info">
          <h3>${truncateText(video.prompt, 30)}</h3>
          <div class="video-meta">
            <span>${video.style}</span>
            <span>${formattedDate}</span>
          </div>
          <div class="video-actions">
            <button class="btn primary btn-view" data-id="${video.id}">Ver</button>
            <button class="btn danger btn-delete" data-id="${video.id}">Eliminar</button>
          </div>
        </div>
      `;
      
      // Event listeners
      const viewBtn = videoCard.querySelector('.btn-view');
      const deleteBtn = videoCard.querySelector('.btn-delete');
      const playButton = videoCard.querySelector('.play-button');
      
      viewBtn.addEventListener('click', () => openVideoModal(video));
      deleteBtn.addEventListener('click', () => deleteVideo(video.id));
      playButton.addEventListener('click', () => openVideoModal(video));
      
      videosContainer.appendChild(videoCard);
    });
  }
  
  function openVideoModal(video) {
    currentVideoId = video.id;
    
    modalTitle.textContent = truncateText(video.prompt, 50);
    modalVideo.src = video.path;
    modalPrompt.textContent = video.prompt;
    modalStyle.textContent = video.style;
    modalDuration.textContent = video.duration;
    modalProvider.textContent = video.provider;
    
    const date = new Date(video.createdAt);
    modalDate.textContent = date.toLocaleDateString();
    
    videoModal.style.display = 'block';
    modalVideo.play();
  }
  
  async function downloadCurrentVideo() {
    if (!currentVideoId) return;
    
    try {
      const response = await fetch(`/api/videos/${currentVideoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener información del video');
      }
      
      const video = await response.json();
      
      // Crear enlace de descarga
      const a = document.createElement('a');
      a.href = video.path;
      a.download = `video-${currentVideoId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar video:', error);
      alert('Error al descargar el video');
    }
  }
  
  async function deleteVideo(videoId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este video?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar video');
      }
      
      // Si el video eliminado es el actual en el modal, cerrar modal
      if (videoId === currentVideoId) {
        videoModal.style.display = 'none';
        modalVideo.pause();
      }
      
      // Recargar videos
      loadVideos();
    } catch (error) {
      console.error('Error al eliminar video:', error);
      alert('Error al eliminar el video');
    }
  }
  
  function deleteCurrentVideo() {
    if (currentVideoId) {
      deleteVideo(currentVideoId);
    }
  }
  
  // Utilidades
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
});