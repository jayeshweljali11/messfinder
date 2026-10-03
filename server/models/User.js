// PostgreSQL User Model Definition & Column mapping
module.exports = {
  tableName: 'users',
  columns: [
    'id',
    'name',
    'email',
    'phone',
    'password',
    'college',
    'role',
    'created_at'
  ]
};
