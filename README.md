# Login Authentication System

A full-stack authentication system built with **React** and **FastAPI**, providing secure user registration, login, Google authentication, and email-based password recovery.

---

## Overview

This project demonstrates a complete authentication workflow with a modern React frontend and a FastAPI backend.

Users can create an account using their email and password, sign in with Google, and securely recover their password through a time-limited email verification code.

The application uses SQLite for data persistence and SMTP for sending password-reset emails.

---

## Features

### Authentication

- User registration with email and password
- Email/password login
- Google OAuth authentication
- Password visibility toggle
- Authentication error handling

### Password Recovery

- Forgot-password workflow
- Email-based password reset codes
- Time-limited reset codes
- One-time-use reset codes
- Password reset functionality
- Reset-code validation and expiration handling

### Backend

- REST API built with FastAPI
- SQLAlchemy ORM
- SQLite database
- bcrypt password hashing
- SMTP email delivery using `aiosmtplib`
- Environment-based configuration for sensitive credentials
- CORS configuration for frontend-backend communication

### Frontend

- React
- Vite
- Responsive authentication interface
- Login, registration, forgot-password, and reset-password screens
- Google Sign-In integration
- Form validation and user feedback

---

## Technologies

### Frontend

| Technology | Purpose |
|------------|---------|
| React | User interface |
| Vite | Frontend development and build tooling |
| JavaScript | Application logic |
| CSS | Styling and responsive design |

### Backend

| Technology | Purpose |
|------------|---------|
| Python | Backend programming language |
| FastAPI | REST API framework |
| SQLAlchemy | Database ORM |
| SQLite | Database |
| bcrypt | Password hashing |
| aiosmtplib | SMTP email delivery |

### Authentication & Services

| Service | Purpose |
|---------|---------|
| Google OAuth | Google authentication |
| SMTP | Password-reset emails |

---

## Project Architecture

The application follows a simple full-stack architecture:

```text
┌─────────────────────────┐
│     React Frontend      │
│                         │
│  Login / Signup / Reset │
└────────────┬────────────┘
             │
             │ HTTP Requests
             ▼
┌─────────────────────────┐
│      FastAPI Backend    │
│                         │
│ Authentication API      │
│ Password Reset API      │
│ Google Authentication   │
└────────────┬────────────┘
             │
       ┌─────┴─────┐
       ▼           ▼
┌────────────┐  ┌──────────────┐
│   SQLite   │  │ SMTP / Email │
│  Database  │  │   Service    │
└────────────┘  └──────────────┘


## Project Structure
Project/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md