const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./config/db');
const { autoSeedDatabase } = require('./data/store');
const errorHandler = require('./middleware/errorHandler');

// Route files
const messRoutes = require('./routes/messRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS
app.use(cors());

// Serve static frontend assets
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'Mess Finder API',
    tagline: 'Find. Compare. Eat Better.',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/messes', messRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// Custom fallback for single page navigation or static pages
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

let PORT = parseInt(process.env.PORT, 10) || 5001;

// Start server with automatic port recovery if busy
const startServer = async () => {
  // Connect to PostgreSQL (with resilient fallback if database is configuring)
  const conn = await connectDB();
  if (conn) {
    await autoSeedDatabase();
  }

  const listen = (portToTry) => {
    const server = app.listen(portToTry, () => {
      console.log(`
=====================================================
🚀 MESS FINDER SERVER RUNNING!
📡 URL: http://localhost:${portToTry}
🍲 Explore: http://localhost:${portToTry}/find-mess.html
📝 Register: http://localhost:${portToTry}/register-mess.html
💡 Environment: ${process.env.NODE_ENV || 'development'}
=====================================================
      `);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${portToTry} is already in use, trying port ${portToTry + 1}...`);
        listen(portToTry + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  listen(PORT);

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
  });
};

startServer();

module.exports = app;
