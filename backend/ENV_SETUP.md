# Environment Setup Guide

## Quick Setup

1. **Create a `.env` file** in the `backend/` directory
2. **Copy the configuration below** and adjust as needed

## Configuration Options

### Option 1: Local MongoDB (Recommended for Development)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartparking
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**To use this option:**
- Install MongoDB locally: https://www.mongodb.com/try/download/community
- Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

### Option 2: MongoDB Atlas (Cloud)

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartparking?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**To use this option:**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string from "Connect" → "Connect your application"
4. Replace `username` and `password` with your database user credentials
5. **IMPORTANT**: Add your IP address to the Network Access whitelist:
   - Go to "Network Access" in MongoDB Atlas
   - Click "Add IP Address"
   - Add your current IP (or use `0.0.0.0/0` for development - NOT recommended for production)

## Troubleshooting Connection Errors

### Error: `getaddrinfo EAI_AGAIN` or `ReplicaSetNoPrimary`

**Causes:**
1. **Network/DNS issue**: Can't resolve MongoDB hostname
2. **IP not whitelisted**: Your IP isn't in MongoDB Atlas whitelist
3. **Wrong connection string**: Connection string format is incorrect
4. **MongoDB not running**: Local MongoDB service isn't started

**Solutions:**
1. **For MongoDB Atlas:**
   - Check Network Access in Atlas dashboard
   - Add your current IP address
   - Verify connection string format
   - Check internet connection

2. **For Local MongoDB:**
   - Ensure MongoDB service is running: `mongod` or check services
   - Verify MongoDB is on port 27017
   - Check firewall settings

3. **Test Connection:**
   ```bash
   # Test local MongoDB
   mongosh mongodb://localhost:27017/smartparking
   
   # Or test Atlas connection string directly
   mongosh "your-connection-string"
   ```

## Quick Start (Local MongoDB)

1. Install MongoDB locally or use Docker
2. Create `.env` file with local MongoDB URI
3. Run `npm start` in backend directory

## Quick Start (MongoDB Atlas)

1. Create MongoDB Atlas account
2. Create cluster and database user
3. Add your IP to Network Access
4. Copy connection string to `.env` file
5. Run `npm start` in backend directory

