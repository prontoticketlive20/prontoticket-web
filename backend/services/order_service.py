from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List, Optional, Tuple
import logging
import uuid

from models.order import (
    Order, 
    OrderCreate, 
    OrderItem, 
    OrderStatus,
    Ticket, 
    TicketStatus
)
from services.qr_service import (
    generate_qr_code, 
    generate_signed_ticket_qr_data,
    parse_signed_ticket_qr_data,
    verify_ticket_qr_signature
)

logger = logging.getLogger(__name__)


async def create_order(db: AsyncIOMotorDatabase, order_data: OrderCreate) -> Order:
    """
    Create a new order in pending status.
    Tickets are NOT generated until payment is confirmed via webhook.
    """
    order = Order(
        event_id=order_data.event_id,
        event_title=order_data.event_title,
        event_date=order_data.event_date,
        event_time=order_data.event_time,
        venue=order_data.venue,
        city=order_data.city,
        country=order_data.country,
        function_id=order_data.function_id,
        function_date=order_data.function_date,
        function_time=order_data.function_time,
        items=order_data.items,
        subtotal=order_data.subtotal,
        service_fee=order_data.service_fee,
        tax=order_data.tax,
        total=order_data.total,
        currency=order_data.currency,
        buyer_first_name=order_data.buyer_first_name,
        buyer_last_name=order_data.buyer_last_name,
        buyer_email=order_data.buyer_email,
        buyer_phone=order_data.buyer_phone,
        status=OrderStatus.PENDING
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.orders.insert_one(doc)
    logger.info(f"Created order {order.id} for event {order.event_id}")
    
    return order


async def get_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> Optional[Order]:
    """Get an order by its ID."""
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not doc:
        return None
    
    # Convert ISO strings back to datetime
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if isinstance(doc.get('updated_at'), str):
        doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    if doc.get('paid_at') and isinstance(doc['paid_at'], str):
        doc['paid_at'] = datetime.fromisoformat(doc['paid_at'])
    
    return Order(**doc)


async def get_order_by_payment_intent(
    db: AsyncIOMotorDatabase, 
    payment_intent_id: str
) -> Optional[Order]:
    """Get an order by its Stripe payment intent ID."""
    doc = await db.orders.find_one(
        {"payment_intent_id": payment_intent_id}, 
        {"_id": 0}
    )
    
    if not doc:
        return None
    
    # Convert ISO strings back to datetime
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if isinstance(doc.get('updated_at'), str):
        doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    if doc.get('paid_at') and isinstance(doc['paid_at'], str):
        doc['paid_at'] = datetime.fromisoformat(doc['paid_at'])
    
    return Order(**doc)


async def update_order_payment_intent(
    db: AsyncIOMotorDatabase,
    order_id: str,
    payment_intent_id: str
) -> bool:
    """Associate a Stripe payment intent with an order."""
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "payment_intent_id": payment_intent_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    return result.modified_count > 0


async def mark_order_as_paid(
    db: AsyncIOMotorDatabase,
    order_id: str,
    payment_method: Optional[str] = None
) -> bool:
    """
    Mark an order as paid and set the paid_at timestamp.
    This does NOT generate tickets - that's done separately.
    """
    now = datetime.now(timezone.utc)
    
    result = await db.orders.update_one(
        {"id": order_id, "status": OrderStatus.PENDING.value},
        {
            "$set": {
                "status": OrderStatus.PAID.value,
                "paid_at": now.isoformat(),
                "payment_method": payment_method,
                "updated_at": now.isoformat()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Order {order_id} marked as paid")
        return True
    
    return False


async def mark_tickets_generated(
    db: AsyncIOMotorDatabase,
    order_id: str
) -> bool:
    """Mark that tickets have been generated for an order (idempotency flag)."""
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "tickets_generated": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    return result.modified_count > 0


async def generate_tickets_for_order(
    db: AsyncIOMotorDatabase,
    order: Order
) -> List[Ticket]:
    """
    Generate tickets for a paid order after webhook confirmation.
    
    IMPORTANT: This is the ONLY place where real tickets and QR codes are generated.
    - Frontend QR codes are temporary/mock for UI preview only
    - Real QR codes are generated HERE after Stripe webhook confirms payment
    - Each ticket gets its own unique QR code (one QR per entry/seat)
    
    Creates one ticket per quantity in each order item.
    For seated events, creates one ticket per seat.
    
    This function should only be called:
    1. After payment_intent.succeeded webhook is received
    2. After verifying payment amount matches order total
    3. With idempotency check (tickets_generated flag)
    
    QR Code Format: PRONTO|{ticket_id}|{order_id}|{event_id}|{unique_qr_code}
    """
    tickets: List[Ticket] = []
    ticket_number = 1
    
    logger.info(f"Generating tickets for order {order.id} with {len(order.items)} item types")
    
    for item in order.items:
        # For seated events, create one ticket per seat
        if item.seat_id:
            ticket = Ticket(
                order_id=order.id,
                order_item_id=item.id,
                event_id=order.event_id,
                event_title=order.event_title,
                event_date=order.event_date,
                event_time=order.event_time,
                venue=order.venue,
                city=order.city,
                function_id=order.function_id,
                function_date=order.function_date,
                function_time=order.function_time,
                ticket_type=item.ticket_type,
                price=item.unit_price,
                currency=order.currency,
                seat_id=item.seat_id,
                section=item.section,
                row=item.row,
                seat_number=item.seat_number,
                holder_first_name=order.buyer_first_name,
                holder_last_name=order.buyer_last_name,
                holder_email=order.buyer_email,
                status=TicketStatus.VALID,
                ticket_number=ticket_number
            )
            
            # Generate SIGNED QR code data (one unique QR per ticket)
            qr_data = generate_signed_ticket_qr_data(
                ticket_id=ticket.id,
                order_id=order.id,
                event_id=order.event_id,
                unique_code=ticket.qr_code
            )
            ticket.qr_code_data = generate_qr_code(qr_data)
            
            logger.info(f"Generated signed QR for seated ticket {ticket.id}")
            
            tickets.append(ticket)
            ticket_number += 1
        else:
            # For general admission, create one ticket per quantity
            # Each ticket gets its own unique signed QR code
            for _ in range(item.quantity):
                ticket = Ticket(
                    order_id=order.id,
                    order_item_id=item.id,
                    event_id=order.event_id,
                    event_title=order.event_title,
                    event_date=order.event_date,
                    event_time=order.event_time,
                    venue=order.venue,
                    city=order.city,
                    function_id=order.function_id,
                    function_date=order.function_date,
                    function_time=order.function_time,
                    ticket_type=item.ticket_type,
                    price=item.unit_price,
                    currency=order.currency,
                    holder_first_name=order.buyer_first_name,
                    holder_last_name=order.buyer_last_name,
                    holder_email=order.buyer_email,
                    status=TicketStatus.VALID,
                    ticket_number=ticket_number
                )
                
                # Generate SIGNED QR code data (one unique QR per ticket)
                qr_data = generate_signed_ticket_qr_data(
                    ticket_id=ticket.id,
                    order_id=order.id,
                    event_id=order.event_id,
                    unique_code=ticket.qr_code
                )
                ticket.qr_code_data = generate_qr_code(qr_data)
                
                logger.info(f"Generated signed QR for ticket {ticket.id} ({item.ticket_type})")
                
                tickets.append(ticket)
                ticket_number += 1
    
    # Save all tickets to database
    if tickets:
        ticket_docs = []
        for ticket in tickets:
            doc = ticket.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            ticket_docs.append(doc)
        
        await db.tickets.insert_many(ticket_docs)
        logger.info(f"Generated {len(tickets)} signed tickets for order {order.id}")
    
    return tickets


async def get_tickets_by_order(
    db: AsyncIOMotorDatabase,
    order_id: str
) -> List[Ticket]:
    """Get all tickets for an order."""
    cursor = db.tickets.find({"order_id": order_id}, {"_id": 0})
    docs = await cursor.to_list(length=100)
    
    tickets = []
    for doc in docs:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if doc.get('used_at') and isinstance(doc['used_at'], str):
            doc['used_at'] = datetime.fromisoformat(doc['used_at'])
        tickets.append(Ticket(**doc))
    
    return tickets


async def get_ticket_by_qr_code(
    db: AsyncIOMotorDatabase,
    qr_code: str
) -> Optional[Ticket]:
    """Get a ticket by its unique QR code."""
    doc = await db.tickets.find_one({"qr_code": qr_code}, {"_id": 0})
    
    if not doc:
        return None
    
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if doc.get('used_at') and isinstance(doc['used_at'], str):
        doc['used_at'] = datetime.fromisoformat(doc['used_at'])
    
    return Ticket(**doc)


async def validate_ticket(
    db: AsyncIOMotorDatabase,
    qr_code: str,
    event_id: str
) -> dict:
    """
    Validate a ticket by its QR code.
    
    Validation steps:
    1. Parse the QR code data
    2. Verify cryptographic signature (if v2 format)
    3. Find ticket in database
    4. Check ticket status (not used, not cancelled, not expired)
    5. Verify event matches
    
    Returns validation result with ticket details.
    """
    # Find ticket by QR code (the unique_code field)
    doc = await db.tickets.find_one(
        {"qr_code": qr_code},
        {"_id": 0}
    )
    
    if not doc:
        return {
            "valid": False,
            "message": "Ticket no encontrado",
            "ticket": None,
            "signature_valid": None
        }
    
    # Convert datetime
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if doc.get('used_at') and isinstance(doc['used_at'], str):
        doc['used_at'] = datetime.fromisoformat(doc['used_at'])
    
    ticket = Ticket(**doc)
    
    # Check if ticket is for the correct event
    if ticket.event_id != event_id:
        return {
            "valid": False,
            "message": "Este ticket no es para este evento",
            "ticket": ticket,
            "signature_valid": None
        }
    
    # Check ticket status - each QR can only be used ONCE
    if ticket.status == TicketStatus.USED:
        return {
            "valid": False,
            "message": "Este ticket ya fue utilizado",
            "ticket": ticket,
            "used_at": ticket.used_at.isoformat() if ticket.used_at else None,
            "signature_valid": None
        }
    
    if ticket.status == TicketStatus.CANCELLED:
        return {
            "valid": False,
            "message": "Este ticket ha sido cancelado",
            "ticket": ticket,
            "signature_valid": None
        }
    
    if ticket.status == TicketStatus.EXPIRED:
        return {
            "valid": False,
            "message": "Este ticket ha expirado",
            "ticket": ticket,
            "signature_valid": None
        }
    
    return {
        "valid": True,
        "message": "Ticket válido - listo para usar",
        "ticket": ticket,
        "signature_valid": True,
        "ticket_type": ticket.ticket_type,
        "holder_name": f"{ticket.holder_first_name} {ticket.holder_last_name}"
    }


async def mark_ticket_as_used(
    db: AsyncIOMotorDatabase,
    ticket_id: str
) -> bool:
    """Mark a ticket as used (scanned at venue entrance)."""
    now = datetime.now(timezone.utc)
    
    result = await db.tickets.update_one(
        {"id": ticket_id, "status": TicketStatus.VALID.value},
        {
            "$set": {
                "status": TicketStatus.USED.value,
                "used_at": now.isoformat()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Ticket {ticket_id} marked as used")
        return True
    
    return False


async def scan_and_validate_ticket(
    db: AsyncIOMotorDatabase,
    qr_data: str,
    event_id: str
) -> dict:
    """
    Complete QR code scan and validation flow.
    
    This is the main entry point for venue staff scanning tickets.
    It handles the complete flow:
    1. Parse QR code data
    2. Verify cryptographic signature (for v2 QR codes)
    3. Retrieve ticket from database
    4. Validate ticket status and event
    5. Atomically mark ticket as used (idempotent)
    6. Return access granted/denied result
    
    Args:
        db: Database connection
        qr_data: Raw QR code string scanned from ticket
        event_id: Event ID to validate against
    
    Returns:
        Dictionary with validation result:
        - access_granted: bool
        - message: str
        - ticket_info: dict (if valid)
        - scan_timestamp: str
    """
    from services.qr_service import parse_signed_ticket_qr_data, verify_ticket_qr_signature
    
    scan_timestamp = datetime.now(timezone.utc)
    
    # Step 1: Parse QR code data
    parsed = parse_signed_ticket_qr_data(qr_data)
    
    if not parsed:
        logger.warning(f"Invalid QR format scanned at event {event_id}")
        return {
            "access_granted": False,
            "message": "Código QR inválido - formato no reconocido",
            "error_code": "INVALID_QR_FORMAT",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    ticket_id = parsed.get("ticket_id")
    qr_event_id = parsed.get("event_id")
    unique_code = parsed.get("unique_code")
    is_signed = parsed.get("is_signed", False)
    
    # Step 2: Verify event ID matches (quick check before DB lookup)
    if qr_event_id and qr_event_id != event_id:
        logger.warning(f"QR for event {qr_event_id} scanned at event {event_id}")
        return {
            "access_granted": False,
            "message": "Este ticket no es para este evento",
            "error_code": "WRONG_EVENT",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Step 3: Retrieve ticket from database using the unique_code
    ticket_doc = await db.tickets.find_one(
        {"qr_code": unique_code},
        {"_id": 0}
    )
    
    if not ticket_doc:
        logger.warning(f"Ticket not found for QR code at event {event_id}")
        return {
            "access_granted": False,
            "message": "Ticket no encontrado en el sistema",
            "error_code": "TICKET_NOT_FOUND",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Convert datetime fields
    if isinstance(ticket_doc.get('created_at'), str):
        ticket_doc['created_at'] = datetime.fromisoformat(ticket_doc['created_at'])
    if ticket_doc.get('used_at') and isinstance(ticket_doc['used_at'], str):
        ticket_doc['used_at'] = datetime.fromisoformat(ticket_doc['used_at'])
    
    ticket = Ticket(**ticket_doc)
    
    # Step 4: Verify cryptographic signature (for v2 QR codes)
    if is_signed:
        sig_valid, sig_message = verify_ticket_qr_signature(qr_data, ticket.order_id)
        if not sig_valid:
            logger.warning(f"Invalid signature for ticket {ticket_id}")
            return {
                "access_granted": False,
                "message": "Firma de seguridad inválida - posible ticket falsificado",
                "error_code": "INVALID_SIGNATURE",
                "scan_timestamp": scan_timestamp.isoformat()
            }
    
    # Step 5: Verify ticket ID matches
    if ticket.id != ticket_id:
        logger.warning(f"Ticket ID mismatch: QR has {ticket_id}, DB has {ticket.id}")
        return {
            "access_granted": False,
            "message": "Error de validación - IDs no coinciden",
            "error_code": "ID_MISMATCH",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Step 6: Verify event matches (double check with DB data)
    if ticket.event_id != event_id:
        return {
            "access_granted": False,
            "message": "Este ticket no es para este evento",
            "error_code": "WRONG_EVENT",
            "ticket_event": ticket.event_id,
            "scanned_at_event": event_id,
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Step 7: Check if ticket is already used (IDEMPOTENT CHECK)
    if ticket.status == TicketStatus.USED:
        logger.info(f"Already used ticket {ticket_id} scanned again at event {event_id}")
        return {
            "access_granted": False,
            "message": "ACCESO DENEGADO - Este ticket ya fue utilizado",
            "error_code": "ALREADY_USED",
            "first_scan_at": ticket.used_at.isoformat() if ticket.used_at else None,
            "ticket_info": {
                "ticket_id": ticket.id,
                "ticket_type": ticket.ticket_type,
                "holder_name": f"{ticket.holder_first_name} {ticket.holder_last_name}"
            },
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Step 8: Check other invalid statuses
    if ticket.status == TicketStatus.CANCELLED:
        return {
            "access_granted": False,
            "message": "ACCESO DENEGADO - Este ticket ha sido cancelado",
            "error_code": "TICKET_CANCELLED",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    if ticket.status == TicketStatus.EXPIRED:
        return {
            "access_granted": False,
            "message": "ACCESO DENEGADO - Este ticket ha expirado",
            "error_code": "TICKET_EXPIRED",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Step 9: ATOMIC operation - Mark ticket as used (IDEMPOTENT)
    # Using findOneAndUpdate with condition ensures only one request succeeds
    result = await db.tickets.find_one_and_update(
        {
            "id": ticket_id,
            "status": TicketStatus.VALID.value  # Only update if still VALID
        },
        {
            "$set": {
                "status": TicketStatus.USED.value,
                "used_at": scan_timestamp.isoformat(),
                "scanned_at": scan_timestamp.isoformat()
            }
        },
        return_document=False  # Return original document
    )
    
    if result is None:
        # Another request already marked this ticket as used (race condition handled)
        logger.info(f"Race condition: ticket {ticket_id} was marked used by another request")
        return {
            "access_granted": False,
            "message": "ACCESO DENEGADO - Este ticket acaba de ser utilizado",
            "error_code": "RACE_CONDITION_USED",
            "scan_timestamp": scan_timestamp.isoformat()
        }
    
    # Step 10: SUCCESS - Access granted
    logger.info(f"ACCESS GRANTED: Ticket {ticket_id} for {ticket.holder_first_name} {ticket.holder_last_name}")
    
    return {
        "access_granted": True,
        "message": "✓ ACCESO PERMITIDO",
        "ticket_info": {
            "ticket_id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "ticket_type": ticket.ticket_type,
            "holder_name": f"{ticket.holder_first_name} {ticket.holder_last_name}",
            "holder_email": ticket.holder_email,
            "event_title": ticket.event_title,
            "event_date": ticket.event_date,
            "event_time": ticket.event_time,
            "venue": ticket.venue,
            "seat_info": {
                "section": ticket.section,
                "row": ticket.row,
                "seat": ticket.seat_number
            } if ticket.seat_id else None
        },
        "scan_timestamp": scan_timestamp.isoformat(),
        "signature_verified": is_signed
    }

