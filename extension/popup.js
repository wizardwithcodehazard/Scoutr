/**
 * Scoutr — Autonomous Form Filler Extension Logic
 * Connects In-Browser Form Scraper with Gemini 2.0 Flash Engine and Command Center.
 */

// --- DOM ELEMENTS ---
const profileText = document.getElementById('user-profile');
const fillButton = document.getElementById('fill-btn');
const statusText = document.getElementById('status');
const profileSelect = document.getElementById('profile-select');
const openDashboardBtn = document.getElementById('open-dashboard-btn');
const targetAtsText = document.getElementById('target-ats-text');

// Profile Editor Elements
const profileNameInput = document.getElementById('profile-name');
const saveProfileButton = document.getElementById('save-profile-btn');
const deleteProfileButton = document.getElementById('delete-profile-btn');

// Voice & OCR Elements
const recordButton = document.getElementById('record-btn');
const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const clearImageBtn = document.getElementById('clear-image-btn');
const fileStatus = document.getElementById('file-status');

// Settings Elements
const toneSelect = document.getElementById('tone-select');
const languageInput = document.getElementById('language-input');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const apiKeyHint = document.getElementById('api-key-hint');

// Preview Card DOM Elements
const previewFullname = document.getElementById('preview-fullname');
const previewRole = document.getElementById('preview-role');
const previewEmail = document.getElementById('preview-email');
const previewLocation = document.getElementById('preview-location');

// Staged Role DOM Elements
const stagedCard = document.getElementById('staged-card');
const stagedCompany = document.getElementById('staged-company');
const stagedRole = document.getElementById('staged-role');
const stagedMatchBadge = document.getElementById('staged-match-badge');

// --- STATE ---
let allProfiles = [];
let currentApiKey = '';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide && lucide.createIcons) lucide.createIcons();
  setupTabs();
  loadProfiles();
  loadApiKey();
  detectCurrentAts();
  loadStagedJob();
});

// --- TAB SWITCHING LOGIC ---
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(target);
      if (targetPane) targetPane.classList.add('active');
      if (window.lucide && lucide.createIcons) lucide.createIcons();
    });
  });
}

// Detect Target ATS on active tab
async function detectCurrentAts() {
  try {
    if (!chrome.tabs || !chrome.tabs.query) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    let atsName = 'Standard Web Form';
    const url = tab.url.toLowerCase();
    if (url.includes('greenhouse.io') || url.includes('boards.greenhouse')) atsName = 'Greenhouse ATS Detected';
    else if (url.includes('lever.co') || url.includes('jobs.lever')) atsName = 'Lever ATS Detected';
    else if (url.includes('ashbyhq.com')) atsName = 'Ashby ATS Detected';
    else if (url.includes('workday.com') || url.includes('myworkdayjobs')) atsName = 'Workday ATS Detected';
    else if (url.includes('wellfound.com')) atsName = 'Wellfound Portal Detected';
    else if (url.includes('ycombinator.com') || url.includes('workatastartup.com')) atsName = 'Y Combinator Portal Detected';
    else if (url.includes('forms.gle') || url.includes('docs.google.com/forms')) atsName = 'Google Forms Detected';

    if (targetAtsText) {
      targetAtsText.textContent = atsName;
    }
  } catch (e) {
    // Non-critical background detection
  }
}

// Check if a job was staged from the dashboard
function loadStagedJob() {
  if (!chrome.storage || !chrome.storage.local) return;
  chrome.storage.local.get(['scoutr_staged_job'], (res) => {
    const staged = res.scoutr_staged_job;
    if (staged && staged.company) {
      if (stagedCard) stagedCard.style.display = 'flex';
      if (stagedCompany) stagedCompany.textContent = staged.company;
      if (stagedRole) stagedRole.textContent = staged.role || 'Software Engineer';
      if (stagedMatchBadge) stagedMatchBadge.textContent = (staged.match || 94) + '% Match';
    }
  });
}

// Load API Key from local storage
function loadApiKey() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['gemini_api_key'], (res) => {
      currentApiKey = res.gemini_api_key || '';
      if (apiKeyInput && currentApiKey) {
        apiKeyInput.value = currentApiKey;
      }
    });
  }
}

if (saveApiKeyBtn && apiKeyInput) {
  saveApiKeyBtn.addEventListener('click', () => {
    const val = apiKeyInput.value.trim();
    currentApiKey = val;
    chrome.storage.local.set({ gemini_api_key: val }, () => {
      if (apiKeyHint) {
        apiKeyHint.textContent = 'API key saved successfully!';
        apiKeyHint.style.color = '#10b981';
        setTimeout(() => {
          apiKeyHint.textContent = 'Keys are stored securely in local browser storage.';
          apiKeyHint.style.color = '#94a3b8';
        }, 2500);
      }
    });
  });
}

// Open Dashboard
if (openDashboardBtn) {
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/app' });
  });
}

// --- PROFILE MANAGEMENT ---
function formatProfileData(p) {
  if (!p) return '';
  if (p.data && typeof p.data === 'string') return p.data;
  
  const lines = [];
  if (p.fullname) lines.push(`Name: ${p.fullname}`);
  if (p.email) lines.push(`Email: ${p.email}`);
  if (p.phone) lines.push(`Phone: ${p.phone}`);
  if (p.location) lines.push(`Location: ${p.location}`);
  if (p.workAuth) lines.push(`Work Authorization: ${p.workAuth}`);
  if (p.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
  if (p.github) lines.push(`GitHub: ${p.github}`);
  if (p.portfolio) lines.push(`Portfolio: ${p.portfolio}`);
  if (p.twitter) lines.push(`Twitter: ${p.twitter}`);
  if (p.targetRoles) lines.push(`Target Roles: ${p.targetRoles}`);
  if (p.skills) lines.push(`Skills: ${p.skills}`);
  if (p.narrative) lines.push(`Bio / Experience:\n${p.narrative}`);
  return lines.join('\n');
}

function updatePreviewCard(p) {
  if (!p) return;
  if (previewFullname) previewFullname.textContent = p.fullname || p.name || 'Candidate';
  if (previewRole) previewRole.textContent = p.name || p.targetRoles || 'Engineer';
  if (previewEmail) previewEmail.innerHTML = `<i data-lucide="mail"></i> ${p.email || 'candidate@example.com'}`;
  if (previewLocation) previewLocation.innerHTML = `<i data-lucide="map-pin"></i> ${p.location || 'San Francisco, CA / Remote'}`;
  
  if (profileText) profileText.value = formatProfileData(p);
  if (profileNameInput) profileNameInput.value = p.name || '';
  if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function loadProfiles() {
  if (!chrome.storage || !chrome.storage.local) return;

  chrome.storage.local.get(['allUserProfiles', 'lastProfileName'], (result) => {
    let raw = result.allUserProfiles;
    if (typeof raw === 'string') {
      try { allProfiles = JSON.parse(raw); } catch (e) { allProfiles = []; }
    } else if (Array.isArray(raw)) {
      allProfiles = raw;
    } else {
      allProfiles = [];
    }

    // Fallback default if empty
    if (allProfiles.length === 0) {
      allProfiles = [
        {
          name: "Founding AI Engineer",
          fullname: "Sahil Sharma",
          email: "sahil@example.com",
          phone: "+1 (555) 019-2834",
          location: "San Francisco, CA (Hybrid / Remote)",
          workAuth: "US Citizen / Permanent Resident",
          linkedin: "https://linkedin.com/in/sahil-sharma",
          github: "https://github.com/sahil-sharma",
          portfolio: "https://sahil.dev",
          targetRoles: "Founding AI Engineer, Senior Full-Stack",
          skills: "TypeScript, Python, PyTorch, Next.js, Node.js, Scraper Studio",
          narrative: "Full-stack & AI systems engineer with 5+ years shipping resilient scrapers, autonomous agents, and high-scale distributed applications."
        }
      ];
    }

    if (profileSelect) {
      profileSelect.innerHTML = '';
      allProfiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        profileSelect.appendChild(opt);
      });
    }

    let active = allProfiles[0];
    if (result.lastProfileName) {
      const found = allProfiles.find(p => p.name === result.lastProfileName);
      if (found) active = found;
    }

    if (profileSelect) profileSelect.value = active.name;
    updatePreviewCard(active);
  });
}

function saveProfilesAndRefresh() {
  chrome.storage.local.set({ allUserProfiles: JSON.stringify(allProfiles) }, () => {
    loadProfiles();
  });
}

if (profileSelect) {
  profileSelect.addEventListener('change', () => {
    const selected = profileSelect.value;
    const prof = allProfiles.find(p => p.name === selected);
    if (prof) {
      updatePreviewCard(prof);
      chrome.storage.local.set({ lastProfileName: selected, current_user: selected });
    }
  });
}

if (saveProfileButton) {
  saveProfileButton.addEventListener('click', (e) => {
    e.preventDefault();
    const name = profileNameInput.value.trim();
    const data = profileText.value.trim();

    if (!name) {
      alert('Please enter a profile label.');
      return;
    }

    const idx = allProfiles.findIndex(p => p.name === name);
    if (idx > -1) {
      allProfiles[idx] = { ...allProfiles[idx], name, data };
    } else {
      allProfiles.push({ name, data });
    }

    chrome.storage.local.set({ lastProfileName: name, current_user: name });
    saveProfilesAndRefresh();
    alert(`Profile '${name}' saved!`);
  });
}

if (deleteProfileButton) {
  deleteProfileButton.addEventListener('click', (e) => {
    e.preventDefault();
    const name = profileSelect.value;
    if (!name) return;

    if (confirm(`Delete profile '${name}'?`)) {
      allProfiles = allProfiles.filter(p => p.name !== name);
      chrome.storage.local.remove('lastProfileName');
      saveProfilesAndRefresh();
    }
  });
}

// --- VOICE DICTATION ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && recordButton) {
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  let isRecording = false;

  recordButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (isRecording) {
      rec.stop();
      recordButton.classList.remove('recording');
      recordButton.querySelector('span').textContent = 'Voice Dictate';
      isRecording = false;
    } else {
      try {
        rec.start();
        recordButton.classList.add('recording');
        recordButton.querySelector('span').textContent = 'Stop Dictating';
        isRecording = true;
      } catch (err) {
        if (fileStatus) fileStatus.textContent = 'Microphone busy or not allowed.';
      }
    }
  });

  rec.onresult = (evt) => {
    for (let i = evt.resultIndex; i < evt.results.length; ++i) {
      if (evt.results[i].isFinal) {
        profileText.value += (profileText.value ? '\n' : '') + evt.results[i][0].transcript;
      }
    }
  };
}

// --- RESUME OCR UPLOAD ---
if (imageUpload) {
  imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fileStatus) fileStatus.textContent = 'Reading resume file...';

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1];
      if (imagePreview) imagePreview.src = reader.result;
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'flex';

      if (!currentApiKey) {
        if (fileStatus) fileStatus.textContent = 'Please enter Gemini API key in Settings tab for OCR.';
        return;
      }

      if (fileStatus) fileStatus.textContent = 'Extracting resume structure via Gemini 2.0 OCR...';

      try {
        const ocrPrompt = `Extract candidate details from this resume image. Output as clean text formatted with Name, Email, Phone, Location, Skills, and Bio.`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: ocrPrompt },
                { inline_data: { mime_type: file.type || 'image/png', data: base64Data } }
              ]
            }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (profileText) profileText.value = extractedText;
          if (fileStatus) fileStatus.textContent = 'OCR Extraction Complete!';
        } else {
          if (fileStatus) fileStatus.textContent = 'OCR request failed. Check API key.';
        }
      } catch (err) {
        if (fileStatus) fileStatus.textContent = 'OCR network error.';
      }
    };
    reader.readAsDataURL(file);
  });
}

if (clearImageBtn) {
  clearImageBtn.addEventListener('click', () => {
    if (imagePreview) imagePreview.src = '';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (imageUpload) imageUpload.value = null;
    if (fileStatus) fileStatus.textContent = '';
  });
}

// --- DETERMINISTIC FALLBACK FIELD MAPPER ---
function deterministicMapFields(scrapedFields, rawText) {
  const formData = {};
  const lines = (rawText || '').split('\n');
  const extract = (key) => {
    const l = lines.find(line => line.toLowerCase().startsWith(key.toLowerCase() + ':'));
    return l ? l.split(':').slice(1).join(':').trim() : '';
  };

  const fullname = extract('Name') || 'Sahil Sharma';
  const email = extract('Email') || 'sahil@example.com';
  const phone = extract('Phone') || '+1 (555) 019-2834';
  const location = extract('Location') || 'San Francisco, CA / Remote';
  const linkedin = extract('LinkedIn') || 'https://linkedin.com/in/sahil-sharma';
  const github = extract('GitHub') || 'https://github.com/sahil-sharma';
  const portfolio = extract('Portfolio') || 'https://sahil.dev';
  const workAuth = extract('Work Authorization') || 'US Citizen / Permanent Resident';
  const narrative = rawText.includes('Bio / Experience:') ? rawText.split('Bio / Experience:')[1].trim() : rawText;

  const parts = fullname.split(' ');
  const firstName = parts[0] || fullname;
  const lastName = parts.slice(1).join(' ') || '';

  scrapedFields.forEach(f => {
    const lbl = (f.label || '').toLowerCase();
    if (lbl.includes('first name') || lbl.includes('given name')) formData[f.identifier] = firstName;
    else if (lbl.includes('last name') || lbl.includes('family name') || lbl.includes('surname')) formData[f.identifier] = lastName;
    else if (lbl.includes('full name') || lbl === 'name' || lbl.includes('your name')) formData[f.identifier] = fullname;
    else if (lbl.includes('email') || lbl.includes('e-mail')) formData[f.identifier] = email;
    else if (lbl.includes('phone') || lbl.includes('mobile') || lbl.includes('tel')) formData[f.identifier] = phone;
    else if (lbl.includes('linkedin')) formData[f.identifier] = linkedin;
    else if (lbl.includes('github') || lbl.includes('git')) formData[f.identifier] = github;
    else if (lbl.includes('portfolio') || lbl.includes('website') || lbl.includes('personal link') || lbl.includes('url')) formData[f.identifier] = portfolio;
    else if (lbl.includes('location') || lbl.includes('city') || lbl.includes('address')) formData[f.identifier] = location;
    else if (lbl.includes('authorized') || lbl.includes('sponsorship') || lbl.includes('work auth') || lbl.includes('visa')) formData[f.identifier] = workAuth;
    else if (lbl.includes('cover letter') || lbl.includes('additional') || lbl.includes('summary') || lbl.includes('about yourself')) formData[f.identifier] = narrative.slice(0, 500);
  });

  return formData;
}

// --- MAIN IN-BROWSER FORM SCAN & AUTO-FILL ---
if (fillButton) {
  fillButton.addEventListener('click', async () => {
    setLoading(true);
    statusText.textContent = 'Scanning active page for form inputs...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) throw new Error("Could not inspect active browser tab.");

      // Step 1: Inject In-Browser Form Scraper
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: scrapePageForForms
      });

      let scrapedFields = [];
      if (injectionResults && injectionResults.length > 0) {
        for (const res of injectionResults) {
          if (res.result && res.result.length > 0) {
            scrapedFields = res.result;
            break;
          }
        }
      }

      if (scrapedFields.length === 0) {
        throw new Error("No fillable form inputs found on this page.");
      }

      let mappedFormData = {};
      let detectedCompany = 'Startup';
      let detectedRole = 'Application';
      let suggestions = [];

      // If Gemini API Key is configured, use Gemini 2.0 Flash for semantic reasoning & dynamic suggestions
      if (currentApiKey) {
        statusText.textContent = `Found ${scrapedFields.length} fields. Correlating via Gemini 2.0 Flash...`;
        const tone = toneSelect?.value || 'Professional & Concise';
        const lang = languageInput?.value || 'English';

        const systemPrompt = `
          You are an intelligent autonomous job applicant assistant.
          
          TASKS:
          1. Map candidate's profile to the provided HTML form fields.
          2. Extract company name and role title from Page Title: "${tab.title}".
          3. For open-ended, novel, or dynamic questions (e.g. essay questions, salary expectations, unique prompts) where the exact answer is not explicitly detailed in the candidate profile, generate a tailored, high-conviction AI suggestion based on candidate skills.
          
          CANDIDATE PROFILE:
          "${profileText.value}"
          
          SETTINGS:
          Tone: ${tone}
          Language: ${lang}
          
          FORM FIELDS IDENTIFIED (JSON):
          ${JSON.stringify(scrapedFields)}
          
          INSTRUCTIONS:
          Return STRICT VALID JSON only with no markdown formatting:
          {
            "formData": {
              "identifier_1": "answer_1"
            },
            "suggestions": [
              {
                "identifier": "identifier_x",
                "question": "Question label text",
                "suggestedAnswer": "High-conviction suggested response tailored to candidate experience",
                "reason": "Rationale"
              }
            ],
            "companyName": "Company extracted from page title or form context",
            "jobRole": "Role title extracted",
            "followUpQuestion": "Summary of action taken."
          }
        `;

        try {
          const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
          });

          if (apiRes.ok) {
            const resultData = await apiRes.json();
            const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleanJson = rawText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed.formData) {
              mappedFormData = parsed.formData;
              if (parsed.companyName) detectedCompany = parsed.companyName;
              if (parsed.jobRole) detectedRole = parsed.jobRole;
              if (Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions;
            }
          }
        } catch (geminiErr) {
          console.warn("Gemini API fallback to deterministic heuristics:", geminiErr);
        }
      }

      // If Gemini key is missing or API did not return mapping, use deterministic heuristic mapper
      if (Object.keys(mappedFormData).length === 0) {
        statusText.textContent = `Auto-filling ${scrapedFields.length} fields via pattern heuristics...`;
        mappedFormData = deterministicMapFields(scrapedFields, profileText.value);
        const titleParts = (tab.title || '').split(/[-–|—]/);
        if (titleParts[0]) detectedCompany = titleParts[0].trim();
        if (titleParts[1]) detectedRole = titleParts[1].trim();
      }

      // Step 2: Inject In-Browser Form Filler with React/Next.js Prototype Setters
      statusText.textContent = 'Auto-filling fields on page...';
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: fillPage,
        args: [mappedFormData]
      });

      // Render Dynamic Suggestions if any
      renderSuggestions(suggestions, tab.id);

      // Step 3: Automatically log to Application Pipeline
      chrome.storage.local.get(['scoutr_applications'], (res) => {
        const today = new Date().toISOString().split('T')[0];
        let apps = res.scoutr_applications || [];
        if (!apps.some(a => a.company === detectedCompany && a.date === today)) {
          apps.unshift({
            id: Date.now().toString(),
            company: detectedCompany,
            role: detectedRole,
            source: 'In-Browser Auto-Fill',
            status: 'Applied',
            date: today
          });
          chrome.storage.local.set({ scoutr_applications: apps });
        }
      });

      statusText.textContent = `Success! Auto-filled ${Object.keys(mappedFormData).length} fields & synced.`;

    } catch (err) {
      statusText.textContent = `Notice: ${err.message}`;
    } finally {
      setLoading(false);
    }
  });
}

function renderSuggestions(suggestions, tabId) {
  const container = document.getElementById('suggestions-section');
  const list = document.getElementById('suggestions-list');
  const count = document.getElementById('suggestions-count');

  if (!suggestions || suggestions.length === 0) {
    if (container) container.style.display = 'none';
    return;
  }

  if (container) container.style.display = 'flex';
  if (count) count.textContent = `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}`;
  if (list) list.innerHTML = '';

  suggestions.forEach(item => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
      <div class="suggestion-q">${item.question || 'Dynamic Field'}</div>
      <div class="suggestion-ans">${item.suggestedAnswer || ''}</div>
      <div class="suggestion-actions">
        <button class="btn-apply-suggestion" data-id="${item.identifier}">
          <span>⚡ Apply to Field</span>
        </button>
      </div>
    `;

    const btn = card.querySelector('.btn-apply-suggestion');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Applying...';
      const singleForm = { [item.identifier]: item.suggestedAnswer };
      await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        func: fillPage,
        args: [singleForm]
      });
      btn.textContent = '✓ Applied';
      btn.style.background = '#10b981';
    });

    list.appendChild(card);
  });
}

function setLoading(isLoading) {
  if (fillButton) fillButton.disabled = isLoading;
}

// --- CONTENT SCRIPT FUNCTIONS INJECTED INTO TARGET TAB ---
function scrapePageForForms() {
  const fields = [];
  const found = new Set();

  const add = (el, label) => {
    if (!el || el.hidden || el.disabled || found.has(el) || !label || label.trim() === '') return;
    const uid = `scoutr_field_${fields.length}`;
    el.dataset.scoutrId = uid;
    found.add(el);
    fields.push({ identifier: uid, label: label.trim() });
  };

  // Google Forms
  document.querySelectorAll('div[role="listitem"]').forEach(block => {
    const lbl = block.querySelector('div[role="heading"]');
    const inp = block.querySelector('input[type="text"], input[type="email"], textarea');
    if (lbl && inp) add(inp, lbl.innerText || lbl.textContent);
  });

  // MS Forms
  if (fields.length === 0) {
    document.querySelectorAll('div[data-automation-id="questionItem"]').forEach(block => {
      const lbl = block.querySelector('[data-automation-id="questionTitle"]');
      const inp = block.querySelector('input, textarea');
      if (lbl && inp) add(inp, lbl.innerText || lbl.textContent);
    });
  }

  // Generic HTML Form inputs & ATS Portals (Ashby, Greenhouse, Lever, Workday)
  document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea').forEach(el => {
    let lbl = '';
    if (el.id) {
      const lEl = document.querySelector(`label[for="${el.id}"]`);
      if (lEl) lbl = lEl.innerText;
    }
    if (!lbl) {
      const p = el.closest('label');
      if (p) lbl = p.innerText.split('\n')[0];
    }
    if (!lbl) lbl = el.ariaLabel || el.getAttribute('aria-label') || el.placeholder;
    add(el, lbl);
  });

  return fields;
}

function fillPage(formData) {
  for (const [id, val] of Object.entries(formData)) {
    if (val && val.trim() !== '') {
      const el = document.querySelector(`[data-scoutr-id="${id}"]`);
      if (el) {
        try {
          const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (setter) {
            setter.call(el, val);
          } else {
            el.value = val;
          }
        } catch (e) {
          el.value = val;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }
  }
}
