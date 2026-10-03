const express = require('express');
const router = express.Router();
const {
  getAllMesses,
  getNearbyMesses,
  getMessById,
  createMess,
  updateMess,
  deleteMess,
  ownerLogin
} = require('../controllers/messController');
const { getMessReviews } = require('../controllers/reviewController');

// Specific routes first to prevent :id param collisions
router.get('/nearby', getNearbyMesses);
router.post('/owner-login', ownerLogin);

// Main collection routes
router.route('/')
  .get(getAllMesses)
  .post(createMess);

// Single mess routes
router.route('/:id')
  .get(getMessById)
  .put(updateMess)
  .delete(deleteMess);

// Nested reviews for a mess
router.get('/:id/reviews', getMessReviews);

module.exports = router;
