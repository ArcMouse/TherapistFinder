class SlotUnavailable(Exception):
    """Raised when a requested slot conflicts with an existing booking."""


class PaymentRequired(Exception):
    """Raised by the (future) payment hook when a booking cannot be paid for."""