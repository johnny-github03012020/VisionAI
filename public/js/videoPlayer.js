document.addEventListener('DOMContentLoaded', function() {
  // Función para reproducir el video
  window.playVideo = function(videoId, prompt, style, duration, provider, date) {
    const modal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoError = document.getElementById('videoError');
    
    if (!modal || !videoPlayer) return;
    
    // Restablecer el estado del reproductor
    videoPlayer.style.display = 'block';
    if (videoError) {
      videoError.style.display = 'none';
    }
    
    // Actualizar información del video
    if (document.getElementById('videoPrompt')) {
      document.getElementById('videoPrompt').textContent = `Prompt: ${prompt || 'No especificado'}`;
    }
    if (document.getElementById('videoStyle')) {
      document.getElementById('videoStyle').textContent = `Estilo: ${style || 'No especificado'}`;
    }
    if (document.getElementById('videoDuration')) {
      document.getElementById('videoDuration').textContent = `Duración: ${duration || '0'} segundos`;
    }
    if (document.getElementById('videoProvider')) {
      document.getElementById('videoProvider').textContent = `Proveedor: ${provider || 'No especificado'}`;
    }
    if (document.getElementById('videoDate')) {
      document.getElementById('videoDate').textContent = `Fecha: ${date || 'No especificada'}`;
    }
    
    // Configurar botones de acción
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.setAttribute('data-video-id', videoId);
    }
    
    const eliminarBtn = document.getElementById('eliminarBtn');
    if (eliminarBtn) {
      eliminarBtn.setAttribute('data-video-id', videoId);
    }
    
    // Verificar si el video existe
    fetch(`/api/videos/${videoId}`)
      .then(response => response.json())
      .then(videoData => {
        // Verificar si hay un error en el video
        if (videoData.error) {
          window.showVideoError('Error: ' + videoData.message);
          modal.style.display = 'block';
          return;
        }
        
        // Configurar la fuente del video
        videoPlayer.src = `/videos/${videoId}.mp4`;
        
        // Mostrar el modal
        modal.style.display = 'block';
        
        // Intentar reproducir el video
        videoPlayer.load();
        videoPlayer.play().catch(error => {
          console.error('Error al reproducir el video:', error);
          window.showVideoError('El archivo de video no se encuentra disponible en el sitio.');
        });
      })
      .catch(error => {
        console.error('Error al obtener información del video:', error);
        window.showVideoError('Error al obtener información del video.');
      });
  };
  
  // Configurar el evento de error del reproductor de video
  const videoPlayer = document.getElementById('videoPlayer');
  if (videoPlayer) {
    videoPlayer.addEventListener('error', function() {
      window.showVideoError('El archivo de video no se encuentra disponible en el sitio.');
    });
  }
  
  // Configurar el botón de descarga
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const videoId = this.getAttribute('data-video-id');
      if (videoId) {
        window.location.href = `/api/videos/download/${videoId}`;
      }
    });
  }
  
  // Configurar el botón de eliminar
  const eliminarBtn = document.getElementById('eliminarBtn');
  if (eliminarBtn) {
    eliminarBtn.addEventListener('click', function() {
      const videoId = this.getAttribute('data-video-id');
      if (videoId && confirm('¿Estás seguro de que deseas eliminar este video?')) {
        fetch(`/api/videos/${videoId}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (response.ok) {
            // Cerrar el modal
            const modal = document.getElementById('videoModal');
            if (modal) {
              modal.style.display = 'none';
            }
            
            // Recargar la página para actualizar la lista de videos
            window.location.reload();
          } else {
            alert('Error al eliminar el video.');
          }
        })
        .catch(error => {
          console.error('Error al eliminar el video:', error);
          alert('Error al eliminar el video.');
        });
      }
    });
  }
});