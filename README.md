# 🚀 NumenTracker (Backend)

Backend service powering the Numen personal finance tracker — a WhatsApp-connected system that logs daily user transactions, analyzes spending behavior with NLP, and visualizes insights through a connected dashboard.

---

## 🌍 Live Dashboard
**Frontend:** [numen-tracker-frontend.vercel.app](https://numen-tracker-frontend.vercel.app)

---

## ⚡ Key Features
- 📲 **Twilio WhatsApp Integration** — Receive and process user messages directly from WhatsApp.  
- 🧠 **spaCy NLP Engine** — Extract structured transaction data from text like _"Spent ₹250 for lunch"_.  
- 💸 **Automated Financial Tracking** — Log income, expenses, and daily balances.  
- 📊 **Analytics-Ready Data** — Feed transaction data to the frontend dashboard for graphs and visual insights.  
- 🗄️ **MongoDB Storage** — Store user profiles and transactions securely.  
- ⚙️ **Express REST API** — Modular routes, clean controllers, and middleware-driven validation.  
- 🔐 **Environment Config** — Flexible `.env` support for secure deployment.  

---

## 🧠 Architecture Overview

```
User (WhatsApp)
     ↓
Twilio API → Express Webhook (/webhook)
     ↓
spaCy NLP Processor → MongoDB (transactions)
     ↓
REST API → Next.js Frontend (on Vercel)
```

---

## 💬 WhatsApp Integration (via Twilio)

**Workflow:**  
1. User sends message → Twilio forwards it to the Express webhook.  
2. The message text is processed by the NLP module.  
3. Extracted transaction data is saved to MongoDB.  
4. A confirmation message or summary is sent back via Twilio API.  

**Example Incoming Payload:**
```json
{
  "From": "+97150000000",
  "Body": "Added ₹5000 salary"
}
```

**Example Parsed Output:**
```json
{
  "type": "income",
  "category": "salary",
  "amount": 5000,
  "source": "whatsapp",
  "date": "2025-11-02"
}
```

---

## 🧩 NLP with spaCy

NumenTracker uses **spaCy** for entity recognition and intent extraction to interpret financial text messages.

**Example NLP pipeline:**
- Tokenize input message  
- Detect amount (₹/Rs/$ pattern)  
- Detect category keywords (e.g., food, rent, travel)  
- Infer transaction type (income/expense)  
- Store result in MongoDB  

---

## 🗄️ Data Flow

```
[WhatsApp Message] 
      ↓
[Twilio Webhook] 
      ↓
[NLP Processing (spaCy)]
      ↓
[MongoDB Transaction Storage]
      ↓
[REST API Responses]
      ↓
[Next.js Dashboard Visualization]
```

---

## ⚙️ Setup & Installation

```bash
git clone https://github.com/failasbasheer/NumenTracker.git
cd NumenTracker
npm install
```

### Create `.env` file
```
PORT=5000
MONGO_URI=mongodb+srv://<your-uri>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-whatsapp-number>
NLP_MODEL_PATH=<path-to-spacy-model>
```

### Run the app
```bash
npm run dev   # for development
npm start     # for production
```

---

## 📁 Folder Structure
```
NumenTracker/
│
├── config/          # Database & environment setup
├── controllers/     # Business logic for transactions & messages
├── middleware/      # Auth, error handling, request validation
├── models/          # MongoDB models (User, Transaction)
├── routes/          # Express route definitions
├── utils/           # NLP processing and helper functions
├── server.js        # Entry point
└── package.json     # Dependencies & scripts
```

---

## 🚀 Deployment

Recommended platforms:
- **Render / Railway** — for backend hosting  
- **Vercel** — for frontend (already live)  
- **MongoDB Atlas** — for managed database hosting  

Ensure environment variables are configured in your deployment dashboard.

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|-------|-------------|
| Language | JavaScript (ES6+) |
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| Messaging API | Twilio WhatsApp API |
| NLP | spaCy |
| Hosting | Render / Railway / Vercel |

---

## 🤝 Contributing

1. Fork the repository  
2. Create a feature branch: `git checkout -b feature/<feature-name>`  
3. Commit changes: `git commit -m "Added new feature"`  
4. Push: `git push origin feature/<feature-name>`  
5. Submit a Pull Request  

---

## 📜 License

MIT License © 2025 [Failas Basheer](https://github.com/failasbasheer)
