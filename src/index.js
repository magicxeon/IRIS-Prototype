const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { 
  createProjectController, 
  getProjectsController, 
  getProjectByIdController 
} = require('./project-controller');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.post('/api/projects', createProjectController);
app.get('/api/projects', getProjectsController);
app.get('/api/projects/:projectId', getProjectByIdController);

// Fallback to serve index.html for single page application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 IREBA System is running at http://localhost:${PORT}`);
  console.log(`📂 Serving static files from: ${path.join(__dirname, '../public')}`);
  console.log(`⚙️  Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================================`);
});
