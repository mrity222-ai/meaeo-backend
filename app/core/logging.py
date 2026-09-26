import sys

from loguru import logger


def configure_logging() -> None:
    """
    Configure application-wide logging.

    Production application code should use this logger
    instead of print().
    """

    logger.remove()

    logger.add(
        sys.stderr,
        level="INFO",
        enqueue=True,
        backtrace=False,
        diagnose=False,
    )


configure_logging()