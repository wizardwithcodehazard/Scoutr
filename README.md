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
flowchart TD
    subgraph Discovery["1. Bright Data Ingestion Layer"]
        A["Startup ATS Portals<br/>(Ashby, Greenhouse, Lever, YC)"]
        B["Scraper Studio Collectors<br/>(Parallel Multi-Source Pipeline)"]
        C["AST Self-Healing Sentinel<br/>(bdata scraper heal)"]
        D["Stale-Listing Filter<br/>(30-Day Freshness Gate)"]
        E["Dynamic Ingestion Server<br/>(dashboard/server.js)"]
    end

    subgraph Command["2. Scoutr Command Center"]
        F["Linear-Style Split Explorer<br/>(Active Jobs Feed)"]
        G["Gemini 3.5 Flash Lite<br/>(Semantic Re-Ranking Engine)"]
        H["Strict Token Matcher<br/>(Regex Word-Boundary Search)"]
        I["Pipeline Tracker<br/>(Applied, Interviewing, Offers)"]
        J["Responsive Pagination<br/>(Mobile & Desktop Views)"]
    end

    subgraph Extension["3. Chrome Extension Companion"]
        K["Live Target ATS Page<br/>(Job Application Form)"]
        L["In-Browser DOM Scanner<br/>(scrapePageForForms)"]
        M["Gemini 3.5 Semantic Mapper<br/>(Dynamic Field Autofill)"]
        N["Synthetic Event Dispatcher<br/>(input, change, blur)"]
    end

    A -->|bdata run| B
    B -->|DOM Shift Detected| C
    C -->|AST Repaired| B
    B -->|Active Feed| D
    D -->|Fresh Stream| E

    E -->|Semantic Query| G
    E -->|Word Match| H
    G --> F
    H --> F
    F --> I
    F --> J

    F -->|1-Click Apply| K
    K --> L
    L --> M
    M --> N
    N -->|Auto-Log Status| I
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

### 1. Clone & Start the Workspace Server
```bash
git clone https://github.com/wizardwithcodehazard/Scoutr.git
cd Scoutr
npm install
npm run dashboard
```
* **Landing Page:** [http://localhost:3000](http://localhost:3000)
* **Command Center App:** [http://localhost:3000/app](http://localhost:3000/app)

### 2. Load the Chrome Extension (Manifest V3)
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `extension` directory.
4. Pin **Scoutr** to your browser toolbar.

### 3. Deploy to Cloudflare Pages
1. In the Cloudflare Dashboard, create a new **Pages** project connected to this Git repository.
2. Set **Build output directory** to `dashboard`.
3. Set Node.js compatibility flags and deploy to your custom `*.pages.dev` domain with edge API functions.

---

## License
MIT License. Built for Into the Scrape-Verse 2026.
