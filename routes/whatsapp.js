


const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const levenshtein = require('fast-levenshtein');
const crypto = require('crypto');

// Pending user confirmations
const pendingTransactions = {};

// Categories
const categoriesDict = [
  'fuel', 'salary', 'food', 'rent', 'shopping', 'entertainment', 'travel', 'bills', 'others'
];
const categoryKeywords = {
  fuel: ['petrol', 'diesel', 'fuel', 'gas'],
  salary: ['salary', 'income', 'bonus', 'pay', 'stipend', 'earnings', 'received'],
  food: ['food', 'restaurant', 'cafe', 'meal', 'dining', 'lunch', 'breakfast', 'dinner'],
  rent: ['rent', 'house', 'apartment', 'mortgage'],
  shopping: ['shopping', 'clothes', 'amazon', 'flipkart', 'mall', 'buy', 'purchase'],
  entertainment: ['movie', 'cinema', 'netflix', 'game', 'entertainment', 'concert', 'music'],
  travel: ['bus', 'train', 'flight', 'uber', 'ola', 'taxi', 'travel', 'cab'],
  bills: ['electricity', 'water', 'internet', 'phone', 'bill', 'subscription', 'utility'],
};

const incomeKeywords = ['salary', 'income', 'bonus', 'pay', 'received', 'earned', 'gift'];
const expenseKeywords = ['fuel', 'food', 'rent', 'shopping', 'entertainment', 'travel', 'bills'];

// Emoji mapping
const emojiMap = { food: "🍔", rent: "🏠", salary: "💼", travel: "✈️", bills: "💡", shopping: "🛍️", fuel: "⛽", entertainment: "🎮", others: "💰" };

// Fun responses
const responseTemplates = {
  income: [
    "💸 Money flowing in! {count} income added. Keep that hustle strong!",
    "🤑 {count} income recorded — time to treat yourself (responsibly 😎)",
    "🎉 You just got richer! {count} income transaction added.",
    "💰 {count} income(s) saved! Keep stacking that cash!",
    "✨ Cha-ching! Added {count} income transaction(s). You’re on fire 🔥"
  ],
  expense: [
    "💸 {count} expense added. Oof, money flies fast 🕊️",
    "🍔 {count} expense recorded. Hope it was worth it 😅",
    "💳 {count} expense logged. Try not to cry while checking your wallet 😭",
    "🧾 {count} expense(s) added! Budget just got lighter 💨",
    "😬 {count} expense noted. Maybe skip that next coffee? ☕️"
  ],
  unclear: [
    "🤔 I couldn’t tell if that’s income or expense. Please reply 'income' or 'expense'.",
    "😕 That message was a bit confusing. Is it an income or expense?",
    "🧐 Clarify please — should I add it as income or expense?",
    "🙃 Hmm... income or expense?",
    "📊 Need a little help! Reply with 'income' or 'expense' to confirm."
  ]
};

// Instruction image
const INSTRUCTION_IMAGE_URL = "https://i.postimg.cc/hPtXj0z6/Gemini-Generated-Image-bsi726bsi726bsi7.png";

// Helper: Fuzzy correct a word
function correctWord(word, dictionary) {
  let closest = word;
  let minDistance = Infinity;
  for (let dictWord of dictionary) {
    const dist = levenshtein.get(word, dictWord);
    if (dist < minDistance) {
      minDistance = dist;
      closest = dictWord;
    }
  }
  return closest;
}

// Helper: Categorize message
function categorizeMessage(message) {
  message = message.toLowerCase();
  let bestCategory = 'others';
  let maxMatches = 0;
  for (let [category, keywords] of Object.entries(categoryKeywords)) {
    let matches = 0;
    for (let kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(message)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }
  return bestCategory;
}

// Helper: Parse numeric amount
function parseAmount(message) {
  const match = message.match(/(?:₹|rs|r\.s\.|inr)?\s*(\d[\d,]*\.?\d*)/i);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

// Helper: Split message into multiple transactions
function splitTransactions(message) {
  return message
    .split(/\n|,|and/i)
    .map(s => s.trim())
    .filter(Boolean);
}

// Greetings
const greetings = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening'];

// --- Webhook handler ---
router.post('/', bodyParser.urlencoded({ extended: false }), async (req, res) => {
  try {
    const incomingMsg = req.body.Body.trim();
    const from = req.body.From;
    const lowerMsg = incomingMsg.toLowerCase();

    console.log(`[WhatsApp] From: ${from}, Message: ${incomingMsg}`);

    // 1️⃣ Greetings → show instructions + logo (Handles ALL users, including new ones)
    if (greetings.some(greet => lowerMsg.includes(greet))) {
      return res.send(`
        <Response>
          <Message>
            <Body>
🌟 Numen
Track. Understand. Grow.

Here’s what you can do:
- Type 'balance' → Show your total income, expenses & balance
- Type 'summary' → Show a monthly summary
- Type 'last 5' → Show last 5 transactions
- Type 'dashboard' → Get your dashboard link
- Add transactions naturally: "Spent 500 food", "Got 2000 salary"
            </Body>
            <Media>${INSTRUCTION_IMAGE_URL}</Media>
          </Message>
        </Response>
      `);
    }

    // After greetings, all other actions require a registered user.
    const user = await User.findOne({ phone: from.replace('whatsapp:', '') });
    if (!user) {
        return res.send('<Response><Message>Welcome! To get started, please sign up on the Numen website first.</Message></Response>');
    }

    // 2️⃣ Commands
    if (/^balance$/i.test(lowerMsg)) {
      const txs = await Transaction.find({ user: user._id });
      const income = txs.filter(t => t.type === 'income').reduce((a,b) => a + b.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((a,b) => a + b.amount, 0);
      const balance = income - expense;
      return res.send(`<Response><Message>
📊 Balance:
Income: ₹${income.toLocaleString('en-IN')}
Expense: ₹${expense.toLocaleString('en-IN')}
Balance: ₹${balance.toLocaleString('en-IN')}
</Message></Response>`);
    }

    if (/^summary$/i.test(lowerMsg)) {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const txs = await Transaction.find({ user: user._id, date: { $gte: startMonth } });
      const income = txs.filter(t => t.type === 'income').reduce((a,b) => a + b.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((a,b) => a + b.amount, 0);
      const balance = income - expense;
      return res.send(`<Response><Message>
📊 Monthly Summary (${now.toLocaleString('default', { month: 'long' })}):
Income: ₹${income.toLocaleString('en-IN')}
Expense: ₹${expense.toLocaleString('en-IN')}
Balance: ₹${balance.toLocaleString('en-IN')}
</Message></Response>`);
    }

    if (/^last\s?\d*$/i.test(lowerMsg) || /^recent$/i.test(lowerMsg)) {
      const txs = await Transaction.find({ user: user._id }).sort({ date: -1 }).limit(5);
      if (txs.length === 0) {
        return res.send(`<Response><Message>🧾 No recent transactions found.</Message></Response>`);
      }
      const formatted = txs.map(t => `${emojiMap[t.category] || '💰'} ${t.category}: ₹${t.amount.toLocaleString('en-IN')} (${t.type})`).join('\n');
      return res.send(`<Response><Message>🧾 Recent Transactions:\n${formatted}</Message></Response>`);
    }

    if (/dashboard/i.test(lowerMsg)) {
      return res.send(`<Response><Message>🌐 View your dashboard here: https://yourapp.vercel.app/dashboard</Message></Response>`);
    }

    // 3️⃣ Pending clarification
    if (pendingTransactions[from]) {
      const pending = pendingTransactions[from];
      const reply = lowerMsg;
      if (reply === 'income' || reply === 'expense') {
        const savedTransactions = [];
        for (let tx of pending.transactions) {
          const transaction = new Transaction({
            user: user._id,
            type: reply,
            category: tx.category,
            amount: Math.abs(tx.amount),
            date: new Date()
          });
          await transaction.save();
          savedTransactions.push(transaction);
        }
        delete pendingTransactions[from];

        const response = responseTemplates[reply][Math.floor(Math.random() * 5)].replace('{count}', savedTransactions.length);
        return res.send(`<Response><Message>${response}</Message></Response>`);
      } else {
        return res.send(`<Response><Message>${responseTemplates.unclear[Math.floor(Math.random() * 5)]}</Message></Response>`);
      }
    }

    // 4️⃣ Parse new transactions
    const parts = splitTransactions(incomingMsg);
    const transactions = [];

    for (let part of parts) {
      const words = part.split(/\s+/);
      const correctedWords = words.map(w => (isNaN(parseFloat(w)) ? correctWord(w, categoriesDict) : w));
      const correctedMsg = correctedWords.join(' ');
      const category = categorizeMessage(correctedMsg);
      const amount = parseAmount(part);

      let type = null;
      if (incomeKeywords.some(kw => correctedMsg.toLowerCase().includes(kw))) type = 'income';
      else if (expenseKeywords.some(kw => correctedMsg.toLowerCase().includes(kw))) type = 'expense';

      transactions.push({ original: part, category, amount, type });
    }

    // Ask for clarification if unclear
    const unclearTx = transactions.filter(t => !t.type || t.amount === 0);
    if (unclearTx.length > 0) {
      const validForPending = transactions.filter(t => t.amount > 0);
      if(validForPending.length === 0){
        return res.send(`<Response><Message>🤔 I couldn't find an amount in your message. Try something like "spent 500 on food".</Message></Response>`);
      }
      pendingTransactions[from] = { transactions: validForPending };
      const unclearResponse = responseTemplates.unclear[Math.floor(Math.random() * 5)];
      return res.send(`<Response><Message>${unclearResponse}</Message></Response>`);
    }

    // Save valid transactions
    const savedTransactions = [];
    for (let tx of transactions) {
      if (tx.amount > 0) {
        const transaction = new Transaction({
          user: user._id,
          type: tx.type,
          category: tx.category,
          amount: Math.abs(tx.amount),
          date: new Date()
        });
        await transaction.save();
        savedTransactions.push(transaction);
      }
    }
    
    if (savedTransactions.length === 0) {
        return res.send(`<Response><Message>I'm sorry, I couldn't understand that. For help, just say hello!</Message></Response>`);
    }

    const replyType = savedTransactions[0]?.type || 'expense';
    const response = responseTemplates[replyType][Math.floor(Math.random() * 5)]
      .replace('{count}', savedTransactions.length);

    res.send(`<Response><Message>${response}</Message></Response>`);

  } catch (err) {
    console.error(err);
    res.status(500).send('<Response><Message>⚠️ Something went wrong while processing your message.</Message></Response>');
  }
});

module.exports = router;