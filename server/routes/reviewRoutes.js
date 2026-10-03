const express = require('express');
const router = express.Router();
const {
  createReview,
  deleteReview
} = require('../controllers/reviewController');

router.post('/', createReview);
router.delete('/:id', deleteReview);

module.exports = router;
