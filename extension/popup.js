/**
 * Clairis — Autonomous Form Filler Extension Logic
 * Connects In-Browser Form Scraper with Gemini 2.0 Flash Engine and Command Center.
 */

// --- DOM ELEMENTS ---
const profileText = document.getElementById('user-profile');
const fillButton = document.getElementById('fill-btn');
const statusText = document.getElementById('status');
const recordButton = document.getElementById('record-btn');

const profileSelect = document.getElementById('profile-select');
const profileNameInput = document.getElementById('profile-name');
const saveProfileButton = document.getElementById('save-profile-btn');
const deleteProfileButton = document.getElementById('delete-profile-btn');

const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const clearImageBtn = document.getElementById('clear-image-btn');
const fileStatus = document.getElementById('file-status');
const openDashboardBtn = document.getElementById('open-dashboard-btn');

// --- STATE ---
let allProfiles = [];
let currentApiKey = '';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide && lucide.createIcons) lucide.createIcons();
  loadProfiles();
  loadApiKey();
  detectCurrentAts();
});

// Detect Target ATS on active tab
async function detectCurrentAts() {
  try {
    if (!chrome.tabs || !chrome.tabs.query) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    let atsName = 'Standard Web Application';
    const url = tab.url.toLowerCase();
    if (url.includes('greenhouse.io') || url.includes('boards.greenhouse')) atsName = 'Greenhouse ATS';
    else if (url.includes('lever.co') || url.includes('jobs.lever')) atsName = 'Lever ATS';
    else if (url.includes('ashbyhq.com')) atsName = 'Ashby ATS';
    else if (url.includes('workday.com') || url.includes('myworkdayjobs')) atsName = 'Workday ATS';
    else if (url.includes('wellfound.com')) atsName = 'Wellfound Portal';
    else if (url.includes('ycombinator.com') || url.includes('workatastartup.com')) atsName = 'Y Combinator Portal';
    else if (url.includes('forms.gle') || url.includes('docs.google.com/forms')) atsName = 'Google Forms';

    if (statusText) {
      statusText.textContent = `Target detected: ${atsName}`;
    }
  } catch (e) {
    // Non-critical background detection
  }
}

// Load API Key from local storage
function loadApiKey() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['gemini_api_key'], (res) => {
      currentApiKey = res.gemini_api_key || '';
    });
  }
}

// Open Dashboard
if (openDashboardBtn) {
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/app.html') });
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

function loadProfiles() {
  if (!chrome.storage || !chrome.storage.local) return;

  chrome.storage.local.get(['allUserProfiles', 'lastProfileName'], (result) => {
    try {
      allProfiles = result.allUserProfiles ? JSON.parse(result.allUserProfiles) : [];
    } catch (e) {
      allProfiles = [];
    }

    profileSelect.innerHTML = '<option value="">-- New / Select Profile --</option>';
    allProfiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name;
      profileSelect.appendChild(opt);
    });

    if (result.lastProfileName) {
      const last = allProfiles.find(p => p.name === result.lastProfileName);
      if (last) {
        profileNameInput.value = last.name;
        profileText.value = formatProfileData(last);
        profileSelect.value = last.name;
      }
    } else if (allProfiles.length > 0) {
      profileNameInput.value = allProfiles[0].name;
      profileText.value = formatProfileData(allProfiles[0]);
      profileSelect.value = allProfiles[0].name;
    }
  });
}

function saveProfilesAndRefresh() {
  chrome.storage.local.set({ allUserProfiles: JSON.stringify(allProfiles) }, () => {
    loadProfiles();
  });
}

saveProfileButton.addEventListener('click', (e) => {
  e.preventDefault();
  const name = profileNameInput.value.trim();
  const data = profileText.value.trim();

  if (!name) {
    statusText.textContent = 'Please enter a profile label.';
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
  statusText.textContent = `Profile '${name}' saved!`;
});

deleteProfileButton.addEventListener('click', (e) => {
  e.preventDefault();
  const name = profileSelect.value;
  if (!name) return;

  if (confirm(`Delete profile '${name}'?`)) {
    allProfiles = allProfiles.filter(p => p.name !== name);
    chrome.storage.local.remove('lastProfileName');
    saveProfilesAndRefresh();
    profileNameInput.value = '';
    profileText.value = '';
    statusText.textContent = `Profile '${name}' deleted.`;
  }
});

profileSelect.addEventListener('change', () => {
  const selected = profileSelect.value;
  if (selected) {
    const prof = allProfiles.find(p => p.name === selected);
    if (prof) {
      profileNameInput.value = prof.name;
      profileText.value = formatProfileData(prof);
      chrome.storage.local.set({ lastProfileName: selected, current_user: selected });
    }
  } else {
    profileNameInput.value = '';
    profileText.value = '';
  }
});

// --- IMAGE OCR EXTRACTION ---
imageUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!currentApiKey) {
    const entered = prompt('Please enter your Google Gemini API Key for OCR extraction:');
    if (entered) {
      currentApiKey = entered.trim();
      chrome.storage.local.set({ gemini_api_key: currentApiKey });
    } else {
      fileStatus.textContent = 'API key required for OCR.';
      return;
    }
  }

  fileStatus.textContent = 'Scanning document via Gemini Vision...';
  try {
    const base64 = await fileToBase64(file);
    const raw = base64.split(',')[1];
    const mime = base64.split(':')[1].split(';')[0];

    imagePreview.src = base64;
    imagePreviewContainer.style.display = 'block';

    const payload = {
      contents: [{
        parts: [
          { text: "Transcribe all visible resume text, experience, skills, and contact information precisely. Return raw text only." },
          { inlineData: { mimeType: mime, data: raw } }
        ]
      }]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      profileText.value = (profileText.value ? profileText.value + '\n\n' : '') + text;
      fileStatus.textContent = 'OCR text extracted into profile!';
    } else {
      fileStatus.textContent = 'Could not extract text from document.';
    }
  } catch (err) {
    fileStatus.textContent = `OCR Error: ${err.message}`;
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
}

if (clearImageBtn) {
  clearImageBtn.addEventListener('click', () => {
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
    imageUpload.value = null;
    fileStatus.textContent = '';
  });
}

// --- MAIN IN-BROWSER FORM SCAN & AUTO-FILL ---
fillButton.addEventListener('click', async () => {
  if (!currentApiKey) {
    const entered = prompt('Please enter your Google Gemini API Key:');
    if (entered) {
      currentApiKey = entered.trim();
      chrome.storage.local.set({ gemini_api_key: currentApiKey });
    } else {
      statusText.textContent = 'Gemini API key is required.';
      return;
    }
  }

  setLoading(true);
  statusText.textContent = 'Scanning active page for form inputs...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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

    statusText.textContent = `Found ${scrapedFields.length} fields. Mapping profile via Gemini 2.0...`;

    const tone = document.getElementById('tone-select').value;
    const lang = document.getElementById('language-input').value;

    const systemPrompt = `
      You are an intelligent autonomous job applicant assistant.
      
      TASKS:
      1. Map candidate's profile to the provided HTML form fields.
      2. Extract company name and role title from Page Title: "${tab.title}".
      
      CANDIDATE PROFILE:
      "${profileText.value}"
      
      FORM FIELDS IDENTIFIED (JSON):
      ${JSON.stringify(scrapedFields)}
      
      SETTINGS:
      Tone: ${tone}
      Language: ${lang}
      
      INSTRUCTIONS:
      Return STRICT VALID JSON only with no markdown formatting:
      {
        "formData": {
          "identifier_1": "answer_1"
        },
        "companyName": "Company extracted from page title or form context",
        "jobRole": "Role title extracted",
        "followUpQuestion": "Summary of action taken."
      }
    `;

    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
    });

    if (!apiRes.ok) throw new Error(`Gemini API error: ${apiRes.statusText}`);

    const resultData = await apiRes.json();
    const rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.formData) throw new Error("Invalid mapping response format.");

    // Step 2: Inject In-Browser Form Filler
    statusText.textContent = 'Auto-filling fields on page...';
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: fillPage,
      args: [parsed.formData]
    });

    // Step 3: Automatically log to Application Pipeline
    if (parsed.companyName && parsed.companyName !== 'Unknown') {
      chrome.storage.local.get(['current_user'], (uRes) => {
        const u = uRes.current_user || 'Sahil';
        const key = `apps_${u}`;
        chrome.storage.local.get([key], (aRes) => {
          const apps = aRes[key] || [];
          const today = new Date().toLocaleDateString('en-GB');
          if (!apps.some(a => a.company === parsed.companyName && a.date === today)) {
            apps.unshift({
              id: Date.now().toString(),
              company: parsed.companyName,
              role: parsed.jobRole || 'Application',
              source: 'In-Browser Auto-Fill',
              status: 'Applied',
              date: today
            });
            chrome.storage.local.set({ [key]: apps });
          }
        });
      });
    }

    statusText.textContent = parsed.followUpQuestion || 'Form auto-filled & logged to Command Center!';

  } catch (err) {
    statusText.textContent = `Error: ${err.message}`;
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  fillButton.disabled = isLoading;
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

  // Generic HTML Form inputs
  if (fields.length === 0) {
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(el => {
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
  }

  return fields;
}

function fillPage(formData) {
  for (const [id, val] of Object.entries(formData)) {
    if (val && val.trim() !== '') {
      const el = document.querySelector(`[data-scoutr-id="${id}"]`);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }
  }
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
        statusText.textContent = 'Mic initialization error.';
      }
    }
  });

  rec.onresult = (evt) => {
    let interim = '';
    for (let i = evt.resultIndex; i < evt.results.length; ++i) {
      if (evt.results[i].isFinal) {
        profileText.value += (profileText.value ? ' ' : '') + evt.results[i][0].transcript;
      }
    }
  };
}
