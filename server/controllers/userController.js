const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { getDbStatus } = require('../config/db');

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

    // Check if user already exists
    liveUsers = loadUsersSafe();
    const exists = liveUsers.find(u => 
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && u.phone && u.phone === cleanPhone)
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Email or Phone is already registered. Please login.'
      });
    }

    // If MongoDB is connected, save to DB
    let dbUser = null;
    if (getDbStatus()) {
      try {
        dbUser = await User.create({
          name: cleanName,
          email: cleanEmail || `${cleanPhone}@messfinder.student`,
          phone: cleanPhone,
          college: cleanCollege,
          password: password,
          role: 'student'
        });
      } catch (err) {
        console.warn('MongoDB student register note:', err.message);
      }
    }

    const newUser = {
      _id: dbUser ? String(dbUser._id) : `stu_${Date.now()}`,
      name: cleanName,
      email: cleanEmail || `${cleanPhone}@messfinder.student`,
      phone: cleanPhone,
      college: cleanCollege,
      password: String(password).trim(),
      role: 'student',
      createdAt: new Date().toISOString()
    };

    liveUsers.unshift(newUser);
    saveUsersSafe(liveUsers);

    // Return sanitized student data
    const safeData = {
      _id: newUser._id,
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

    // Check MongoDB if active
    if (getDbStatus()) {
      try {
        const user = await User.findOne({
          $or: [{ email: cleanInput }, { phone: cleanInput }],
          password: cleanPass
        });
        if (user) {
          return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            data: {
              _id: String(user._id),
              name: user.name,
              email: user.email,
              phone: user.phone,
              college: user.college,
              role: user.role || 'student'
            }
          });
        }
      } catch (e) {}
    }

    // Check liveUsers file store
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
        _id: matched._id,
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
