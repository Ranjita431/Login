# AuthFlow — Full-Stack Authentication System

A full-stack authentication application built with **React, Vite, FastAPI, and PostgreSQL**. It provides email/password authentication, email verification, Google sign-in, password recovery, and token-based session management.

## Features

### Authentication
- User registration with email and password
- Email verification
- Email/password login
- Google OAuth sign-in
- JWT access and refresh tokens
- HTTP-only cookies for authentication
- Refresh-token rotation and logout

### Password Recovery
- Forgot-password workflow
- Email-based password-reset codes
- Reset-code expiration and validation
- Password reset with the new password

### Backend
- FastAPI REST API
- SQLAlchemy ORM
- PostgreSQL database
- Alembic database migrations
- Password hashing
- SMTP email delivery using `aiosmtplib`
- Environment-based configuration
- Request logging
- Rate limiting
- CORS configuration

### Frontend
- React and Vite
- Separate pages, components, hooks, and services
- Login and registration forms
- Google sign-in integration
- Email verification
- Forgot-password and reset-password screens
- Authentication state and session restoration
- Form validation and error handling

## Technologies

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development and build tooling |
| FastAPI | Backend API |
| Python | Backend programming language |
| SQLAlchemy | Database ORM |
| PostgreSQL | Relational database |
| Alembic | Database migrations |
| JWT | Access and refresh tokens |
| `uv` | Python dependency and environment management |
| `aiosmtplib` | SMTP email delivery |
| Google OAuth | Google authentication |

## Project Structure

```text
Project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── datamodels/
│   │   ├── db/
│   │   ├── models/
│   │   ├── router/
│   │   ├── services/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   ├── logs/
│   ├── scripts/
│   ├── .env.example
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── uv.lock
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Prerequisites

- Python version supported by the backend project
- Node.js and npm
- PostgreSQL
- `uv`
- Google OAuth credentials if Google sign-in is required
- SMTP credentials for email delivery

## Configuration

### Backend

1. Open a terminal in the `backend` directory.
2. Create a local `.env` file by copying `.env.example`.
3. Configure the PostgreSQL connection, JWT settings, frontend URL, Google OAuth client ID, and SMTP settings using the variable names defined in `.env.example`.
4. Install dependencies using `uv sync`.

Never commit real credentials or secrets to Git.

### Frontend

Install the frontend dependencies:

```powershell
cd frontend
npm install
```

Configure any frontend environment variables required by the application before running it.

## Running the Application

### Start the backend

From the project root:

```powershell
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Start the frontend

Open a second terminal:

```powershell
cd frontend
npm run dev
```

Vite typically serves the frontend at `http://localhost:5173`.

Ensure PostgreSQL is running and the backend configuration matches your local environment.

## Database Migrations

Apply migrations:

```powershell
cd backend
uv run alembic upgrade head
```

Check whether model changes require new migrations:

```powershell
uv run alembic check
```

## Testing

Run the backend tests:

```powershell
cd backend
uv run pytest
```

Run the frontend production build and lint checks:

```powershell
cd frontend
npm run build
npm run lint
```

## Security Notes

- Keep `.env` and real credentials out of version control.
- Use HTTPS and secure cookie settings in production.
- Keep access tokens short-lived and validate refresh tokens.
- Configure allowed CORS origins for the deployment environment.
- Protect Google OAuth and SMTP credentials.
- Review production database permissions and logging configuration before deployment.

## Development Status

The application includes email/password authentication, email verification, Google sign-in, password recovery, JWT-based session management, and database migration support.

This project is intended for development and evaluation. Production deployment requires environment-specific security configuration and review.
