from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Optional
import stripe
import os
import logging

from models.order import (
    Order,
    OrderCreate,
    OrderItem,
    OrderStatus,
    Ticket,
    TicketValidation
)
from services.order_service import (
    create_order,
    get_order_by_id,
    get_tickets_by_order,
    update_order_payment_intent,
    validate_ticket,
    mark_ticket_as_used,
    scan_and_validate_ticket
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

# Database reference (will be set from main app)
db: Optional[AsyncIOMotorDatabase] = None


def set_database(database: AsyncIOMotorDatabase):
    """Set the database reference for the orders router."""
    global db
    db = database


# Request models
class ScanTicketRequest(BaseModel):
    """Request body for scanning a ticket QR code."""
    qr_data: str  # Raw QR code data from scanner
    event_id: str  # Event ID to validate against


@router.post("", response_model=dict)
async def create_new_order(order_data: OrderCreate):
    """
    Create a new order and initiate Stripe payment.
    
    This endpoint:
    1. Creates an order in "pending" status
    2. Creates a Stripe PaymentIntent
    3. Returns the client_secret for frontend payment confirmation
    
    Tickets are NOT generated until payment is confirmed via webhook.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Create order in database
    order = await create_order(db, order_data)
    
    # Initialize Stripe with secret key
    stripe_secret_key = os.environ.get("STRIPE_SECRET_KEY")
    
    if not stripe_secret_key:
        logger.error("STRIPE_SECRET_KEY not configured")
        raise HTTPException(
            status_code=500,
            detail="Payment service not configured"
        )
    
    stripe.api_key = stripe_secret_key
    
    try:
        # Create Stripe PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=order.total,  # Already in smallest currency unit
            currency=order.currency.lower(),
            metadata={
                "order_id": order.id,
                "event_id": order.event_id,
                "event_title": order.event_title,
                "buyer_email": order.buyer_email
            },
            automatic_payment_methods={
                "enabled": True
            },
            description=f"ProntoTicketLive - {order.event_title}"
        )
        
        # Update order with payment intent ID
        await update_order_payment_intent(
            db=db,
            order_id=order.id,
            payment_intent_id=payment_intent.id
        )
        
        logger.info(
            f"Created order {order.id} with PaymentIntent {payment_intent.id}"
        )
        
        return {
            "order_id": order.id,
            "payment_intent_id": payment_intent.id,
            "client_secret": payment_intent.client_secret,
            "amount": order.total,
            "currency": order.currency
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating PaymentIntent: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Payment service error: {str(e)}"
        )


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get an order by ID."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    order = await get_order_by_id(db, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.get("/{order_id}/tickets", response_model=List[Ticket])
async def get_order_tickets(order_id: str):
    """
    Get all tickets for an order.
    
    Returns tickets only if the order is paid.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    order = await get_order_by_id(db, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != OrderStatus.PAID:
        raise HTTPException(
            status_code=400,
            detail="Tickets are only available for paid orders"
        )
    
    tickets = await get_tickets_by_order(db, order_id)
    
    return tickets


@router.get("/{order_id}/status", response_model=dict)
async def get_order_status(order_id: str):
    """Get the current status of an order."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    order = await get_order_by_id(db, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_id": order.id,
        "status": order.status,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "tickets_generated": order.tickets_generated
    }


@router.post("/validate-ticket", response_model=dict)
async def validate_ticket_endpoint(qr_code: str, event_id: str):
    """
    Validate a ticket by QR code.
    Used by venue staff to verify ticket validity.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    result = await validate_ticket(db, qr_code, event_id)
    
    return result


@router.post("/mark-ticket-used/{ticket_id}", response_model=dict)
async def mark_ticket_used_endpoint(ticket_id: str):
    """
    Mark a ticket as used (scanned at venue).
    Should be called after successful validation.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    success = await mark_ticket_as_used(db, ticket_id)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Could not mark ticket as used. It may already be used or invalid."
        )
    
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": "Ticket marked as used"
    }
