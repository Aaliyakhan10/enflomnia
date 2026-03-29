# **Project: ENFLOMNIA**
### *The Autonomous Content Nervous System for Global Enterprise*

**Vision:** To collapse the "10-Day Content Cycle" into a **2-Hour Autonomous Loop**. Enflomnia is an agentic ecosystem that turns static enterprise data into a high-frequency, compliant, and multi-modal media engine.

---

## **1. The Problem: The "Administrative Rot"**
In the enterprise, content doesn't move at the speed of the market; it moves at the speed of committees. 
*   **The Bandwidth Bottleneck**: Teams spend 90% of their time on research, legal checks, and manual editing, leaving only 10% for strategy.
*   **Information Graveyards**: Massive amounts of valuable data are trapped in "dead" PDFs and internal reports.
*   **The Creative Delay**: Professional video and image assets require expensive, slow manual production.

---

## **2. The Solution: The "Tree of Life" Architecture**
Enflomnia is built using a **First Principles** approach, dismantling the "Human Bandwidth Bottleneck" into autonomous agents that coordinate via the **Agent-to-Agent (A2A) Protocol**.

### **🌿 The Master Flow**
The Master Flow is an autonomous, end-to-end loop that mirrors natural growth:

````carousel
### **1. Soil (Data Ingestion)**
Automatically ingests new company context (PDFs, docs, text) into the **Knowledge Lake**.
Powered by RAG and Vector Search.
<!-- slide -->
### **2. Root (Strategy)**
The **Stratagem** agent analyzes your brand DNA and existing top-performing posts to suggest brand-safe content pillars.
<!-- slide -->
### **3. Trunk (Creation)**
The **Alchemist** generates high-quality scripts, prompts, and captions grounded in your "Soil."
Triggers **Remotion** for programmatic video.
<!-- slide -->
### **4. Bark (Governance)**
The **Aegis** (Sentinel) reviews everything for compliance. If confidence is low (< 0.8), it blocks the post.
Real-time tone and terminology monitoring.
<!-- slide -->
### **5. Fruit (Launch)**
The **Fruit** agent (Postman) automatically pushes approved content to your social graphs (Instagram, LinkedIn).
<!-- slide -->
### **6. Pulse (Feedback)**
The **Pulse** listens to audience "vibes" and **System Pulse** detects reach anomalies to refine the next loop.
````

---

## **3. Our Agent Roster (The Swarm)**

| Agent | Role | System Service |
| :--- | :--- | :--- |
| **DNA & Soil** | Context Grounding | `PredictionService` |
| **The Alchemist** | Content Generation | `ScriptService` |
| **The Aegis** | Governance & Safety | `ComplianceService` |
| **The Pulse** | Scheduling & Cadence | `WorkloadSignalService` |
| **System Pulse** | Anomaly Detection | `ReachAnomalyService` |
| **The Fruit** | Automated Publishing | `PublishingService` |
| **Knowledge Lake** | Enterprise Memory | `KnowledgeLakeService` |

---

## **4. Feature Studios (User Modules)**

### **🎨 Creative Accelerator**
*   **Document Studio**: Ingest PDFs and reports to ground your AI in proprietary data.
*   **Image Studio**: Multi-modal generation with brand-consistent captions.
*   **Video Studio**: Powered by **Remotion**, generating programmatic videos with dynamic hooks and CTAs.

### **📊 Strategic Intelligence**
*   **Campaign Strategist**: Grounded strategy planning with objective-driven pillars.
*   **Insight Engine**: Deep analytics, reach monitoring, and anomaly detection.
*   **Audience Pulse**: Real-time listening to engagement "vibes."

### **🛡️ Brand Security**
*   **Comment Shield**: Automated moderation and sentiment-based response filtering.
*   **Aegis Privacy**: Ensuring PII and sensitive data never leave the enterprise boundary.

---

## **5. Technology Stack**

### **🧠 AI & Reasoning**
*   **Core Engine**: Gemini 2.5 Flash (via `google-genai`).
*   **Orchestration**: Vertex AI A2A Protocol.
*   **Observability**: Langfuse (LLM Tracing & Spans).

### **⚙️ Backend**
*   **Framework**: FastAPI (Python).
*   **Persistence**: SQLAlchemy + PostgreSQL (Supabase).
*   **Auth & Vector**: Supabase Auth & pgvector.

### **💻 Frontend**
*   **Framework**: Next.js 14 (App Router).
*   **Styling**: Tailwind CSS + Lucide Icons.
*   **Video Engine**: **Remotion SDK** + FFmpeg.

---

## **6. Operational Setup**

### **A. Prerequisites**
*   **Node.js**: v18+ 
*   **Python**: 3.10+
*   **FFmpeg**: Required for Remotion rendering.

### **B. Environment Variables**
Provide your "Digital Keys" in a `.env` file in the `enflomnia-backend` folder:
```bash
# AI
GEMINI_API_KEY=your_key
GEMINI_MODEL_ID=gemini-2.5-flash

# Supabase
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
JWT_SECRET=your_secret
DATABASE_URL=postgresql://...

# Observability
LANGFUSE_PUBLIC_KEY=your_key
LANGFUSE_SECRET_KEY=your_key

# Integrations
INSTAGRAM_ACCESS_TOKEN=your_token
```

### **C. Launching the System**

**1. Backend**
```bash
cd enflomnia-backend
python -m venv .venv
# Activate venv, then:
pip install -r requirements.txt
python main.py
```

**2. Frontend**
```bash
cd enflomnia-frontend
npm install
npm run dev
```

---

## **7. Governing the Master Flow (Example API)**

**Endpoint**: `POST /api/orchestrator/master-flow`
```json
{
  "creator_id": "demo-creator-001",
  "enterprise_id": "demo-enterprise-001",
  "seed_info": {
    "title": "Summer Collection 2026",
    "content": "Our new eco-friendly swimwear is dropping tomorrow!"
  },
  "publish_automatically": true
}
```

---
> [!IMPORTANT]
> **Enflomnia** is designed for high-frequency, safe-speed publishing. It doesn't just generate content; it professionalizes the administrative lifecycle, freeing humans for **Pure Human Connection.**

---
**Technical Foundation:** Google Cloud, Gemini Intelligence, Remotion SDK, Supabase.
