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

    // If Gemini API Key is configured, use Gemini 2.0 Flash for semantic reasoning
    if (currentApiKey) {
      statusText.textContent = `Found ${scrapedFields.length} fields. Correlating via Gemini 2.0 Flash...`;
      const tone = document.getElementById('tone-select')?.value || 'Professional';
      const lang = document.getElementById('language-input')?.value || 'English';

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
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini API fallback to deterministic heuristics:", geminiErr);
      }
    }

    // If Gemini key is missing or API did not return mapping, use deterministic heuristic mapper
    if (Object.keys(mappedFormData).length === 0) {
      statusText.textContent = `Auto-filling ${scrapedFields.length} fields via deterministic pattern heuristics...`;
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

    // Step 3: Automatically log to Application Pipeline
    chrome.storage.local.get(['current_user', 'scoutr_applications'], (res) => {
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

    statusText.textContent = `Success! Form auto-filled (${Object.keys(mappedFormData).length} fields).`;

  } catch (err) {
    statusText.textContent = `Notice: ${err.message}`;
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
