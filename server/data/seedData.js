const fs = require('fs');
const path = require('path');

const MESSES_FILE = path.join(__dirname, 'live_messes.json');
const REVIEWS_FILE = path.join(__dirname, 'live_reviews.json');

function loadJsonSafe(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

// Only real verified messes (Zero dummy messes)
const initialMesses = loadJsonSafe(MESSES_FILE, []);
const initialReviews = loadJsonSafe(REVIEWS_FILE, []);

module.exports = { initialMesses, initialReviews };
