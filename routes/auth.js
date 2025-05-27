const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Archivo para almacenar usuarios (en producción usaríamos una base de datos)
const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

// Asegurar que el directorio data existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Asegurar que el archivo de usuarios existe
if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}

// Función para leer usuarios
function getUsers() {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error al leer usuarios:', error);
    return [];
  }
}

// Función para guardar usuarios
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error al guardar usuarios:', error);
    return false;
  }
}

// Ruta de registro
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }
  
  const users = getUsers();
  
  // Verificar si el usuario ya existe
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }
  
  // Agregar nuevo usuario
  users.push({ username, password });
  
  if (saveUsers(users)) {
    // Generar token JWT
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'secreto_predeterminado',
      { expiresIn: '24h' }
    );
    
    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token
    });
  } else {
    return res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Ruta de inicio de sesión
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }
  
  const users = getUsers();
  
  // Buscar usuario
  const user = users.find(user => user.username === username && user.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  
  // Generar token JWT
  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET || 'secreto_predeterminado',
    { expiresIn: '24h' }
  );
  
  res.json({
    message: 'Inicio de sesión exitoso',
    token
  });
});

// Ruta para verificar token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_predeterminado');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token inválido' });
  }
});

module.exports = router;