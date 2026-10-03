const fs = require('fs');
const path = require('path');
const { getDbStatus, query } = require('../config/db');
const { initialMesses, initialReviews } = require('./seedData');

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
  return Math.round(distance * 10) / 10;
}

// Convert PostgreSQL row to standardized object expected by frontend
function formatMess(row) {
  if (!row) return null;
  const lat = Number(row.latitude !== undefined ? row.latitude : (row.location?.coordinates?.[1] || 18.5284));
  const lng = Number(row.longitude !== undefined ? row.longitude : (row.location?.coordinates?.[0] || 73.8443));

  const meals = typeof row.meals === 'string' ? JSON.parse(row.meals) : (row.meals || {});
  const menu = typeof row.menu === 'string' ? JSON.parse(row.menu) : (row.menu || {});
  const facilities = typeof row.facilities === 'string' ? JSON.parse(row.facilities) : (row.facilities || []);
  const images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []);

  return {
    _id: String(row.id || row._id),
    id: row.id || row._id,
    name: row.name,
    ownerName: row.owner_name !== undefined ? row.owner_name : row.ownerName,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    username: row.username,
    password: row.password,
    address: row.address,
    area: row.area,
    city: row.city || 'Pune',
    pincode: row.pincode,
    location: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    latitude: lat,
    longitude: lng,
    foodType: row.food_type !== undefined ? row.food_type : row.foodType,
    monthlyPrice: Number(row.monthly_price !== undefined ? row.monthly_price : row.monthlyPrice),
    trialPrice: Number(row.trial_price !== undefined ? row.trial_price : (row.trialPrice || 100)),
    meals,
    menu,
    facilities,
    description: row.description || '',
    images,
    rating: Number(row.rating || 4.5),
    reviewCount: Number(row.review_count !== undefined ? row.review_count : (row.reviewCount || 0)),
    isVerified: row.is_verified !== undefined ? row.is_verified : (row.isVerified !== false),
    createdAt: row.created_at || row.createdAt || new Date(),
    distance: row.distance !== undefined ? Math.round(Number(row.distance) * 10) / 10 : undefined
  };
}

function formatReview(row) {
  if (!row) return null;
  const images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []);
  return {
    _id: String(row.id || row._id),
    id: row.id || row._id,
    messId: String(row.mess_id !== undefined ? row.mess_id : row.messId),
    userId: row.user_id ? String(row.user_id) : (row.userId ? String(row.userId) : null),
    userName: row.user_name !== undefined ? row.user_name : row.userName,
    userCollege: row.user_college !== undefined ? row.user_college : (row.userCollege || 'Student / Bachelor'),
    rating: Number(row.rating),
    comment: row.comment,
    images,
    likes: Number(row.likes || 0),
    createdAt: row.created_at || row.createdAt || new Date()
  };
}

// Fallback in-memory stores
let memoryMesses = loadJsonSafe(MESSES_FILE, []);
let memoryReviews = loadJsonSafe(REVIEWS_FILE, []);

// Seed PostgreSQL with real registered messes and remove dummy data
async function autoSeedDatabase() {
  if (!getDbStatus()) return;
  try {
    // 1. Purge all dummy / seed mock messes from PostgreSQL
    await query(`
      DELETE FROM messes WHERE name IN (
        'Shree Ganesh Mess & Dining',
        'Annapurna Bhojanalay',
        'Swami Samarth Student Dining Hall',
        'Kolhapuri Tadka & Khanawal',
        'Sai Krupa Deluxe Mess',
        'Green Leaf Pure Veg Kitchen & Tiffin',
        'Punjab Da Swad Student Mess'
      );
    `);

    // 2. Ensure all live registered messes exist in PostgreSQL
    const liveMesses = loadJsonSafe(MESSES_FILE, []);
    for (const m of liveMesses) {
      const check = await query(
        'SELECT id FROM messes WHERE LOWER(name) = LOWER($1) OR (username IS NOT NULL AND LOWER(username) = LOWER($2))',
        [m.name, m.username || '']
      );

      let currentMessId;
      if (check.rows.length === 0) {
        console.log(`🌱 Syncing live mess "${m.name}" (${m.username}) to PostgreSQL...`);
        const lng = m.location?.coordinates?.[0] || 73.8443;
        const lat = m.location?.coordinates?.[1] || 18.5284;
        const insertMessSql = `
          INSERT INTO messes (
            name, owner_name, phone, whatsapp, email, username, password,
            address, area, city, pincode, latitude, longitude,
            food_type, monthly_price, trial_price, meals, menu, facilities,
            description, images, rating, review_count, is_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          RETURNING id;
        `;
        const messValues = [
          m.name,
          m.ownerName,
          m.phone,
          m.whatsapp || m.phone,
          m.email || '',
          m.username || '',
          m.password || '',
          m.address,
          m.area,
          m.city || 'Pune',
          m.pincode || '411001',
          lat,
          lng,
          m.foodType,
          m.monthlyPrice,
          m.trialPrice || 100,
          JSON.stringify(m.meals || {}),
          JSON.stringify(m.menu || {}),
          JSON.stringify(m.facilities || []),
          m.description || '',
          JSON.stringify(m.images || []),
          m.rating || 5.0,
          m.reviewCount || 0,
          m.isVerified !== false
        ];
        const res = await query(insertMessSql, messValues);
        currentMessId = res.rows[0].id;
      } else {
        currentMessId = check.rows[0].id;
        // Ensure username and password are up to date in DB
        if (m.username && m.password) {
          await query(
            'UPDATE messes SET username = $1, password = $2, phone = $3, owner_name = $4 WHERE id = $5',
            [m.username, m.password, m.phone, m.ownerName, currentMessId]
          );
        }
      }

      // Sync reviews for this mess
      const liveReviews = loadJsonSafe(REVIEWS_FILE, []);
      const messReviews = liveReviews.filter(r => String(r.messId) === String(m._id) || String(r.messId) === String(currentMessId));
      for (const rev of messReviews) {
        const revCheck = await query(
          'SELECT id FROM reviews WHERE mess_id = $1 AND user_name = $2 AND comment = $3',
          [currentMessId, rev.userName, rev.comment]
        );
        if (revCheck.rows.length === 0) {
          await query(`
            INSERT INTO reviews (mess_id, user_name, user_college, rating, comment, images, likes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            currentMessId,
            rev.userName,
            rev.userCollege || 'Student / Bachelor',
            rev.rating,
            rev.comment,
            JSON.stringify(rev.images || []),
            rev.likes || 0
          ]);
        }
      }
    }
    console.log('✅ PostgreSQL is fully in sync with live registered messes (dummy data removed).');
  } catch (err) {
    console.error('Error auto-seeding PostgreSQL:', err.message);
  }
}

// Data Store Layer
const DataStore = {
  // Find all messes with filtering
  async getAllMesses(filters = {}) {
    if (getDbStatus()) {
      try {
        let sql = `SELECT * FROM messes WHERE 1=1`;
        const params = [];
        let pIndex = 1;

        if (filters.foodType && filters.foodType !== 'All') {
          sql += ` AND food_type = $${pIndex++}`;
          params.push(filters.foodType);
        }
        if (filters.maxPrice) {
          sql += ` AND monthly_price <= $${pIndex++}`;
          params.push(Number(filters.maxPrice));
        }
        if (filters.minRating) {
          sql += ` AND rating >= $${pIndex++}`;
          params.push(Number(filters.minRating));
        }
        if (filters.search) {
          const searchPattern = `%${filters.search}%`;
          sql += ` AND (name ILIKE $${pIndex} OR area ILIKE $${pIndex} OR city ILIKE $${pIndex} OR description ILIKE $${pIndex})`;
          params.push(searchPattern);
          pIndex++;
        }

        sql += ` ORDER BY rating DESC, created_at DESC`;

        const res = await query(sql, params);
        return res.rows.map(formatMess);
      } catch (e) {
        console.warn('PostgreSQL query error, using fallback:', e.message);
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
    }).map(formatMess);
  },

  // Find nearby messes with real Haversine distance
  async getNearbyMesses(lat, lng, radiusKm = 10, filters = {}) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Valid latitude and longitude coordinates are required');
    }

    if (getDbStatus()) {
      try {
        let sql = `
          SELECT *,
            ( 6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                  cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) +
                  sin(radians($1)) * sin(radians(latitude))
                ))
            ) ) AS distance
          FROM messes
          WHERE 1=1
        `;
        const params = [latitude, longitude];
        let pIndex = 3;

        if (filters.foodType && filters.foodType !== 'All') {
          if (filters.foodType === 'Both') {
            // Keep all
          } else {
            sql += ` AND (food_type = $${pIndex} OR food_type = 'Both')`;
            params.push(filters.foodType);
            pIndex++;
          }
        }

        if (filters.maxPrice) {
          sql += ` AND monthly_price <= $${pIndex++}`;
          params.push(Number(filters.maxPrice));
        }

        if (filters.minPrice) {
          sql += ` AND monthly_price >= $${pIndex++}`;
          params.push(Number(filters.minPrice));
        }

        if (filters.minRating) {
          sql += ` AND rating >= $${pIndex++}`;
          params.push(Number(filters.minRating));
        }

        if (filters.search) {
          const searchPattern = `%${filters.search}%`;
          sql += ` AND (name ILIKE $${pIndex} OR area ILIKE $${pIndex} OR description ILIKE $${pIndex})`;
          params.push(searchPattern);
          pIndex++;
        }

        // Subquery to filter by radius and sort
        const wrappedSql = `
          SELECT * FROM (${sql}) AS nearby
          ${radiusKm && radiusKm > 0 ? `WHERE distance <= ${Number(radiusKm)}` : ''}
          ORDER BY distance ASC
        `;

        const res = await query(wrappedSql, params);
        let results = res.rows.map(formatMess);

        if (filters.mealType) {
          results = results.filter(m => {
            if (filters.mealType === 'breakfast') return m.meals?.breakfast?.available;
            if (filters.mealType === 'lunch') return m.meals?.lunch?.available;
            if (filters.mealType === 'dinner') return m.meals?.dinner?.available;
            return true;
          });
        }

        return results;
      } catch (err) {
        console.warn('PostgreSQL nearby query fallback:', err.message);
      }
    }

    // In-memory fallback
    let results = memoryMesses.map(mess => {
      const messLng = mess.location?.coordinates?.[0] || mess.longitude || 73.8443;
      const messLat = mess.location?.coordinates?.[1] || mess.latitude || 18.5284;
      const distance = calculateHaversineDistance(latitude, longitude, messLat, messLng);
      return {
        ...mess,
        distance
      };
    });

    if (radiusKm && radiusKm > 0) {
      results = results.filter(m => m.distance <= radiusKm);
    }

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

    results.sort((a, b) => a.distance - b.distance);
    return results.map(formatMess);
  },

  // Get single mess by ID
  async getMessById(id) {
    if (getDbStatus()) {
      try {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const res = await query('SELECT * FROM messes WHERE id = $1', [numId]);
          if (res.rows.length > 0) {
            return formatMess(res.rows[0]);
          }
        }
      } catch (err) {
        // fallback
      }
    }
    const mem = memoryMesses.find(m => String(m._id || m.id) === String(id));
    return mem ? formatMess(mem) : null;
  },

  // Create a new mess
  async createMess(messData) {
    const lat = messData.location?.coordinates?.[1] || messData.latitude || 18.5284;
    const lng = messData.location?.coordinates?.[0] || messData.longitude || 73.8443;

    if (getDbStatus()) {
      try {
        const sql = `
          INSERT INTO messes (
            name, owner_name, phone, whatsapp, email, username, password,
            address, area, city, pincode, latitude, longitude,
            food_type, monthly_price, trial_price, meals, menu, facilities,
            description, images, rating, review_count, is_verified, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW())
          RETURNING *;
        `;
        const values = [
          messData.name,
          messData.ownerName,
          messData.phone,
          messData.whatsapp || messData.phone,
          messData.email || '',
          messData.username || '',
          messData.password || '',
          messData.address,
          messData.area,
          messData.city || 'Pune',
          messData.pincode || '411001',
          lat,
          lng,
          messData.foodType,
          messData.monthlyPrice,
          messData.trialPrice || 100,
          JSON.stringify(messData.meals || {}),
          JSON.stringify(messData.menu || {}),
          JSON.stringify(messData.facilities || []),
          messData.description || '',
          JSON.stringify(messData.images || []),
          messData.rating || 4.8,
          messData.reviewCount || 0,
          messData.isVerified !== false
        ];

        const res = await query(sql, values);
        const created = formatMess(res.rows[0]);
        memoryMesses.unshift(created);
        saveJsonSafe(MESSES_FILE, memoryMesses);
        return created;
      } catch (err) {
        console.warn('PostgreSQL create error, fallback:', err.message);
      }
    }

    const created = formatMess({
      ...messData,
      _id: `mem_mess_${Date.now()}`,
      rating: messData.rating || 4.8,
      reviewCount: 0,
      createdAt: new Date()
    });
    memoryMesses.unshift(created);
    saveJsonSafe(MESSES_FILE, memoryMesses);
    return created;
  },

  // Update a mess
  async updateMess(id, updateData) {
    if (getDbStatus()) {
      try {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const sets = [];
          const values = [];
          let vIndex = 1;

          if (updateData.name !== undefined) { sets.push(`name = $${vIndex++}`); values.push(updateData.name); }
          if (updateData.ownerName !== undefined) { sets.push(`owner_name = $${vIndex++}`); values.push(updateData.ownerName); }
          if (updateData.phone !== undefined) { sets.push(`phone = $${vIndex++}`); values.push(updateData.phone); }
          if (updateData.foodType !== undefined) { sets.push(`food_type = $${vIndex++}`); values.push(updateData.foodType); }
          if (updateData.monthlyPrice !== undefined) { sets.push(`monthly_price = $${vIndex++}`); values.push(Number(updateData.monthlyPrice)); }
          if (updateData.trialPrice !== undefined) { sets.push(`trial_price = $${vIndex++}`); values.push(Number(updateData.trialPrice)); }
          if (updateData.rating !== undefined) { sets.push(`rating = $${vIndex++}`); values.push(Number(updateData.rating)); }
          if (updateData.reviewCount !== undefined) { sets.push(`review_count = $${vIndex++}`); values.push(Number(updateData.reviewCount)); }
          if (updateData.meals !== undefined) { sets.push(`meals = $${vIndex++}`); values.push(JSON.stringify(updateData.meals)); }
          if (updateData.menu !== undefined) { sets.push(`menu = $${vIndex++}`); values.push(JSON.stringify(updateData.menu)); }
          if (updateData.facilities !== undefined) { sets.push(`facilities = $${vIndex++}`); values.push(JSON.stringify(updateData.facilities)); }
          if (updateData.images !== undefined) { sets.push(`images = $${vIndex++}`); values.push(JSON.stringify(updateData.images)); }
          if (updateData.description !== undefined) { sets.push(`description = $${vIndex++}`); values.push(updateData.description); }

          if (sets.length > 0) {
            values.push(numId);
            const sql = `UPDATE messes SET ${sets.join(', ')} WHERE id = $${vIndex} RETURNING *;`;
            const res = await query(sql, values);
            if (res.rows.length > 0) {
              const updated = formatMess(res.rows[0]);
              const idx = memoryMesses.findIndex(m => String(m._id || m.id) === String(id));
              if (idx !== -1) memoryMesses[idx] = updated;
              saveJsonSafe(MESSES_FILE, memoryMesses);
              return updated;
            }
          }
        }
      } catch (err) {
        console.warn('PostgreSQL update error:', err.message);
      }
    }

    const idx = memoryMesses.findIndex(m => String(m._id || m.id) === String(id));
    if (idx !== -1) {
      memoryMesses[idx] = formatMess({ ...memoryMesses[idx], ...updateData });
      saveJsonSafe(MESSES_FILE, memoryMesses);
      return memoryMesses[idx];
    }
    return null;
  },

  // Delete a mess
  async deleteMess(id) {
    if (getDbStatus()) {
      try {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          await query('DELETE FROM messes WHERE id = $1', [numId]);
        }
      } catch (err) {}
    }
    memoryMesses = memoryMesses.filter(m => String(m._id || m.id) !== String(id));
    saveJsonSafe(MESSES_FILE, memoryMesses);
    return true;
  },

  // Reviews
  async getReviewsForMess(messId) {
    if (getDbStatus()) {
      try {
        const numId = parseInt(messId, 10);
        if (!isNaN(numId)) {
          const res = await query('SELECT * FROM reviews WHERE mess_id = $1 ORDER BY created_at DESC', [numId]);
          return res.rows.map(formatReview);
        }
      } catch (err) {}
    }
    return memoryReviews
      .filter(r => String(r.messId || r.mess_id) === String(messId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(formatReview);
  },

  async createReview(reviewData) {
    let created;
    if (getDbStatus()) {
      try {
        const numMessId = parseInt(reviewData.messId, 10);
        if (!isNaN(numMessId)) {
          const sql = `
            INSERT INTO reviews (mess_id, user_name, user_college, rating, comment, images, likes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *;
          `;
          const values = [
            numMessId,
            reviewData.userName,
            reviewData.userCollege || 'Student / Bachelor',
            Number(reviewData.rating),
            reviewData.comment,
            JSON.stringify(reviewData.images || []),
            0
          ];

          const res = await query(sql, values);
          created = formatReview(res.rows[0]);

          // Recalculate average rating & review count in PostgreSQL
          await query(`
            UPDATE messes SET
              rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE mess_id = $1),
              review_count = (SELECT COUNT(*) FROM reviews WHERE mess_id = $1)
            WHERE id = $1;
          `, [numMessId]);
        }
      } catch (err) {
        console.warn('PostgreSQL review create error:', err.message);
      }
    }

    if (!created) {
      created = formatReview({
        ...reviewData,
        _id: `mem_rev_${Date.now()}`,
        createdAt: new Date()
      });
    }

    memoryReviews.unshift(created);
    saveJsonSafe(REVIEWS_FILE, memoryReviews);

    // Recalculate average rating for fallback memory
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
  autoSeedDatabase,
  formatMess,
  formatReview
};
