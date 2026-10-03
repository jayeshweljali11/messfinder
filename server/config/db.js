const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/messfinder';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000 // Fast failover if local Mongo daemon is not running
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB connection note: ${error.message}`);
    console.log(`ℹ️ Mess Finder is running with active storage fallback. If you have MongoDB installed, ensure 'mongod' is running or set MONGODB_URI in .env.`);
    return null;
  }
};

const getDbStatus = () => isConnected;

module.exports = { connectDB, getDbStatus };
