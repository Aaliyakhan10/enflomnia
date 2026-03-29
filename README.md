# **Project: ENFLOMNIA**
### *The Self-Evolving Content Nervous System for the Global Enterprise*

**Vision:** To collapse the "10-Day Content Cycle" into a **2-Hour Autonomous Loop**. Enflomnia is an agentic ecosystem that turns static enterprise data into a high-frequency, compliant, and multi-modal media engine.

---

## **🚀 Quick Start: Run the Master Flow**
If you want to start the autonomous content engine immediately:
1.  **Set Your Keys:** Add your **Gemini API Key** and **Meta Access Tokens** to `enflomnia-backend/.env`.
2.  **Run the Backend:** `cd enflomnia-backend && python main.py`
3.  **Run the Frontend:** `cd enflomnia-frontend && npm run dev`

---

## **1. The Vision: The "Administrative Rot"**
In the enterprise, content doesn't move at the speed of the market; it moves at the speed of committees. 
* **The Bandwidth Bottleneck:** Teams spend 90% of their time on research, legal checks, and manual editing, leaving only 10% for strategy.
* **Information Graveyards:** Massive amounts of valuable data are trapped in "dead" PDFs and internal reports.
* **The Creative Delay:** Professional video and image assets require expensive, slow manual production.

---

## **2. The Solution: The Enflomnia Ecosystem**
Enflomnia is built using a **First Principles** approach, dismantling the "Human Bandwidth Bottleneck" into autonomous agents that coordinate via the **Agent-to-Agent (A2A) Protocol**.

### **🌿 The Master Flow (The Tree of Life)**
The Master Flow is an autonomous, end-to-end loop that mirrors natural growth:
1.  **Soil (Data Ingestion)**: Automatically ingests new company context (PDFs, docs, text) into the Knowledge Lake.
2.  **Root (Strategy)**: Analyzes your brand and existing top-performing posts to suggest brand-safe content pillars.
3.  **Trunk (Creation)**: The **Alchemist** generates high-quality scripts, prompts, and captions grounded in your "Soil."
4.  **Bark (Aegis Gate)**: A "Digital Lawyer" (Sentinel) reviews everything for compliance. If confidence is low (< 0.8), it blocks the post.
5.  **Fruit (Launch)**: The **Fruit** phase automatically pushes approved content to your social graphs (Instagram).
6.  **Pulse (Feedback)**: Listens to audience "vibes" to refine the next loop.

---

## **3. Technical Architecture**

| Layer | Component | Function |
| :--- | :--- | :--- |
| **Orchestration** | Vertex AI Agent Engine | Manages agent collaboration via the **A2A Protocol**. |
| **Reasoning** | Gemini 2.5 Flash | The "Cortex" for fast and smart execution. |
| **Rendering** | Remotion on Cloud Run | Serverless video production engine. |
| **Knowledge** | Vector Search / RAG | The "Digital Library" of enterprise facts. |
| **Safety** | The Aegis (AIAudit) | Real-time compliance and safe-speed publishing. |

---

## **4. Setting Up Your "Keys" (Required)**
Provide your "Digital Keys" in your `.env` file inside the `enflomnia-backend` folder.

<details>
<summary><b>Click to see API & Token Setup Details</b></summary>

### **A. Gemini API Key (The Brain)**
Used for all AI generation and analysis.
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Create an API Key and add it to `.env`: `GEMINI_API_KEY=your_key_here`.

### **B. Facebook & Instagram Tokens (The Postman)**
**Required for automated posting.**
1.  Go to [Meta for Developers](https://developers.facebook.com/).
2.  Create an App (Business Type) and set up the **Instagram Graph API**.
3.  Generate a **User Access Token** with these permissions:
    -   `instagram_basic`, `instagram_content_publish`, `ads_management`, `pages_show_list`.
4.  Add it to `.env`: `INSTAGRAM_ACCESS_TOKEN=your_token_here`.

### **C. Supabase (The Memory)**
Used to store your documents and metrics.
1.  Create a project at [Supabase](https://supabase.com/).
2.  Add your URL and keys to `.env` (see `.env.example`).
</details>

---

## **5. How to Run the System**

### **Step 1: Start the Backend**
```bash
cd enflomnia-backend

# 🌿 Create a Virtual Environment (Recommended)
python -m venv .venv

# 🌿 Activate the Environment:
# On Windows:
.venv\Scripts\activate

# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
python main.py
```

### **Step 2: Start the Frontend**
```bash
cd enflomnia-frontend
npm install
npm run dev
```

### **Step 3: Trigger the Master Flow**
Once both are running, trigger the autonomous loop via API:
**Endpoint**: `POST /api/orchestrator/master-flow`

**JSON Body**:
```json
{
  "creator_id": "YOUR_CREATOR_ID",
  "enterprise_id": "YOUR_ENTERPRISE_ID",
  "seed_info": {
    "title": "Summer Collection 2026",
    "content": "Our new eco-friendly swimwear is dropping tomorrow!"
  },
  "publish_automatically": true
}
```

---

## **6. Why Enflomnia Wins**
Enflomnia isn't just a content generator; it's a **Circular Ecosystem**. It listens, thinks, creates, and protects. It professionalizes the **90% administrative rot**, freeing humans to focus on what actually matters: **Pure Human Connection.**

---
**Technical Foundation:** Google Cloud, Gemini Intelligence, Remotion SDK. 
