const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { connectDB, query, getDbStatus } = require('../config/db');
const { initialMesses, initialReviews } = require('../data/seedData');

async function runSeed() {
  console.log('🔄 Connecting to PostgreSQL for syncing live data...');
  const pool = await connectDB();

  if (!pool || !getDbStatus()) {
    console.error('❌ Could not connect to PostgreSQL. Please check your .env settings and ensure PostgreSQL is running.');
    process.exit(1);
  }

  try {
    console.log('🧹 Purging dummy data and resetting tables...');
    await query('TRUNCATE TABLE reviews, messes, users RESTART IDENTITY CASCADE;');

    console.log(`🌱 Inserting ${initialMesses.length} live registered messes into PostgreSQL...`);
    for (let i = 0; i < initialMesses.length; i++) {
      const m = initialMesses[i];
      const lng = m.location?.coordinates?.[0] || 73.8443;
      const lat = m.location?.coordinates?.[1] || 18.5284;

      const insertMessSql = `
        INSERT INTO messes (
          name, owner_name, phone, whatsapp, email, username, password,
          address, area, city, pincode, latitude, longitude,
          food_type, monthly_price, trial_price, meals, menu, facilities,
          description, images, rating, review_count, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING id, name;
      `;
      const messValues = [
        m.name,
        m.ownerName,
        m.phone,
        m.whatsapp || m.phone,
        m.email || '',
        m.username || (m.ownerName ? m.ownerName.toLowerCase().replace(/\s+/g, '') : `owner${i + 1}`),
        m.password || 'baap@123',
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
      const messId = res.rows[0].id;
      console.log(`  ➕ Added Live Mess: ${res.rows[0].name} (ID: ${messId}, Username: ${m.username || 'N/A'})`);

      // Seed reviews matching this mess
      const matchingReviews = initialReviews.filter(r => String(r.messId) === String(m._id) || String(r.messId) === String(messId));
      for (const rev of matchingReviews) {
        await query(`
          INSERT INTO reviews (mess_id, user_name, user_college, rating, comment, images, likes)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          messId,
          rev.userName,
          rev.userCollege || 'Student / Bachelor',
          rev.rating,
          rev.comment,
          JSON.stringify(rev.images || []),
          rev.likes || 0
        ]);
        console.log(`    ⭐ Review from: ${rev.userName} (${rev.rating} stars)`);
      }

      // Update mess review count and rating
      if (matchingReviews.length > 0) {
        await query(`
          UPDATE messes SET
            rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE mess_id = $1),
            review_count = (SELECT COUNT(*) FROM reviews WHERE mess_id = $1)
          WHERE id = $1;
        `, [messId]);
      }
    }

    // Seed default student account
    await query(`
      INSERT INTO users (name, email, phone, college, password, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING;
    `, [
      'Demo Student',
      'student@messfinder.com',
      '9876543210',
      'COEP Pune',
      'student123',
      'student'
    ]);
    console.log('👤 Created demo student: student@messfinder.com / student123');

    console.log('🎉 PostgreSQL database synchronized with zero dummy data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

runSeed();
