const express = require('express');
const cors = require('cors');
const { createProfile, getProfileById, getAllProfiles, deleteProfile } = require('../src/controllers/profiles.controller');

const app = express();

// CORS header: Access-Control-Allow-Origin: *
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Routes
app.post('/api/profiles', createProfile);
app.get('/api/profiles/:id', getProfileById);
app.get('/api/profiles', getAllProfiles);
app.delete('/api/profiles/:id', deleteProfile);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ status: 'error', message: 'Invalid JSON payload' });
  }
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Start server for local testing if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
