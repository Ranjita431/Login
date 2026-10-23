import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "FastAPI backend is running!"


def test_invalid_google_token_is_rejected(client, monkeypatch):
    def reject_token(*args, **kwargs):
        raise ValueError("Invalid test credential")

    monkeypatch.setattr(
        "app.main.id_token.verify_oauth2_token",
        reject_token,
    )

    response = client.post(
        "/auth/google",
        json={"credential": "invalid-test-credential"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Google token"


def test_refresh_without_token_returns_401(client):
    response = client.post("/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token missing"


def test_login_with_invalid_credentials_returns_401(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "authflow-test-nonexistent@gmail.com",
            "password": "DefinitelyWrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_reset_password_with_invalid_code_returns_400(client):
    response = client.post(
        "/auth/reset-password",
        json={
            "email": "authflow-test-nonexistent@gmail.com",
            "code": "000000",
            "new_password": "NewTestPassword123!",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid reset code"


def test_logout_clears_authentication_cookies(client):
    response = client.post("/auth/logout")

    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"

    set_cookie_headers = response.headers.get_list("set-cookie")
    assert any("access_token" in cookie.lower() for cookie in set_cookie_headers)
    assert any("refresh_token" in cookie.lower() for cookie in set_cookie_headers)


from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.core.security import create_refresh_token, decode_token
from app.models import RefreshToken


def test_refresh_token_rotation_and_replay_rejection(client, monkeypatch):
    user_id = uuid4()
    old_token = create_refresh_token({"sub": str(user_id)})
    old_payload = decode_token(old_token)

    # Simulate a token record without writing to PostgreSQL.
    class FakeStoredToken:
        def __init__(self):
            self.user_id = user_id
            self.token_id = old_payload["jti"]
            self.expires_at = (
                datetime.now(timezone.utc) + timedelta(days=7)
            ).replace(tzinfo=None)
            self.revoked_at = None

    stored = FakeStoredToken()
    saved_tokens = []

    class FakeQuery:
        def __init__(self, model):
            self.model = model

        def filter(self, *args, **kwargs):
            return self

        def first(self):
            if self.model is RefreshToken:
                return stored
            return None

        def delete(self, **kwargs):
            return 0



    class FakeDB:
        def query(self, model):
            return FakeQuery(model)

        def add(self, record):
            saved_tokens.append(record)

        def commit(self):
            pass

        def rollback(self):
            pass



    fake_db = FakeDB()

    def override_get_db():
        yield fake_db

    from app.db import get_db
    from app.main import app

    app.dependency_overrides[get_db] = override_get_db

    try:
        # First use should rotate the refresh token.
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": old_token},
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Tokens refreshed successfully"
        assert stored.revoked_at is not None
        assert len(saved_tokens) == 1

        new_record = saved_tokens[0]
        assert new_record.user_id == user_id
        assert new_record.token_id != old_payload["jti"]

        # Reusing the original token must be rejected.
        replay_response = client.post(
            "/auth/refresh",
            json={"refresh_token": old_token},
        )

        assert replay_response.status_code == 401
        assert replay_response.json()["detail"] == (
            "Refresh token has already been used"
        )
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_refresh_rotation_rolls_back_on_commit_failure(client):
    user_id = uuid4()
    old_token = create_refresh_token({"sub": str(user_id)})
    old_payload = decode_token(old_token)

    class FakeStoredToken:
        def __init__(self):
            self.user_id = user_id
            self.token_id = old_payload["jti"]
            self.expires_at = (
                datetime.now(timezone.utc) + timedelta(days=7)
            ).replace(tzinfo=None)
            self.revoked_at = None

    stored = FakeStoredToken()

    class FakeQuery:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            return stored

        def delete(self, **kwargs):
            return 0


    class FakeDB:
        rollback_called = False
        commit_count = 0

        def query(self, model):
            return FakeQuery()

        def add(self, record):
            pass

        def commit(self):
            self.commit_count += 1
            if self.commit_count >= 2:
                raise RuntimeError("Simulated database failure")

        def rollback(self):
            self.rollback_called = True


    fake_db = FakeDB()

    def override_get_db():
        yield fake_db

    from app.db import get_db
    from app.main import app

    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": old_token},
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Could not refresh session"
        assert fake_db.rollback_called is True
    finally:
        app.dependency_overrides.pop(get_db, None)

