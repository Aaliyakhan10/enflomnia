# Inflomnia — Active Agentic Infrastructure for Digital Creators

**Team Name:** Singlebit (Leader: Aaliya khan)  
**Track:** AI for Media, Content & Digital Experiences

## 🌟 The Problem & The Inflomnia Solution

Inflomnia shifts the paradigm from passive creative tools to active **Agentic Infrastructure**.

### How is Inflomnia Different?

1. **Active Agents vs. Passive Dashboards**
   Unlike traditional analytics tools that only display metrics, Inflomnia uses AI agents to take action—such as moderating engagement, assisting pricing decisions, and simulating content outcomes.
2. **Labor Automation (Phase 1 Focus)**
   Inflomnia digitizes the repetitive 90% of creator business work (moderation, analysis, pricing support), reducing operational overload instead of adding more tools to manage.
3. **Agentic Infrastructure (Phase 2+ Expansion)**
   As the system evolves, Inflomnia introduces advanced agent-based workflows to support content planning, simulations, and scaled operations.

### How Inflomnia Solves the Problem

*   **Breaking the "Human Ceiling"**: Inflomnia helps creators scale beyond limited personal time by automating decision support and repetitive operational tasks (initially assisted, not fully autonomous).
*   **Psychological Sustainability**: By providing context-aware insights, Inflomnia reduces stress caused by platform volatility and performance uncertainty.
*   **Professionalizing Creator Businesses**: Over time, Inflomnia enables creators and small businesses to adopt structured, data-backed content and monetization practices, improving consistency and confidence.

---

## ✨ Core Features & USPs (Feature Innovation)

*   **10-Persona Simulation**: Adversarial AI agents critique scripts. Predicts audience reaction before production spending.
*   **Neural Persona**: RAG-based cloning of voice & values. An autonomous worker that makes real business decisions.
*   **Visual Vibe Audit**: Computer Vision for grid analysis. Matches brands/creators via aesthetic fit, not vanity metrics.

---

## 🗺️ Phased Roadmap

### 1. Resilience Engine (The Shield) — Phase 1 (Core)
*   Detects whether reach changes are creator-specific or platform-wide.
*   Assists in filtering toxic comments, spam, and bot-driven activity.
*   Provides signals to adjust content workload based on engagement patterns.

### 2. Monetization Accelerator (The Accelerator) — Phase 1 (Core)
*   Suggests fair, data-backed pricing ranges for brand deals.
*   Assists with script structure and hook recommendations for branded content.
*   Supports creator–brand matching based on audience relevance and content fit.

### 3. Content Intelligence & Prediction Engine — Phase 2 (Expansion)
*   Predicts likely-performing formats and topics within a niche.
*   Analyzes emerging trends before they reach saturation.
*   Simulates potential growth trajectories over 3, 6, and 12 months.
*   Recommends data-backed strategic pivots for long-term growth.

### 4. Risk & Safety Guard (The Filter) — Phase 2 (Expansion)
*   Acts as an AI-assisted legal and reputation safety layer.
*   Scans brand contracts to flag potentially unfavorable clauses.
*   Identifies suspicious engagement and scam activity on paid promotions.
*   Helps diagnose technical or policy-related factors affecting reach.

### 5. Digital Twin & Agentic Systems — Phase 3 (Roadmap)
*   Learns creator preferences, tone, and workflows over time.
*   Assists with message handling, workflow organization, and content planning.
*   Uses synthetic audience personas to simulate engagement feedback.
*   Enables multi-platform content repurposing as a future capability.

---

## 🛠️ System Architecture & Tech Stack

*   **Backend Layer**: FastAPI (Python), AWS Lambda (processing), AWS API Gateway.
*   **AI Engine Layer**: Amazon Bedrock (Claude 3.5 Sonnet / Nova), Amazon Bedrock Guardrails, Google Gemini API.
*   **Storage & Search**: SQLite (Dev) / PostgreSQL (Prod), Amazon S3, Amazon OpenSearch Serverless.
*   **Frontend Layer**: Next.js 14, React, Tailwind CSS, Recharts (hosted on AWS Amplify).
*   **Authentication**: AWS Cognito.

---

## 🚀 Setup & Development Instructions

### Project Structure

The repository is divided into two main applications:
*   `inflomnia-backend`: The Python API Server.
*   `inflomnia-frontend`: The Next.js Web Dashboard.

### 1. Backend Setup (`inflomnia-backend`)

1. Navgiate to the backend directory:
   ```bash
   cd inflomnia-backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Mac/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Copy `.env.example` to `.env` and fill in your AWS credentials, Bedrock Model IDs, and API keys:
   ```bash
   cp .env.example .env
   ```
5. Run the development server (runs with SQLite by default):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will be available at `http://localhost:8000`. You can view the swagger docs at `http://localhost:8000/docs`.*

### 2. Frontend Setup (`inflomnia-frontend`)

1. Navigate to the frontend directory:
   ```bash
   cd inflomnia-frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Ensure you have a `.env.local` file pointing to the backend API:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be available at `http://localhost:3000`.*
