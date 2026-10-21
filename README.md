# CreditGuard AI — Credit Risk Intelligence

An end-to-end credit risk assessment project combining a calibrated machine learning model, a FastAPI backend, Docker deployment, and a browser-based dashboard.

## Project Overview

CreditGuard AI estimates the probability of loan default from applicant and loan attributes. The dashboard provides model performance information, applicant assessment, model insights, and API status monitoring.

**Important:** This is an educational machine learning project, not a production lending decision system. Predictions may be inaccurate or biased and must not be used as the sole basis for real credit decisions.

## Features

- Calibrated Random Forest classification model
- Probability-based credit risk assessment
- FastAPI prediction API
- Input validation and error handling
- Interactive frontend dashboard
- Model performance metrics and SHAP-based global insights
- Docker-based API deployment
- Automated API tests
- Jupyter notebook for data exploration

## Model Performance

Reported held-out test-set metrics:

| Metric | Value |
|---|---:|
| ROC-AUC | 0.9388 |
| PR-AUC | 0.8939 |
| Brier Score | 0.0552 |
| Log Loss | 0.2037 |
| Configured classification threshold | 0.55 |

ROC-AUC and PR-AUC measure ranking performance. Brier Score and Log Loss evaluate probabilistic predictions; lower values are generally better.

These results describe the evaluated dataset and do not guarantee performance on new applicants.

## Technology Stack

- Python
- pandas and NumPy
- scikit-learn
- SHAP
- FastAPI and Pydantic
- Uvicorn
- Docker
- HTML, CSS, and JavaScript
- pytest

## Project Structure

```text
Credit-Risk-ML-System/
├── app/
│   └── main.py
├── artifacts/
│   ├── credit_risk_model.joblib
│   └── model_metadata.json
├── data/
│   └── credit_risk_dataset.csv
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── notebooks/
│   └── 01_data_understanding.ipynb
├── tests/
│   └── test_api.py
├── .dockerignore
├── .gitignore
├── Dockerfile
└── requirements.txt
```

## Requirements

- Python 3.12 recommended for consistency with the Docker image
- Docker Desktop, if running the API in Docker
- A modern web browser

## Setup

Create and activate a virtual environment in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run the API Locally

From the project root:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Useful endpoints:

- Health: `http://127.0.0.1:8000/health`
- Model information: `http://127.0.0.1:8000/model-info`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

## Run the Frontend

Open a second PowerShell terminal and run:

```powershell
python -m http.server 8080 --directory frontend
```

Then visit:

`http://127.0.0.1:8080`

Keep the terminal running while using the frontend. The API must also be running and reachable.

## Run with Docker

Build the image:

```powershell
docker build -t credit-risk-ml:latest .
```

Start the container:

```powershell
docker run --name credit-risk-api -p 8000:8000 credit-risk-ml:latest
```

Check health:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

If a container named `credit-risk-api` is already running, stop or remove it before creating another container with that name.

## Run Tests

With the virtual environment activated:

```powershell
python -m pytest tests -q
```

The current API test suite has passed 9 tests in the development environment. A Starlette deprecation warning was observed during testing.

## Model Insights

The project includes global SHAP importance information to help explore which features influenced model predictions across the evaluated data.

Global feature importance does not establish causation and is not a substitute for a validated, individual-applicant explanation.

## Responsible Use

- Treat predictions as estimates, not facts.
- Review data quality, model limitations, calibration, and fairness before any real-world use.
- Protect applicant information and avoid committing private or identifying data.
- Validate the model independently before making consequential decisions.

## License

No license has been specified yet. Add a license before distributing or reusing this project under explicit open-source terms.

