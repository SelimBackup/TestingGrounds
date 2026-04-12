# Netlify Deployment - Quick Start

## What Was Set Up

### 1. Frontend (Netlify)
- ✅ `netlify.toml` - Netlify configuration with build settings
- ✅ Environment variable support via `VITE_API_URL`
- ✅ SPA redirect rules configured

### 2. Backend (Render.com)
- ✅ `render.yaml` - Render Blueprint configuration
- ✅ `Procfile` - Alternative deployment method
- ✅ `requirements.txt` - Python dependencies
- ✅ CORS configured for cross-origin requests

### 3. Environment Configuration
- ✅ `.env.example` - Template for local development
- ✅ `CORS_ORIGINS` support for production

## Deployment Steps

### Step 1: Push to GitHub
```bash
cd /mnt/okcomputer/output/app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/quotation-generator.git
git push -u origin main
```

### Step 2: Deploy Backend (Render.com)

**Option A: Blueprint (Automatic)**
1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`

**Option B: Manual**
1. Go to https://dashboard.render.com/
2. New + → Web Service
3. Connect GitHub repo
4. Settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
5. Add Environment Variable:
   - `CORS_ORIGINS=*` (temporary, update after frontend deploy)

**Get your backend URL**: `https://your-service-name.onrender.com`

### Step 3: Deploy Frontend (Netlify)

**Option A: Netlify Dashboard**
1. Go to https://app.netlify.com/
2. "Add new site" → "Import from Git"
3. Connect GitHub repo
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
6. Deploy

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts
```

### Step 4: Update CORS

1. Copy your Netlify URL (e.g., `https://quotation-abc123.netlify.app`)
2. Go to Render Dashboard → Your Service → Environment
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://quotation-abc123.netlify.app
   ```
4. Service will auto-restart

## File Structure for Deployment

```
app/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt    # Python deps
│   ├── uploads/            # Temp storage
│   └── outputs/            # Excel output
├── src/                    # React frontend
├── dist/                   # Built frontend → Netlify
├── netlify.toml            # Netlify config
├── render.yaml             # Render config
├── Procfile                # Render alternative
├── package.json            # Node deps
└── .env.example            # Env template
```

## Environment Variables

### Frontend (Netlify)
| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | Yes |

### Backend (Render)
| Variable | Value | Required |
|----------|-------|----------|
| `CORS_ORIGINS` | `https://your-frontend.netlify.app` | Yes |
| `PYTHON_VERSION` | `3.11.0` | No |

## Local Development

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
python app.py

# Terminal 2 - Frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/extract` | POST | Extract data from PPTX/PDF |
| `/api/generate` | POST | Generate Excel quotation |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Update `CORS_ORIGINS` in Render with exact Netlify URL |
| 404 on API | Check `VITE_API_URL` ends with `/api` |
| Build fails | Set `NODE_VERSION=18` in Netlify |
| Backend sleeps | Normal on free tier, wakes on first request (~30s) |

## Free Tier Limits

- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **Render**: Web service sleeps after 15min inactivity

## Need Help?

- Netlify Docs: https://docs.netlify.com/
- Render Docs: https://render.com/docs
