const mongoose = require('mongoose');

const MessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mess name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Contact phone number is required'],
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    trim: true
  },
  password: {
    type: String
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  area: {
    type: String,
    required: [true, 'Area/Locality is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    default: 'Pune'
  },
  pincode: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    // Note: GeoJSON stores [longitude, latitude]
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates [longitude, latitude] are required']
    }
  },
  foodType: {
    type: String,
    required: [true, 'Food type is required (Veg, Non-Veg, or Both)'],
    enum: ['Veg', 'Non-Veg', 'Both']
  },
  monthlyPrice: {
    type: Number,
    required: [true, 'Monthly price is required'],
    min: [500, 'Monthly price must be at least ₹500']
  },
  trialPrice: {
    type: Number,
    default: 100
  },
  meals: {
    breakfast: {
      available: { type: Boolean, default: true },
      timing: { type: String, default: '7:30 AM - 10:00 AM' }
    },
    lunch: {
      available: { type: Boolean, default: true },
      timing: { type: String, default: '12:00 PM - 3:00 PM' }
    },
    dinner: {
      available: { type: Boolean, default: true },
      timing: { type: String, default: '7:30 PM - 10:30 PM' }
    }
  },
  menu: {
    breakfast: [{ type: String }],
    lunch: [{ type: String }],
    dinner: [{ type: String }],
    special: { type: String, default: 'Sunday Feast: Special Thali & Sweet' }
  },
  facilities: [{ type: String }],
  description: {
    type: String,
    required: [true, 'Mess description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create 2dsphere index for location-based geospatial queries
MessSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Mess || mongoose.model('Mess', MessSchema);
