document.addEventListener('DOMContentLoaded', function() {
  // Cargar videos al iniciar la página
  loadVideos();
  
  // Configurar botón de actualizar
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadVideos);
  }
  
  // Función para cargar videos
  function loadVideos() {
    const videosContainer = document.getElementById('videosContainer');
    if (!videosContainer) return;
    
    // Mostrar indicador de carga
    videosContainer.innerHTML = '<div class="loading">Cargando videos...</div>';
    
    // Obtener lista de videos
    fetch('/api/videos')
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {
          videosContainer.innerHTML = '<div class="no-videos">No hay videos disponibles</div>';
          return;
        }
        
        // Limpiar contenedor
        videosContainer.innerHTML = '';
        
        // Mostrar cada video
        data.forEach(video => {
          const videoCard = document.createElement('div');
          videoCard.className = 'video-card';
          
          // Crear thumbnail con imagen de portada o placeholder
          const thumbnail = document.createElement('div');
          thumbnail.className = 'video-thumbnail';
          
          // Verificar si es un video HTML (error) o un video real
          const isErrorVideo = video.path.endsWith('.html');
          
          if (isErrorVideo) {
            thumbnail.innerHTML = `
              <div class="error-thumbnail">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Error</span>
              </div>
            `;
          } else {
            thumbnail.innerHTML = `
              <img src="/videos/thumbnails/${video.id}.jpg" onerror="this.src='/img/video-placeholder.jpg'" alt="Thumbnail">
              <div class="play-button">
                <i class="fas fa-play"></i>
              </div>
            `;
          }
          
          // Información del video
          const videoInfo = document.createElement('div');
          videoInfo.className = 'video-info';
          videoInfo.innerHTML = `
            <h3>${video.prompt ? video.prompt.substring(0, 50) + '...' : 'Video sin título'}</h3>
            <p>Estilo: ${video.style || 'No especificado'}</p>
            <p>Duración: ${video.duration || '?'} segundos</p>
            <p>Fecha: ${new Date(video.createdAt).toLocaleDateString()}</p>
          `;
          
          // Añadir evento de clic para reproducir el video
          videoCard.appendChild(thumbnail);
          videoCard.appendChild(videoInfo);
          
          if (!isErrorVideo) {
            videoCard.addEventListener('click', function() {
              playVideo(
                video.id,
                video.prompt,
                video.style,
                video.duration,
                video.provider,
                new Date(video.createdAt).toLocaleDateString()
              );
            });
          } else {
            // Si es un video de error, abrir en una nueva pestaña
            videoCard.addEventListener('click', function() {
              window.open(video.path, '_blank');
            });
          }
          
          videosContainer.appendChild(videoCard);
        });
      })
      .catch(error => {
        console.error('Error al cargar videos:', error);
        videosContainer.innerHTML = '<div class="error">Error al cargar videos</div>';
      });
  }
});