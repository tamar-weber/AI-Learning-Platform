# AI Learning Platform (Mini MVP)

This is a mini learning platform that allows users to select a topic, receive AI-generated lessons, and view their learning history. This project was built as a programming task.

## Technologies Used

*   **Backend:** Node.js, Express.js
*   **Frontend:** React
*   **Database:** PostgreSQL (running on Docker)
*   **AI Integration:** OpenAI GPT API (or a mocked version)

## Features

*   User registration.
*   Topic selection (Category and Sub-category).
*   AI lesson generation.
*   User learning history.
*   Admin dashboard to view all users and prompts.

## Setup and Installation

Follow these steps to run the project locally.

### Prerequisites

*   Node.js (v16 or higher)
*   npm
*   Docker Desktop

### 1. Clone the Repository

```bash
git clone https://github.com/tamar-weber/AI-Learning-Platform.git
cd ai-learning-platform
```

### 2. Start the Database

Make sure Docker Desktop is running, then run:

```bash
docker-compose up -d
```

### 3. Setup Backend

```bash
cd backend
npm install

# Create the database tables by running the SQL script
# (You might need a tool like DBeaver or run psql command)

npm start
```
The backend will run on `http://localhost:8000`.

### 4. Setup Frontend

```bash
cd ../frontend
npm install
npm start
```
The frontend will run on `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
# Database Configuration
DB_USER=myuser
DB_HOST=localhost
DB_DATABASE=learning_platform
DB_PASSWORD=mypassword
DB_PORT=5432

# AI Configuration
OPENAI_API_KEY=sk-your-key-here (optional, will use mock if not provided)
```

