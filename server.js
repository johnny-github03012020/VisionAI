const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
// API Status and Config routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Authentication routes using authController
const authController = require('./controllers/authController');
const authApiRouter = express.Router();

authApiRouter.post('/register', authController.register);
authApiRouter.post('/login', authController.login);
authApiRouter.get('/me', authController.verifyToken, authController.getCurrentUser);

app.use('/api/auth', authApiRouter); // Standardized API prefix

// Video generation and management routes
const videoRoutes = require('./routes/video'); // Uses videoController and authController.verifyToken
app.use('/api/videos', videoRoutes);

// System routes (ffmpeg check/install)
const systemRoutes = require('./routes/systemRoutes');
app.use('/api/system', systemRoutes);

// --- Basic HTML serving (Example for root, can be expanded) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Error Handling ---
// Catch-all for 404 errors
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
