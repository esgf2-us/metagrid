from multiprocessing import cpu_count
from os import environ
from tempfile import mkdtemp


def calculate_workers() -> int:
    """Calculate the number of workers for the Gunicorn server.

    Returns:
    - int: The final value for the 'workers' field after applying the validation logic.

    The method first checks if a value has been provided for 'workers'. If not, it attempts to retrieve the value from the 'web_concurrency' or 'max_workers'.
    If neither of these fields has a value, the method calculates the number of workers based on the number of CPU cores and rounds the result to the nearest integer, with a minimum value of 2.
    """
    return int(
        environ.get("GUNICORN_WORKERS")
        or environ.get("GUNICORN_WEB_CONCURRENCY")
        or environ.get("GUNICORN_MAX_WORKERS")
        or round(
            max(
                int(environ.get("GUNICORN_MAX_WORKERS_PER_CORE", 1))
                * cpu_count(),
                2,
            )
        )
    )


def get_binding_addr() -> str:
    """Determine the binding address for the Gunicorn server.

    Returns:
    - str: The final value for the `bind` field after applying the validation logic.

    The method first checks if a value has been provided for `bind`. If not, it attempts to construct a binding address from `host` and `port`
    """
    return (
        environ.get("GUNICORN_BIND_ADDRESS")
        or f"{environ.get('GUNICORN_HOST', '0.0.0.0')}:{environ.get('GUNICORN_PORT', 5000)}"
    )


# Actual Gunicorn config variables
workers: int = calculate_workers()
worker_tmp_dir: str = mkdtemp(prefix="/dev/shm/")
loglevel: str = "DEBUG"
errorlog: str = "-"
accesslog: str = "-"
graceful_timeout: int = 120
timeout: int = 120
keepalive: int = 5
bind: str = get_binding_addr()
reload: bool = True
default_proc_name: str = "Metagrid"
