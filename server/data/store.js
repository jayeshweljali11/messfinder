const fs = require('fs');
const path = require('path');
const Mess = require('../models/Mess');
const Review = require('../models/Review');
const User = require('../models/User');
const { getDbStatus } = require('../config/db');

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

function saveJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Error writing ${filePath}:`, err.message);
  }
}

// Haversine formula to compute great-circle distance between two points in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place (e.g. 0.8 km)
}

// Live store containing ONLY live registered messes and real reviews
let memoryMesses = loadJsonSafe(MESSES_FILE, []);
let memoryReviews = loadJsonSafe(REVIEWS_FILE, []);
let memoryUsers = [];

// Seed MongoDB if empty with live data only
async function autoSeedDatabase() {
  if (!getDbStatus()) return;
  try {
    const count = await Mess.countDocuments();
    if (count === 0 && memoryMesses.length > 0) {
      console.log('🌱 Syncing live messes to MongoDB...');
      await Mess.insertMany(memoryMesses);
    }
  } catch (err) {
    console.error('Error syncing MongoDB:', err.message);
  }
}

// Data Store Layer
const DataStore = {
  // Find all messes with filtering
  async getAllMesses(filters = {}) {
    if (getDbStatus()) {
      try {
        let query = {};
        if (filters.foodType && filters.foodType !== 'All') {
          query.foodType = filters.foodType;
        }
        if (filters.maxPrice) {
          query.monthlyPrice = { $lte: Number(filters.maxPrice) };
        }
        if (filters.minRating) {
          query.rating = { $gte: Number(filters.minRating) };
        }
        if (filters.search) {
          const regex = new RegExp(filters.search, 'i');
          query.$or = [
            { name: regex },
            { area: regex },
            { city: regex },
            { description: regex }
          ];
        }
        const messes = await Mess.find(query).sort({ rating: -1, createdAt: -1 });
        return messes.map(m => m.toObject());
      } catch (e) {
        console.warn('MongoDB query error, using fallback:', e.message);
      }
    }

    // In-memory fallback
    return memoryMesses.filter(m => {
      if (filters.foodType && filters.foodType !== 'All') {
        if (filters.foodType === 'Veg' && m.foodType !== 'Veg') return false;
        if (filters.foodType === 'Non-Veg' && m.foodType !== 'Non-Veg') return false;
        if (filters.foodType === 'Both' && m.foodType !== 'Both') return false;
      }
      if (filters.maxPrice && m.monthlyPrice > Number(filters.maxPrice)) {
        return false;
      }
      if (filters.minRating && m.rating < Number(filters.minRating)) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          m.name.toLowerCase().includes(q) ||
          m.area.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  },

  // Find nearby messes with real Haversine distance
  async getNearbyMesses(lat, lng, radiusKm = 10, filters = {}) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Valid latitude and longitude coordinates are required');
    }

    let allMesses = [];

    if (getDbStatus()) {
      try {
        allMesses = await Mess.find({}).lean();
      } catch (err) {
        console.warn('Mongo nearby query fallback:', err.message);
        allMesses = memoryMesses;
      }
    } else {
      allMesses = memoryMesses;
    }

    // Calculate distance for each mess
    let results = allMesses.map(mess => {
      // mess.location.coordinates is [lng, lat]
      const messLng = mess.location.coordinates[0];
      const messLat = mess.location.coordinates[1];
      const distance = calculateHaversineDistance(latitude, longitude, messLat, messLng);
      return {
        ...mess,
        distance // in km
      };
    });

    // Filter within radius if specified
    if (radiusKm && radiusKm > 0) {
      results = results.filter(m => m.distance <= radiusKm);
    }

    // Additional filters (foodType, price, rating, meal)
    if (filters.foodType && filters.foodType !== 'All') {
      results = results.filter(m => {
        if (filters.foodType === 'Both') return true;
        return m.foodType === filters.foodType || m.foodType === 'Both';
      });
    }

    if (filters.maxPrice) {
      results = results.filter(m => m.monthlyPrice <= Number(filters.maxPrice));
    }

    if (filters.minPrice) {
      results = results.filter(m => m.monthlyPrice >= Number(filters.minPrice));
    }

    if (filters.minRating) {
      results = results.filter(m => m.rating >= Number(filters.minRating));
    }

    if (filters.mealType) {
      results = results.filter(m => {
        if (filters.mealType === 'breakfast') return m.meals?.breakfast?.available;
        if (filters.mealType === 'lunch') return m.meals?.lunch?.available;
        if (filters.mealType === 'dinner') return m.meals?.dinner?.available;
        return true;
      });
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.area.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    // Sort by nearest distance first
    results.sort((a, b) => a.distance - b.distance);

    return results;
  },

  // Get single mess by ID
  async getMessById(id) {
    if (getDbStatus()) {
      try {
        const mess = await Mess.findById(id).lean();
        if (mess) return mess;
      } catch (err) {
        // fallback to memory
      }
    }
    return memoryMesses.find(m => String(m._id) === String(id)) || null;
  },

  // Create a new mess
  async createMess(messData) {
    if (getDbStatus()) {
      try {
        const newMess = await Mess.create(messData);
        // Also keep memory sync
        memoryMesses.unshift(newMess.toObject());
        return newMess.toObject();
      } catch (err) {
        console.warn('Mongo create error, storing in memory:', err.message);
      }
    }

    const created = {
      ...messData,
      _id: `mem_mess_${Date.now()}`,
      rating: messData.rating || 4.5,
      reviewCount: 0,
      createdAt: new Date()
    };
    memoryMesses.unshift(created);
    saveJsonSafe(MESSES_FILE, memoryMesses);
    return created;
  },

  // Update a mess
  async updateMess(id, updateData) {
    if (getDbStatus()) {
      try {
        const updated = await Mess.findByIdAndUpdate(id, updateData, { new: true }).lean();
        if (updated) {
          const idx = memoryMesses.findIndex(m => String(m._id) === String(id));
          if (idx !== -1) memoryMesses[idx] = { ...memoryMesses[idx], ...updateData };
          saveJsonSafe(MESSES_FILE, memoryMesses);
          return updated;
        }
      } catch (err) {}
    }

    const idx = memoryMesses.findIndex(m => String(m._id) === String(id));
    if (idx !== -1) {
      memoryMesses[idx] = { ...memoryMesses[idx], ...updateData };
      saveJsonSafe(MESSES_FILE, memoryMesses);
      return memoryMesses[idx];
    }
    return null;
  },

  // Delete a mess
  async deleteMess(id) {
    if (getDbStatus()) {
      try {
        await Mess.findByIdAndDelete(id);
      } catch (err) {}
    }
    memoryMesses = memoryMesses.filter(m => String(m._id) !== String(id));
    saveJsonSafe(MESSES_FILE, memoryMesses);
    return true;
  },

  // Reviews
  async getReviewsForMess(messId) {
    if (getDbStatus()) {
      try {
        const reviews = await Review.find({ messId }).sort({ createdAt: -1 }).lean();
        return reviews;
      } catch (err) {}
    }
    return memoryReviews
      .filter(r => String(r.messId) === String(messId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async createReview(reviewData) {
    let created;
    if (getDbStatus()) {
      try {
        created = await Review.create(reviewData);
        created = created.toObject();
      } catch (err) {
        console.warn('Mongo review create error:', err.message);
      }
    }

    if (!created) {
      created = {
        ...reviewData,
        _id: `mem_rev_${Date.now()}`,
        createdAt: new Date()
      };
      memoryReviews.unshift(created);
    } else {
      memoryReviews.unshift(created);
    }
    saveJsonSafe(REVIEWS_FILE, memoryReviews);

    // Recalculate average rating for the mess
    const messReviews = await this.getReviewsForMess(reviewData.messId);
    if (messReviews.length > 0) {
      const sum = messReviews.reduce((acc, r) => acc + Number(r.rating), 0);
      const avg = Math.round((sum / messReviews.length) * 10) / 10;
      await this.updateMess(reviewData.messId, {
        rating: avg,
        reviewCount: messReviews.length
      });
    }

    return created;
  }
};

module.exports = {
  DataStore,
  calculateHaversineDistance,
  autoSeedDatabase
};
