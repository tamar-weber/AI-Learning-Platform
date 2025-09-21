# AI Learning Platform 🧠
A full-stack learning platform that generates personalized lessons with AI.  
Built with **React**, **Node.js (Express)**, and **MongoDB**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or via Docker)
- OpenAI API key

---

### Setup

#### 1. Clone and install
```bash
git clone [your-repo]
cd ai-learning-platform
2. Backend setup
bash
Copy code
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
3. Database (Docker option)
bash
Copy code
docker-compose up -d
4. Start backend
bash
Copy code
npm run dev
5. Frontend setup (new terminal)
bash
Copy code
cd frontend
npm install
npm start
🔐 Environment Variables
Backend (.env)
env
Copy code
PORT=8000
MONGODB_URI=mongodb+srv://<your-user>:<your-pass>@cluster0.mongodb.net/ai-learning-db
OPENAI_API_KEY=sk-your-api-key
JWT_SECRET=your-secret-key
Frontend (.env.local)
env
Copy code
REACT_APP_API_URL=http://localhost:8000
🚀 Features
User Management – Registration & login with JWT.

AI Integration – Generate lessons dynamically from OpenAI.

Categories & Subcategories – Organized learning structure.

Learning History – Save and view user prompts & responses.

Admin Dashboard – Manage users and view all prompts.

Validation & Error Handling – Clean API responses.

🛠 Tech Stack
Frontend: React 18, React Router, Axios

Backend: Node.js, Express, Mongoose (MongoDB ODM)

Database: MongoDB

AI: OpenAI GPT API

Auth: JWT-based authentication

Environment: dotenv, Docker (optional)

📁 Project Structure
bash
Copy code
ai-learning-platform/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection setup
│   ├── controllers/           # Controllers (business logic)
│   ├── database/
│   │   └── mockDatabase.js    # Mock DB (for testing/demo)
│   ├── models/                # Mongoose models (User, Prompt, History)
│   ├── routes/                # Express routes
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoriesRoutes.js
│   │   ├── historyRoutes.js
│   │   └── lessonRoutes.js
│   ├── services/
│   │   └── aiService.js       # OpenAI service layer
│   ├── .env                   # Local environment variables (not in Git)
│   ├── createAdmin.js         # Script to create default admin
│   ├── setAdmin.js            # Utility for admin setup
│   ├── server.js              # Backend entry point
│   ├── database.sql           # SQL schema (if needed in future)
│   └── package.json
│
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── Navbar.js
│   │   ├── pages/             # Application pages
│   │   │   ├── AdminPage.js
│   │   │   ├── HistoryPage.js
│   │   │   ├── HomePage.js
│   │   │   ├── LearningPage.js
│   │   │   ├── LoginPage.js
│   │   │   └── RegisterPage.js
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   └── reportWebVitals.js
│   └── package.json
│
├── docker-compose.yml         # Docker config (MongoDB, backend, frontend)
├── .gitignore
└── README.md
🧪 Example Usage
A user registers and selects a category (e.g., Science → Space).

They send a prompt: "Teach me about black holes".

The system saves the prompt, queries the AI, and returns a generated lesson.

Later, the user can view their learning history in the dashboard.

👩‍💻 Default Admin Access
For testing and demo purposes, a default admin user is created:

Name: תמר המנהלת

ID Number: 111111111

Use these credentials to log in to the admin dashboard.

🔧 Development Scripts
Backend
bash
Copy code
cd backend
npm run dev        # Run in dev mode
npm run build      # Build for production
npm test           # Run tests
Frontend
bash
Copy code
cd frontend
npm start          # Start dev server
npm run build      # Build for production
npm test           # Run tests
⭐ Future Improvements
Add pagination and filters to the admin dashboard

Swagger/OpenAPI API documentation

Unit & integration tests with Jest

Deployment with Vercel/Netlify/Render

📌 Built for learning and portfolio purposes

