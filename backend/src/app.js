const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ---------- global middleware ----------
app.use(helmet()); // sensible security HTTP headers
app.use(
  cors({
    // Only the frontend dev server may call this API.
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // request logging: GET /api/tasks 200 12ms
}
app.use(express.json()); // parse JSON request bodies

// ---------- routes ----------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DoseQue API is running' });
});

app.use('/api/tasks', taskRoutes);

// Unknown routes -> 404 with the standard JSON shape.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler — must be registered LAST.
app.use(errorHandler);

module.exports = app;
