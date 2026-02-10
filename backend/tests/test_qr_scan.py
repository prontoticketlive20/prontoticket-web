"""
Test script for QR code scanning and validation.
Tests the complete flow: scan -> validate signature -> mark as used -> prevent double entry
"""
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

from models.order import Order, OrderItem, OrderStatus, TicketStatus
from services.order_service import (
    generate_tickets_for_order,
    scan_and_validate_ticket
)
from services.qr_service import generate_signed_ticket_qr_data


async def test_qr_scan_validation():
    """Test complete QR scan and validation flow."""
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    print("=" * 70)
    print("TESTING QR CODE SCANNING AND VALIDATION")
    print("=" * 70)
    
    # 1. Setup: Create test order and generate tickets
    print("\n1. Setting up test data...")
    
    test_order_id = f"test-scan-{uuid.uuid4().hex[:8]}"
    test_event_id = "event-scan-test-001"
    
    order = Order(
        id=test_order_id,
        event_id=test_event_id,
        event_title="Test Event - QR Scanning",
        event_date="2025-06-15",
        event_time="20:00",
        venue="Test Venue",
        city="Ciudad de México",
        country="México",
        items=[
            OrderItem(id="item-1", ticket_type="General", quantity=2, unit_price=50000),
        ],
        subtotal=100000,
        service_fee=15000,
        tax=18400,
        total=133400,
        currency="MXN",
        buyer_first_name="Juan",
        buyer_last_name="Pérez",
        buyer_email="juan@test.com",
        buyer_phone="+52 55 1234 5678",
        status=OrderStatus.PAID
    )
    
    # Save order
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Generate tickets
    tickets = await generate_tickets_for_order(db, order)
    
    print(f"   ✓ Created order: {test_order_id}")
    print(f"   ✓ Generated {len(tickets)} tickets")
    
    # 2. Generate QR code data for first ticket
    print("\n2. Generating signed QR code data...")
    
    ticket = tickets[0]
    qr_data = generate_signed_ticket_qr_data(
        ticket_id=ticket.id,
        order_id=order.id,
        event_id=test_event_id,
        unique_code=ticket.qr_code
    )
    
    print(f"   ✓ QR Data: {qr_data[:60]}...")
    
    # 3. Test: First scan - should grant access
    print("\n3. Testing FIRST SCAN (should grant access)...")
    
    result1 = await scan_and_validate_ticket(db, qr_data, test_event_id)
    
    print(f"   Access Granted: {result1['access_granted']}")
    print(f"   Message: {result1['message']}")
    
    if result1['access_granted']:
        print(f"   ✓ Ticket Type: {result1['ticket_info']['ticket_type']}")
        print(f"   ✓ Holder: {result1['ticket_info']['holder_name']}")
        print(f"   ✓ Signature Verified: {result1.get('signature_verified')}")
    
    assert result1['access_granted'] == True, "First scan should grant access!"
    
    # 4. Test: Second scan - should deny access (already used)
    print("\n4. Testing SECOND SCAN (should deny - already used)...")
    
    result2 = await scan_and_validate_ticket(db, qr_data, test_event_id)
    
    print(f"   Access Granted: {result2['access_granted']}")
    print(f"   Message: {result2['message']}")
    print(f"   Error Code: {result2.get('error_code')}")
    
    if result2.get('first_scan_at'):
        print(f"   ✓ First scan was at: {result2['first_scan_at']}")
    
    assert result2['access_granted'] == False, "Second scan should deny access!"
    assert result2['error_code'] == 'ALREADY_USED', "Should return ALREADY_USED error!"
    
    # 5. Test: Third scan - still denied (idempotent)
    print("\n5. Testing THIRD SCAN (idempotent - still denied)...")
    
    result3 = await scan_and_validate_ticket(db, qr_data, test_event_id)
    
    print(f"   Access Granted: {result3['access_granted']}")
    print(f"   Error Code: {result3.get('error_code')}")
    
    assert result3['access_granted'] == False, "Third scan should still deny!"
    assert result3['error_code'] == 'ALREADY_USED', "Error code should be consistent!"
    
    # 6. Test: Wrong event - should deny
    print("\n6. Testing WRONG EVENT (should deny)...")
    
    ticket2 = tickets[1]
    qr_data2 = generate_signed_ticket_qr_data(
        ticket_id=ticket2.id,
        order_id=order.id,
        event_id=test_event_id,
        unique_code=ticket2.qr_code
    )
    
    result_wrong = await scan_and_validate_ticket(db, qr_data2, "wrong-event-id")
    
    print(f"   Access Granted: {result_wrong['access_granted']}")
    print(f"   Error Code: {result_wrong.get('error_code')}")
    
    assert result_wrong['access_granted'] == False, "Wrong event should deny!"
    assert result_wrong['error_code'] == 'WRONG_EVENT', "Should return WRONG_EVENT error!"
    
    # 7. Test: Invalid QR format
    print("\n7. Testing INVALID QR FORMAT (should deny)...")
    
    result_invalid = await scan_and_validate_ticket(db, "INVALID|QR|DATA", test_event_id)
    
    print(f"   Access Granted: {result_invalid['access_granted']}")
    print(f"   Error Code: {result_invalid.get('error_code')}")
    
    assert result_invalid['access_granted'] == False, "Invalid QR should deny!"
    assert result_invalid['error_code'] == 'INVALID_QR_FORMAT', "Should return INVALID_QR_FORMAT!"
    
    # 8. Test: Second ticket still works
    print("\n8. Testing SECOND TICKET (should still work)...")
    
    result_ticket2 = await scan_and_validate_ticket(db, qr_data2, test_event_id)
    
    print(f"   Access Granted: {result_ticket2['access_granted']}")
    print(f"   Message: {result_ticket2['message']}")
    
    assert result_ticket2['access_granted'] == True, "Second ticket should still work!"
    
    # 9. Cleanup
    print("\n9. Cleaning up test data...")
    
    await db.orders.delete_one({"id": test_order_id})
    await db.tickets.delete_many({"order_id": test_order_id})
    
    print("   ✓ Test data cleaned up")
    
    print("\n" + "=" * 70)
    print("ALL TESTS PASSED ✓")
    print("=" * 70)
    print("\nValidation Flow Summary:")
    print("  1. Parse QR code data")
    print("  2. Verify cryptographic signature (HMAC-SHA256)")
    print("  3. Retrieve ticket from database")
    print("  4. Validate event match")
    print("  5. Check ticket status (valid/used/cancelled/expired)")
    print("  6. Atomically mark as USED (idempotent)")
    print("  7. Return access granted/denied")
    print("\nIdempotent Behavior:")
    print("  - First scan: ACCESS GRANTED, mark as USED")
    print("  - Second+ scan: ACCESS DENIED, no state change")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(test_qr_scan_validation())
