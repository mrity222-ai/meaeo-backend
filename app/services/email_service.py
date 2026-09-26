from __future__ import annotations

import logging

from app.models.config import settings


logger = logging.getLogger(__name__)


class EmailService:
    """
    Email delivery abstraction.

    Development:
        EMAIL_PROVIDER=console

    Production:
        EMAIL_PROVIDER=resend
    """

    @staticmethod
    def send_verification_code(
        *,
        email: str,
        code: str,
    ) -> None:
        provider = (
            settings.EMAIL_PROVIDER
            .strip()
            .lower()
        )

        if provider == "console":
            EmailService._send_console(
                email=email,
                code=code,
            )
            return

        if provider == "resend":
            EmailService._send_resend(
                email=email,
                code=code,
            )
            return

        if provider == "smtp":
            try:
                EmailService._send_smtp(
                    email=email,
                    code=code,
                )
                return
            except Exception as exc:
                if settings.APP_ENV == "development":
                    logger.warning(
                        "SMTP delivery failed in development (%s). Falling back to console OTP delivery.",
                        exc,
                    )
                    EmailService._send_console(
                        email=email,
                        code=code,
                    )
                    return
                raise

        raise ValueError(
            f"Unsupported email provider: {provider}. Supported: 'console', 'smtp', 'resend'"
        )

    @staticmethod
    def _send_console(
        *,
        email: str,
        code: str,
    ) -> None:
        """
        Development-only email delivery.
        """

        logger.info(
            "Email verification code generated for %s",
            email,
        )

        print(
            "\n"
            "========================================\n"
            "EMAIL VERIFICATION\n"
            f"To: {email}\n"
            f"Verification code: {code}\n"
            "Expires in: 10 minutes\n"
            "========================================\n"
        )

    @staticmethod
    def _send_resend(
        *,
        email: str,
        code: str,
    ) -> None:
        """
        Production transactional email delivery.
        """

        if settings.RESEND_API_KEY is None:
            raise ValueError(
                "RESEND_API_KEY is required when "
                "EMAIL_PROVIDER=resend"
            )

        import resend

        resend.api_key = (
            settings.RESEND_API_KEY
            .get_secret_value()
        )

        response = resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Your Marketing System verification code",
                "html": f"""
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Verify your email</h2>

                        <p>
                            Use the verification code below:
                        </p>

                        <div style="
                            font-size: 32px;
                            font-weight: 700;
                            letter-spacing: 8px;
                            margin: 24px 0;
                        ">
                            {code}
                        </div>

                        <p>
                            This code expires in 10 minutes.
                        </p>

                        <p>
                            If you did not request this code,
                            you can safely ignore this email.
                        </p>
                    </div>
                """,
            }
        )

        logger.info(
            "Verification email sent to %s",
            email,
        )

    @staticmethod
    def _send_smtp(
        *,
        email: str,
        code: str,
    ) -> None:
        """
        Standard SMTP delivery (supports Gmail, Hostinger, Sendgrid, Outlook, custom SMTP).
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        host = settings.SMTP_HOST
        port = settings.SMTP_PORT or 587
        user = settings.SMTP_USER
        password = (
            settings.SMTP_PASSWORD.get_secret_value()
            if settings.SMTP_PASSWORD
            else None
        )

        if not host or not user or not password:
            raise ValueError(
                "SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required when EMAIL_PROVIDER=smtp"
            )

        from_addr = settings.EMAIL_FROM or user
        from_name = settings.EMAIL_FROM_NAME or "Autonomous Marketing System"
        from_header = f"{from_name} <{from_addr}>"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Verification Code: {code}"
        msg["From"] = from_header
        msg["To"] = email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #7c3aed; font-size: 22px; font-weight: 800; margin: 0;">Autonomous Marketing AI</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Account Security Verification</p>
            </div>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your verification code is below. Please enter this code to verify your email address:</p>
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">{code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.4;">This code is valid for 10 minutes. If you did not initiate this request, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Protected by Autonomous Marketing AI Security</p>
          </div>
        </body>
        </html>
        """
        text_content = f"Your verification code is: {code}. It expires in 10 minutes."
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Intelligent protocol selection:
        # Port 465 is dedicated SSL (SMTPS, required by Hostinger / standard SSL).
        # Port 587 / 25 use STARTTLS.
        is_ssl = (int(port) == 465) or (not bool(settings.SMTP_USE_TLS))

        if is_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
            server.ehlo()
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(user, password)
        server.sendmail(from_addr, [email], msg.as_string())
        server.quit()

        logger.info("Verification email sent via SMTP to %s", email)

    @staticmethod
    def send_test_email(recipient_email: str) -> None:
        """
        Test SMTP configuration directly against the SMTP server.
        Raises an exception if connection or credentials fail so the admin UI sees the exact error.
        """
        EmailService._send_smtp(
            email=recipient_email,
            code="123456",
        )