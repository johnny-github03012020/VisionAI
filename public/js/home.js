document.addEventListener('DOMContentLoaded', function() {
    // Manejar el botón "Comenzar ahora"
    const comenzarAhoraBtn = document.getElementById('comenzar-ahora');
    if (comenzarAhoraBtn) {
        comenzarAhoraBtn.addEventListener('click', function() {
            // Simplemente redirigir a la página del generador
            window.location.href = 'generador.html';
        });
    }
    
    // Manejar el botón "Ir al Generador" en la sección CTA
    const irGeneradorBtn = document.getElementById('ir-generador');
    if (irGeneradorBtn) {
        irGeneradorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Simplemente redirigir a la página del generador
            window.location.href = 'generador.html';
        });
    }
    
    // Manejar todos los enlaces con clase "go-to-generator"
    const goToGeneratorLinks = document.querySelectorAll('.go-to-generator');
    goToGeneratorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Simplemente redirigir a la página del generador
            window.location.href = 'generador.html';
        });
    });
    
    // Manejar el elemento de navegación "Generador"
    const navGenerador = document.querySelector('.nav-item[data-page="generador"]');
    if (navGenerador) {
        navGenerador.addEventListener('click', function(e) {
            e.preventDefault();
            // Simplemente redirigir a la página del generador
            window.location.href = 'generador.html';
        });
    }
});