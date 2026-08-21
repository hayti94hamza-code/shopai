const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('✅ NEFHARA Server is running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});
