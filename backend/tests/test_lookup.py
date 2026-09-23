import pytest
from unittest.mock import AsyncMock
from services.constituency_lookup import constituency_lookup
from services.db_service import DatabaseService

def test_lookup_success():
    # Inside TN-011 Dr. Radhakrishnan Nagar (13.11 to 13.14, 80.26 to 80.29)
    result = constituency_lookup.lookup(lat=13.1200, lon=80.2700)
    assert result is not None
    assert result["constituency_id"] == "TN-011"
    assert result["constituency_name"] == "Dr. Radhakrishnan Nagar"

def test_lookup_fail():
    # Outside all Mock constituencies
    result = constituency_lookup.lookup(lat=10.0, lon=70.0)
    assert result is None

@pytest.fixture
def mock_db_service():
    service = DatabaseService()
    service.db = AsyncMock()
    return service

@pytest.mark.asyncio
async def test_dedup_query(mock_db_service):
    # Mock find_one to return a detection
    mock_db_service.db.detections.find_one = AsyncMock(return_value={"id": "test_123", "status": "reported"})
    
    doc = await mock_db_service.find_recent_nearby_detection(lat=13.12, lon=80.27)
    assert doc is not None
    assert doc["id"] == "test_123"
    
    args, kwargs = mock_db_service.db.detections.find_one.call_args
    query = args[0]
    assert "location" in query
    assert query["location"]["$nearSphere"]["$geometry"]["coordinates"] == [80.27, 13.12]
