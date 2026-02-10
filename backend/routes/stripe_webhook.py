from fastapi import APIRouter, Request, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
import stripe
import os
import logging
from datetime import datetime, timezone
from typing import Optional

from models.order import WebhookEvent, OrderStatus
from services.order_service import (
    get_order_by_payment_intent,
    mark_order_as_paid,
    mark_tickets_generated,
    generate_tickets_for_order
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Database reference (will be set from main app)
db: Optional[AsyncIOMotorDatabase] = None


def set_database(database: AsyncIOMotorDatabase):
    """Set the database reference for the webhook router."""
    global db
    db = database


async def is_event_processed(event_id: str) -> bool:
    """
    Check if a webhook event has already been processed.
    This ensures idempotency - we don't process the same event twice.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    existing = await db.webhook_events.find_one({"id": event_id})
    return existing is not None and existing.get("processed", False)


async def record_webhook_event(
    event_id: str,
    event_type: str,
    payment_intent_id: Optional[str] = None,
    processed: bool = False
):
    """Record a webhook event for idempotency tracking."""
    if db is None:
        return
    
    event = WebhookEvent(
        id=event_id,
        type=event_type,
        payment_intent_id=payment_intent_id,
        processed=processed,
        processed_at=datetime.now(timezone.utc) if processed else None
    )
    
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('processed_at'):
        doc['processed_at'] = doc['processed_at'].isoformat()
    
    # Upsert to handle race conditions
    await db.webhook_events.update_one(
        {"id": event_id},
        {"$set": doc},
        upsert=True
    )


async def mark_event_processed(event_id: str):
    """Mark a webhook event as successfully processed."""
    if db is None:
        return
    
    await db.webhook_events.update_one(
        {"id": event_id},
        {
            "$set": {
                "processed": True,
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """
    Handle Stripe webhook events.
    
    This endpoint:
    1. Validates the Stripe signature
    2. Checks for idempotency (event not already processed)
    3. Handles payment_intent.succeeded events
    4. Updates order status and generates tickets
    
    Stripe will retry webhooks that return 4xx/5xx errors.
    """
    if db is None:
        logger.error("Database not initialized for webhook handler")
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get Stripe webhook secret from environment
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(
            status_code=500, 
            detail="Webhook secret not configured"
        )
    
    # Get raw body for signature verification
    try:
        payload = await request.body()
    except Exception as e:
        logger.error(f"Error reading request body: {e}")
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    # Verify Stripe signature
    if not stripe_signature:
        logger.warning("Missing Stripe-Signature header")
        raise HTTPException(status_code=400, detail="Missing signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=webhook_secret
        )
    except stripe.error.SignatureVerificationError as e:
        logger.warning(f"Invalid Stripe signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Error constructing webhook event: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    
    event_id = event.get("id")
    event_type = event.get("type")
    
    logger.info(f"Received Stripe webhook: {event_type} (ID: {event_id})")
    
    # Check idempotency - has this event already been processed?
    if await is_event_processed(event_id):
        logger.info(f"Event {event_id} already processed, skipping")
        return {"status": "already_processed", "event_id": event_id}
    
    # Record the event (before processing)
    payment_intent_id = None
    if event_type == "payment_intent.succeeded":
        payment_intent_id = event.get("data", {}).get("object", {}).get("id")
    
    await record_webhook_event(
        event_id=event_id,
        event_type=event_type,
        payment_intent_id=payment_intent_id,
        processed=False
    )
    
    # Handle specific event types
    if event_type == "payment_intent.succeeded":
        result = await handle_payment_intent_succeeded(event)
        
        # Mark event as processed
        await mark_event_processed(event_id)
        
        return result
    
    # For other event types, just acknowledge receipt
    logger.info(f"Unhandled event type: {event_type}")
    await mark_event_processed(event_id)
    
    return {"status": "received", "event_type": event_type}


async def handle_payment_intent_succeeded(event: dict) -> dict:
    """
    Handle the payment_intent.succeeded event.
    
    This function:
    1. Retrieves the order by payment_intent_id
    2. Verifies the paid amount matches the order total
    3. Updates order status to "paid"
    4. Generates tickets with unique QR codes
    
    Ensures idempotency - tickets are only generated once.
    """
    payment_intent = event.get("data", {}).get("object", {})
    payment_intent_id = payment_intent.get("id")
    amount_received = payment_intent.get("amount_received", 0)
    currency = payment_intent.get("currency", "").upper()
    payment_method_type = payment_intent.get("payment_method_types", ["card"])[0]
    
    logger.info(
        f"Processing payment_intent.succeeded: {payment_intent_id}, "
        f"amount: {amount_received} {currency}"
    )
    
    if not payment_intent_id:
        logger.error("No payment_intent_id in event")
        raise HTTPException(status_code=400, detail="Missing payment_intent_id")
    
    # Get the order associated with this payment intent
    order = await get_order_by_payment_intent(db, payment_intent_id)
    
    if not order:
        logger.warning(f"No order found for payment_intent: {payment_intent_id}")
        # Return 200 to acknowledge receipt - order might be from a different source
        return {
            "status": "no_order_found",
            "payment_intent_id": payment_intent_id
        }
    
    # Verify the order hasn't already been processed (belt and suspenders)
    if order.status == OrderStatus.PAID and order.tickets_generated:
        logger.info(f"Order {order.id} already paid and tickets generated")
        return {
            "status": "already_processed",
            "order_id": order.id
        }
    
    # Verify the paid amount matches the order total
    # Note: Stripe amounts are in smallest currency unit (cents/centavos)
    if amount_received != order.total:
        logger.error(
            f"Amount mismatch for order {order.id}: "
            f"expected {order.total}, received {amount_received}"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Amount mismatch: expected {order.total}, received {amount_received}"
        )
    
    # Verify currency matches
    if currency != order.currency:
        logger.error(
            f"Currency mismatch for order {order.id}: "
            f"expected {order.currency}, received {currency}"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Currency mismatch: expected {order.currency}, received {currency}"
        )
    
    # Update order status to paid
    paid_success = await mark_order_as_paid(
        db=db,
        order_id=order.id,
        payment_method=payment_method_type
    )
    
    if not paid_success:
        # Order might already be paid (race condition)
        logger.info(f"Order {order.id} status update returned false - might already be paid")
    
    # Check if tickets were already generated (idempotency)
    # Refresh order data
    order = await get_order_by_payment_intent(db, payment_intent_id)
    
    if order and order.tickets_generated:
        logger.info(f"Tickets already generated for order {order.id}")
        return {
            "status": "success",
            "order_id": order.id,
            "tickets_generated": True,
            "message": "Tickets were already generated"
        }
    
    # Generate tickets with unique QR codes
    try:
        tickets = await generate_tickets_for_order(db, order)
        
        # Mark tickets as generated (idempotency flag)
        await mark_tickets_generated(db, order.id)
        
        logger.info(
            f"Successfully processed payment for order {order.id}, "
            f"generated {len(tickets)} tickets"
        )
        
        return {
            "status": "success",
            "order_id": order.id,
            "tickets_generated": True,
            "ticket_count": len(tickets)
        }
        
    except Exception as e:
        logger.error(f"Error generating tickets for order {order.id}: {e}")
        # Re-raise to trigger Stripe retry
        raise HTTPException(
            status_code=500,
            detail=f"Error generating tickets: {str(e)}"
        )
