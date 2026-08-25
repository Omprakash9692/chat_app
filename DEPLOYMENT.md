# 🚀 Production Deployment Guide

This guide provides step-by-step instructions for deploying the **ChitChat** full-stack web application.

---

## 1. Deploying Backend to Render / Railway

### Step 1: Create a New Web Service
1. Sign in to [Render](https://render.com) or [Railway](https://railway.app).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`chat_app`).
4. Select the **Root Directory** as `backend`.

### Step 2: Configure Service Settings
- **Name**: `chitchat-backend` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` (or `node server.js`)

### Step 3: Configure Environment Variables
In the Render dashboard under **Environment**:
Add the following keys (refer to `backend/.env.example`):
- `MONGO_URI`: `mongodb+srv://...`
- `JWT_SECRET`: `your_jwt_secret`
- `CLIENT_URL`: `https://your-frontend.vercel.app`
- `CLOUDINARY_CLOUD_NAME`: `your_cloud_name`
- `CLOUDINARY_API_KEY`: `your_api_key`
- `CLOUDINARY_API_SECRET`: `your_api_secret`
- `BREVO_API_KEY`: `your_brevo_api_key`
- `BREVO_SENDER_EMAIL`: `your_sender_email`

> 💡 **Note**: Render will automatically assign a `PORT` variable. The server will bind to `0.0.0.0:${PORT}` automatically.

---

## 2. Deploying Frontend to Vercel

### Step 1: Import Project to Vercel
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your `chat_app` repository.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend` (Click Edit and select the `frontend` folder if prompted)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variables
Under **Environment Variables**, add:
- `VITE_API_URL`: `https://chitchat-backend.onrender.com` (Your deployed Render backend URL **without** trailing slash)

### Step 4: Deploy
Click **Deploy**. Vercel will build the frontend and generate your production URL (e.g. `https://chitchat-frontend.vercel.app`).

---

## 3. Post-Deployment Verification

1. **Verify Backend Health**: Visit `https://your-backend.onrender.com/health` in your browser. It should return `{"status": "OK", ...}`.
2. **Verify Frontend**: Open your deployed Vercel URL.
3. Test authentication (Register/Login), real-time messaging via Socket.io, image uploads, and page refreshes on sub-routes.
