# Collectly backend

FastAPI application code and backend-specific setup live in this directory.

## First milestone: API foundation

The application entry point is `app/main.py`. It loads environment-backed settings from `app/config.py` and mounts the versioned API router. `GET /api/v1/health` checks that the process is alive; `GET /api/v1/health/ready` also checks the database connection.

## Run locally

From this directory, create a virtual environment, install dependencies, copy the local settings file, and start PostgreSQL:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
docker compose up -d db
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Start the API with:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Generate a local JWT secret and place its output in `.env` as `JWT_SECRET_KEY`:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
```

Then start the API and open `http://127.0.0.1:8000/docs` for the generated API documentation. The local PostgreSQL container uses host port `5433` by default to avoid conflicting with another local database. `.env` is for local overrides; keep real secrets out of source control. Alembic owns schema changes; do not create application tables with `create_all()`.

To manually check API and database readiness, request `http://127.0.0.1:8000/api/v1/health/ready`. A successful response includes `"database": "ok"`.

The first domain model is `app/models/user.py`; its schema is introduced by Alembic revision `0002_create_users`. `POST /api/v1/auth/register` validates email, matching password confirmation, and an 8-128 character password, then stores only an Argon2id password hash. `POST /api/v1/auth/login` issues a short-lived JWT access token; `GET /api/v1/users/me` returns the profile for that token. Password complexity rules, refresh tokens, logout invalidation, and email verification are later authentication milestones. Set a unique `JWT_SECRET_KEY` in `.env`; the development fallback is not suitable for production.
