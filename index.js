require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    // Validate the URL format using a regex
    const urlRegex = /^https?:\/\/([\w.-]+)(\/.*)?$/;
    const match = originalUrl.match(urlRegex);

    if (!match) {
      return res.json({ error: 'invalid url' });
    }

    const hostname = match[1];

    // Validate the hostname using DNS lookup
    dns.lookup(hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Check if the URL already exists in the database
      const existing = Object.entries(urlDatabase).find(
        ([key, value]) => value.original_url === originalUrl
      );

      if (existing) {
        return res.json({
          original_url: originalUrl,
          short_url: existing[0],
        });
      }

      // Add a new entry to the database
      const shortUrl = idCounter++;
      urlDatabase[shortUrl] = { original_url: originalUrl };

      res.json({
        original_url: originalUrl,
        short_url: shortUrl,
      });
    });
  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});

// GET /api/shorturl/<short_url>
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const entry = urlDatabase[shortUrl];

  if (!entry) {
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }

  res.redirect(entry.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
