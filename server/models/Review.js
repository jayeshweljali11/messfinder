const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  messId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: [true, 'Mess reference ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userName: {
    type: String,
    required: [true, 'Reviewer name is required'],
    trim: true
  },
  userCollege: {
    type: String,
    trim: true,
    default: 'Student / Bachelor'
  },
  rating: {
    type: Number,
    required: [true, 'Rating (1 to 5) is required'],
    min: [1, 'Minimum rating is 1'],
    max: [5, 'Maximum rating is 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment cannot be empty'],
    minlength: [5, 'Review must be at least 5 characters long'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  images: [{
    type: String
  }],
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
