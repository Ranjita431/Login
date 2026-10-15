from pathlib import Path
import re

path = Path("app/api/v1/auth.py")
source = path.read_text(encoding="utf-8")
updated = source

# Import the message response model.
if "from app.datamodels.auth import MessageResponse" not in updated:
    anchor = "from app.core.config import settings"
    if anchor not in updated:
        raise SystemExit("Config import not found; auth.py unchanged.")
    updated = updated.replace(
        anchor,
        anchor + "\nfrom app.datamodels.auth import MessageResponse",
        1,
    )

# Keep revoked refresh tokens until expiry for replay detection.
updated, n_cleanup = re.subn(
    r'def cleanup_refresh_tokens\(db: Session\):.*?\n(?=@router\.)',
    '''def cleanup_refresh_tokens(db: Session):
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    db.query(RefreshToken).filter(
        RefreshToken.expires_at < now
    ).delete(synchronize_session=False)

    db.commit()


''',
    updated,
    count=1,
    flags=re.S,
)
if n_cleanup != 1:
    raise SystemExit("Cleanup function not matched; auth.py unchanged.")

# Change login and refresh response models.
updated, n_login_model = re.subn(
    r'(@router\.post\("/login",\s*)response_model=TokenResponse(\))',
    r'\1response_model=MessageResponse\2',
    updated,
    count=1,
)
updated, n_refresh_model = re.subn(
    r'(@router\.post\("/refresh",\s*)response_model=TokenResponse(\))',
    r'\1response_model=MessageResponse\2',
    updated,
    count=1,
)
if n_login_model != 1 or n_refresh_model != 1:
    raise SystemExit("Login/refresh decorators not matched; auth.py unchanged.")

# Replace only the token-return blocks inside their respective functions.
login_start = updated.index("def login(")
refresh_decorator = re.search(r'(?m)^@router\.post\("/refresh"', updated)
if not refresh_decorator or refresh_decorator.start() <= login_start:
    raise SystemExit("Refresh route boundary not found; auth.py unchanged.")

login_part = updated[login_start:refresh_decorator.start()]
login_part, n_login_return = re.subn(
    r'return\s*\{\s*"access_token":\s*access_token,\s*'
    r'"refresh_token":\s*refresh_token,\s*'
    r'"token_type":\s*"bearer",\s*\}',
    'return {"message": "Login successful"}',
    login_part,
    count=1,
)
if n_login_return != 1:
    raise SystemExit("Login return block not matched; auth.py unchanged.")
updated = updated[:login_start] + login_part + updated[refresh_decorator.start():]

refresh_start = updated.index("def refresh_token(")
logout_decorator = re.search(r'(?m)^@router\.post\("/logout"', updated)
if not logout_decorator or logout_decorator.start() <= refresh_start:
    raise SystemExit("Logout route boundary not found; auth.py unchanged.")

refresh_part = updated[refresh_start:logout_decorator.start()]
refresh_part, n_refresh_return = re.subn(
    r'return\s*\{\s*"access_token":\s*new_access_token,\s*'
    r'"refresh_token":\s*new_refresh_token,\s*'
    r'"token_type":\s*"bearer",\s*\}',
    'return {"message": "Tokens refreshed successfully"}',
    refresh_part,
    count=1,
)
if n_refresh_return != 1:
    raise SystemExit("Refresh return block not matched; auth.py unchanged.")
updated = updated[:refresh_start] + refresh_part + updated[logout_decorator.start():]

# Save only after every expected edit succeeded.
path.write_text(updated, encoding="utf-8")
print("Auth patch applied successfully.")
