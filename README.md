# Parkly

Parkly is a smart parking assistant application. It consists of a React frontend built with Vite and a Node.js/Express backend.

## Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)

## Project Structure
- `frontend/`: The React application
- `backend/`: The Node.js Express server

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

Make sure you have an `.env` file in the `backend` directory with the necessary environment variables (e.g., database connection strings, API keys). If there is an `.env.example` file, copy it to `.env` and fill in the values.

Start the backend development server:

```bash
npm run dev
```

The backend server should now be running (usually on `http://localhost:5000` or whatever port is configured).

### 2. Frontend Setup

Open **a new terminal window/tab**, and navigate to the `frontend` directory from the root of the project:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend should now be running, and Vite will display the local URL in the terminal (typically `http://localhost:5173`). Open that URL in your browser to view the application!

## Available Scripts

### Frontend
- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds the app for production.
- `npm run preview` - Locally preview the production build.

### Backend
- `npm run dev` - Starts the development server using nodemon.
- `npm start` - Starts the server normally.
- `npm run seed` - Runs the script to seed the database with simulated data.
- `npm test` - Runs backend tests.
