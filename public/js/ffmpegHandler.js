/**
 * FFmpeg Handler - Sistema centralizado para detectar e instalar FFmpeg
 */
const FFmpegHandler = {
  // Estado de FFmpeg
  status: {
    installed: false,
    path: null,
    checking: false,
    initialized: false
  },
  
  // Elemento para mostrar el banner de error
  errorBanner: null,
  
  // Inicializar el handler
  init: function() {
    if (this.status.initialized) return;
    
    // Eliminar cualquier banner existente
    this.removeExistingBanners();
    
    // Configurar el botón de ayuda de FFmpeg
    const ffmpegHelpBtn = document.getElementById('ffmpeg-help-btn');
    if (ffmpegHelpBtn) {
      ffmpegHelpBtn.addEventListener('click', () => this.showModal());
    }
    
    // Marcar como inicializado
    this.status.initialized = true;
    
    // Realizar la verificación inicial
    return this.checkFFmpeg();
  },
  
  // Eliminar banners existentes
  removeExistingBanners: function() {
    const existingBanners = document.querySelectorAll('.ffmpeg-error-banner');
    existingBanners.forEach(banner => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    });
    this.errorBanner = null;
  },
  
  // Verificar si FFmpeg está instalado
  checkFFmpeg: function() {
    if (this.status.checking) return Promise.resolve(this.status.installed);
    
    this.status.checking = true;
    
    return fetch('/api/system/check-ffmpeg')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('Respuesta de verificación FFmpeg:', data);
        this.status.installed = data.installed || data.found;
        this.status.path = data.path || null;
        
        // Ocultar la notificación antigua si existe
        const ffmpegCheck = document.getElementById('ffmpeg-check');
        if (ffmpegCheck) {
          ffmpegCheck.style.display = 'none';
        }
        
        if (!this.status.installed) {
          this.showErrorBanner();
        } else {
          this.hideErrorBanner();
          
          // Si FFmpeg está instalado, eliminar cualquier notificación existente
          const existingNotification = document.getElementById('error-ffmpeg');
          if (existingNotification && existingNotification.parentNode) {
            existingNotification.parentNode.removeChild(existingNotification);
          }
        }
        
        return this.status.installed;
      })
      .catch(error => {
        console.error('Error al verificar FFmpeg:', error);
        this.status.installed = false;
        this.showErrorBanner('No se pudo verificar FFmpeg. Error de conexión con el servidor.');
        return false;
      })
      .finally(() => {
        this.status.checking = false;
      });
  },
  
  // Mostrar banner de error
  showErrorBanner: function(customMessage) {
    // Eliminar cualquier banner existente antes de crear uno nuevo
    this.hideErrorBanner();
    
    // Crear el banner
    this.errorBanner = document.createElement('div');
    this.errorBanner.className = 'ffmpeg-error-banner';
    this.errorBanner.innerHTML = `
      <div class="ffmpeg-error-content">
        <h3>FFmpeg no está instalado</h3>
        <p>${customMessage || 'FFmpeg es necesario para generar videos. No se ha detectado en su sistema.'}</p>
        <div class="ffmpeg-error-actions">
          <button id="ffmpeg-install-auto" class="btn primary">Instalar automáticamente</button>
          <button id="ffmpeg-install-manual" class="btn secondary">Instalar manualmente</button>
          <button id="ffmpeg-check-again" class="btn secondary">Verificar de nuevo</button>
        </div>
      </div>
    `;
    
    // Insertar el banner al principio del contenido principal
    const mainContent = document.querySelector('main') || document.querySelector('.container');
    if (mainContent) {
      mainContent.insertBefore(this.errorBanner, mainContent.firstChild);
    } else {
      document.body.insertBefore(this.errorBanner, document.body.firstChild);
    }
    
    // Configurar botones
    document.getElementById('ffmpeg-install-auto').addEventListener('click', () => this.installFFmpeg());
    document.getElementById('ffmpeg-install-manual').addEventListener('click', () => this.showManualInstructions());
    document.getElementById('ffmpeg-check-again').addEventListener('click', () => this.checkFFmpeg());
  },
  
  // Ocultar banner de error
  hideErrorBanner: function() {
    const existingBanners = document.querySelectorAll('.ffmpeg-error-banner');
    existingBanners.forEach(banner => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    });
    this.errorBanner = null;
  },
  
  // Instalar FFmpeg automáticamente
  installFFmpeg: function() {
    // Cambiar el contenido del banner para mostrar progreso
    if (this.errorBanner) {
      this.errorBanner.innerHTML = `
        <div class="ffmpeg-error-content">
          <h3>Instalando FFmpeg...</h3>
          <p>Por favor espera, esto puede tardar unos minutos.</p>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
          </div>
        </div>
      `;
      
      // Simular progreso
      let progress = 0;
      const progressBar = this.errorBanner.querySelector('.progress');
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
        .then(response => {
          if (!response.ok) {
            throw new Error('Error en la respuesta del servidor: ' + response.status);
          }
          return response.json();
        })
        .then(data => {
          clearInterval(interval);
          progressBar.style.width = '100%';
          
          if (data.success) {
            this.errorBanner.innerHTML = `
              <div class="ffmpeg-error-content">
                <h3>FFmpeg instalado correctamente</h3>
                <p>${data.message}</p>
                <button id="continue" class="btn primary">Continuar</button>
              </div>
            `;
            
            document.getElementById('continue').addEventListener('click', () => {
              this.hideErrorBanner();
              window.location.reload();
            });
          } else {
            this.errorBanner.innerHTML = `
              <div class="ffmpeg-error-content">
                <h3>Error al instalar FFmpeg</h3>
                <p>${data.error || data.message || 'Error desconocido'}</p>
                <div class="ffmpeg-error-actions">
                  <button id="try-again" class="btn primary">Intentar de nuevo</button>
                  <button id="install-manual" class="btn secondary">Instalar manualmente</button>
                </div>
              </div>
            `;
            
            document.getElementById('try-again').addEventListener('click', () => this.installFFmpeg());
            document.getElementById('install-manual').addEventListener('click', () => this.showManualInstructions());
          }
        })
        .catch(error => {
          clearInterval(interval);
          console.error('Error al instalar FFmpeg:', error);
          
          this.errorBanner.innerHTML = `
            <div class="ffmpeg-error-content">
              <h3>Error al instalar FFmpeg</h3>
              <p>${error.message}</p>
              <div class="ffmpeg-error-actions">
                <button id="try-again" class="btn primary">Intentar de nuevo</button>
                <button id="install-manual" class="btn secondary">Instalar manualmente</button>
              </div>
            </div>
          `;
          
          document.getElementById('try-again').addEventListener('click', () => this.installFFmpeg());
          document.getElementById('install-manual').addEventListener('click', () => this.showManualInstructions());
        });
    }
  },
  
  // Mostrar instrucciones manuales
  showManualInstructions: function() {
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
      this.checkFFmpeg();
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  },
  
  // Mostrar modal de instalación
  showModal: function() {
    // Verificar si ya existe un modal de FFmpeg
    const existingModal = document.querySelector('.ffmpeg-modal');
    if (existingModal) {
      return; // No crear otro modal si ya existe uno
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal ffmpeg-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>Instalación de FFmpeg</h3>
        <div class="ffmpeg-options">
          <button id="install-auto" class="btn primary">Instalar automáticamente</button>
          <button id="install-manual" class="btn secondary">Instrucciones manuales</button>
        </div>
        <div id="ffmpeg-status" class="hidden">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress" style="width: 0%"></div>
            </div>
          </div>
          <p id="ffmpeg-status-message">Instalando FFmpeg...</p>
        </div>
        <div id="manual-instructions" class="hidden">
          <h4>Instalación manual:</h4>
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
          <button id="verify-ffmpeg" class="btn primary">Verificar instalación</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar cierre del modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Configurar botones
    const installAutoBtn = modal.querySelector('#install-auto');
    const installManualBtn = modal.querySelector('#install-manual');
    const verifyBtn = modal.querySelector('#verify-ffmpeg');
    const ffmpegStatus = modal.querySelector('#ffmpeg-status');
    const manualInstructions = modal.querySelector('#manual-instructions');
    
    installAutoBtn.addEventListener('click', () => {
      ffmpegStatus.classList.remove('hidden');
      installAutoBtn.disabled = true;
      installManualBtn.disabled = true;
      
      // Simular progreso
      const progressBar = modal.querySelector('.progress');
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
          modal.querySelector('#ffmpeg-status-message').textContent = 'FFmpeg instalado correctamente. Reiniciando...';
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          modal.querySelector('#ffmpeg-status-message').textContent = `Error: ${data.error || 'No se pudo instalar FFmpeg'}`;
          installAutoBtn.disabled = false;
          installManualBtn.disabled = false;
        }
      })
      .catch(error => {
        clearInterval(interval);
        modal.querySelector('#ffmpeg-status-message').textContent = `Error: ${error.message}`;
        installAutoBtn.disabled = false;
        installManualBtn.disabled = false;
      });
    });
    
    installManualBtn.addEventListener('click', () => {
      manualInstructions.classList.remove('hidden');
      ffmpegStatus.classList.add('hidden');
    });
    
    verifyBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.checkFFmpeg().then(installed => {
        if (installed) {
          alert('FFmpeg detectado correctamente.');
        }
      });
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  },
  
  // Obtener el estado actual
  getStatus: function() {
    return { ...this.status };
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  FFmpegHandler.init();
});

// Exponer el handler al ámbito global
window.FFmpegHandler = FFmpegHandler;