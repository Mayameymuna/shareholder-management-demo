# 🏦 Shareholder Management System (SMS)

An enterprise-grade equity management platform built to handle high-stakes shareholder data with precision and security.

## 🛡️ Financial Governance Features
- **Maker-Checker Protocol:** Every transaction (Registration, Transfer, Allotment) requires a dual-stage authorization workflow.
- **Compliance Staging:** Automated handling of the regulatory cutoff, managing capital in escrow/staging environments.
- **Bilingual Certificate Engine:** Dynamic PDF/Document generation in Amharic, Afaan Oromo, and English.
- **Audit Logging:** Every system change is stamped with a User ID and Timestamp for internal audit.
- **Balanced Scorecard (BSC):** Real-time performance tracking for staff against sales targets.

## 💻 Tech Stack
- **Frontend:** React.js + Tailwind CSS + Lucide Icons + Recharts
- **Backend:** Node.js (Express) + JWT Auth + Multer (KYC Handling)
- **Database:** MySQL (Relational schema focused on data integrity)

## 🛠️ Installation & Setup
1. **Database:** Import `backend/database_schema.sql` into your local MySQL.
2. **Backend:**
   - Go to `/backend`, run `npm install`.
   - Create a `.env` file (see `.env.example`).
   - Run `npm start`.
3. **Frontend:**
   - Go to `/frontend`, run `npm install`.
   - Create a `.env` file with `REACT_APP_API_URL`.
   - Run `npm start`.

---
