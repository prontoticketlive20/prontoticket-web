from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone

# Import routers
from routes import (
    stripe_webhook_router,
    set_webhook_db,
    orders_router,
    set_orders_db,
    checkin_router,
    set_checkin_db
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Set database for routers
set_webhook_db(db)
set_orders_db(db)
set_checkin_db(db)

# Create the main app without a prefix
app = FastAPI(
    title="ProntoTicketLive API",
    description="Event ticketing platform API",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models for basic status check
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# Basic routes
@api_router.get("/")
async def root():
    return {"message": "ProntoTicketLive API", "status": "online"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Include routers
api_router.include_router(orders_router)
api_router.include_router(stripe_webhook_router)
api_router.include_router(checkin_router)

# Include the main API router in the app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_db_client():
    """Create indexes on startup for better query performance."""
    try:
        # Orders indexes
        await db.orders.create_index("id", unique=True)
        await db.orders.create_index("payment_intent_id")
        await db.orders.create_index("buyer_email")
        await db.orders.create_index("status")
        
        # Tickets indexes
        await db.tickets.create_index("id", unique=True)
        await db.tickets.create_index("order_id")
        await db.tickets.create_index("qr_code", unique=True)
        await db.tickets.create_index("event_id")
        
        # Webhook events index (for idempotency)
        await db.webhook_events.create_index("id", unique=True)
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
