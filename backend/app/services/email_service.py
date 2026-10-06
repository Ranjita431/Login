from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings


async def send_password_reset_email(
    recipient_email: str,
    reset_code: str,
) -> None:
    if not settings.smtp_email or not settings.smtp_password:
        raise RuntimeError("Email service is not configured")

    message = EmailMessage()

    message["From"] = settings.smtp_email
    message["To"] = recipient_email
    message["Subject"] = "Password Reset Code"

    message.set_content(
        f"""Hello,

We received a request to reset your password.

Your password reset code is: {reset_code}

This code will expire in 10 minutes and can only be used once.

If you did not request a password reset, you can ignore this email.

Regards,
Login Authentication System
"""
    )

    await aiosmtplib.send(
        message,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=True,
        username=settings.smtp_email,
        password=settings.smtp_password,
    )