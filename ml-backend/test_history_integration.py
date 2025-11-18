"""Integration test for FastAPI prediction history persistence.

Run with:
    python -m pytest ml-backend/test_history_integration.py -q
"""

from fastapi.testclient import TestClient
from api import app, init_db

client = TestClient(app)

def sample_patient():
    return {
        "age": 63,
        "sex": 1,
        "cp": 3,
        "trestbps": 145,
        "chol": 233,
        "fbs": 1,
        "restecg": 0,
        "thalach": 150,
        "exang": 0,
        "oldpeak": 2.3,
        "slope": 0,
        "ca": 0,
        "thal": 1
    }

def test_predict_and_history_roundtrip():
    # Reset DB for clean slate
    init_db(reset=True)
    user_id = "itest-user-123"

    # Make multiple predictions
    for i in range(3):
        resp = client.post("/predict", json=sample_patient(), headers={"X-User-Id": user_id})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "risk_level" in data
        assert "timestamp" in data

    # Fetch history
    hist_resp = client.get(f"/history/{user_id}?limit=10")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert history["user_id"] == user_id
    assert history["count"] == 3
    assert len(history["predictions"]) == 3
    # Ensure latest prediction first (IDs descending by insertion order)
    ids = [p["id"] for p in history["predictions"]]
    assert ids[0] != ids[-1]

def test_history_empty_user():
    init_db(reset=True)
    user_id = "no-preds-user"
    hist_resp = client.get(f"/history/{user_id}?limit=5")
    assert hist_resp.status_code == 200
    data = hist_resp.json()
    assert data["user_id"] == user_id
    assert data["count"] == 0
    assert data["predictions"] == []
