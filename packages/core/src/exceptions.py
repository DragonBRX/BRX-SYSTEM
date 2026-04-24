"""
BRX SYSTEM - Custom Exceptions
"""


class BRXSystemException(Exception):
    """Base exception for BRX SYSTEM."""

    def __init__(self, message: str, status_code: int = 500, error_code: str = "INTERNAL_ERROR", details: dict = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AgentException(BRXSystemException):
    """Agent execution exception."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=500, error_code="AGENT_ERROR", details=details)


class RAGException(BRXSystemException):
    """RAG pipeline exception."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=500, error_code="RAG_ERROR", details=details)


class LLMException(BRXSystemException):
    """LLM provider exception."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=502, error_code="LLM_ERROR", details=details)


class ValidationException(BRXSystemException):
    """Input validation exception."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, error_code="VALIDATION_ERROR", details=details)


class NotFoundException(BRXSystemException):
    """Resource not found exception."""

    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=404, error_code="NOT_FOUND", details=details)
