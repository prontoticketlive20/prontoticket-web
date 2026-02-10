import qrcode
import io
import base64
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def generate_qr_code(data: str, size: int = 10, border: int = 2) -> str:
    """
    Generate a QR code image and return it as a base64 encoded string.
    
    Args:
        data: The data to encode in the QR code
        size: Box size (pixels per module)
        border: Border size (number of modules)
    
    Returns:
        Base64 encoded PNG image string
    """
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=size,
            border=border,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{base64_image}"
        
    except Exception as e:
        logger.error(f"Error generating QR code: {e}")
        raise


def generate_ticket_qr_data(
    ticket_id: str,
    order_id: str,
    event_id: str,
    qr_code: str
) -> str:
    """
    Generate the data string to be encoded in a ticket's QR code.
    This data will be used for validation at the venue.
    
    Args:
        ticket_id: Unique ticket ID
        order_id: Order ID
        event_id: Event ID
        qr_code: Unique QR validation code
    
    Returns:
        Formatted string for QR code
    """
    # Format: PRONTO|{ticket_id}|{order_id}|{event_id}|{qr_code}
    # This format allows quick parsing and validation
    return f"PRONTO|{ticket_id}|{order_id}|{event_id}|{qr_code}"


def parse_ticket_qr_data(qr_data: str) -> Optional[dict]:
    """
    Parse QR code data scanned at the venue.
    
    Args:
        qr_data: Raw QR code string
    
    Returns:
        Dictionary with parsed data or None if invalid format
    """
    try:
        parts = qr_data.split("|")
        
        if len(parts) != 5 or parts[0] != "PRONTO":
            return None
        
        return {
            "prefix": parts[0],
            "ticket_id": parts[1],
            "order_id": parts[2],
            "event_id": parts[3],
            "qr_code": parts[4]
        }
        
    except Exception as e:
        logger.error(f"Error parsing QR data: {e}")
        return None
