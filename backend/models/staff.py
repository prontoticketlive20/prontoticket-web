"""
Staff authentication and scan logging models.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid


class StaffRole(str, Enum):
    ADMIN = "admin"
    SCANNER = "scanner"
    SUPERVISOR = "supervisor"


class Staff(BaseModel):
    """Staff member model."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    full_name: str
    role: StaffRole = StaffRole.SCANNER
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StaffLogin(BaseModel):
    """Staff login request."""
    username: str
    password: str


class StaffSession(BaseModel):
    """Staff session after login."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_id: str
    staff_name: str
    staff_role: StaffRole
    event_id: Optional[str] = None
    function_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScanLog(BaseModel):
    """Log entry for each ticket scan."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Scan info
    event_id: str
    function_id: Optional[str] = None
    ticket_id: Optional[str] = None
    qr_data: str
    
    # Result
    access_granted: bool
    error_code: Optional[str] = None
    message: str
    
    # Staff info
    staff_id: str
    staff_name: str
    
    # Ticket holder info (if found)
    holder_name: Optional[str] = None
    ticket_type: Optional[str] = None
    
    # Timestamps
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScanStats(BaseModel):
    """Scan statistics for an event."""
    event_id: str
    function_id: Optional[str] = None
    total_scans: int = 0
    successful_scans: int = 0
    denied_scans: int = 0
    unique_tickets_used: int = 0
