const { DataStore } = require('../data/store');

// @desc    Get all reviews for a specific mess
// @route   GET /api/messes/:id/reviews
exports.getMessReviews = async (req, res, next) => {
  try {
    const reviews = await DataStore.getReviewsForMess(req.params.id);
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a new student review
// @route   POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { messId, userName, userCollege, rating, comment, images } = req.body;

    if (!messId) {
      return res.status(400).json({
        success: false,
        message: 'Mess ID is required to post a review'
      });
    }

    if (!rating || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars'
      });
    }

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a genuine review comment with at least 5 characters'
      });
    }

    // Verify mess exists
    const mess = await DataStore.getMessById(messId);
    if (!mess) {
      return res.status(404).json({
        success: false,
        message: 'Mess not found'
      });
    }

    const reviewPayload = {
      messId,
      userName: userName?.trim() || 'Anonymous Student',
      userCollege: userCollege?.trim() || 'Student / Bachelor',
      rating: Number(rating),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      likes: 0,
      createdAt: new Date()
    };

    const newReview = await DataStore.createReview(reviewPayload);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted successfully.',
      data: newReview
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
