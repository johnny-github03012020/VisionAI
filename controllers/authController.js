const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Simulación de base de datos de usuarios (en producción usarías MongoDB)
const users = [];

exports.register = (req, res) => {
  const { username, password, email } = req.body;
  
  // Validación básica
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  
  // Verificar si el usuario ya existe
  if (users.find(user => user.username === username || user.email === email)) {
    return res.status(400).json({ message: 'Usuario o email ya registrado' });
  }
  
  // Crear nuevo usuario
  const newUser = {
    id: uuidv4(),
    username,
    password, // En producción, deberías hashear la contraseña
    email,
    createdAt: new Date()
  };
  
  users.push(newUser);
  
  // Generar token
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }
  });
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  
  // Validación básica
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }
  
  // Buscar usuario
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  
  // Generar token
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    message: 'Login exitoso',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
};

exports.logout = (req, res) => {
  // En una implementación con tokens JWT, el logout se maneja del lado del cliente
  // eliminando el token almacenado
  res.json({ message: 'Logout exitoso' });
};

exports.getCurrentUser = (req, res) => {
  // El usuario ya está disponible en req.user gracias al middleware verifyToken
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email
  });
};

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};