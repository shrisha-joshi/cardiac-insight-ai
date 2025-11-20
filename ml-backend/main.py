"""
═══════════════════════════════════════════════════════════════════════════════
FASTAPI ML BACKEND - Week 3 Implementation
═══════════════════════════════════════════════════════════════════════════════

RESTful API for cardiac risk prediction using trained ML models

Endpoints:
- POST /predict: Make prediction for single patient
- POST /batch-predict: Make predictions for multiple patients
- GET /health: Check API and model health
- GET /model-info: Get model metadata and performance

═══════════════════════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import numpy as np
import joblib
import keras
import os
import sqlite3
import json
from datetime import datetime
import time

# Global variables for models
models = {}
preprocessor = None
ensemble_weights = None
model_metadata = {}
# In-memory prediction history store keyed by user_id (kept as cache)
prediction_history: Dict[str, List[Dict[str, Any]]] = {}

# SQLite persistence
DB_PATH = os.path.join(os.path.dirname(__file__), "prediction_history.db")

def init_db(reset: bool = False):
    """Initialize SQLite database and tables."""
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                risk_score REAL NOT NULL,
                confidence REAL NOT NULL,
                prediction TEXT NOT NULL,
                explanation TEXT,
                recommendations TEXT,
                patient_age REAL,
                patient_gender TEXT,
                resting_bp REAL,
                cholesterol REAL,
                blood_sugar_fasting INTEGER,
                max_heart_rate REAL,
                exercise_induced_angina INTEGER,
                oldpeak REAL,
                st_slope TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()

def save_prediction_to_db(user_id: str, record: Dict[str, Any]):
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            INSERT INTO predictions (
                user_id, created_at, risk_level, risk_score, confidence, prediction,
                explanation, recommendations, patient_age, patient_gender, resting_bp,
                cholesterol, blood_sugar_fasting, max_heart_rate, exercise_induced_angina,
                oldpeak, st_slope
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                record["created_at"],
                record["risk_level"],
                record["risk_score"],
                record["confidence"],
                record["prediction"],
                record.get("explanation", ""),
                json.dumps(record.get("recommendations", [])),
                record.get("patient_age"),
                record.get("patient_gender"),
                record.get("resting_bp"),
                record.get("cholesterol"),
                1 if record.get("blood_sugar_fasting") else 0,
                record.get("max_heart_rate"),
                1 if record.get("exercise_induced_angina") else 0,
                record.get("oldpeak"),
                record.get("st_slope")
            )
        )
        conn.commit()
    finally:
        conn.close()

def fetch_history_from_db(user_id: str, limit: int) -> List[Dict[str, Any]]:
    if not os.path.exists(DB_PATH):
        return []
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute(
            "SELECT id, created_at, risk_level, risk_score, confidence, prediction, explanation, recommendations, patient_age, patient_gender, resting_bp, cholesterol, blood_sugar_fasting, max_heart_rate, exercise_induced_angina, oldpeak, st_slope FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, limit)
        )
        rows = cursor.fetchall()
        predictions_list: List[Dict[str, Any]] = []
        for row in rows:
            (
                pid, created_at, risk_level, risk_score, confidence, prediction_val,
                explanation, recommendations_json, patient_age, patient_gender, resting_bp,
                cholesterol, blood_sugar_fasting, max_hr, exercise_angina, oldpeak, st_slope
            ) = row
            predictions_list.append({
                "id": f"pred-{pid}",
                "created_at": created_at,
                "risk_level": risk_level,
                "risk_score": risk_score,
                "confidence": confidence,
                "prediction": prediction_val,
                "explanation": explanation,
                "recommendations": json.loads(recommendations_json or "[]"),
                "patient_age": patient_age,
                "patient_gender": patient_gender,
                "resting_bp": resting_bp,
                "cholesterol": cholesterol,
                "blood_sugar_fasting": bool(blood_sugar_fasting),
                "max_heart_rate": max_hr,
                "exercise_induced_angina": bool(exercise_angina),
                "oldpeak": oldpeak,
                "st_slope": st_slope
            })
        return predictions_list
    finally:
        conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context replacing deprecated startup events."""
    global models, preprocessor, ensemble_weights, model_metadata
    print("🚀 Lifespan start: loading ML models...")
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    try:
        preprocessor_path = os.path.join(model_dir, "preprocessor.pkl")
        if os.path.exists(preprocessor_path):
            preprocessor = joblib.load(preprocessor_path)
            print("✅ Loaded preprocessor")
        
        xgb_path = os.path.join(model_dir, "xgboost_model.pkl")
        if os.path.exists(xgb_path):
            models['xgboost'] = joblib.load(xgb_path)
            print("✅ Loaded XGBoost model")
            
        rf_path = os.path.join(model_dir, "random_forest_model.pkl")
        if os.path.exists(rf_path):
            models['random_forest'] = joblib.load(rf_path)
            print("✅ Loaded Random Forest model")
            
        nn_path = os.path.join(model_dir, "neural_network_model.h5")
        if os.path.exists(nn_path):
            models['neural_network'] = keras.models.load_model(nn_path)
            print("✅ Loaded Neural Network model")
            
        metrics_path = os.path.join(model_dir, "training_metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
                if 'ensemble' in metrics and 'weights' in metrics['ensemble']:
                    ensemble_weights = metrics['ensemble']['weights']
                else:
                    ensemble_weights = {
                        'xgboost': 0.40,
                        'random_forest': 0.35,
                        'neural_network': 0.25
                    }
                model_metadata = metrics
            print("✅ Loaded ensemble weights and metrics")
        else:
            ensemble_weights = {
                'xgboost': 0.40,
                'random_forest': 0.35,
                'neural_network': 0.25
            }
        print(f"✅ Successfully loaded {len(models)} models")
        init_db()
        yield
    finally:
        print("🛑 Lifespan end: cleanup complete")

# Initialize FastAPI app
app = FastAPI(
    title="Cardiac Risk Prediction API",
    description="ML-powered cardiac risk assessment using XGBoost, Random Forest, and Neural Network ensemble",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class PatientData(BaseModel):
    """Input data for single patient prediction"""
    age: float = Field(..., ge=0, le=120, description="Age in years")
    sex: int = Field(..., ge=0, le=1, description="Sex (0=female, 1=male)")
    cp: int = Field(..., ge=0, le=3, description="Chest pain type (0-3)")
    trestbps: float = Field(..., ge=0, le=300, description="Resting blood pressure (mm Hg)")
    chol: float = Field(..., ge=0, le=600, description="Serum cholesterol (mg/dl)")
    fbs: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120 mg/dl (0=no, 1=yes)")
    restecg: int = Field(..., ge=0, le=2, description="Resting ECG results (0-2)")
    thalach: float = Field(..., ge=0, le=250, description="Maximum heart rate achieved")
    exang: int = Field(..., ge=0, le=1, description="Exercise induced angina (0=no, 1=yes)")
    oldpeak: float = Field(..., ge=0, le=10, description="ST depression")
    slope: int = Field(..., ge=0, le=2, description="Slope of peak exercise ST segment (0-2)")
    ca: int = Field(..., ge=0, le=4, description="Number of major vessels colored by fluoroscopy (0-4)")
    thal: int = Field(..., ge=0, le=3, description="Thalassemia (0-3)")

    model_config = {
        "json_schema_extra": {
            "example": {
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
        }
    }

class PredictionResponse(BaseModel):
    """Response for prediction request"""
    risk_score: float = Field(..., description="Risk score (0-100)")
    risk_level: str = Field(..., description="Risk category: low, medium, high, very-high")
    confidence: float = Field(..., description="Prediction confidence (0-100)")
    model_predictions: Dict[str, float] = Field(..., description="Individual model predictions")
    ensemble_prediction: float = Field(..., description="Ensemble model prediction")
    prediction_time_ms: float = Field(..., description="Prediction latency in milliseconds")
    timestamp: str = Field(..., description="Prediction timestamp")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    models_loaded: Dict[str, bool]
    total_predictions: int
    avg_latency_ms: float
    uptime_seconds: float
    timestamp: str

class ModelInfoResponse(BaseModel):
    """Model metadata response"""
    models: Dict[str, Dict[str, Any]]
    ensemble_weights: Dict[str, float]
    total_parameters: int
    training_date: str
    version: str

def preprocess_input(patient_data: PatientData):
    """Preprocess patient data for model input"""
    # Convert to dictionary
    data = patient_data.model_dump()
    
    # Create feature array (match training feature order)
    features = np.array([[
        data['age'],
        data['sex'],
        data['cp'],
        data['trestbps'],
        data['chol'],
        data['fbs'],
        data['restecg'],
        data['thalach'],
        data['exang'],
        data['oldpeak'],
        data['slope'],
        data['ca'],
        data['thal']
    ]])
    
    # Engineer additional features (match training)
    age_group = 0 if data['age'] < 40 else 1 if data['age'] < 50 else 2 if data['age'] < 60 else 3
    chol_risk = 1 if data['chol'] > 240 else 0
    bp_risk = 1 if data['trestbps'] > 140 else 0
    predicted_max_hr = 220 - data['age']
    hr_reserve = data['thalach'] / predicted_max_hr if predicted_max_hr > 0 else 0
    composite_risk = (data['age']/100) * 0.3 + (data['trestbps']/200) * 0.3 + (data['chol']/300) * 0.4
    sex_age_interaction = data['sex'] * data['age']
    
    # Append engineered features
    engineered = np.array([[age_group, chol_risk, bp_risk, hr_reserve, composite_risk, sex_age_interaction]])
    features = np.concatenate([features, engineered], axis=1)
    
    # Scale features
    if preprocessor:
        features = preprocessor['scaler'].transform(features)
    
    return features

def get_risk_level(risk_score: float) -> str:
    """Convert risk score to risk level category"""
    if risk_score < 30:
        return "low"
    elif risk_score < 50:
        return "medium"
    elif risk_score < 70:
        return "high"
    else:
        return "very-high"

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Cardiac Risk Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/predict",
            "batch_predict": "/batch-predict",
            "health": "/health",
            "model_info": "/model-info",
            "docs": "/docs"
        }
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(patient: PatientData, request: Request):
    """
    Make cardiac risk prediction for a single patient
    
    Returns risk score (0-100), risk level, confidence, and individual model predictions
    """
    start_time = time.time()
    
    try:
        # Preprocess input
        features = preprocess_input(patient)
        
        # Get predictions from each model
        model_predictions = {}
        
        if 'xgboost' in models:
            xgb_pred = models['xgboost'].predict_proba(features)[0][1]
            model_predictions['xgboost'] = float(xgb_pred * 100)
        
        if 'random_forest' in models:
            rf_pred = models['random_forest'].predict_proba(features)[0][1]
            model_predictions['random_forest'] = float(rf_pred * 100)
        
        if 'neural_network' in models:
            nn_pred = models['neural_network'].predict(features, verbose=0)[0][0]
            model_predictions['neural_network'] = float(nn_pred * 100)
        
        # Calculate ensemble prediction
        ensemble_pred = 0.0
        if model_predictions:
            for model_name, pred in model_predictions.items():
                ensemble_pred += (pred / 100) * ensemble_weights.get(model_name, 0.33)
            
            # Normalize if weights don't sum to 1 or missing models
            total_weight = sum(ensemble_weights.get(m, 0.33) for m in model_predictions.keys())
            if total_weight > 0:
                ensemble_pred = ensemble_pred / total_weight
        else:
            # Fallback if no models loaded
            ensemble_pred = 0.5 
        
        risk_score = ensemble_pred * 100
        
        # Calculate confidence (based on agreement between models)
        if len(model_predictions) > 1:
            predictions = list(model_predictions.values())
            std_dev = np.std(predictions)
            confidence = max(0, min(100, 100 - std_dev))
        else:
            confidence = 85.0
        
        # Get risk level
        risk_level = get_risk_level(risk_score)
        
        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000
        
        response = PredictionResponse(
            risk_score=round(risk_score, 2),
            risk_level=risk_level,
            confidence=round(confidence, 2),
            model_predictions=model_predictions,
            ensemble_prediction=round(risk_score, 2),
            prediction_time_ms=round(latency_ms, 2),
            timestamp=datetime.now().isoformat()
        )

        # Store prediction in history if user id provided via header
        user_id = request.headers.get("X-User-Id")
        if user_id:
            record = {
                "id": f"pred-{int(time.time() * 1000)}",
                "created_at": response.timestamp,
                "risk_level": response.risk_level,
                "risk_score": response.risk_score,
                "confidence": response.confidence,
                "prediction": "Risk" if response.risk_level in ["high", "very-high"] else "No Risk",
                "explanation": "Ensemble prediction based on loaded models.",
                "recommendations": ["Consult cardiologist" if response.risk_level in ["high", "very-high"] else "Maintain healthy lifestyle"],
                # Minimal patient data snapshot
                "patient_age": patient.age,
                "patient_gender": "male" if patient.sex == 1 else "female",
                "resting_bp": patient.trestbps,
                "cholesterol": patient.chol,
                "blood_sugar_fasting": bool(patient.fbs),
                "max_heart_rate": patient.thalach,
                "exercise_induced_angina": bool(patient.exang),
                "oldpeak": patient.oldpeak,
                "st_slope": "flat",
            }
            history = prediction_history.setdefault(user_id, [])
            history.insert(0, record)  # most recent first
            # Keep only latest 500 entries per user to bound memory
            if len(history) > 500:
                del history[500:]
            # Persist to SQLite
            save_prediction_to_db(user_id, record)

        return response
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/batch-predict")
async def batch_predict(patients: List[PatientData]):
    """Make predictions for multiple patients"""
    results = []
    for patient in patients:
        result = await predict(patient)
        results.append(result)
    return {"predictions": results, "count": len(results)}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API and model health status"""
    
    models_loaded = {
        "xgboost": "xgboost" in models,
        "random_forest": "random_forest" in models,
        "neural_network": "neural_network" in models,
        "preprocessor": preprocessor is not None
    }
    
    return HealthResponse(
        status="healthy" if all(models_loaded.values()) else "degraded",
        models_loaded=models_loaded,
        total_predictions=0,  # TODO: Track in production
        avg_latency_ms=87.0,  # TODO: Calculate from actual metrics
        uptime_seconds=0.0,  # TODO: Track from startup
        timestamp=datetime.now().isoformat()
    )


@app.get("/model-info", response_model=ModelInfoResponse)
async def model_info():
    """Get model metadata and performance information"""
    
    model_details = {}
    total_params = 0
    
    for model_name in models.keys():
        if model_name in model_metadata:
            model_details[model_name] = model_metadata[model_name]
        else:
            model_details[model_name] = {"loaded": True}
    
    return ModelInfoResponse(
        models=model_details,
        ensemble_weights=ensemble_weights,
        total_parameters=total_params,
        training_date=datetime.now().isoformat(),
        version="1.0.0"
    )


@app.get("/history/{user_id}")
async def get_prediction_history(user_id: str, limit: int = 100):
    """Return persisted prediction history for a user (SQLite backed)."""
    db_history = fetch_history_from_db(user_id, limit)
    # Merge with any newer in-memory records not yet persisted (should be rare)
    mem_history = prediction_history.get(user_id, [])
    combined_ids = {h["id"] for h in db_history}
    combined = mem_history + [h for h in db_history if h["id"] not in combined_ids]
    # Truncate to limit
    combined = combined[:limit]
    return {
        "user_id": user_id,
        "count": len(combined),
        "predictions": combined,
        "limit": limit
    }


# Run server
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting FastAPI server...")
    print("📍 API will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
