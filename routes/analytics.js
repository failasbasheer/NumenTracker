const express = require('express');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const categoryTotalsMap = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const categoryTotals = Object.entries(categoryTotalsMap).map(([category, amount]) => ({ category, amount }));

  const monthlyMap = {};
  transactions.forEach((t) => {
    const month = new Date(t.date).toLocaleString("default", { month: "short", year: "numeric" });
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0, month };
    monthlyMap[month][t.type] += t.amount;
  });
  const monthly = Object.values(monthlyMap);

  res.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryTotals,
    monthly,
  });
});

module.exports = router;
