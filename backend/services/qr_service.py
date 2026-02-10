"""
QR Code Service for ProntoTicketLive

This module handles QR code generation with cryptographic signing.
Each ticket gets a unique, signed QR code that can only be used once.

Security Features:
- HMAC-SHA256 signature prevents tampering
- Unique ticket_id in each QR code
- Timestamp included in signature
- Server-side validation required
"""

import qrcode
import io
import base64
import hmac
import hashlib
import os
import json
from typing import Optional, Tuple
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Secret key for signing QR codes - should be set in environment
QR_SIGNING_SECRET = os.environ.get('QR_SIGNING_SECRET', 'pronto-ticket-live-default-secret-change-in-production')


def _get_signing_key() -> bytes:
    """Get the signing key as bytes."""
    return QR_SIGNING_SECRET.encode('utf-8')


def _generate_signature(data: str) -> str:
    """
    Generate HMAC-SHA256 signature for the given data.
    
    Args:
        data: String data to sign
        
    Returns:
        Hex-encoded signature (first 16 characters for compactness)
    """
    key = _get_signing_key()
    signature = hmac.new(key, data.encode('utf-8'), hashlib.sha256).hexdigest()
    # Return first 16 chars for shorter QR codes while maintaining security
    return signature[:16]


def _verify_signature(data: str, signature: str) -> bool:
    """
    Verify HMAC-SHA256 signature.
    
    Args:
        data: Original data that was signed
        signature: Signature to verify
        
    Returns:
        True if signature is valid, False otherwise
    """
    expected_signature = _generate_signature(data)
    return hmac.compare_digest(expected_signature, signature)


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
            version=None,  # Auto-determine version based on data
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


def generate_signed_ticket_qr_data(
    ticket_id: str,
    order_id: str,
    event_id: str,
    unique_code: str,
    issued_at: Optional[datetime] = None
) -> str:
    """
    Generate a cryptographically signed QR code data string.
    
    The QR data includes:
    - Ticket ID (unique per ticket)
    - Order ID (reference to purchase)
    - Event ID (validates correct event)
    - Unique code (random UUID for uniqueness)
    - Timestamp (when ticket was issued)
    - Signature (HMAC-SHA256, prevents tampering)
    
    Format: PRONTO|v2|{ticket_id}|{event_id}|{unique_code}|{timestamp}|{signature}
    
    Args:
        ticket_id: Unique ticket ID
        order_id: Order ID (included in signature but not in QR for compactness)
        event_id: Event ID
        unique_code: Unique validation code (UUID)
        issued_at: Timestamp when ticket was issued
    
    Returns:
        Signed QR code data string
    """
    if issued_at is None:
        issued_at = datetime.now(timezone.utc)
    
    # Timestamp as Unix epoch (compact)
    timestamp = int(issued_at.timestamp())
    
    # Data to sign (includes order_id for extra security even though not in QR)
    sign_data = f"{ticket_id}:{order_id}:{event_id}:{unique_code}:{timestamp}"
    signature = _generate_signature(sign_data)
    
    # QR code format (v2 = signed version)
    # Format: PRONTO|v2|ticket_id|event_id|unique_code|timestamp|signature
    qr_data = f"PRONTO|v2|{ticket_id}|{event_id}|{unique_code}|{timestamp}|{signature}"
    
    logger.debug(f"Generated signed QR for ticket {ticket_id}")
    
    return qr_data


def parse_signed_ticket_qr_data(qr_data: str) -> Optional[dict]:
    """
    Parse signed QR code data scanned at the venue.
    
    Args:
        qr_data: Raw QR code string
    
    Returns:
        Dictionary with parsed data or None if invalid format
    """
    try:
        parts = qr_data.split("|")
        
        # Check for v2 (signed) format
        if len(parts) == 7 and parts[0] == "PRONTO" and parts[1] == "v2":
            return {
                "version": "v2",
                "ticket_id": parts[2],
                "event_id": parts[3],
                "unique_code": parts[4],
                "timestamp": int(parts[5]),
                "signature": parts[6],
                "is_signed": True
            }
        
        # Legacy v1 format (unsigned) - for backwards compatibility
        if len(parts) == 5 and parts[0] == "PRONTO":
            return {
                "version": "v1",
                "ticket_id": parts[1],
                "order_id": parts[2],
                "event_id": parts[3],
                "unique_code": parts[4],
                "is_signed": False
            }
        
        logger.warning(f"Unknown QR format: {qr_data[:50]}...")
        return None
        
    except Exception as e:
        logger.error(f"Error parsing QR data: {e}")
        return None


def verify_ticket_qr_signature(
    qr_data: str,
    order_id: str
) -> Tuple[bool, str]:
    """
    Verify the cryptographic signature of a ticket QR code.
    
    This should be called during ticket validation to ensure
    the QR code hasn't been tampered with.
    
    Args:
        qr_data: Raw QR code string
        order_id: Order ID (required to verify signature)
    
    Returns:
        Tuple of (is_valid, message)
    """
    parsed = parse_signed_ticket_qr_data(qr_data)
    
    if not parsed:
        return False, "Formato de QR inválido"
    
    # Legacy unsigned QR codes
    if not parsed.get("is_signed"):
        return True, "QR válido (versión legacy sin firma)"
    
    # Reconstruct the signed data
    sign_data = f"{parsed['ticket_id']}:{order_id}:{parsed['event_id']}:{parsed['unique_code']}:{parsed['timestamp']}"
    
    # Verify signature
    if _verify_signature(sign_data, parsed['signature']):
        return True, "Firma válida"
    else:
        logger.warning(f"Invalid signature for ticket {parsed['ticket_id']}")
        return False, "Firma inválida - QR posiblemente alterado"


# Legacy functions for backwards compatibility
def generate_ticket_qr_data(
    ticket_id: str,
    order_id: str,
    event_id: str,
    qr_code: str
) -> str:
    """
    Legacy function - now generates signed QR codes.
    
    Args:
        ticket_id: Unique ticket ID
        order_id: Order ID
        event_id: Event ID
        qr_code: Unique QR validation code
    
    Returns:
        Signed QR code data string
    """
    return generate_signed_ticket_qr_data(
        ticket_id=ticket_id,
        order_id=order_id,
        event_id=event_id,
        unique_code=qr_code
    )


def parse_ticket_qr_data(qr_data: str) -> Optional[dict]:
    """
    Legacy function - now parses both signed and unsigned QR codes.
    """
    return parse_signed_ticket_qr_data(qr_data)
