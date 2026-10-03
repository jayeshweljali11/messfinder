const fs = require('fs');
const path = require('path');
const { getDbStatus, query } = require('../config/db');

const USERS_FILE = path.join(__dirname, '../data/live_users.json');

function loadUsersSafe() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading live_users.json:', err.message);
  }
  return [];
}

function saveUsersSafe(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving live_users.json:', err.message);
  }
}

let liveUsers = loadUsersSafe();

// @desc    Register a new student user
// @route   POST /api/users/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, college, password } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, Contact (Email or Mobile) and Password are required.'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters.'
      });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanName = name.trim();
    const cleanCollege = (college || 'Student / Bachelor').trim();
    const finalEmail = cleanEmail || `${cleanPhone}@messfinder.student`;

    // 1. Check PostgreSQL if active
    let dbUser = null;
    if (getDbStatus()) {
      try {
        const checkRes = await query(
          'SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR (phone IS NOT NULL AND phone = $2)',
          [finalEmail, cleanPhone]
        );
        if (checkRes.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'An account with this Email or Phone is already registered. Please login.'
          });
        }

        const insertRes = await query(
          `INSERT INTO users (name, email, phone, college, password, role, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING *`,
          [cleanName, finalEmail, cleanPhone, cleanCollege, String(password).trim(), 'student']
        );
        dbUser = insertRes.rows[0];
      } catch (err) {
        console.warn('PostgreSQL student register note:', err.message);
      }
    }

    // 2. Also keep fallback JSON updated
    liveUsers = loadUsersSafe();
    const existsInMemory = liveUsers.find(u => 
      (finalEmail && u.email && u.email.toLowerCase() === finalEmail.toLowerCase()) ||
      (cleanPhone && u.phone && u.phone === cleanPhone)
    );

    if (existsInMemory && !dbUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Email or Phone is already registered. Please login.'
      });
    }

    const newUser = {
      _id: dbUser ? String(dbUser.id) : `stu_${Date.now()}`,
      id: dbUser ? dbUser.id : undefined,
      name: cleanName,
      email: finalEmail,
      phone: cleanPhone,
      college: cleanCollege,
      password: String(password).trim(),
      role: 'student',
      createdAt: dbUser ? dbUser.created_at : new Date().toISOString()
    };

    liveUsers.unshift(newUser);
    saveUsersSafe(liveUsers);

    // Return sanitized student data
    const safeData = {
      _id: newUser._id,
      id: newUser.id || newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      college: newUser.college,
      role: 'student'
    };

    res.status(201).json({
      success: true,
      message: `Welcome, ${cleanName}! Your student account has been created successfully.`,
      data: safeData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login student user
// @route   POST /api/users/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Email / Mobile and Password.'
      });
    }

    const cleanInput = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Check PostgreSQL if active
    if (getDbStatus()) {
      try {
        const resDb = await query(
          'SELECT * FROM users WHERE (LOWER(email) = $1 OR phone = $1) AND password = $2',
          [cleanInput, cleanPass]
        );
        if (resDb.rows.length > 0) {
          const user = resDb.rows[0];
          return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            data: {
              _id: String(user.id),
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              college: user.college,
              role: user.role || 'student'
            }
          });
        }
      } catch (e) {
        console.warn('PostgreSQL login error, checking fallback:', e.message);
      }
    }

    // Check liveUsers file store fallback
    liveUsers = loadUsersSafe();
    const matched = liveUsers.find(u => 
      ((u.email && u.email.toLowerCase() === cleanInput) ||
       (u.phone && u.phone === cleanInput)) &&
      (String(u.password).trim() === cleanPass)
    );

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials! No registered student found with this Email/Phone and Password.'
      });
    }

    res.status(200).json({
      success: true,
      message: `Welcome back, ${matched.name}!`,
      data: {
        _id: String(matched._id || matched.id),
        id: matched.id || matched._id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        college: matched.college,
        role: matched.role || 'student'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/me
exports.getMe = async (req, res, next) => {
  liveUsers = loadUsersSafe();
  res.status(200).json({
    success: true,
    data: liveUsers.length > 0 ? liveUsers[0] : null
  });
};
