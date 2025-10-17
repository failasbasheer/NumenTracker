// const express = require('express');
// const Transaction = require('../models/Transaction');
// const authMiddleware = require('../middleware/authMiddleware');
// const router = express.Router();

// router.get('/', authMiddleware, async (req, res) => {
//   const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
//   res.json(transactions);
// });

// router.post('/', authMiddleware, async (req, res) => {
//   const { type, category, amount, date } = req.body;
//   const transaction = new Transaction({ type, category, amount, date, user: req.user.id });
//   await transaction.save();
//   res.json(transaction);
// });

// const mongoose = require('mongoose');
// router.delete('/:id', authMiddleware, async (req, res) => {
//   try {
//     console.log("🧾 Delete requested for:", req.params.id);
//     console.log("👤 Authenticated user ID:", req.user.id);

//     const deleted = await Transaction.findOneAndDelete({
//       _id: req.params.id,
//       user: new mongoose.Types.ObjectId(req.user.id)
//     });

//     if (!deleted) {
//       console.log("⚠️ No transaction found or not owned by user");
//       return res.status(404).json({ message: "Transaction not found or unauthorized" });
//     }

//     res.json({ message: "Transaction deleted" });
//   } catch (err) {
//     console.error("❌ Delete error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


const express = require('express');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const mongoose = require('mongoose');

// Get all transactions
router.get('/', authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
  res.json(transactions);
});

// Create transaction
router.post('/', authMiddleware, async (req, res) => {
  const { type, category, amount, date } = req.body;
  const transaction = new Transaction({ type, category, amount, date, user: req.user.id });
  await transaction.save();

  // Emit real-time update
  const io = req.app.get('io');
  io.to(req.user.id).emit('transactionUpdated', transaction);

  res.json(transaction);
});

// Delete transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!deleted) return res.status(404).json({ message: "Transaction not found or unauthorized" });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(req.user.id).emit('transactionUpdated', { deletedId: req.params.id });

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
