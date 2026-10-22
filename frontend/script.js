"use strict";

(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];

    let apiBaseUrl = "https://credit-risk-ml-system-z0f4.onrender.com";
    let assessments = [];
    let toastTimer = null;

    const pageNames = {
        dashboard: "Dashboard",
        assessment: "New Assessment",
        insights: "Model Insights",
        api: "API Status",
        about: "About Project"
    };

    // --------------------------------------------------
    // Notifications
    // --------------------------------------------------

    function showToast(message) {
        const toast = $("#toast");
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3200);
    }

    // --------------------------------------------------
    // Navigation
    // --------------------------------------------------

    function navigateTo(pageName) {
        const target = $("#page-" + pageName);

        if (!target) return;

        $$(".page").forEach((page) => {
            page.classList.toggle("active", page === target);
        });

        $$(".nav-link[data-page]").forEach((button) => {
            const isActive = button.dataset.page === pageName;

            button.classList.toggle("active", isActive);

            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });

        $("#currentPageName").textContent =
            pageNames[pageName] || pageName;

        $("#sidebar").classList.remove("open");

        if (pageName === "dashboard") {
            requestAnimationFrame(drawPerformanceChart);
        }

        if (pageName === "api") {
            checkApiStatus();
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    $$(".nav-link[data-page]").forEach((button) => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.page);
        });
    });

    $$("[data-go]").forEach((button) => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.go);
        });
    });

    $("#mobileMenu")?.addEventListener("click", () => {
        $("#sidebar").classList.toggle("open");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            $("#sidebar")?.classList.remove("open");
        }
    });

    // --------------------------------------------------
    // API request helper
    // --------------------------------------------------

    async function apiRequest(path, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(
                apiBaseUrl.replace(/\/+$/, "") + path,
                {
                    ...options,
                    signal: controller.signal
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            let data;

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const detail =
                    data && typeof data === "object"
                        ? data.detail
                        : null;

                const message = Array.isArray(detail)
                    ? detail.map((item) => item.msg || JSON.stringify(item)).join("; ")
                    : detail || `API request failed with HTTP ${response.status}`;

                throw new Error(message);
            }

            return data;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("Request timed out. Check whether the API is running.");
            }

            if (error instanceof TypeError) {
                throw new Error(
                    "Cannot connect to the API. Check Docker, the API URL, and CORS settings."
                );
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    // --------------------------------------------------
    // API status
    // --------------------------------------------------

    function setStatusDot(element, status) {
        if (!element) return;

        const colors = {
            healthy: "#15966e",
            offline: "#d64d60",
            checking: "#e8a94b"
        };

        element.style.background = colors[status] || colors.checking;
    }

    async function checkApiStatus() {
        const title = $("#apiStatusTitle");
        const description = $("#apiStatusDescription");
        const badge = $("#apiStatusBadge");

        $("#topApiStatus").textContent = "Checking API...";
        $("#sidebarApiStatus").textContent = "Checking API...";
        $("#backendStatus").textContent = "Checking...";

        setStatusDot($("#topStatusDot"), "checking");
        setStatusDot($("#sidebarStatusDot"), "checking");

        if (title) title.textContent = "Checking backend...";
        if (description) description.textContent = "Requesting GET /health";
        if (badge) {
            badge.textContent = "CHECKING";
            badge.className = "tag tag-blue";
        }

        try {
            const result = await apiRequest("/health");

            const healthy =
                result.status === "healthy" &&
                result.model_loaded === true;

            const state = healthy ? "healthy" : "offline";
            const message = healthy ? "API connected" : "API not ready";

            $("#topApiStatus").textContent = message;
            $("#sidebarApiStatus").textContent = message;
            $("#backendStatus").textContent = message;

            setStatusDot($("#topStatusDot"), state);
            setStatusDot($("#sidebarStatusDot"), state);

            if (title) {
                title.textContent = healthy
                    ? "Backend is healthy"
                    : "Backend is not ready";
            }

            if (description) {
                description.textContent =
                    `GET /health returned status=${result.status}, ` +
                    `model_loaded=${result.model_loaded}`;
            }

            if (badge) {
                badge.textContent = healthy ? "CONNECTED" : "NOT READY";
                badge.className = healthy ? "tag" : "tag tag-red";
            }

            return healthy;
        } catch (error) {
            $("#topApiStatus").textContent = "API offline";
            $("#sidebarApiStatus").textContent = "API offline";
            $("#backendStatus").textContent = "Offline";

            setStatusDot($("#topStatusDot"), "offline");
            setStatusDot($("#sidebarStatusDot"), "offline");

            if (title) title.textContent = "Cannot reach backend";

            if (description) {
                description.textContent =
                    error.message +
                    " Open Docker Desktop and check the API URL.";
            }

            if (badge) {
                badge.textContent = "OFFLINE";
                badge.className = "tag tag-red";
            }

            return false;
        }
    }

    $("#refreshApiButton")?.addEventListener("click", async () => {
        const button = $("#refreshApiButton");
        button.disabled = true;

        try {
            const healthy = await checkApiStatus();

            showToast(
                healthy
                    ? "API is connected and the model is loaded."
                    : "API is not ready. Check Docker and the API URL."
            );
        } finally {
            button.disabled = false;
        }
    });

    $("#saveApiUrlButton")?.addEventListener("click", async () => {
        const input = $("#apiBaseUrl");
        const value = input.value.trim().replace(/\/+$/, "");

        let parsedUrl;

        try {
            parsedUrl = new URL(value);
        } catch {
            showToast("Please enter a valid API base URL.");
            input.focus();
            return;
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            showToast("The API URL must use HTTP or HTTPS.");
            return;
        }

        apiBaseUrl = value;

        const button = $("#saveApiUrlButton");
        button.disabled = true;

        try {
            const healthy = await checkApiStatus();

            showToast(
                healthy
                    ? "API URL saved. Backend connection is healthy."
                    : "API URL saved, but the backend is not reachable."
            );
        } finally {
            button.disabled = false;
        }
    });

    // --------------------------------------------------
    // Safe text rendering
    // --------------------------------------------------

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return replacements[character];
        });
    }

    // --------------------------------------------------
    // Assessment form
    // --------------------------------------------------

    function getNumber(id) {
        const value = $("#" + id).value.trim();

        if (value === "") return null;

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    }

    function buildApplicantPayload() {
        return {
            person_age: getNumber("person_age"),
            person_income: getNumber("person_income"),
            person_home_ownership: $("#person_home_ownership").value,
            person_emp_length: getNumber("person_emp_length"),
            loan_intent: $("#loan_intent").value,
            loan_grade: $("#loan_grade").value,
            loan_amnt: getNumber("loan_amnt"),
            loan_int_rate: getNumber("loan_int_rate"),
            loan_percent_income: getNumber("loan_percent_income"),
            cb_person_default_on_file:
                $("#cb_person_default_on_file").value,
            cb_person_cred_hist_length:
                getNumber("cb_person_cred_hist_length")
        };
    }

    function validateApplicant(payload) {
        const errors = [];

        if (
            payload.person_age === null ||
            payload.person_age < 18 ||
            payload.person_age > 100
        ) {
            errors.push("Age must be between 18 and 100.");
        }

        if (
            payload.person_income === null ||
            payload.person_income <= 0 ||
            payload.person_income > 100000000
        ) {
            errors.push("Annual income must be positive and within the supported limit.");
        }

        if (
            payload.person_emp_length !== null &&
            (
                payload.person_emp_length < 0 ||
                payload.person_emp_length > 80
            )
        ) {
            errors.push("Employment length must be between 0 and 80 years.");
        }

        if (
            payload.person_emp_length !== null &&
            payload.person_age !== null &&
            payload.person_emp_length > payload.person_age
        ) {
            errors.push("Employment length cannot exceed the applicant's age.");
        }

        if (
            payload.loan_amnt === null ||
            payload.loan_amnt <= 0 ||
            payload.loan_amnt > 1000000
        ) {
            errors.push("Loan amount must be positive and within the supported limit.");
        }

        if (
            payload.loan_int_rate !== null &&
            (
                payload.loan_int_rate < 0 ||
                payload.loan_int_rate > 100
            )
        ) {
            errors.push("Interest rate must be between 0 and 100.");
        }

        if (
            payload.loan_percent_income === null ||
            payload.loan_percent_income < 0 ||
            payload.loan_percent_income > 1
        ) {
            errors.push("Loan-to-income ratio must be between 0 and 1.");
        }

        if (
            payload.cb_person_cred_hist_length === null ||
            payload.cb_person_cred_hist_length < 0 ||
            payload.cb_person_cred_hist_length > 100
        ) {
            errors.push("Credit history must be between 0 and 100 years.");
        }

        return errors;
    }

    function renderPrediction(result, payload) {
        const probability = Number(result.default_probability);
        const threshold = Number(result.decision_threshold);
        const predictedClass = Number(result.predicted_class);

        if (
            !Number.isFinite(probability) ||
            probability < 0 ||
            probability > 1 ||
            !Number.isFinite(threshold) ||
            threshold < 0 ||
            threshold > 1 ||
            ![0, 1].includes(predictedClass)
        ) {
            throw new Error("The API returned an invalid prediction response.");
        }

        const isHigherRisk = predictedClass === 1;
        const probabilityPercent = (probability * 100).toFixed(2);
        const thresholdPercent = (threshold * 100).toFixed(0);

        const modelName = escapeHtml(
            result.model_name || "Credit risk model"
        );

        const riskCategory = escapeHtml(
            result.risk_category ||
            (isHigherRisk ? "HIGHER_PREDICTED_RISK" : "LOWER_PREDICTED_RISK")
        );

        const disclaimer = escapeHtml(
            result.disclaimer ||
            "Educational use only. This prediction is not a lending decision or a guarantee of future default."
        );

        $("#thresholdValue").textContent = thresholdPercent + "%";

        $("#predictionResult").innerHTML = `
            <article class="card result-card">
                <div class="eyebrow">ASSESSMENT RESULT</div>

                <div class="result-heading">
                    <div>
                        <h2>${isHigherRisk ? "Higher predicted risk" : "Lower predicted risk"}</h2>
                        <p>Model: ${modelName}</p>
                    </div>

                    <span class="tag ${isHigherRisk ? "tag-red" : ""}">
                        ${riskCategory}
                    </span>
                </div>

                <div class="result-metrics">
                    <div class="result-metric">
                        <small>Estimated default probability</small>
                        <strong>${probabilityPercent}%</strong>
                        <div class="progress-track">
                            <div
                                class="progress-fill ${isHigherRisk ? "fill-red" : "fill-green"}"
                                style="width:${probabilityPercent}%"
                            ></div>
                        </div>
                    </div>

                    <div class="result-metric">
                        <small>Decision threshold</small>
                        <strong>${thresholdPercent}%</strong>
                        <small>Configured classification cutoff</small>
                    </div>

                    <div class="result-metric">
                        <small>Predicted class</small>
                        <strong>${predictedClass}</strong>
                        <small>${isHigherRisk ? "Positive class: default" : "Class 0: non-default"}</small>
                    </div>
                </div>

                <div class="notice">${disclaimer}</div>
            </article>
        `;

        const record = {
            id: "CG-" + String(Date.now()).slice(-7),
            profile:
                `${payload.person_age} yrs · ` +
                `${payload.person_home_ownership} · ` +
                `${payload.loan_intent}`,
            probability: probabilityPercent,
            predictedClass,
            riskCategory
        };

        assessments.unshift(record);
        assessments = assessments.slice(0, 20);

        renderRecentAssessments();

        $("#predictionResult").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function renderPredictionError(message) {
        $("#predictionResult").innerHTML = `
            <article class="card result-card">
                <div class="error-panel">
                    <span class="tag tag-red">ASSESSMENT FAILED</span>
                    <h2>Prediction could not be completed</h2>
                    <p>${escapeHtml(message)}</p>
                    <p>Open API Status to check the backend connection. If the browser reports a CORS error, the FastAPI backend needs CORS configuration for this frontend origin.</p>
                </div>
            </article>
        `;
    }

    $("#assessmentForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const form = event.currentTarget;

        if (!form.reportValidity()) return;

        const payload = buildApplicantPayload();
        const validationErrors = validateApplicant(payload);

        if (validationErrors.length > 0) {
            renderPredictionError(validationErrors.join(" "));
            showToast("Please correct the applicant details.");
            return;
        }

        const button = $("#predictButton");
        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = "Assessing applicant...";
        $("#predictionResult").innerHTML = "";

        try {
            const result = await apiRequest("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            renderPrediction(result, payload);
            showToast("Risk assessment completed successfully.");
        } catch (error) {
            renderPredictionError(error.message);
            showToast("Prediction failed. Check API Status.");
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });

    $("#assessmentForm")?.addEventListener("reset", () => {
        setTimeout(() => {
            $("#predictionResult").innerHTML = "";
        }, 0);
    });

    // --------------------------------------------------
    // Recent assessments table
    // --------------------------------------------------

    function renderRecentAssessments() {
        const tbody = $("#recentAssessments");

        if (!tbody) return;

        if (assessments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No assessments yet. Create one to see it here.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = assessments.map((record) => {
            const higherRisk = record.predictedClass === 1;

            return `
                <tr>
                    <td><b>${escapeHtml(record.id)}</b></td>
                    <td>${escapeHtml(record.profile)}</td>
                    <td>${escapeHtml(record.probability)}%</td>
                    <td>${record.predictedClass}</td>
                    <td>
                        <span class="tag ${higherRisk ? "tag-red" : ""}">
                            ${escapeHtml(record.riskCategory)}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // --------------------------------------------------
    // Development-time performance chart
    // --------------------------------------------------

    function drawPerformanceChart() {
        const canvas = $("#performanceChart");
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = rect.width;
        const height = 250;

        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.height = height + "px";

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);

        const metrics = [
            { label: "ROC-AUC", value: 0.9388, group: "Ranking", color: "#6676e9" },
            { label: "PR-AUC", value: 0.8939, group: "Ranking", color: "#6676e9" },
            { label: "Brier Score", value: 0.0552, group: "Error metrics", color: "#16a085" },
            { label: "Log Loss", value: 0.2037, group: "Error metrics", color: "#16a085" }
        ];

        const outer = 12;
        const gap = 12;
        const cardWidth = (width - outer * 2 - gap) / 2;
        const cardHeight = 108;
        const top = 8;
        const rowGap = 12;

        metrics.forEach((metric, index) => {
            const column = index % 2;
            const row = Math.floor(index / 2);
            const x = outer + column * (cardWidth + gap);
            const y = top + row * (cardHeight + rowGap);

            context.fillStyle = "#f7f8fc";
            context.beginPath();
            if (typeof context.roundRect === "function") {
                context.roundRect(x, y, cardWidth, cardHeight, 10);
            } else {
                context.rect(x, y, cardWidth, cardHeight);
            }
            context.fill();

            context.textAlign = "left";
            context.textBaseline = "middle";
            context.font = "12px Segoe UI, Arial, sans-serif";
            context.fillStyle = "#65718a";
            context.fillText(metric.label, x + 13, y + 19);

            context.font = "bold 23px Segoe UI, Arial, sans-serif";
            context.fillStyle = "#19243a";
            context.fillText(metric.value.toFixed(4), x + 13, y + 49);

            const barX = x + 13;
            const barY = y + 75;
            const barWidth = Math.max(12, cardWidth - 26);
            const barHeight = 7;

            context.fillStyle = "#e5e9f2";
            context.beginPath();
            if (typeof context.roundRect === "function") {
                context.roundRect(barX, barY, barWidth, barHeight, 4);
            } else {
                context.rect(barX, barY, barWidth, barHeight);
            }
            context.fill();

            // Ranking metrics use a 0-1 scale.
            // Error metrics use a relative display scale, not a direct comparison.
            const normalized = metric.group === "Ranking"
                ? metric.value
                : Math.max(0, Math.min(1, 1 - metric.value / 0.25));

            context.fillStyle = metric.color;
            context.beginPath();
            if (typeof context.roundRect === "function") {
                context.roundRect(
                    barX,
                    barY,
                    Math.max(2, barWidth * normalized),
                    barHeight,
                    4
                );
            } else {
                context.rect(
                    barX,
                    barY,
                    Math.max(2, barWidth * normalized),
                    barHeight
                );
            }
            context.fill();
        });

        context.font = "11px Segoe UI, Arial, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = "#748198";
        context.fillText(
            "Ranking: higher is better  |  Error metrics: lower is better",
            outer,
            height - 8
        );
    }

    window.addEventListener("resize", drawPerformanceChart);

    // --------------------------------------------------
    // Test prediction endpoint
    // --------------------------------------------------

    $("#testPredictionButton")?.addEventListener("click", async () => {
        const button = $("#testPredictionButton");
        const output = $("#apiTestResult");
        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = "Testing...";
        output.textContent = "Sending a sample prediction request...";

        const sampleApplicant = {
            person_age: 25,
            person_income: 60000,
            person_home_ownership: "RENT",
            person_emp_length: 3,
            loan_intent: "EDUCATION",
            loan_grade: "B",
            loan_amnt: 8000,
            loan_int_rate: 10.5,
            loan_percent_income: 0.13,
            cb_person_default_on_file: "N",
            cb_person_cred_hist_length: 4
        };

        try {
            const result = await apiRequest("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sampleApplicant)
            });

            output.textContent =
                `Prediction endpoint is working. ` +
                `Class: ${result.predicted_class}; ` +
                `estimated probability: ` +
                `${(result.default_probability * 100).toFixed(2)}%.`;

            showToast("Prediction endpoint test passed.");
        } catch (error) {
            output.textContent = "Prediction test failed: " + error.message;
            showToast("Prediction endpoint test failed.");
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });

    // --------------------------------------------------
    // Initial page setup
    // --------------------------------------------------

    renderRecentAssessments();
    checkApiStatus();

    requestAnimationFrame(drawPerformanceChart);
})();
