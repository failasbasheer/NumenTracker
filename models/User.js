const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },       // added name field
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', UserSchema);