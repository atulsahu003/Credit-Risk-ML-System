
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, model_validator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = PROJECT_ROOT / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "credit_risk_model.joblib"
METADATA_PATH = ARTIFACT_DIR / "model_metadata.json"

model = None
metadata = None


class ApplicantInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    person_age: int = Field(ge=18, le=100)
    person_income: float = Field(gt=0, le=100_000_000)
    person_home_ownership: Literal["RENT", "OWN", "MORTGAGE", "OTHER"]
    person_emp_length: float | None = Field(default=None, ge=0, le=80)
    loan_intent: Literal[
        "PERSONAL",
        "EDUCATION",
        "MEDICAL",
        "VENTURE",
        "HOMEIMPROVEMENT",
        "DEBTCONSOLIDATION",
    ]
    loan_grade: Literal["A", "B", "C", "D", "E", "F", "G"]
    loan_amnt: float = Field(gt=0, le=1_000_000)
    loan_int_rate: float | None = Field(default=None, ge=0, le=100)
    loan_percent_income: float = Field(ge=0, le=1)
    cb_person_default_on_file: Literal["Y", "N"]
    cb_person_cred_hist_length: int = Field(ge=0, le=100)

    @model_validator(mode="after")
    def validate_employment_length(self):
        if (
            self.person_emp_length is not None
            and self.person_emp_length > self.person_age
        ):
            raise ValueError("Employment length cannot exceed age.")
        return self


class PredictionResponse(BaseModel):
    model_name: str
    default_probability: float
    decision_threshold: float
    predicted_class: int
    risk_category: str
    disclaimer: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, metadata

    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    if not METADATA_PATH.exists():
        raise RuntimeError(f"Metadata file not found: {METADATA_PATH}")

    logger.info("Loading trained model...")
    model = joblib.load(MODEL_PATH)

    with METADATA_PATH.open("r", encoding="utf-8") as file:
        metadata = json.load(file)

    logger.info("Model loaded successfully.")
    yield


app = FastAPI(
    title="Credit Risk ML System",
    description="Credit default risk prediction API",
    version="1.0.0",
    lifespan=lifespan,
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "https://credit-risk-ml-system.pages.dev",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)




@app.get("/")
def root():
    return {
        "message": "Credit Risk ML System API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy" if model is not None else "not_ready",
        "model_loaded": model is not None,
    }


@app.get("/model-info")
def model_info():
    if metadata is None:
        raise HTTPException(status_code=503, detail="Model metadata not loaded.")

    return metadata


@app.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantInput):
    if model is None or metadata is None:
        raise HTTPException(status_code=503, detail="Model is not ready.")

    try:
        applicant_df = pd.DataFrame([applicant.model_dump()])

        probabilities = model.predict_proba(applicant_df)[0]
        classes = list(model.classes_)
        positive_index = classes.index(1)

        probability = float(probabilities[positive_index])
        threshold = float(metadata.get("decision_threshold", 0.55))
        predicted_class = int(probability >= threshold)

        return PredictionResponse(
            model_name=metadata.get("model_name", "Credit Risk Model"),
            default_probability=round(probability, 6),
            decision_threshold=threshold,
            predicted_class=predicted_class,
            risk_category=(
                "HIGHER_PREDICTED_RISK"
                if predicted_class == 1
                else "LOWER_PREDICTED_RISK"
            ),
            disclaimer=(
                "Educational analytical output only; not a standalone "
                "lending decision or a guarantee of future default."
            ),
        )

    except Exception:
        logger.exception("Prediction failed.")
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check server logs.",
        ) from None
