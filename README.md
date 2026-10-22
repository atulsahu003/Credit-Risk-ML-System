# CreditGuard AI — Credit Risk Intelligence

An end-to-end credit risk assessment system built with a calibrated Random Forest model, FastAPI, Docker, and an interactive web dashboard. The application estimates loan default probability and provides model performance metrics and global SHAP-based feature importance insights.

<p align="center">

**[Live Dashboard](https://credit-risk-ml-system.pages.dev)** · **[API Health](https://credit-risk-ml-system-z0f4.onrender.com/health)** · **[API Documentation](https://credit-risk-ml-system-z0f4.onrender.com/docs)** · **[GitHub Repository](https://github.com/atulsahu003/Credit-Risk-ML-System)**

</p>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Live Demo](#live-demo)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Model Performance](#model-performance)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Run the Frontend](#run-the-frontend)
- [Run with Docker](#run-with-docker)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Model Explainability](#model-explainability)
- [Responsible Use and Limitations](#responsible-use-and-limitations)
- [Future Improvements](#future-improvements)
- [License](#license)

## Project Overview

CreditGuard AI is a machine learning project that estimates the probability of loan default using applicant and loan attributes.

The project combines a trained and calibrated Random Forest classifier with a FastAPI backend and a browser-based dashboard. Users can submit sample applicant profiles, obtain a predicted default probability, inspect model performance metrics, and explore global feature importance information.

The system demonstrates an end-to-end machine learning workflow, including model evaluation, probability calibration, API development, input validation, automated testing, containerization, and cloud deployment.

> **Important:** This project is intended for educational and portfolio demonstration purposes. It is not a production lending decision system. Predictions may be inaccurate or biased and must not be used as the sole basis for real credit decisions.

## Live Demo

| Component | Link |
|---|---|
| Web Dashboard | [Open CreditGuard AI](https://credit-risk-ml-system.pages.dev) |
| Backend Health | [Check API Health](https://credit-risk-ml-system-z0f4.onrender.com/health) |
| Model Information | [View Model Metadata](https://credit-risk-ml-system-z0f4.onrender.com/model-info) |
| Interactive API Docs | [Open FastAPI Swagger UI](https://credit-risk-ml-system-z0f4.onrender.com/docs) |

**Deployment architecture:**
- Frontend: Cloudflare Pages
- Backend API: Render
- Machine learning model: Calibrated Random Forest
- API framework: FastAPI
- Containerization: Docker

**Note:** Render's free instances may spin down after inactivity. The first request after a period of inactivity can take longer to respond.

## Key Features

- **Credit risk prediction:** Estimates the probability of loan default from applicant and loan characteristics.
- **Calibrated Random Forest:** Uses a calibrated classification model to produce probability estimates.
- **Configurable classification threshold:** Uses a configured decision threshold of 0.55.
- **REST API:** Exposes model functionality through FastAPI endpoints.
- **Input validation:** Validates prediction requests using Pydantic and FastAPI.
- **Interactive dashboard:** Provides applicant assessment, performance metrics, model insights, and API health status.
- **Model evaluation:** Reports ROC-AUC, PR-AUC, Brier Score, and Log Loss.
- **Global explainability:** Displays saved SHAP-based feature importance summaries.
- **Docker support:** Packages the backend and model artifacts into a container.
- **Automated testing:** Includes API tests using pytest.
- **Data exploration:** Includes a Jupyter notebook for initial dataset understanding.

## System Architecture

```text
                 CreditGuard AI
                        |
             Browser-based Dashboard
              HTML, CSS, JavaScript
                        |
                 HTTPS / REST API
                        |
                  FastAPI Backend
                        |
              Input Validation (Pydantic)
                        |
             Calibrated Random Forest
                        |
              Default Probability
                        |
              Threshold Classification
                        |
             Prediction Result Dashboard
```

### Prediction Workflow

1. The user enters sample applicant and loan details.
2. The frontend sends a request to the FastAPI prediction endpoint.
3. The backend validates the submitted features.
4. The trained model estimates the probability of default.
5. The configured threshold is used to generate a predicted class.
6. The API returns the prediction result to the dashboard.

The predicted class is a model output, not a loan approval or rejection decision.

## Model Performance

The following metrics were reported for the held-out test set:

| Metric | Value | Interpretation |
|---|---:|---|
| ROC-AUC | 0.9388 | Measures ranking/discrimination ability |
| PR-AUC | 0.8939 | Summarizes precision-recall performance |
| Brier Score | 0.0552 | Evaluates probabilistic prediction error |
| Log Loss | 0.2037 | Evaluates the quality of probability predictions |
| Decision Threshold | 0.55 | Configured classification cutoff |

ROC-AUC and PR-AUC measure different aspects of model ranking performance. Brier Score and Log Loss evaluate probability predictions; lower values are generally better.

These metrics describe performance on the evaluated dataset. They do not guarantee the same results on new data or in a real lending environment.

## Technology Stack

| Category | Technologies |
|---|---|
| Programming Language | Python |
| Data Processing | pandas, NumPy |
| Machine Learning | scikit-learn |
| Explainability | SHAP |
| Backend | FastAPI, Pydantic, Uvicorn |
| Frontend | HTML, CSS, JavaScript |
| Testing | pytest |
| Deployment | Docker, Render, Cloudflare Pages |
| Development | Jupyter Notebook, Git, GitHub |

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

## Getting Started

### Prerequisites

- Python 3.12 recommended
- Git
- A modern web browser
- Docker Desktop, if running the API in a container

### 1. Clone the Repository

```powershell
git clone https://github.com/atulsahu003/Credit-Risk-ML-System.git

cd Credit-Risk-ML-System
```

### 2. Create a Virtual Environment

```powershell
python -m venv .venv

.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, use an appropriate local execution-policy setting or activate the environment through Command Prompt instead.

### 3. Install Dependencies

```powershell
python -m pip install --upgrade pip

pip install -r requirements.txt
```

### 4. Start the Backend API

Run this command from the project root:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Keep this terminal running while using the local application.

## Run the Frontend

Open a second terminal from the project root and run:

```powershell
python -m http.server 8080 --directory frontend
```

Open the following address in your browser:

```text
http://127.0.0.1:8080
```

For local use, ensure the frontend's API base URL points to the local backend. For the hosted dashboard, use the deployed Render API URL.

## Run with Docker

Build the Docker image from the project root:

```powershell
docker build -t credit-risk-ml:latest .
```

Start the API container:

```powershell
docker run --name credit-risk-api -p 8000:8000 credit-risk-ml:latest
```

Check the health endpoint:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

If a container named `credit-risk-api` already exists, stop and remove the existing container before creating another one with the same name.

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Checks API and model health |
| `/model-info` | GET | Returns model metadata and saved evaluation metrics |
| `/docs` | GET | Opens interactive Swagger API documentation |
| `/predict` | POST | Generates a credit risk prediction |

Example health-check response:

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

For the exact prediction request schema, required features, and response format, refer to the live [API documentation](https://credit-risk-ml-system-z0f4.onrender.com/docs).

## Testing

Run the test suite with the virtual environment activated:

```powershell
python -m pytest tests -q
```

The API test suite previously passed **9 tests** in the development environment. A Starlette deprecation warning was observed during testing.

Test results can change when the code or dependencies change. Run the tests again after making modifications.

## Model Explainability

The Model Insights page displays saved global SHAP feature importance summaries.

Features shown in the current dashboard include:
- Loan-to-income ratio
- Annual income
- Home ownership category
- Loan grade
- Interest rate

Mean absolute SHAP values summarize the magnitude of a feature's contribution across the evaluated sample. They do not, by themselves, indicate whether a feature increases or decreases default risk.

Global feature importance does not establish causation and is not equivalent to an individual applicant's explanation. The dashboard's saved global SHAP summaries should not be interpreted as live per-applicant SHAP values.

## Responsible Use and Limitations

CreditGuard AI is an educational machine learning project.

- Treat model outputs as estimates, not facts.
- Do not use predictions as the sole basis for consequential lending decisions.
- Model performance may change across populations, time periods, and data distributions.
- Evaluate calibration and fairness across relevant subgroups before any real-world use.
- Protect applicant information and do not commit private or identifying data.
- Validate the model independently before considering any consequential application.
- Feature importance does not establish causation.
- A low estimated probability does not guarantee that a borrower will repay a loan.

## Future Improvements

Potential extensions include:

- Add per-applicant SHAP explanations with a clearly defined explanation workflow.
- Evaluate fairness and calibration across relevant subgroups.
- Add data drift and model performance monitoring.
- Add versioned model artifacts and reproducible training pipelines.
- Improve CI automation for tests and deployment checks.
- Add authentication and access controls if the project is extended beyond public demonstration.
- Add additional visualizations and evaluation reports.

## License

No license has been specified yet. Until a license is added, do not assume that others have permission to redistribute or reuse the project under open-source terms.
