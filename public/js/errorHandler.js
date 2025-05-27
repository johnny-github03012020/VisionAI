document.addEventListener('DOMContentLoaded', function() {
  // Función para mostrar notificaciones
  window.showNotification = function(message, type = 'error', duration = 5000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span class="notification-close">&times;</span>
      <div>${message}</div>
    `;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Configurar cierre automático
    const timeout = setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, duration);
    
    // Configurar cierre manual
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', function() {
      clearTimeout(timeout);
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    });
  };
  
  // Función para manejar errores de reproducción de video
  window.handleVideoError = function(videoId, error) {
    console.error('Error al reproducir el video:', error);
    
    // Verificar si el error es 404 (archivo no encontrado)
    if (error && error.message && error.message.includes('404')) {
      // Verificar si FFmpeg está instalado
      fetch('/api/videos/' + videoId)
        .then(response => response.json())
        .then(videoData => {
          if (videoData.error && videoData.message && videoData.message.includes('FFmpeg')) {
            showNotification(
              'No se puede reproducir el video porque FFmpeg no está instalado. Haga clic en "Ayuda con FFmpeg" para obtener instrucciones de instalación.',
              'error',
              10000
            );
          } else {
            showNotification(
              'El archivo de video no se encuentra. Es posible que haya sido eliminado o que ocurriera un error durante su generación.',
              'error'
            );
          }
        })
        .catch(err => {
          showNotification('Error al obtener información del video: ' + err.message, 'error');
        });
    } else {
      showNotification('Error al reproducir el video: ' + (error.message || 'Error desconocido'), 'error');
    }
  };
  
  // Función para mostrar el modal de ayuda de FFmpeg
  window.showFFmpegHelp = function() {
    // Crear un modal con instrucciones
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Instalación de FFmpeg</h2>
        <div class="error-message">
          <p>Para generar videos, necesitas instalar FFmpeg en tu sistema:</p>
          <ol>
            <li>Descarga FFmpeg desde <a href="https://ffmpeg.org/download.html" target="_blank">ffmpeg.org</a> o usa el botón de descarga directa abajo.</li>
            <li>Extrae el archivo ZIP a una carpeta (por ejemplo: C:\\ffmpeg)</li>
            <li>Añade la carpeta bin (C:\\ffmpeg\\bin) a tu PATH del sistema:
              <ul>
                <li>Abre el Panel de Control → Sistema → Configuración avanzada del sistema</li>
                <li>Haz clic en "Variables de entorno"</li>
                <li>En "Variables del sistema", selecciona "Path" y haz clic en "Editar"</li>
                <li>Haz clic en "Nuevo" y añade la ruta a la carpeta bin (C:\\ffmpeg\\bin)</li>
                <li>Haz clic en "Aceptar" en todas las ventanas</li>
              </ul>
            </li>
            <li>Reinicia tu aplicación</li>
          </ol>
          <a href="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" class="download-link" target="_blank">
            <i class="fas fa-download"></i> Descargar FFmpeg para Windows
          </a>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar el botón de cerrar
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
    });
    
    // Cerrar al hacer clic fuera del contenido
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  
  // Añadir botón de ayuda de FFmpeg a la página
  const addFFmpegHelpButton = function() {
    const container = document.querySelector('.container');
    if (container) {
      const helpBtn = document.createElement('button');
      helpBtn.id = 'ffmpeg-help-btn';
      helpBtn.className = 'btn secondary';
      helpBtn.innerHTML = '<i class="fas fa-question-circle"></i> Ayuda con FFmpeg';
      helpBtn.addEventListener('click', showFFmpegHelp);
      
      // Añadir después del primer h1 o al principio
      const h1 = container.querySelector('h1');
      if (h1) {
        h1.parentNode.insertBefore(helpBtn, h1.nextSibling);
      } else {
        container.prepend(helpBtn);
      }
    }
  };
  
  // Verificar si hay errores de FFmpeg en los videos existentes
  fetch('/api/videos')
    .then(response => response.json())
    .then(videos => {
      // Buscar videos con error de FFmpeg
      const ffmpegErrors = videos.filter(video => 
        video.error === true && 
        video.message && 
        video.message.includes('FFmpeg no encontrado')
      );
      
      // Si hay errores de FFmpeg, mostrar el botón de ayuda
      if (ffmpegErrors.length > 0) {
        addFFmpegHelpButton();
        
        // Mostrar notificación
        showNotification(
          'Se detectaron problemas con FFmpeg. Haga clic en "Ayuda con FFmpeg" para obtener instrucciones de instalación.',
          'warning',
          10000
        );
      }
    })
    .catch(error => {
      console.error('Error al verificar videos:', error);
    });
});

document.addEventListener('DOMContentLoaded', function() {
  // Función para mostrar el error en el reproductor de video
  window.showVideoError = function(message) {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoError = document.getElementById('videoError');
    
    if (videoPlayer && videoError) {
      // Ocultar el reproductor y mostrar el error
      videoPlayer.style.display = 'none';
      videoError.style.display = 'flex';
      
      // Actualizar el mensaje de error
      const errorMessage = document.getElementById('errorMessage');
      if (errorMessage) {
        errorMessage.textContent = message || 'El archivo de video no se encuentra disponible en el sitio.';
      }
    }
  };
  
  // Función para mostrar el modal de ayuda de FFmpeg
  window.showFFmpegHelp = function() {
    const modal = document.getElementById('ffmpegModal');
    if (modal) {
      modal.style.display = 'block';
    }
  };
  
  // Configurar el botón de ayuda de FFmpeg
  const ffmpegHelpBtn = document.getElementById('ffmpegHelpBtn');
  if (ffmpegHelpBtn) {
    ffmpegHelpBtn.addEventListener('click', showFFmpegHelp);
  }
  
  // Configurar los botones de cierre de modales
  const closeButtons = document.querySelectorAll('.close');
  closeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Cerrar modales al hacer clic fuera del contenido
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
});