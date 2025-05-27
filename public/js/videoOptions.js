/**
 * Manejador de opciones de video
 */
document.addEventListener('DOMContentLoaded', function() {
  // Elementos del formulario
  const videoForm = document.getElementById('video-form');
  const descriptionInput = document.getElementById('video-description');
  const durationOptions = document.querySelectorAll('input[name="duration"]');
  const customDurationInput = document.getElementById('custom-duration');
  const orientationOptions = document.querySelectorAll('input[name="orientation"]');
  const backgroundMusicSelect = document.getElementById('background-music');
  const transitionsSelect = document.getElementById('transitions');
  const subtitlesCheckbox = document.getElementById('include-subtitles');
  const voiceOverCheckbox = document.getElementById('include-voice-over');
  const generateButton = document.getElementById('generate-video-btn');
  const previewContainer = document.getElementById('preview-container');
  
  // Estado de generación
  let isGenerating = false;
  
  // Función para mostrar/ocultar el campo de duración personalizada
  function toggleCustomDuration() {
    if (!customDurationInput) return;
    
    const customDurationContainer = customDurationInput.closest('.custom-duration-container');
    if (!customDurationContainer) return;
    
    const isCustomSelected = getSelectedValue(durationOptions) === 'custom';
    customDurationContainer.style.display = isCustomSelected ? 'block' : 'none';
  }
  
  // Función para obtener el valor seleccionado de un grupo de radio buttons
  function getSelectedValue(radioButtons) {
    if (!radioButtons) return null;
    
    for (const radioButton of radioButtons) {
      if (radioButton.checked) {
        return radioButton.value;
      }
    }
    return null;
  }
  
  // Función para generar el video
  async function generateVideo(event) {
    if (event) event.preventDefault();
    if (isGenerating) return;
    
    // Validar que haya una descripción
    if (!descriptionInput || !descriptionInput.value.trim()) {
      showError('Por favor, proporciona una descripción para el video');
      return;
    }
    
    // Obtener valores del formulario
    const videoOptions = {
      description: descriptionInput.value,
      duration: getSelectedValue(durationOptions) || 'short',
      customDuration: customDurationInput ? parseInt(customDurationInput.value) || 60 : 60,
      orientation: getSelectedValue(orientationOptions) || 'horizontal',
      backgroundMusic: backgroundMusicSelect ? backgroundMusicSelect.value : 'automatic',
      transitions: transitionsSelect ? transitionsSelect.value : 'automatic',
      includeSubtitles: subtitlesCheckbox ? subtitlesCheckbox.checked : false,
      includeVoiceOver: voiceOverCheckbox ? voiceOverCheckbox.checked : false
    };
    
    // Actualizar UI
    isGenerating = true;
    updateGeneratingUI(true);
    
    try {
      // Enviar opciones al servidor
      const response = await fetch('/api/videos/process-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoOptions)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar opciones de video');
      }
      
      // Iniciar generación de video
      const generateResponse = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoOptions)
      });
      
      const generateData = await generateResponse.json();
      
      if (!generateResponse.ok) {
        throw new Error(generateData.message || 'Error al generar video');
      }
      
      // Mostrar mensaje de éxito
      showSuccess(`Generación de video iniciada. Tiempo estimado: ${generateData.estimatedTime}`);
      
      // Redirigir a la página de estado del video
      setTimeout(() => {
        window.location.href = `/video-status.html?id=${generateData.videoId}`;
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Error al generar video');
    } finally {
      isGenerating = false;
      updateGeneratingUI(false);
    }
  }
  
  // Función para actualizar la UI durante la generación
  function updateGeneratingUI(generating) {
    if (generateButton) {
      generateButton.disabled = generating;
      generateButton.innerHTML = generating ? 
        '<i class="fas fa-spinner fa-spin"></i> Generando...' : 
        'Generar Video';
    }
    
    // Deshabilitar campos durante la generación
    const formInputs = videoForm ? videoForm.querySelectorAll('input, select, textarea') : [];
    formInputs.forEach(input => {
      input.disabled = generating;
    });
  }
  
  // Función para mostrar mensaje de error
  function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;
    
    // Insertar al principio del formulario
    if (videoForm) {
      videoForm.insertBefore(errorContainer, videoForm.firstChild);
      
      // Eliminar después de 5 segundos
      setTimeout(() => {
        errorContainer.remove();
      }, 5000);
    }
  }
  
  // Función para mostrar mensaje de éxito
  function showSuccess(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    
    // Insertar al principio del formulario
    if (videoForm) {
      videoForm.insertBefore(successContainer, videoForm.firstChild);
      
      // Eliminar después de 5 segundos
      setTimeout(() => {
        successContainer.remove();
      }, 5000);
    }
  }
  
  // Registrar eventos
  durationOptions.forEach(option => {
    option.addEventListener('change', toggleCustomDuration);
  });
  
  if (videoForm) {
    videoForm.addEventListener('submit', generateVideo);
  }
  
  // Inicializar
  toggleCustomDuration();
});