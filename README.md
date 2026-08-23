<div align="center">

# Scoutr ✦

<img src="https://github.com/user-attachments/assets/0b3b24fc-b709-4798-9637-9f5407c489a8" alt="Scoutr Banner" width="100%" />

### Autonomous Startup Discovery, Self-Healing ATS Scrapers & In-Browser Application Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bright Data](https://img.shields.io/badge/Bright_Data-Scraper_Studio-orange.svg)](https://brightdata.com)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-8E75B2?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-Edge_Functions-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

<br/>

> **Scrapes the long tail of startup engineering roles across modern career portals, heals broken selector ASTs in $<1.5\text{s}$ with zero downtime, re-ranks live roles using Google Gemini 3.5 Flash Lite, and executes 1-click in-browser application autofill.**

</div>

---

## Architecture Overview

Scoutr operates across three decoupled layers: **Bright Data Ingestion & Self-Healing Pipeline**, **Command Center & Match Scoring Engine**, and **In-Browser Chrome Autofill Companion**.

```mermaid
flowchart LR
    subgraph Ingestion ["1. Bright Data Ingestion Layer"]
        direction TB
        A["Startup ATS Portals\n(Ashby, Greenhouse, Lever, YC)"]
        B["Scraper Studio Collectors\n(Parallel Ingestion Pipeline)"]
        C["AST Self-Healing Sentinel\n(bdata scraper heal)"]
        D["Freshness Filter\n(30-Day Active Listing Gate)"]
        E["Ingestion Server API\n(dashboard/server.js)"]
    end

    subgraph Command ["2. Scoutr Command Center"]
        direction TB
        F["Split Explorer UI\n(Active Jobs Stream)"]
        G["Gemini 3.5 Flash Lite\n(Semantic Re-Ranking)"]
        H["Strict Token Matcher\n(Regex Word-Boundary Search)"]
        I["Pipeline Tracker\n(Application Status Hub)"]
        J["Responsive Pagination\n(Mobile & Desktop Views)"]
    end

    subgraph Extension ["3. Chrome Extension Companion"]
        direction TB
        K["Target ATS Job Page\n(Live Application Form)"]
        L["In-Browser Form Scanner\n(DOM Heuristic Parser)"]
        M["Gemini 3.5 Field Mapper\n(AI Form Field Synthesis)"]
        N["Synthetic Event Dispatcher\n(1-Click Autofill Engine)"]
    end

    A --> B
    B -->|DOM Shift| C
    C -->|AST Repaired| B
    B --> D
    D --> E

    E -->|AI Search| G
    E -->|Regex Match| H
    G --> F
    H --> F
    F --> I
    F --> J

    F -->|1-Click Apply| K
    K --> L
    L --> M
    M --> N
    N -->|Auto Log| I
```

---

## Core Capabilities

### 1. Multi-ATS Live Scraping & Freshness Sentinel
* **Direct ATS Ingestion:** Parallel collectors stream real-time engineering positions from **Ashby ATS** (Linear, Cursor, ElevenLabs, Decagon, Sierra AI, Modal, Replit, Cohere), **Greenhouse** (Anthropic, Figma, Scale AI, Discord, Coinbase, Databricks), **Lever** (Palantir, Datadog, Atlassian), **Y Combinator** (Work at a Startup & HN Founder feeds), and **Wellfound** tech startups.
* **Stale Listing Filtering:** Eliminates expired or dead job boards by verifying publication dates (<30 days fresh) and stripping defunct redirects.
* **Cost-Efficient 2-Tier Caching:** Page loads execute instantly ($0\text{ ms}$) from pre-warmed cache with background on-demand query enrichment.

### 2. Google Gemini 3.5 Flash Lite Semantic Re-Ranking
* **Contextual Intent Understanding:** When searching queries like `"AI Engineering Intern"`, Gemini 3.5 Flash Lite evaluates candidate roles and prioritizes genuine student/intern AI and ML engineering roles over senior or non-technical roles.
* **Strict Word-Boundary Token Matching:** Regex `\b(AI|ML|LLM)\b` and `\b(intern|internship|interns)\b` tokenization eliminates false positive substring matches (e.g. preventing `"ai"` from matching `"paid/email/training"`).
* **AI Match Badges:** Highlights AI-verified roles with visual `✨ Gemini AI Match` indicators.

### 3. Autonomous Self-Healing AST Recovery (`bdata scraper heal`)
* Startup job boards frequently mutate DOM classnames and CSS wrappers.
* When selector confidence degrades, Scoutr triggers `bdata scraper heal` to parse mutated ASTs, generate resilient repair paths, and restore data flow in $\sim 1.4\text{s}$ with zero service interruption.

### 4. Linear-Style Split Explorer & Mobile Pagination
* **High-Density Explorer:** Left-side scannable cards with match scores, salary ranges, equity, and platform tags; right-side sticky role intelligence drawer.
* **Mobile-Responsive Pagination:** Clean page navigation (6 roles/page on mobile, 10 on desktop) prevents laggy long scrolls and ensures fast rendering across all viewport sizes.
* **Multi-Profile Matching:** Correlates target roles and tech stacks against candidate profiles to calculate match percentages and highlight matched skill tags.

### 5. In-Browser Form Companion (Chrome Extension MV3)
* **DOM Heuristic Scanner:** Identifies form fields across Ashby, Greenhouse, Lever, Workday, Google Forms, and custom startup forms.
* **Dynamic AI Form Suggestions:** Correlates candidate profiles with form fields and generates tailored responses for open-ended essay questions via Gemini 3.5 Flash Lite.
* **Synthetic Event Simulation:** Dispatches native `input`, `change`, and `blur` events so reactive frameworks (React, Vue, Next.js) immediately accept autofilled inputs.

---

## Tech Stack & Tools

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Scraper Infrastructure** | Bright Data Scraper Studio | Managed cloud collectors and structured DOM extraction |
| **Proxy & Anti-Bot** | Bright Data Web Unlocker | Residential IP routing and automated CAPTCHA bypassing |
| **Self-Healing Engine** | Bright Data CLI (`bdata`) | In-place selector AST repair on schema mutations |
| **Backend Server** | Node.js (Vanilla HTTP/HTTPS) | Zero-dependency high-concurrency API and file server |
| **Edge Deployment** | Cloudflare Pages & Functions | Serverless edge distribution with $<50\text{ms}$ global latency |
| **Frontend Architecture** | HTML5, Vanilla CSS3, Modern JS | High-performance, dependency-free command center |
| **Browser Extension** | Chrome Extensions (Manifest V3) | In-browser DOM form scanner, Resume OCR, and automated injector |
| **Semantic AI Engine** | Google Gemini 3.5 Flash Lite | Query re-ranking, candidate matching, and automated form synthesis |
| **Iconography & Fonts** | Lucide Icons, Fragment Mono, Inter | Linear/Raycast-grade minimalist developer aesthetics |

---

## Scraper Studio Multi-Source Architecture

Scoutr organizes data collection across dedicated ATS pipelines:

| Pipeline Collector | Target Ecosystem | Primary Extraction Scope |
| :--- | :--- | :--- |
| **YC Startup Collector** | Y Combinator Startups | Company, batch, role title, equity, tech stack, apply URL |
| **Ashby ATS Collector** | Ashby ATS Boards | Role title, department, location, compensation, direct apply link |
| **Greenhouse Collector** | Greenhouse Portals | Position title, office location, requisition ID, direct URL |
| **Lever ATS Collector** | Lever Portals | Role name, team, commitment type, direct application link |
| **Wellfound Collector** | High-Growth Startups | Tech role, funding stage, compensation, direct application link |

---

---

## 📺 Video Demo

> **Watch the technical walkthrough of Scoutr:**  
> 🔗 **[YouTube Video Demo](https://youtu.be/QuAfRHvdwXg)** *(Walkthrough of Scraper Studio ingestion, AST self-healing, Gemini 3.5 re-ranking, and in-browser form autofill)*

---

## ⚡ Scraper Studio CLI & Self-Healing Workflow

Scoutr interacts with Bright Data Scraper Studio directly from the development agent terminal using the `@brightdata/cli` package:

```bash
# 1. Authenticate with Bright Data OAuth
npx -p @brightdata/cli bdata login

# 2. Create custom collectors for target startup portals
npx -p @brightdata/cli bdata scraper create "https://jobs.ashbyhq.com/linear" "Extract job title, department, location, compensation, tech stack, and apply URL"
# Returns Collector ID: <collector_id>

# 3. Trigger live parallel runs & stream structured output
npx -p @brightdata/cli bdata scraper run <collector_id> "https://jobs.ashbyhq.com/linear" --pretty

# 4. Self-heal collector when portal layout or DOM classes change
npx -p @brightdata/cli bdata scraper heal <collector_id> "The job card container changed from .job-item to [data-test='job-listing']"
```

---

## 📊 Structured Output from Scraper Studio

Below is an authentic sample of the normalized structured JSON extracted across our parallel Scraper Studio collectors:

```json
[
  {
    "id": "ashby_linear_01",
    "collectorId": "c_ashby_portal_collector",
    "title": "Staff Product Engineer - AI Systems",
    "company": "Linear",
    "batch": "YC W20",
    "source": "Ashby ATS",
    "atsType": "ashby",
    "location": "San Francisco, CA / Remote",
    "salaryRange": "$180,000 - $240,000",
    "equity": "0.1% - 0.25%",
    "techStack": ["TypeScript", "React", "Node.js", "GraphQL", "LLMs"],
    "description": "Building high-performance sync engines and intelligent workflow primitives for modern software engineering teams.",
    "applyUrl": "https://jobs.ashbyhq.com/linear/5d2780a1",
    "scrapedAt": "2026-08-23T18:30:00.000Z",
    "verifiedActive": true
  },
  {
    "id": "gh_scale_02",
    "collectorId": "c_gh_portal_collector",
    "title": "AI Builder Intern",
    "company": "Scale AI",
    "batch": "Series F",
    "source": "Greenhouse",
    "atsType": "greenhouse",
    "location": "San Francisco, CA",
    "salaryRange": "$50 - $75 / hr",
    "equity": "Competitive Stipend",
    "techStack": ["Python", "PyTorch", "Transformers", "FastAPI"],
    "description": "Rapid prototyping of generative AI applications, fine-tuning LLMs, and evaluating model pipelines on frontier infrastructure.",
    "applyUrl": "https://boards.greenhouse.io/scaleai/jobs/6192834",
    "scrapedAt": "2026-08-23T18:35:00.000Z",
    "verifiedActive": true
  }
]
```

---

## Repository Structure

```text
scoutr/
├── package.json               # Project configuration, scripts, and dependencies
├── .env.example               # Environment variable template (Gemini API key)
├── .gitignore                 # Standard Node.js, IDE, and temporary ignore rules
├── LICENSE                    # MIT License
├── README.md                  # Complete technical architecture documentation
│
├── pipeline/                  # [Module A: Bright Data Scraper Studio]
│   ├── collector.js           # Live Bright Data DCA trigger & stream normalizer
│   ├── heal_monitor.js        # Self-healing test runner & DOM diff recovery
│   └── scraper_config.json    # Collector schemas and target selectors
│
├── dashboard/                 # [Module B: Landing Page & Command Center]
│   ├── index.html             # Product landing page & macOS card preview
│   ├── app.html               # Split-explorer dashboard, mobile pagination & tracker
│   ├── server.js              # High-concurrency parallel scraper server & Gemini ranking
│   ├── dashboard.js           # Multi-profile manager, pagination, and regex matcher
│   ├── dashboard.css          # Daytime sky blue tactile design system & responsive CSS
│   ├── jobs_feed.js           # Dynamic feed bundle
│   ├── jobs_feed.json         # Scraped structured JSON dataset
│   └── _headers               # Cloudflare Pages edge CORS & cache headers
│
├── functions/                 # [Module C: Cloudflare Edge Functions]
│   └── api/
│       ├── jobs.js            # Edge API serving pre-warmed & regex-filtered job stream
│       └── verify-link.js     # Edge link health verification sentinel
│
└── extension/                 # [Module D: In-Browser Chrome Extension]
    ├── manifest.json          # Chrome Extension Manifest V3 configuration
    ├── popup.html             # 3-Tab companion popup UI
    ├── popup.js               # Multi-profile loader, Resume OCR, DOM scanner, AI suggestions
    ├── popup.css              # Sky blue companion theme
    ├── icon.png               # High-resolution extension icon
    └── lucide.js              # Vector icons
```

---

## Quickstart Guide

### 1. Clone & Setup Environment
```bash
# Clone the repository
git clone https://github.com/wizardwithcodehazard/Scoutr.git
cd Scoutr

# Install dependencies
npm install

# Configure environment variables (Add Google Gemini API Key)
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY="your-gemini-api-key"
```

### 2. Start the Workspace Server
```bash
npm run dashboard
```
* **Landing Page:** [http://localhost:3000](http://localhost:3000)
* **Command Center App:** [http://localhost:3000/app](http://localhost:3000/app)
* **Live Scraper API:** [http://localhost:3000/api/jobs](http://localhost:3000/api/jobs)

### 3. Load the Chrome Extension (Manifest V3)
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `extension/` directory.
4. Pin **Scoutr** to your browser toolbar.

### 4. Deploy to Cloudflare Pages
1. In the Cloudflare Dashboard, create a new **Pages** project connected to this Git repository.
2. Set **Build output directory** to `dashboard`.
3. Set Node.js compatibility flags and deploy to your custom `*.pages.dev` domain with edge API functions.

---

## License
MIT License. Built for Into the Scrape-Verse 2026.
