# Getting Started with AI Learning Platform – Frontend 🎨

This project was bootstrapped with **Create React App** and serves as the **user interface** for the AI Learning Platform.  
It allows users to register, choose learning categories and subcategories, send prompts to the AI, and view their personal learning history.

---

## Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.  
The page will reload if you make edits.  
You will also see any lint errors in the console.

---

### `npm test`
Launches the test runner in interactive watch mode.  
Useful for verifying components and app behavior.

---

### `npm run build`
Builds the app for production into the `build` folder.  
It correctly bundles React in production mode and optimizes the build for the best performance.  
The build is minified, and the filenames include hashes.

Your app is ready to be deployed!

---

### `npm run eject`
⚠️ Note: this is a one-way operation. Once you eject, you can’t go back!  
All configuration files (Webpack, Babel, ESLint, etc.) will be copied into your project for full control.

You don’t need to use eject for most cases – the default setup works well for development and deployment.

---

## Environment Variables

Create a `.env.local` file in the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000
This tells the React app where to find the backend API.

Learn More
To learn React: React documentation

To learn Create React App: CRA documentation

💡 Technology Choices
Frontend: React + JavaScript

UI Library: Basic React components (extendable with MUI or Tailwind)

State Management: React Hooks & Context (lightweight solution for this project)

API Communication: Axios for REST API calls

Project Structure: Feature-based with pages, components, and API helpers

This frontend was designed to integrate seamlessly with the backend (Node.js + Express + PostgreSQL) of the AI Learning Platform.

