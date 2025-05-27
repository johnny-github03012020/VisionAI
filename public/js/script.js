document.addEventListener('DOMContentLoaded', function() {
  // Handle API option selection
  const apiOptions = document.querySelectorAll('.api-option');
  apiOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Select the radio button
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      
      // Update visual selection
      apiOptions.forEach(opt => opt.setAttribute('data-selected', 'false'));
      this.setAttribute('data-selected', 'true');
    });
  });

  // Handle style option selection
  const styleOptions = document.querySelectorAll('.style-option');
  styleOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Select the radio button
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      
      // Update visual selection
      styleOptions.forEach(opt => opt.setAttribute('data-selected', 'false'));
      this.setAttribute('data-selected', 'true');
    });
  });

  // Initialize tooltips
  const tooltips = document.querySelectorAll('.info-tooltip');
  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseover', function() {
      const tooltipText = this.getAttribute('title');
      if (!tooltipText) return;
      
      // Create tooltip element
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip-popup';
      tooltipEl.textContent = tooltipText;
      document.body.appendChild(tooltipEl);
      
      // Position tooltip
      const rect = this.getBoundingClientRect();
      tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
      tooltipEl.style.left = `${rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2)}px`;
      
      // Remove tooltip on mouseout
      this.addEventListener('mouseout', function onMouseOut() {
        document.body.removeChild(tooltipEl);
        this.removeEventListener('mouseout', onMouseOut);
      });
    });
  });

  // Handle form submission
  const videoForm = document.getElementById('videoGeneratorForm');
  if (videoForm) {
    videoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Collect all form data
      const formData = new FormData(this);
      const videoData = {
        description: formData.get('description'),
        duration: formData.get('duration'),
        orientation: formData.get('orientation'),
        visualStyle: formData.get('visual-style'),
        apiType: formData.get('api-type'),
        elements: formData.getAll('elements')
      };
      
      // Validate form data
      if (!videoData.description) {
        showNotification('Por favor, describe el video que deseas crear', 'error');
        return;
      }
      
      // Show loading state in preview area
      const previewArea = document.querySelector('.previsualizacion');
      if (previewArea) {
        previewArea.innerHTML = '<div class="loading"><div class="spinner"></div><p>Generando video...</p></div>';
      }
      
      // Make API call to backend
      generateVideo(videoData);
    });
  }
  
  // Function to generate video
  async function generateVideo(videoData) {
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Start polling for video status
        pollVideoStatus(data.jobId, data.statusUrl);
        showNotification('Video en proceso de generación', 'info');
      } else {
        showNotification(data.message || 'Error al iniciar la generación del video', 'error');
        resetPreviewArea();
      }
    } catch (error) {
      console.error('Error generating video:', error);
      showNotification('Error al conectar con el servidor', 'error');
      resetPreviewArea();
    }
  }
  
  // Function to poll video status
  async function pollVideoStatus(jobId, statusUrl) {
    try {
      const response = await fetch(statusUrl);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const job = data.job;
        
        // Update progress in UI
        updateProgressUI(job.progress);
        
        if (job.status === 'completed') {
          // Video is ready
          updatePreviewWithVideo(job.videoUrl);
          showNotification('¡Video generado con éxito!', 'success');
        } else if (job.status === 'failed') {
          // Video generation failed
          showNotification(job.error || 'Error al generar el video', 'error');
          resetPreviewArea();
        } else {
          // Still processing, continue polling
          setTimeout(() => pollVideoStatus(jobId, statusUrl), 2000);
        }
      } else {
        showNotification(data.message || 'Error al verificar el estado del video', 'error');
        resetPreviewArea();
      }
    } catch (error) {
      console.error('Error polling video status:', error);
      showNotification('Error al verificar el estado del video', 'error');
      resetPreviewArea();
    }
  }
  
  // Function to update progress UI
  function updateProgressUI(progress) {
    const previewArea = document.querySelector('.previsualizacion');
    if (previewArea) {
      previewArea.innerHTML = `
        <div class="loading">
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <p>Generando video... ${progress}%</p>
        </div>
      `;
    }
  }
  
  // Function to update preview with generated video
  function updatePreviewWithVideo(videoUrl) {
    const previewArea = document.querySelector('.previsualizacion');
    if (previewArea) {
      previewArea.innerHTML = `
        <div class="video-container">
          <video controls>
            <source src="${videoUrl}" type="video/mp4">
            Tu navegador no soporta la reproducción de videos.
          </video>
          <div class="video-controls">
            <button class="download-btn" data-url="${videoUrl}">
              <i class="fas fa-download"></i> Descargar
            </button>
            <button class="share-btn" data-url="${videoUrl}">
              <i class="fas fa-share-alt"></i> Compartir
            </button>
          </div>
        </div>
      `;
      
      // Add event listeners to new buttons
      const downloadBtn = previewArea.querySelector('.download-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
          downloadVideo(this.getAttribute('data-url'));
        });
      }
      
      const shareBtn = previewArea.querySelector('.share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', function() {
          shareVideo(this.getAttribute('data-url'));
        });
      }
    }
  }
  
  // Function to reset preview area
  function resetPreviewArea() {
    const previewArea = document.querySelector('.previsualizacion');
    if (previewArea) {
      previewArea.innerHTML = '<div class="empty-preview">Aquí se mostrará la previsualización de tu video</div>';
    }
  }
  
  // Function to download video
  function downloadVideo(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_generado_' + new Date().getTime() + '.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Function to share video
  function shareVideo(url) {
    if (navigator.share) {
      navigator.share({
        title: 'Video generado con VisionAI',
        text: 'Mira este video que he creado con VisionAI',
        url: url
      })
      .then(() => console.log('Video compartido con éxito'))
      .catch((error) => console.log('Error al compartir:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      prompt('Copia este enlace para compartir tu video:', url);
    }
  }
  
  // Function to show notifications
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      document.body.removeChild(notification);
    });
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="close-notification">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        document.body.removeChild(notification);
      });
    }
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }
  
  // Add CSS for tooltip and progress bar
  const style = document.createElement('style');
  style.textContent = `
    .tooltip-popup {
      position: absolute;
      background-color: var(--dark-bg);
      color: var(--light-text);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      max-width: 250px;
      text-align: center;
    }
    
    .tooltip-popup::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid var(--dark-bg);
    }
    
    .progress-container {
      width: 100%;
      height: 8px;
      background-color: var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    
    .progress-bar {
      height: 100%;
      background-color: var(--primary-color);
      transition: width 0.3s ease;
    }
  `;
  document.head.appendChild(style);
});

// Add this to the DOMContentLoaded event handler

// Handle API type selection and load specific APIs
const apiTypeOptions = document.querySelectorAll('.api-option input[name="api-type"]');
const specificApiSection = document.getElementById('specificApiSection');
const specificApiOptions = document.getElementById('specificApiOptions');

// Load available APIs on page load
loadAvailableAPIs();

// Add event listeners to API type options
apiTypeOptions.forEach(option => {
  option.addEventListener('change', function() {
    updateSpecificApiOptions(this.value);
  });
});

// Function to load available APIs from the backend
async function loadAvailableAPIs() {
  try {
    const response = await fetch('/api/available-apis');
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Store the API data globally
      window.availableAPIs = data.categories;
      
      // Initialize with the default selected API type (opensource)
      const defaultApiType = document.querySelector('input[name="api-type"]:checked').value;
      updateSpecificApiOptions(defaultApiType);
    } else {
      console.error('Error loading APIs:', data.message);
    }
  } catch (error) {
    console.error('Error fetching available APIs:', error);
  }
}

// Function to update specific API options based on selected API type
function updateSpecificApiOptions(apiType) {
  if (!window.availableAPIs) return;
  
  // Find the selected API category
  const selectedCategory = window.availableAPIs.find(cat => cat.id === apiType);
  
  if (!selectedCategory) return;
  
  // Clear existing options
  specificApiOptions.innerHTML = '';
  
  // Add options for the selected category
  selectedCategory.apis.forEach(api => {
    const apiOption = document.createElement('div');
    apiOption.className = 'api-option';
    apiOption.innerHTML = `
      <input type="radio" id="${api.id}" name="specific-api" value="${api.id}">
      <label for="${api.id}">${api.name}</label>
      <span class="api-description">${api.description}</span>
    `;
    specificApiOptions.appendChild(apiOption);
  });
  
  // Select the first option by default
  const firstOption = specificApiOptions.querySelector('input[type="radio"]');
  if (firstOption) {
    firstOption.checked = true;
  }
  
  // Add click event listeners to the new options
  const newApiOptions = specificApiOptions.querySelectorAll('.api-option');
  newApiOptions.forEach(option => {
    option.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      
      newApiOptions.forEach(opt => opt.setAttribute('data-selected', 'false'));
      this.setAttribute('data-selected', 'true');
    });
  });
  
  // Show the specific API section
  specificApiSection.style.display = 'block';
}

// Update form submission to include the specific API
const videoForm = document.getElementById('videoGeneratorForm');
if (videoForm) {
  videoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect all form data
    const formData = new FormData(this);
    const videoData = {
      description: formData.get('description'),
      duration: formData.get('duration'),
      orientation: formData.get('orientation'),
      visualStyle: formData.get('visual-style'),
      apiType: formData.get('api-type'),
      specificApi: formData.get('specific-api'), // Add the specific API
      elements: formData.getAll('elements')
    };
    
    // Rest of the form submission code...
  });
}