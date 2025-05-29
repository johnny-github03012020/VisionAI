const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

// Helper function to get users from file
const getUsersFromFile = () => {
  try {
    if (!fs.existsSync(usersFilePath)) {
      // Create the data directory if it doesn't exist
      const dataDir = path.dirname(usersFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(usersFilePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users from file:', error);
    // If parsing fails or file is corrupted, return empty array or handle error
    // For safety, creating a new empty file if parsing fails might be too destructive.
    // Consider logging the error and returning an empty array or throwing.
    if (!fs.existsSync(usersFilePath) || error.code === 'ENOENT' || error instanceof SyntaxError) {
        const dataDir = path.dirname(usersFilePath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(usersFilePath, JSON.stringify([]));
        return [];
    }
    // For other errors, rethrow or handle appropriately
    throw error; 
  }
};

// Helper function to save users to file
const saveUsersToFile = (users) => {
  try {
    const dataDir = path.dirname(usersFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users to file:', error);
    // Handle error appropriately, maybe rethrow
    throw error;
  }
};

exports.register = async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  
  const users = getUsersFromFile();
  
  if (users.find(user => user.username === username || user.email === email)) {
    return res.status(400).json({ message: 'Usuario o email ya registrado' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10
  
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    email,
    createdAt: new Date()
  };
  
  users.push(newUser);
  saveUsersToFile(users);
  
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

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
  }
  
  const users = getUsersFromFile();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  
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
  res.json({ message: 'Logout exitoso' });
};

exports.getCurrentUser = (req, res) => {
  const users = getUsersFromFile();
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    // This case should ideally not happen if JWT is valid and user was not deleted
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
    req.user = decoded; // Add decoded user payload to request object
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};