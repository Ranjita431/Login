
import json
import logging
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path


LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "authflow.log"


class JsonFormatter(logging.Formatter):
    """Format log records as JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_entry["exception_type"] = record.exc_info[0].__name__
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def configure_logging() -> None:
    """Configure console and rotating file JSON logging."""
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    formatter = JsonFormatter()

    if not any(
        getattr(handler, "_auth_json_console_handler", False)
        for handler in root_logger.handlers
    ):
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler._auth_json_console_handler = True
        root_logger.addHandler(console_handler)

    if not any(
        getattr(handler, "_auth_json_file_handler", False)
        for handler in root_logger.handlers
    ):
        file_handler = RotatingFileHandler(
            LOG_FILE,
            maxBytes=5 * 1024 * 1024,
            backupCount=3,
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)
        file_handler._auth_json_file_handler = True
        root_logger.addHandler(file_handler)
