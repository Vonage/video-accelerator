const express = require('express');
const app = express();
const port = 3000;

require('dotenv').config();

app.use(express.static('public'));

app.use('/dist', express.static('../dist'));

app.get('/config', (req, res) => {
  res.json({
    apiKey: process.env.VONAGE_VIDEO_API_KEY,
    sessionId: process.env.VONAGE_VIDEO_SESSION_ID,
    token: process.env.VONAGE_VIDEO_TOKEN
  });
})

app.listen(port, () => console.log(`Listing on ${port}`));
