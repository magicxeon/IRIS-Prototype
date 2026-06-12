const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { 
  createProjectController, 
  getProjectsController, 
  getProjectByIdController,
  approveProjectController,
  exportJiraCsvController,
  exportWordDocController
} = require('./project-controller');

const {
  uploadFileController,
  deleteFileController
} = require('./upload-controller');

const {
  testGeminiConnectionController,
  analyzeSectionController
} = require('./gemini-controller');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.get('/api/config/schema', (req, res) => {
  res.sendFile(path.join(__dirname, '../data/extraction-schema.json'));
});
app.post('/api/projects', createProjectController);
app.get('/api/projects', getProjectsController);
app.get('/api/projects/:projectId', getProjectByIdController);
app.post('/api/projects/:projectId/upload', uploadFileController);
app.delete('/api/projects/:projectId/documents/:docType', deleteFileController);
app.get('/api/healthcheck/gemini', testGeminiConnectionController);
app.post('/api/projects/:projectId/analyze/:sectionType', analyzeSectionController);
app.put('/api/projects/:projectId/approve', approveProjectController);
app.get('/api/projects/:projectId/export/jira', exportJiraCsvController);
app.get('/api/projects/:projectId/export/word', exportWordDocController);

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
