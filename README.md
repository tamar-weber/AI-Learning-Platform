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
│   ├── config/           
│   ├── controllers/      
│   ├── middleware/        
│   ├── models/             
│   │   └── rag/            
│   ├── routes/             
│   ├── tests/              
│   ├── utils/               
│   ├── .env / .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/             
│   │   ├── components/      
│   │   ├── context/          
│   │   ├── hooks/               
│   │   ├── styles/
│   │   ├── utils/
│   │   └── App.js
│   ├── .env / .env.example
│   └── package.json
├── docker-compose.yml
├── package.json
└── README.md
```

## Getting Started

You can run this project locally **without any external accounts** — no Stripe, no OpenAI, no live deployment needed. Both are optional; see [Testing the Demo](#testing-the-demo-reviewer-notes) below.

### Prerequisites
- Node.js 18+
- Docker (recommended - runs MongoDB for you), **or** a local/Atlas MongoDB instance

### Option A: Docker + Node (recommended for reviewers)

```bash
# 1. Start MongoDB (and the backend, if you'd rather not run it manually)
docker-compose up -d

# 2. Backend setup
cd backend
npm install
cp .env.example .env     
npm run seed              
node server.js             

# 3. Frontend setup (separate terminal)
cd frontend
npm install
cp .env.example .env
npm start                    
```

If you used `docker-compose up -d` to start the `backend` service too, you can skip step 2's `node server.js` - it's already running inside the container. `npm install` / `npm run seed` still need to be run locally once (or via `docker exec ai-learning-backend npm run seed`).

### Option B: Node only (no Docker)

Same as above, but you'll need MongoDB running yourself (local install or a free MongoDB Atlas cluster) and `MONGODB_URI` in `backend/.env` pointed at it.

## Environment Variables

### `backend/.env`

| Variable | Required? | Description |
|---|---|---|
| `PORT` | No (defaults to 8000) | Server port |
| `NODE_ENV` | No | `development` / `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens (any string works locally) |
| `OPENAI_API_KEY` | **No** | Leave empty to run with a fallback chat response instead of real OpenAI calls |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | **No** | Leave both empty to enable local fake-payment mode (see below) |
| `EMAIL_USER` / `EMAIL_PASS` | No | Leave empty to skip sending real emails (failures are just logged) |
| `FRONTEND_URL` | No | Used to build links in emails and Stripe redirects |

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

## Testing the Demo (Reviewer Notes)

### Admin login

The seed script (`npm run seed`) creates a ready-to-use admin account:

```
Email:    admin@example.com
Password: Admin12345
```

Log in with these credentials to access:
- Admin dashboard with KPIs (users, revenue, enrollments, popular courses)
- Course management (create/edit/delete courses, send course update emails)
- Notification & messaging center (send to all users / a course's enrollees / a category / a single user)
- User activity log

### Payments — works with zero setup

If `STRIPE_SECRET_KEY` is left empty in `.env` (the default), clicking **"Enroll"** on a course instantly creates the enrollment locally — no real payment, no Stripe account, no webhook needed. This uses the exact same enrollment-creation code path as a real payment, so the feature is fully testable end-to-end.

If you *do* want to test against real Stripe Checkout, fill in `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` and forward webhook events locally:

```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

Then use one of Stripe's test cards, e.g. `4242 4242 4242 4242` (any future expiry, any 3-digit CVC).

### AI chat assistant — works with zero setup

If `OPENAI_API_KEY` is left empty (the default), the chat assistant returns a friendly fallback response instead of calling OpenAI, so the chat UI (button, modal, loading/error states) is fully visible and testable without an API key. Fill in a real key to see actual AI-generated answers based on the site's content.



---

*This project was built as a learning project, demonstrating a full SaaS build: authentication, payments, AI integration, and admin tooling.*
