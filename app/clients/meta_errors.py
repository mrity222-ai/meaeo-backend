class MetaAPIError(Exception):

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        error_code: int | None = None,
        error_subcode: int | None = None,
        trace_id: str | None = None,
    ):

        super().__init__(message)

        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.error_subcode = error_subcode
        self.trace_id = trace_id

    def __str__(self) -> str:

        details = []

        if self.status_code is not None:
            details.append(
                f"status={self.status_code}"
            )

        if self.error_code is not None:
            details.append(
                f"code={self.error_code}"
            )

        if self.error_subcode is not None:
            details.append(
                f"subcode={self.error_subcode}"
            )

        if self.trace_id:
            details.append(
                f"trace_id={self.trace_id}"
            )

        if details:
            return (
                f"{self.message} "
                f"({' | '.join(details)})"
            )

        return self.message