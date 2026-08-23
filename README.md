<div align="center">

# Scoutr
### Autonomous Startup Discovery, Self-Healing ATS Scrapers & In-Browser Application Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bright Data](https://img.shields.io/badge/Bright_Data-Scraper_Studio-orange.svg)](https://brightdata.com)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E75B2?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

<br/>

> **Scrapes the long tail of startup engineering roles across Ashby, Greenhouse, Lever, and Y Combinator, heals broken selector ASTs in $<1.5\text{s}$ with zero downtime, and executes 1-click in-browser application autofill.**

</div>

---

## Architecture Overview

Scoutr operates across three decoupled modules: **Bright Data Scraper Studio Ingestion Layer**, **Command Center & Multi-Resume Engine**, and **In-Browser Chrome Autofill Companion**.

```mermaid
flowchart TD
    subgraph S1["Tier 1: Bright Data Scraper Studio & Web Unlocker"]
        direction TB
        A["Startup Ecosystems<br/>(Ashby · Greenhouse · Lever · YC)"] -->|bdata scraper run| B["Scraper Studio Collectors<br/>(c_mt4s1dwc1n61l4s9i4 / c_ashby_portal_8f2)"]
        B -->|DOM Layout Mutation Detected| C["AST Self-Healing Sentinel<br/>bdata scraper heal"]
        C -->|Selector Rewritten in 1.4s| B
        B -->|Parallel Stream| D["Pre-Flight Link Sentinel<br/>(HTTP HEAD/GET 404 Pruner)"]
        D -->|Verified Active Jobs| E["Ingestion Server & API<br/>(dashboard/server.js)"]
    end

    subgraph S2["Tier 2: Scoutr Command Center"]
        direction TB
        E -->|0ms Local Cache| F["Linear-Grade Split Explorer<br/>(http://localhost:3000/app)"]
        F --> G["Multi-Profile State Manager<br/>(Role Matching & Skill Scoring)"]
        F --> H["Interactive Pipeline Tracker<br/>(Applied · Interviewing · Offers)"]
        F --> I["Scraper Studio Telemetry Modal<br/>(Live AST Sentinel Diagnostics)"]
    end

    subgraph S3["Tier 3: Chrome Extension Autofill Engine"]
        direction TB
        F -->|Handoff: 'Apply with Scoutr'| J["Live ATS Application Page<br/>(Linear, Cursor, Anthropic, etc.)"]
        J --> K["In-Browser DOM Scanner<br/>(scrapePageForForms)"]
        K --> L["Gemini 2.0 Semantic Mapper<br/>(Personalized Field Correlation)"]
        L --> M["Synthetic Event Dispatcher<br/>(Input · Change · Blur)"]
        M -->|Auto-Log Submission| H
    end
```

---

## Core Capabilities

### 1. Multi-ATS Live Scraping & Pre-Flight Health Sentinel
* **Direct Public ATS Ingestion:** Parallel collectors directly stream real-time engineering positions from **Ashby ATS** (Linear, Cursor, ElevenLabs, Decagon, Sierra AI, Modal), **Greenhouse** (Anthropic, Figma, Scale AI, Discord), **Lever** (Palantir), and **Y Combinator** (Work at a Startup & HN Founder feeds).
* **Automated 404 Sentinel:** Validates outgoing URLs through pre-flight HTTP verification, discarding expired or defunct job boards before rendering.
* **Cost-Efficient 2-Tier Caching:** Page loads execute instantly ($0\text{ ms}$) from local cache without redundant API calls. Live web scraping triggers on demand via **Sync Pipeline**.

### 2. Autonomous Self-Healing AST Recovery (`bdata scraper heal`)
* Startup job boards frequently update DOM classnames, attributes, and wrapper elements.
* When selector confidence degrades, Scoutr's sentinel triggers `bdata scraper heal` to parse the mutated AST, generate resilient repair paths, and restore data flow in $\sim 1.4\text{s}$ with zero service interruption.

### 3. Linear-Style Split Explorer & Relevance Scoring
* **High-Density Explorer:** Left-side scannable cards with real-time match badges, compensation, equity, and platform tags; right-side sticky role intelligence drawer.
* **Multi-Profile Matching:** Tokenized candidate evaluation correlates target roles and tech stacks against job descriptions, calculating match scores and highlighting matched skill badges.
* **Interactive Pipeline Tracker:** 1-click status dropdowns (`Applied`, `Clicked / Staged`, `Interviewing`, `Technical Round`, `Offer Received`, `Rejected`) with live metric filter pills.

### 4. In-Browser Form Companion (Chrome Extension MV3)
* **DOM Heuristic Scanner:** Identifies form fields across Ashby, Greenhouse, Lever, Workday, Google Forms, and Microsoft Forms using `aria-label`, parent `<label>`, and placeholder inspection.
* **Synthetic Event Simulation:** Dispatches native `input`, `change`, and `blur` events so reactive frameworks (React, Vue, Next.js) immediately accept autofilled candidate profiles.

---

## Tech Stack & Tools

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Scraper Infrastructure** | Bright Data Scraper Studio | Managed cloud collectors and structured DOM extraction |
| **Proxy & Anti-Bot** | Bright Data Web Unlocker | Residential IP routing and automated CAPTCHA bypassing |
| **Self-Healing Engine** | Bright Data CLI (`bdata`) | In-place selector AST repair on schema mutations |
| **Backend Server** | Node.js (Vanilla HTTP/HTTPS) | Zero-dependency high-concurrency API and file server |
| **Frontend Architecture** | HTML5, Vanilla CSS3, Modern JS | High-performance, dependency-free command center |
| **Browser Extension** | Chrome Extensions (Manifest V3) | In-browser DOM form scanner and automated injector |
| **Semantic AI Engine** | Google Gemini 2.0 Flash | Dynamic field mapping and personalized custom pitch generation |
| **Iconography & Fonts** | Lucide Icons, Fragment Mono, Inter | Linear/Raycast-grade minimalist developer aesthetics |

---

## Pinned Scraper Studio Collectors

Scoutr utilizes dedicated Scraper Studio Collector configurations mapped in [`pipeline/scraper_config.json`](file:///c:/Users/Sahil/Desktop/scrapeverse/clairis/pipeline/scraper_config.json):

| Collector ID | Target Ecosystem | Primary Extraction Scope |
| :--- | :--- | :--- |
| `c_mt4s1dwc1n61l4s9i4` | Y Combinator Startups | Company, batch, title, equity, tech stack, apply URL |
| `c_ashby_portal_8f2` | Ashby ATS Boards | Role title, department, location, compensation, job ID |
| `c_gh_portal_4e1` | Greenhouse Portals | Position title, office location, requisition ID, direct URL |
| `c_wf_talent_41e9` | Wellfound / Tech Feeds | Startup stage, funding round, remote availability, salary |

---

## Repository Structure

```text
clairis/
├── package.json               # Project configuration, scripts, and dependencies
├── .env.example               # Environment variable template (Gemini API key)
├── LICENSE                    # MIT License
├── README.md                  # Complete technical architecture documentation
│
├── pipeline/                  # [Module A: Bright Data Scraper Studio]
│   ├── collector.js           # Live Bright Data DCA trigger & stream normalizer
│   ├── heal_monitor.js        # Self-healing test runner & DOM diff recovery
│   └── scraper_config.json    # Pinned Collector IDs and schema definitions
│
├── dashboard/                 # [Module B: Landing Page & Command Center]
│   ├── index.html             # Product landing page & macOS card preview
│   ├── app.html               # Split-explorer dashboard & pipeline tracker
│   ├── server.js              # High-concurrency parallel scraper server
│   ├── dashboard.js           # Multi-profile manager, match scoring, and cache
│   ├── dashboard.css          # Daytime sky blue tactile design system
│   ├── jobs_feed.js           # Dynamic feed bundle
│   ├── jobs_feed.json         # Scraped structured JSON dataset
│   ├── michael_safety.png     # Product narrative illustration
│   └── lucide.js              # Vector icon library
│
└── extension/                 # [Module C: In-Browser Chrome Extension]
    ├── manifest.json          # Chrome Extension Manifest V3 configuration
    ├── popup.html             # Companion popup UI
    ├── popup.js               # Multi-profile loader, DOM scanner, and form filler
    ├── popup.css              # Sky blue companion theme
    ├── icon.png               # High-resolution extension icon
    └── lucide.js              # Vector icons
```

---

## Quickstart Guide

### 1. Clone & Start the Workspace Server
```bash
git clone https://github.com/sahil/scoutr.git
cd scoutr/clairis
npm run dashboard
```
* **Landing Page:** [http://localhost:3000](http://localhost:3000)
* **Command Center App:** [http://localhost:3000/app](http://localhost:3000/app)

### 2. Load the Chrome Extension (Manifest V3)
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `clairis/extension` directory.
4. Pin **Scoutr** to your browser toolbar.

### 3. Run Self-Healing Scraper Test Suite
Execute the automated AST repair sentinel to verify recovery logic:
```bash
npm test
```

---

## License
MIT License. Built for Into the Scrape-Verse 2026.
