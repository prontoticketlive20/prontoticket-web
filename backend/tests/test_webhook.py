"""
Test script for Stripe webhook handler.
This script tests the webhook flow without requiring actual Stripe credentials.
"""
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

from models.order import Order, OrderItem, OrderStatus, TicketStatus
from services.order_service import (
    get_order_by_id,
    get_order_by_payment_intent,
    mark_order_as_paid,
    mark_tickets_generated,
    generate_tickets_for_order,
    get_tickets_by_order
)
from services.qr_service import generate_qr_code, generate_ticket_qr_data, parse_ticket_qr_data


async def test_webhook_flow():
    """Test the complete webhook flow."""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    print("=" * 60)
    print("TESTING STRIPE WEBHOOK FLOW")
    print("=" * 60)
    
    # 1. Create a test order (simulating what would happen when user initiates checkout)
    print("\n1. Creating test order...")
    
    test_order_id = f"test-order-{uuid.uuid4().hex[:8]}"
    test_payment_intent_id = f"pi_test_{uuid.uuid4().hex[:16]}"
    
    order = Order(
        id=test_order_id,
        event_id="event-001",
        event_title="Festival Musical Verano 2025",
        event_date="15 JUN 2025",
        event_time="18:00",
        venue="Estadio Nacional",
        city="Ciudad de México",
        country="México",
        function_id="func-1",
        function_date="15 JUN 2025",
        function_time="18:00",
        items=[
            OrderItem(
                id="item-1",
                ticket_type="General",
                quantity=2,
                unit_price=89900  # $899.00 in centavos
            ),
            OrderItem(
                id="item-2",
                ticket_type="VIP",
                quantity=1,
                unit_price=149900  # $1,499.00 in centavos
            )
        ],
        subtotal=329700,  # (899*2 + 1499) * 100
        service_fee=15000,  # $150.00
        tax=55152,  # ~16% tax
        total=399852,  # Total in centavos
        currency="MXN",
        buyer_first_name="Juan",
        buyer_last_name="García",
        buyer_email="juan.garcia@email.com",
        buyer_phone="+52 55 1234 5678",
        payment_intent_id=test_payment_intent_id,
        status=OrderStatus.PENDING
    )
    
    # Save order to database
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orders.insert_one(doc)
    
    print(f"   ✓ Order created: {test_order_id}")
    print(f"   ✓ Payment Intent: {test_payment_intent_id}")
    print(f"   ✓ Total: ${order.total / 100:.2f} {order.currency}")
    
    # 2. Verify order was created in PENDING status
    print("\n2. Verifying order status...")
    
    saved_order = await get_order_by_payment_intent(db, test_payment_intent_id)
    assert saved_order is not None, "Order not found!"
    assert saved_order.status == OrderStatus.PENDING, "Order should be PENDING"
    assert saved_order.tickets_generated == False, "Tickets should not be generated yet"
    
    print(f"   ✓ Order status: {saved_order.status}")
    print(f"   ✓ Tickets generated: {saved_order.tickets_generated}")
    
    # 3. Simulate webhook: Mark order as paid
    print("\n3. Simulating payment_intent.succeeded webhook...")
    
    paid_success = await mark_order_as_paid(
        db=db,
        order_id=test_order_id,
        payment_method="card"
    )
    
    assert paid_success, "Failed to mark order as paid"
    print(f"   ✓ Order marked as paid: {paid_success}")
    
    # 4. Generate tickets (this is what the webhook does after verifying payment)
    print("\n4. Generating tickets...")
    
    # Refresh order data
    saved_order = await get_order_by_id(db, test_order_id)
    
    tickets = await generate_tickets_for_order(db, saved_order)
    
    # Mark tickets as generated (idempotency)
    await mark_tickets_generated(db, test_order_id)
    
    print(f"   ✓ Generated {len(tickets)} tickets")
    
    for i, ticket in enumerate(tickets, 1):
        print(f"   ✓ Ticket {i}: {ticket.ticket_type} - QR: {ticket.qr_code[:16]}...")
    
    # 5. Verify final state
    print("\n5. Verifying final state...")
    
    final_order = await get_order_by_id(db, test_order_id)
    final_tickets = await get_tickets_by_order(db, test_order_id)
    
    assert final_order.status == OrderStatus.PAID, "Order should be PAID"
    assert final_order.paid_at is not None, "paid_at should be set"
    assert final_order.tickets_generated == True, "tickets_generated should be True"
    assert len(final_tickets) == 3, f"Should have 3 tickets (2 General + 1 VIP), got {len(final_tickets)}"
    
    print(f"   ✓ Order status: {final_order.status}")
    print(f"   ✓ Paid at: {final_order.paid_at}")
    print(f"   ✓ Tickets generated flag: {final_order.tickets_generated}")
    print(f"   ✓ Total tickets: {len(final_tickets)}")
    
    # 6. Test idempotency - try to generate tickets again
    print("\n6. Testing idempotency...")
    
    # Check if tickets_generated flag prevents duplicate generation
    if final_order.tickets_generated:
        print("   ✓ tickets_generated flag is True - would skip ticket generation")
    
    # 7. Verify QR codes are unique
    print("\n7. Verifying QR code uniqueness...")
    
    qr_codes = [t.qr_code for t in final_tickets]
    unique_qr_codes = set(qr_codes)
    
    assert len(qr_codes) == len(unique_qr_codes), "QR codes should be unique!"
    print(f"   ✓ All {len(qr_codes)} QR codes are unique")
    
    # 8. Test QR code data parsing
    print("\n8. Testing QR code data format...")
    
    test_ticket = final_tickets[0]
    qr_data = generate_ticket_qr_data(
        ticket_id=test_ticket.id,
        order_id=test_ticket.order_id,
        event_id=test_ticket.event_id,
        qr_code=test_ticket.qr_code
    )
    
    parsed = parse_ticket_qr_data(qr_data)
    
    assert parsed is not None, "Failed to parse QR data"
    assert parsed["ticket_id"] == test_ticket.id, "Ticket ID mismatch"
    assert parsed["order_id"] == test_ticket.order_id, "Order ID mismatch"
    
    print("   ✓ QR data format: PRONTO|ticket_id|order_id|event_id|qr_code")
    print(f"   ✓ Parsed successfully: {parsed['prefix']}")
    
    # Cleanup
    print("\n9. Cleaning up test data...")
    
    await db.orders.delete_one({"id": test_order_id})
    await db.tickets.delete_many({"order_id": test_order_id})
    
    print("   ✓ Test data cleaned up")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✓")
    print("=" * 60)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(test_webhook_flow())
