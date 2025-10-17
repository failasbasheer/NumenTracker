const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registration
// Registration
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    console.log(name+"name here");
    console.log(phone+"phone here");
    console.log(password+"password here");
    

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone, and password are required' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: 'User with this phone number already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, phone, password: hashedPassword });
    await user.save();

    // Log user details
    console.log(`[REGISTER] Name: ${name}, Phone: ${phone}, Hashed Password: ${hashedPassword}`);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, name: user.name, phone: user.phone });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ message: err.message });
  }
});
// Login
// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log(phone+" phone here");
    console.log(password+" password here");

    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const user = await User.findOne({ phone });

    if (!user) return res.status(400).json({ message: 'No account found with this phone number' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Return name along with phone and token
    res.json({ token, phone: user.phone, name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
