# Deployment Guide

This application consists of a React frontend and a Python Flask backend. For Netlify deployment, we'll deploy the frontend to Netlify and the backend to Render (free tier).

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Netlify       │ ──────► │   Render.com     │
│  (Frontend)     │   API   │   (Backend)      │
│  Static Site    │         │   Flask API      │
└─────────────────┘         └──────────────────┘
```

## Step 1: Deploy Backend to Render

### Option A: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and deploy the backend

### Option B: Manual Setup

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `quotation-backend` (or your preferred name)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
6. Click "Create Web Service"

### Environment Variables (Backend)

Set these in Render Dashboard → Your Service → Environment:

```
CORS_ORIGINS=https://your-netlify-site.netlify.app,https://your-custom-domain.com
```

**Note**: Update `CORS_ORIGINS` with your actual Netlify URL after deploying the frontend.

## Step 2: Deploy Frontend to Netlify

### Option A: Using Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   cd /mnt/okcomputer/output/app
   netlify init
   # Follow the prompts
   ```

### Option B: Using Netlify Dashboard

1. Push your code to GitHub
2. Go to [Netlify Dashboard](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Environment Variables (Frontend)

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-name.onrender.com/api
```

**Note**: Use the URL from your deployed Render backend.

## Step 3: Update CORS (After Both Deployments)

1. Copy your Netlify site URL (e.g., `https://quotation-app-123.netlify.app`)
2. Go to Render Dashboard → Your Backend → Environment
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://quotation-app-123.netlify.app
   ```
4. The backend will restart automatically

## Local Development

### Start Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Backend runs on http://localhost:5000
```

### Start Frontend
```bash
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Environment for Local Development
Create `.env` file in project root:
```
VITE_API_URL=http://localhost:5000/api
```

## File Structure

```
app/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # Temp upload folder
│   └── outputs/            # Generated Excel files
├── src/                    # React source code
├── dist/                   # Built frontend (Netlify serves this)
├── netlify.toml            # Netlify configuration
├── render.yaml             # Render configuration
├── Procfile                # Alternative Render config
└── package.json            # Node dependencies
```

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Check that `CORS_ORIGINS` in Render matches your Netlify URL exactly
2. Make sure there are no trailing slashes
3. Include `https://` prefix

### API Not Found (404)
If API calls return 404:
1. Verify `VITE_API_URL` is set correctly in Netlify
2. Check that the backend is running on Render
3. Test the backend directly: `https://your-backend.onrender.com/api/health`

### Build Failures
If Netlify build fails:
1. Check that `NODE_VERSION` is set to 18 or higher
2. Verify `dist` folder is created during build
3. Check build logs for errors

## Custom Domain (Optional)

### Netlify Custom Domain
1. Go to Netlify Dashboard → Domain Settings
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### Render Custom Domain
1. Go to Render Dashboard → Your Service → Settings
2. Add your custom domain
3. Update SSL certificate

## Important Notes

1. **Free Tier Limits**:
   - Render: Web services sleep after 15 min of inactivity (cold start ~30s)
   - Netlify: 100GB bandwidth/month, 300 build minutes/month

2. **File Uploads**: Temporary files are stored on Render's ephemeral filesystem and cleared on restart

3. **Security**: Never commit `.env` files with real credentials to GitHub
