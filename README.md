# 🚨 AI-Powered Adaptive API Security Layer

An AI-powered API abuse detection system built on Cloudflare Workers using Llama 3.3 (Workers AI).
This project analyzes API request patterns, detects malicious behavior, and maintains stateful tracking to prevent abuse in real time.

---

## 🚀 Overview

Modern APIs are vulnerable to abuse such as bot traffic, scraping, and rate-limit attacks. Traditional rule-based systems often fail to adapt to evolving patterns.

This project simulates a real-world **Web Application Firewall (WAF)** enhanced with AI.

It uses a hybrid approach:

* Rule-based validation for immediate threats
* LLM-based analysis for contextual understanding
* Stateful tracking using KV storage for behavioral detection

---

## 🤖 LLM Usage

This project uses **Cloudflare Workers AI (Llama 3.3)** as the core decision engine.

The LLM:

* Analyzes request data along with historical behavior
* Classifies whether a request is abusive
* Returns structured JSON (is_abuse, confidence, type, reason)

The output is combined with system rules and memory to make final decisions.

---

## 🧱 Architecture

```
Client (User / API Logs)
        ↓
Cloudflare Worker (Backend API)
        ↓
Workers AI (Llama 3.3)
        ↓
Decision Engine (Rule + AI + Risk Score)
        ↓
KV Store (IP Behavior Memory)
        ↓
Response (ALLOW / FLAG / BLOCK)
```

---

## ✨ Key Features

* 🧠 **LLM-powered detection** (not rule-based only)
* 📊 **Risk scoring system (0–100)** for adaptive decisions
* 🧠 **Stateful IP tracking** using KV storage
* ⚖️ **Hybrid detection system** (rules + AI)
* ⏳ **Cooldown mechanism** for repeat offenders
* ⚡ **Edge deployment** with low latency and high scalability

---

## 📡 API Endpoints

* `GET /` → Health check
* `GET /stats` → Stats endpoint (extendable)
* `POST /` → Analyze API request

---

## 🧪 How It Works

1. **Request Received**
   API request data is sent to the Cloudflare Worker.

2. **Pre-Processing (Rules)**
   Immediate checks (e.g., extreme rate limits) are applied.

3. **Fetch Memory (KV)**
   Historical behavior for the IP is retrieved.

4. **AI Analysis (Llama 3.3)**
   The request + history is analyzed by the LLM.

5. **Risk Scoring**
   A score (0–100) is computed using:

   * AI confidence
   * Request rate
   * Past flags/blocks

6. **Decision Engine**

   * `ALLOW` → normal traffic
   * `FLAG` → suspicious
   * `BLOCK` → abusive

7. **Update Memory**
   Behavior is stored for future detection.

8. **Response Returned**
   JSON response with decision + reasoning.

---

## ⚙️ Tech Stack

* **Cloudflare Workers** – backend execution at the edge
* **Workers AI (Llama 3.3)** – LLM-based analysis
* **Cloudflare KV** – stateful memory storage
* **TypeScript** – type-safe backend logic
* **Wrangler CLI** – development and deployment

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/manoz7/cf_ai_api_abuse_detector.git
cd cf_ai_api_abuse_detector
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

Server runs at:
http://localhost:8787

---

### 4. Test API

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/login",
    "requests_per_min": 120,
    "user_agent": "bot"
  }'
```

---

## 📊 Example Response

```json
{
  "success": true,
  "data": {
    "ip": "127.0.0.1",
    "action": "BLOCK",
    "risk_score": 92,
    "ai_result": {
      "is_abuse": true,
      "confidence": 0.92,
      "type": "bot",
      "reason": "High request rate with bot-like behavior"
    },
    "history": {
      "requests": 5,
      "flags": 2,
      "blocks": 1
    }
  }
}
```

---

## 🧠 Design Highlights

* **Structured JSON Output**
  Ensures consistent parsing and reliable API responses.

* **Context-Aware AI Decisions**
  Combines current request with historical behavior.

* **Hybrid Detection Approach**
  Reduces false positives compared to rule-only systems.

* **Risk-Based Enforcement**
  Enables more nuanced decisions beyond binary blocking.

---

## 🔄 Future Improvements

* Add few-shot examples to improve AI accuracy
* Introduce anomaly scoring
* Build dashboard UI for monitoring
* Enhance endpoint-level sensitivity

---
