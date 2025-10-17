const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const logs = []; // optionally move shared logs here

router.get('/', authMiddleware, (req, res) => {
  res.json(logs);
});

module.exports = router;
