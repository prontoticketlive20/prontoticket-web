"""
Check-in routes for staff ticket scanning.
"""
from fastapi import APIRouter, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import logging

from models.staff import (
    Staff,
    StaffRole,
    StaffLogin,
    StaffSession,
    ScanLog,
    ScanStats
)
from services.order_service import scan_and_validate_ticket

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/checkin", tags=["checkin"])

# Database reference
db: Optional[AsyncIOMotorDatabase] = None

# Simple in-memory session store (use Redis in production)
active_sessions: dict = {}


def set_database(database: AsyncIOMotorDatabase):
    """Set the database reference."""
    global db
    db = database


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return hash_password(password) == password_hash


# Request/Response models
class StaffLoginRequest(BaseModel):
    username: str
    password: str


class StaffLoginResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    staff_id: Optional[str] = None
    staff_name: Optional[str] = None
    role: Optional[str] = None
    message: str


class SelectEventRequest(BaseModel):
    event_id: str
    function_id: Optional[str] = None


class ScanRequest(BaseModel):
    qr_data: str


class EventInfo(BaseModel):
    id: str
    title: str
    date: str
    time: str
    venue: str
    city: str
    functions: Optional[List[dict]] = None


# Initialize default staff accounts
async def init_default_staff():
    """Create default staff accounts if they don't exist."""
    if db is None:
        return
    
    default_staff = [
        {
            "username": "admin",
            "password": "admin123",
            "full_name": "Administrador",
            "role": StaffRole.ADMIN.value
        },
        {
            "username": "scanner1",
            "password": "scan123",
            "full_name": "Scanner 1",
            "role": StaffRole.SCANNER.value
        },
        {
            "username": "scanner2",
            "password": "scan123",
            "full_name": "Scanner 2",
            "role": StaffRole.SCANNER.value
        }
    ]
    
    for staff_data in default_staff:
        existing = await db.staff.find_one({"username": staff_data["username"]})
        if not existing:
            staff = Staff(
                username=staff_data["username"],
                password_hash=hash_password(staff_data["password"]),
                full_name=staff_data["full_name"],
                role=StaffRole(staff_data["role"])
            )
            doc = staff.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.staff.insert_one(doc)
            logger.info(f"Created default staff: {staff_data['username']}")


@router.post("/login", response_model=StaffLoginResponse)
async def staff_login(request: StaffLoginRequest):
    """
    Staff login for check-in system.
    Returns a session token for subsequent requests.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Initialize default staff on first login attempt
    await init_default_staff()
    
    # Find staff by username
    staff_doc = await db.staff.find_one({"username": request.username}, {"_id": 0})
    
    if not staff_doc:
        return StaffLoginResponse(
            success=False,
            message="Usuario no encontrado"
        )
    
    # Verify password
    if not verify_password(request.password, staff_doc.get("password_hash", "")):
        return StaffLoginResponse(
            success=False,
            message="Contraseña incorrecta"
        )
    
    # Check if active
    if not staff_doc.get("is_active", True):
        return StaffLoginResponse(
            success=False,
            message="Cuenta desactivada"
        )
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session = StaffSession(
        staff_id=staff_doc["id"],
        staff_name=staff_doc["full_name"],
        staff_role=StaffRole(staff_doc["role"]),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=12)
    )
    
    active_sessions[session_token] = session
    
    logger.info(f"Staff login: {staff_doc['full_name']}")
    
    return StaffLoginResponse(
        success=True,
        session_token=session_token,
        staff_id=staff_doc["id"],
        staff_name=staff_doc["full_name"],
        role=staff_doc["role"],
        message="Login exitoso"
    )


@router.post("/logout")
async def staff_logout(authorization: str = Header(None)):
    """Logout and invalidate session."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        if token in active_sessions:
            del active_sessions[token]
            return {"success": True, "message": "Sesión cerrada"}
    
    return {"success": True, "message": "Sesión cerrada"}


def get_current_session(authorization: str = Header(None)) -> StaffSession:
    """Get the current staff session from authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    token = authorization[7:]
    session = active_sessions.get(token)
    
    if not session:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    
    if session.expires_at < datetime.now(timezone.utc):
        del active_sessions[token]
        raise HTTPException(status_code=401, detail="Sesión expirada")
    
    return session


@router.get("/session")
async def get_session(authorization: str = Header(None)):
    """Get current session info."""
    session = get_current_session(authorization)
    return {
        "staff_id": session.staff_id,
        "staff_name": session.staff_name,
        "role": session.staff_role.value,
        "event_id": session.event_id,
        "function_id": session.function_id
    }


@router.get("/events", response_model=List[EventInfo])
async def get_events(authorization: str = Header(None)):
    """Get list of events available for check-in."""
    session = get_current_session(authorization)
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Get events that have tickets (from orders)
    pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {
            "_id": "$event_id",
            "title": {"$first": "$event_title"},
            "date": {"$first": "$event_date"},
            "time": {"$first": "$event_time"},
            "venue": {"$first": "$venue"},
            "city": {"$first": "$city"}
        }}
    ]
    
    events = []
    async for doc in db.orders.aggregate(pipeline):
        events.append(EventInfo(
            id=doc["_id"],
            title=doc["title"],
            date=doc["date"],
            time=doc["time"],
            venue=doc["venue"],
            city=doc["city"]
        ))
    
    # If no events from orders, return mock events for testing
    if not events:
        events = [
            EventInfo(
                id="event-001",
                title="Festival Musical Verano 2025",
                date="15 JUN 2025",
                time="18:00",
                venue="Estadio Nacional",
                city="Ciudad de México"
            ),
            EventInfo(
                id="event-002",
                title="Teatro Noche de Gala",
                date="20 JUN 2025",
                time="20:00",
                venue="Teatro Principal",
                city="Ciudad de México"
            )
        ]
    
    return events


@router.post("/select-event")
async def select_event(
    request: SelectEventRequest,
    authorization: str = Header(None)
):
    """Select an event for check-in scanning."""
    session = get_current_session(authorization)
    
    # Update session with selected event
    session.event_id = request.event_id
    session.function_id = request.function_id
    
    # Update in active sessions
    for token, sess in active_sessions.items():
        if sess.staff_id == session.staff_id:
            active_sessions[token] = session
            break
    
    logger.info(f"Staff {session.staff_name} selected event {request.event_id}")
    
    return {
        "success": True,
        "event_id": request.event_id,
        "function_id": request.function_id,
        "message": "Evento seleccionado"
    }


@router.post("/scan")
async def scan_ticket(
    request: ScanRequest,
    authorization: str = Header(None)
):
    """
    Scan a ticket QR code.
    Validates the ticket and logs the scan.
    """
    session = get_current_session(authorization)
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    if not session.event_id:
        raise HTTPException(
            status_code=400, 
            detail="Debe seleccionar un evento primero"
        )
    
    # Perform scan and validation
    result = await scan_and_validate_ticket(
        db=db,
        qr_data=request.qr_data,
        event_id=session.event_id
    )
    
    # Log the scan
    scan_log = ScanLog(
        event_id=session.event_id,
        function_id=session.function_id,
        ticket_id=result.get("ticket_info", {}).get("ticket_id") if result.get("ticket_info") else None,
        qr_data=request.qr_data[:100],  # Truncate for storage
        access_granted=result.get("access_granted", False),
        error_code=result.get("error_code"),
        message=result.get("message", ""),
        staff_id=session.staff_id,
        staff_name=session.staff_name,
        holder_name=result.get("ticket_info", {}).get("holder_name") if result.get("ticket_info") else None,
        ticket_type=result.get("ticket_info", {}).get("ticket_type") if result.get("ticket_info") else None
    )
    
    log_doc = scan_log.model_dump()
    log_doc['scanned_at'] = log_doc['scanned_at'].isoformat()
    await db.scan_logs.insert_one(log_doc)
    
    return result


@router.get("/stats")
async def get_scan_stats(authorization: str = Header(None)):
    """Get scan statistics for the current event."""
    session = get_current_session(authorization)
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    if not session.event_id:
        return {
            "total_scans": 0,
            "successful_scans": 0,
            "denied_scans": 0
        }
    
    # Aggregate stats
    pipeline = [
        {"$match": {"event_id": session.event_id}},
        {"$group": {
            "_id": None,
            "total_scans": {"$sum": 1},
            "successful_scans": {"$sum": {"$cond": ["$access_granted", 1, 0]}},
            "denied_scans": {"$sum": {"$cond": ["$access_granted", 0, 1]}}
        }}
    ]
    
    result = await db.scan_logs.aggregate(pipeline).to_list(1)
    
    if result:
        return {
            "event_id": session.event_id,
            "total_scans": result[0]["total_scans"],
            "successful_scans": result[0]["successful_scans"],
            "denied_scans": result[0]["denied_scans"]
        }
    
    return {
        "event_id": session.event_id,
        "total_scans": 0,
        "successful_scans": 0,
        "denied_scans": 0
    }


@router.get("/recent-scans")
async def get_recent_scans(
    limit: int = 10,
    authorization: str = Header(None)
):
    """Get recent scan logs for the current event."""
    session = get_current_session(authorization)
    
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    query = {}
    if session.event_id:
        query["event_id"] = session.event_id
    
    cursor = db.scan_logs.find(query, {"_id": 0}).sort("scanned_at", -1).limit(limit)
    logs = await cursor.to_list(limit)
    
    return logs
