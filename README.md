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
