require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database for storing URLs
let urlDatabase = {};
let idCounter = 1;

// Serve the homepage
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// API endpoint for testing
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Helper function to validate URL
const isValidUrl = (url) => {
  try {
    const urlRegex = /^https?:\/\/([\w.-]+)(\/.*)?$/;
    const match = url.match(urlRegex);
    if (!match) return false;
    return match[1]; // Return hostname for DNS lookup
  } catch {
    return false;
  }
};

// POST endpoint to shorten a URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL format
  const hostname = isValidUrl(originalUrl);
  if (!hostname) {
    return res.json({ error: 'invalid url' });
  }

  // Validate hostname with DNS lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if the URL already exists
    const existingEntry = Object.entries(urlDatabase).find(
      ([, value]) => value.original_url === originalUrl
    );

    if (existingEntry) {
      return res.json({
        original_url: originalUrl,
        short_url: existingEntry[0],
      });
    }

    // Create a new short URL entry
    const shortUrl = idCounter++;
    urlDatabase[shortUrl] = { original_url: originalUrl };

    res.json({
      original_url: originalUrl,
      short_url: shortUrl,
    });
  });
});

// GET endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;

  // Check if the short_url exists in the database
  const entry = urlDatabase[shortUrl];
  if (!entry) {
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }

  // Redirect to the original URL
  res.redirect(entry.original_url);
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
