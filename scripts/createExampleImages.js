const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Directorio para las imágenes de prueba
const testImagesDir = path.join(__dirname, '..', 'public', 'test-images');

// Asegurar que el directorio exista
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

// Función para crear una imagen real con texto
function createRealImage(name, text, width = 1024, height = 1024) {
  const imagePath = path.join(testImagesDir, `${name}.jpg`);
  
  // Crear un canvas para dibujar la imagen
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Dibujar fondo negro
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Configurar texto
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Dibujar texto en múltiples líneas
  const lines = text.split('\n');
  const lineHeight = 60;
  const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });
  
  // Guardar como archivo JPG
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(imagePath, buffer);
  
  console.log(`Imagen real creada: ${imagePath}`);
}

// Crear algunas imágenes de prueba con texto descriptivo
createRealImage('scene1', 'CÓDIGOS DEL MIEDO\nEscena 1\nIntroducción');
createRealImage('scene2', 'CÓDIGOS DEL MIEDO\nEscena 2\nCódigos binarios y pantallas');
createRealImage('scene3', 'CÓDIGOS DEL MIEDO\nEscena 3\nAbril 2025');
createRealImage('scene4', 'CÓDIGOS DEL MIEDO\nEscena 4\nMuy pronto cerca de ti...');

console.log('Imágenes de prueba creadas exitosamente.');