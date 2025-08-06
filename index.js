const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Body:', req.body);
  }
  next();
});

// Root route to serve index.html
app.get('/', (req, res) => {
  console.log('Root route accessed, serving index.html');
  res.sendFile(__dirname + '/public/index.html');
});

// POST endpoint for farmer questions
app.post('/ask', (req, res) => {
  try {
    const { question } = req.body;
    // For now, respond with dummy text
    const answer = 'This is a dummy response. Your question was: ' + (question || 'No question provided.');
    console.log('Sending answer:', answer);
    res.json({ answer });
  } catch (err) {
    console.error('Error in /ask:', err);
    res.status(500).json({ answer: 'Sorry, something went wrong on the server.' });
  }
});

// Catch-all error handler for JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ answer: 'Sorry, an unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});