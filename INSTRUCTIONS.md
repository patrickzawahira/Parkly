# Parkly - Smart Parking Assistant Instructions

Welcome to Parkly! This guide will help you set up and run the application.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed.
- **MongoDB**: You need a running MongoDB instance. You can use:
  - **Local MongoDB**: [Download Community Edition](https://www.mongodb.com/try/download/community)
  - **MongoDB Atlas**: [Cloud Database](https://www.mongodb.com/cloud/atlas)

## Setup

### 1. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` directory. You can copy the configuration from `backend/ENV_SETUP.md`.
    
    **Example `.env` content:**
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/smartparking
    JWT_SECRET=your_jwt_secret_key
    ```
    *(See `backend/ENV_SETUP.md` for more details on MongoDB Atlas setup)*

### 2. Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory with your API key:
    ```env
    VITE_API_KEY=your_google_genai_api_key
    ```

## Running the Application

You can run the backend and frontend separately or together from the root directory.

### Option A: Run All (Recommended)

From the **root** directory of the project:

```bash
npm install # Install root dependencies if you haven't already
npm run dev:all
```

This command uses `concurrently` to start both the backend and frontend servers.

### Option B: Run Separately

**Backend:**
```bash
cd backend
npm run dev
```
*Server will start on http://localhost:5000*

**Frontend:**
```bash
cd frontend
npm run dev
```
*App will start on http://localhost:5173 (or similar)*

## Troubleshooting

- **MongoDB Connection Error**: Ensure your MongoDB service is running or your Atlas IP whitelist includes your current IP.
- **Module Not Found**: Make sure you ran `npm install` in both `backend` and `frontend` directories.
