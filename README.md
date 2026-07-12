# AI Learning Platform

A full-stack AI-powered learning platform with course management, payments, a unified notification system, and an AI-powered RAG chat assistant.

🔗 **Live demo (Render):** _[link coming soon]_

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing & Code Quality](#testing--code-quality)
- [Stripe Webhook (Local Dev)](#stripe-webhook-local-dev)
- [Testing the Demo (Reviewer Notes)](#testing-the-demo-reviewer-notes)

---

## Overview

A full **MERN** stack application (MongoDB, Express, React, Node.js) featuring secure authentication, course management, real Stripe payments, a unified notification system, and a RAG-based chat assistant that answers user questions using the platform's own content.

## Key Features

### Users
- Registration & login with hashed passwords (bcrypt) and JWT authentication
- "Forgot password" flow with a hashed, single-use, time-limited reset token
- Profile editing (name, phone, email)
- Automatic welcome email on signup

### Courses & Payments
- Course management (admin) with categories and subcategories
- Real-time course search with server-side pagination
- Course enrollment and secure payment via **Stripe Checkout**
- Enrollment is created **only** from a verified Stripe webhook (never from the client), with idempotency protection against duplicate payments
- Personal purchase history

### Notifications & Messaging
- Unified notification system (bell icon, unread count, mark as read)
- Admin messaging center (send to all users / a specific course's enrollees / a category / a single user)
- Email updates to enrolled users on course changes

### AI Chat Assistant (RAG)
- Support chat that answers based on the platform's own content (courses, categories, FAQ)
- Similarity search with a defined relevance threshold and a fallback response when no good match is found
- Rate limiting on OpenAI API calls

### Admin
- Dashboard with KPIs (users, revenue, enrollments, popular courses, etc.)
- User activity audit log

## Tech Stack

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt, Stripe, OpenAI API, Nodemailer, Jest + Supertest

**Frontend:** React (Create React App), React Router, Axios

**Code quality:** ESLint, Prettier

**Infra:** Docker Compose (optional, for local development)

## Project Structure

```
AI-Learning-Platform/
├── backend/
│   ├── config/           # Centralized configuration (env vars)
│   ├── controllers/       # Request handlers - delegate to services
│   ├── middleware/         # Mongoose models & JWT auth middleware
│   ├── models/             # Business logic (services)
│   │   └── rag/             # RAG modules (OpenAI client, text utils)
│   ├── routes/             # API route definitions
│   ├── tests/               # Jest test suites
│   ├── utils/               # Shared helper functions
│   ├── .env / .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/              # Centralized API calls (axios)
│   │   ├── components/        # React components
│   │   ├── context/            # AuthContext
│   │   ├── hooks/               # Custom hooks (e.g. search debounce)
│   │   ├── styles/
│   │   ├── utils/
│   │   └── App.js
│   ├── .env / .env.example
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (or local MongoDB)
- API keys: Stripe, OpenAI

### Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in real values
node server.js            # runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start                  # runs on http://localhost:3000
```

## Environment Variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default 8000) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `OPENAI_API_KEY` | OpenAI key (for the RAG chat assistant) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Secret used to verify Stripe webhook signatures |
| `FRONTEND_URL` | Frontend URL (used to build links in emails and Stripe redirects) |

### `frontend/.env`

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend API base URL |

## Testing & Code Quality

Run from inside the `backend/` directory:

```bash
npm test          # runs the Jest test suite
npm run lint       # checks code quality (ESLint)
npm run format     # auto-formats code (Prettier)
```

## Stripe Webhook (Local Dev)

To test payments locally, forward Stripe events with the Stripe CLI:

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

Copy the generated webhook signing secret into `STRIPE_WEBHOOK_SECRET` in your `.env`.

## Testing the Demo (Reviewer Notes)

### Payments (Stripe test mode)

This project uses **Stripe test mode** — no real money is charged. When you reach the checkout page, use one of Stripe's official test card numbers:

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |

For any test card: any future expiry date, any 3-digit CVC, and any postal code.

⚠️ **Important:** for a payment to actually complete and create an enrollment, the Stripe webhook must be able to reach the backend. If you're testing locally, run this in a separate terminal **before** completing a checkout:

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

Without this running, the payment will succeed on Stripe's side, but the enrollment won't be created (this is intentional — see [Key Features](#key-features): enrollment is only created from a verified webhook, never from the client, to prevent payment spoofing).

### Viewing the Admin Side

To review the admin features (dashboard, course management, messaging center, etc.), create an admin user with:

```bash
cd backend
node setAdmin.js --email admin@example.com --password YourPassword123
```

Then log in with that email/password. The admin account will have access to:
- Admin dashboard with KPIs (users, revenue, enrollments, popular courses)
- Course management (create/edit/delete courses, send course update emails)
- Notification & messaging center (send to all users / a course's enrollees / a category / a single user)
- User activity log


---

*This project was built as a learning project, demonstrating a full SaaS build: authentication, payments, AI integration, and admin tooling.*
