from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    EXPIRED = "expired"


class TicketStatus(str, Enum):
    VALID = "valid"
    USED = "used"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class OrderItem(BaseModel):
    """Individual item in an order (ticket type or seat)"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_type: str  # e.g., "General", "VIP", "Platino"
    quantity: int
    unit_price: int  # Price in smallest currency unit (cents/centavos)
    
    # For seated events
    seat_id: Optional[str] = None
    section: Optional[str] = None
    row: Optional[str] = None
    seat_number: Optional[str] = None


class OrderCreate(BaseModel):
    """Schema for creating a new order"""
    event_id: str
    event_title: str
    event_date: str
    event_time: str
    venue: str
    city: str
    country: str = "México"
    
    # Selected function for multi-function events
    function_id: Optional[str] = None
    function_date: Optional[str] = None
    function_time: Optional[str] = None
    
    # Items in the order
    items: List[OrderItem]
    
    # Pricing
    subtotal: int  # In smallest currency unit
    service_fee: int
    tax: int
    total: int
    currency: str = "MXN"
    
    # Buyer information
    buyer_first_name: str
    buyer_last_name: str
    buyer_email: str
    buyer_phone: str


class Order(BaseModel):
    """Full order model with all fields"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Event information
    event_id: str
    event_title: str
    event_date: str
    event_time: str
    venue: str
    city: str
    country: str = "México"
    
    # Function information (for multi-function events)
    function_id: Optional[str] = None
    function_date: Optional[str] = None
    function_time: Optional[str] = None
    
    # Order items
    items: List[OrderItem]
    
    # Pricing
    subtotal: int
    service_fee: int
    tax: int
    total: int
    currency: str = "MXN"
    
    # Buyer information
    buyer_first_name: str
    buyer_last_name: str
    buyer_email: str
    buyer_phone: str
    
    # Payment information
    payment_intent_id: Optional[str] = None
    payment_method: Optional[str] = None
    
    # Status
    status: OrderStatus = OrderStatus.PENDING
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Idempotency - track if tickets were already generated
    tickets_generated: bool = False


class Ticket(BaseModel):
    """Individual ticket associated with an order"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Reference to order
    order_id: str
    order_item_id: str
    
    # Event information (denormalized for quick access)
    event_id: str
    event_title: str
    event_date: str
    event_time: str
    venue: str
    city: str
    
    # Function information
    function_id: Optional[str] = None
    function_date: Optional[str] = None
    function_time: Optional[str] = None
    
    # Ticket details
    ticket_type: str
    price: int
    currency: str = "MXN"
    
    # For seated events
    seat_id: Optional[str] = None
    section: Optional[str] = None
    row: Optional[str] = None
    seat_number: Optional[str] = None
    
    # Holder information
    holder_first_name: str
    holder_last_name: str
    holder_email: str
    
    # QR Code - unique code for validation
    qr_code: str = Field(default_factory=lambda: str(uuid.uuid4()))
    qr_code_data: Optional[str] = None  # Base64 encoded QR image
    
    # Status
    status: TicketStatus = TicketStatus.VALID
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    used_at: Optional[datetime] = None
    
    # Ticket number for display
    ticket_number: int = 1  # Sequential number within the order


class TicketValidation(BaseModel):
    """Response for ticket validation"""
    valid: bool
    message: str
    ticket: Optional[Ticket] = None


class WebhookEvent(BaseModel):
    """Stripe webhook event record for idempotency"""
    model_config = ConfigDict(extra="ignore")
    
    id: str  # Stripe event ID
    type: str
    payment_intent_id: Optional[str] = None
    processed: bool = False
    processed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
