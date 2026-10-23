
import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


async def _send_email(message: EmailMessage) -> None:
    if not settings.smtp_email or not settings.smtp_password:
        raise RuntimeError("Email service is not configured")

    await aiosmtplib.send(
        message,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=True,
        username=settings.smtp_email,
        password=settings.smtp_password,
        timeout=30,
    )



async def send_password_reset_email(
    recipient_email: str,
    reset_code: str,
) -> None:
    message = EmailMessage()
    message["From"] = f"AuthFlow <{settings.smtp_email}>"
    message["To"] = recipient_email
    message["Subject"] = "Your AuthFlow Password Reset Code"

    message.set_content(
        f"""Hello,

We received a request to reset the password for your AuthFlow account.

Your password reset code is: {reset_code}

For your security, this code expires in 10 minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email.

Best regards,
The AuthFlow Team
"""
    )

    await _send_email(message)



async def send_email_verification_email(
    recipient_email: str,
    verification_token: str,
) -> None:
    message = EmailMessage()
    message["From"] = f"AuthFlow <{settings.smtp_email}>"
    message["To"] = recipient_email
    message["Subject"] = "Verify your email address"

    verification_url = (
        f"{settings.frontend_url}/verify-email"
        f"?token={verification_token}"
        f"&email={recipient_email}"
    )

    message.set_content(
    f"""Hello,

Thank you for creating an AuthFlow account.

To verify your email address, please open the link below:

{verification_url}

For your security, this verification link expires in 15 minutes.

If you did not create an AuthFlow account, you can safely ignore this email.

Best regards,
The AuthFlow Team
"""
)

    try:
        response = await _send_email(message)
        logger.info(
            "Verification email accepted by SMTP server for %s; response: %s",
            recipient_email,
            response,
        )
    except Exception:
        logger.exception(
            "SMTP verification email failed for %s",
            recipient_email,
        )
        raise
