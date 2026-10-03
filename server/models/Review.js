// PostgreSQL Review Model Definition & Column mapping
module.exports = {
  tableName: 'reviews',
  columns: [
    'id',
    'mess_id',
    'user_id',
    'user_name',
    'user_college',
    'rating',
    'comment',
    'images',
    'likes',
    'created_at'
  ]
};
