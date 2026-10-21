
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    # Entering TestClient's context runs the app startup lifecycle.
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["model_loaded"] is True


def test_root_endpoint(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Credit Risk ML System API"


def test_model_info_endpoint(client):
    response = client.get("/model-info")

    assert response.status_code == 200

    result = response.json()
    assert result["model_name"] == "Calibrated Random Forest"
    assert result["decision_threshold"] == 0.55


def test_predict_endpoint(client):
    payload = {
        "person_age": 25,
        "person_income": 60000,
        "person_home_ownership": "RENT",
        "person_emp_length": 3,
        "loan_intent": "EDUCATION",
        "loan_grade": "B",
        "loan_amnt": 8000,
        "loan_int_rate": 10.5,
        "loan_percent_income": 0.13,
        "cb_person_default_on_file": "N",
        "cb_person_cred_hist_length": 4,
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 200

    result = response.json()
    assert result["model_name"] == "Calibrated Random Forest"
    assert 0 <= result["default_probability"] <= 1
    assert result["decision_threshold"] == 0.55
    assert result["predicted_class"] in [0, 1]
    assert result["risk_category"] in [
        "HIGHER_PREDICTED_RISK",
        "LOWER_PREDICTED_RISK",
    ]


def test_predict_rejects_invalid_age(client):
    payload = {
        "person_age": 15,
        "person_income": 60000,
        "person_home_ownership": "RENT",
        "person_emp_length": 3,
        "loan_intent": "EDUCATION",
        "loan_grade": "B",
        "loan_amnt": 8000,
        "loan_int_rate": 10.5,
        "loan_percent_income": 0.13,
        "cb_person_default_on_file": "N",
        "cb_person_cred_hist_length": 4,
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 422


def _audit_valid_payload():
    return {
        "person_age": 25,
        "person_income": 60000,
        "person_home_ownership": "RENT",
        "person_emp_length": 3,
        "loan_intent": "EDUCATION",
        "loan_grade": "B",
        "loan_amnt": 8000,
        "loan_int_rate": 10.5,
        "loan_percent_income": 0.13,
        "cb_person_default_on_file": "N",
        "cb_person_cred_hist_length": 4,
    }


def test_audit_rejects_negative_income(client):
    payload = _audit_valid_payload()
    payload["person_income"] = -100
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_audit_rejects_invalid_loan_grade(client):
    payload = _audit_valid_payload()
    payload["loan_grade"] = "Z"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_audit_rejects_missing_required_field(client):
    payload = _audit_valid_payload()
    payload.pop("loan_amnt")
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_audit_rejects_extra_field(client):
    payload = _audit_valid_payload()
    payload["unexpected_field"] = "not allowed"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
