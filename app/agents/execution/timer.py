from time import perf_counter


class ExecutionTimer:
    """
    High-resolution execution timer.

    Uses perf_counter() because it is monotonic
    and intended for measuring elapsed time.
    """

    def __init__(self):

        self._started = None
        self._finished = None

    def start(self) -> None:
        self._started = perf_counter()
        self._finished = None

    def stop(self) -> float:
        self._finished = perf_counter()

        if self._started is None:
            return 0.0
        return (
            self._finished - self._started
        ) * 1000