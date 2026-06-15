# FairSplit — Expense Splitting Platform with Anomaly Detection

FairSplit is a full-stack shared expense management application with CSV import, real-time anomaly detection, interactive dashboard charts (personal vs. group expenses), and settlement tracking.

---

## Tech Stack
- **Backend**: Django, Django REST Framework (DRF), SimpleJWT (Auth), SQLite (Database)
- **Frontend**: Vite + React + TypeScript, Tailwind CSS, shadcn/ui, Recharts (Charts)

---

## Directory Structure
```
FairSplit/
├── backend/            # Django project
│   ├── config/         # Settings and routing configuration
│   ├── core/           # Main Django app (models, views, anomaly detection)
│   ├── db.sqlite3      # Local SQLite database
│   ├── manage.py       # Django CLI manager
│   └── venv/           # Python virtual environment
├── frontend/
│   └── FairSplit/      # Vite React app (moved from fairsplit-frontend/)
│       ├── src/        # React sources (App, pages, context, hooks, etc.)
│       ├── package.json
│       ├── vite.config.ts
│       └── ...
└── README.md           # This file
```

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18 or higher (along with npm)

---

### Backend Setup (Django)

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Activate the Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS / Linux (Bash/Zsh)**:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   If a `requirements.txt` is not provided, you can install the necessary packages using:
   ```bash
   pip install django djangorestframework django-cors-headers djangorestframework-simplejwt requests
   ```

4. **Apply Database Migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Start the Django Development Server**:
   ```bash
   python manage.py runserver
   ```
   The backend API will run on `http://localhost:8000/`.

---

### Frontend Setup (Vite + React)

1. **Navigate to the Frontend Directory**:
   ```bash
   cd frontend/FairSplit
   ```

2. **Install npm Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will boot up and run on `http://localhost:5173/` (or `http://localhost:5174/` if the default port is in use).

---

## API Endpoints and Proxy Config

The Vite application contains a configuration to proxy `/api` requests automatically to the backend running at `http://localhost:8000/`. 

### Key APIs
- **Authentication**: `/api/token/` (JWT token obtain), `/api/token/refresh/` (token refresh)
- **Imports**: `/api/imports/upload/` (CSV uploading), `/api/imports/{id}/anomalies/` (retrieve anomalies)
- **Resolutions**: `/api/anomalies/{id}/resolve/` (resolve a specific anomaly)
- **Dashboard Data**: `/api/dashboard/`

---

## Deployment on Vercel (Frontend) & Render (Backend + Database)

Follow this step-by-step guide to host the entire FairSplit application for free using **Vercel** for the frontend, **Render Web Services** for the backend, and **Render Postgres** for the database.

### Step 1: Create a Render PostgreSQL Database

1. Log in to your **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** and select **PostgreSQL**.
3. Fill in the **Name** (e.g., `fairsplit-db`) and click **Create Database**.
4. Once created, copy the **Internal Database URL** (which starts with `postgres://...`). You will use this in the next step to connect the backend.

---

### Step 2: Deploy Backend to Render (Free Web Service)

1. In the **Render Dashboard**, click **New +** and select **Web Service**.
2. Connect the Git repository containing your FairSplit code.
3. Configure the following service settings:
   - **Name**: `fairsplit-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `gunicorn config.wsgi --bind 0.0.0.0:$PORT`
   - **Instance Type**: Select the **Free** tier.
4. Add the following **Environment Variables** in the service settings:
   - `DATABASE_URL`: *(Paste the **Internal Database URL** copied from Step 1)*
   - `SECRET_KEY`: *(Generate a random secure string, e.g. using an online tool or type a secure key)*
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*`
5. Click **Deploy Web Service**. Render will install requirements, run migrations on your Postgres DB, and start the Gunicorn server.
6. Once deployed, copy your Web Service URL (e.g. `https://fairsplit-backend.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Log in to your **[Vercel Dashboard](https://vercel.com)**.
2. Click **Add New** and select **Project**.
3. Import the Git repository containing your FairSplit code.
4. In the Project Configuration settings:
   - **Framework Preset**: Select **Vite** (Vercel should auto-detect this).
   - **Root Directory**: Click *Edit* and select `frontend/FairSplit`.
   - **Build and Development Settings**: Keep defaults (Vercel will run `npm run build` and publish `dist` automatically).
5. Open the **Environment Variables** accordion and add:
   - **Key**: `VITE_API_URL`
   - **Value**: *(Paste your Render backend Web Service URL from Step 2, e.g. `https://fairsplit-backend.onrender.com`)*
6. Click **Deploy**. Vercel will build and host your frontend static application on a global, fast CDN for free!


