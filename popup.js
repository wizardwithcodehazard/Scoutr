// --- GET ALL ELEMENTS ---
const profileText = document.getElementById('user-profile');
const fillButton = document.getElementById('fill-btn');
const statusText = document.getElementById('status');
const recordButton = document.getElementById('record-btn');

// Profile elements
const profileSelect = document.getElementById('profile-select');
const profileNameInput = document.getElementById('profile-name');
const saveProfileButton = document.getElementById('save-profile-btn');
const deleteProfileButton = document.getElementById('delete-profile-btn');

// --- NEW IMAGE UPLOAD ELEMENTS ---
const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const clearImageBtn = document.getElementById('clear-image-btn');
const fileStatus = document.getElementById('file-status');

// --- API & WEBHOOK URLS ---
// 1. You MUST set your Gemini API key here for client-side image processing
// NOTE: This key is used directly in the browser!
const GEMINI_API_KEY = "AIzaSyA0GkoJsohLKSj09TI-IdpN1kK7BqaUBkc"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// 2. This is your ONLY remaining n8n workflow (the Form Filler)
const FORM_FILLER_WEBHOOK_URL = "http://localhost:5678/webhook/f4a0d98c-4fb5-4f43-b313-773cec344280"; 

// --- GLOBAL PROFILES ARRAY ---
let allProfiles = [];

// --- PROFILE MANAGEMENT FUNCTIONS (UNCHANGED) ---
function loadProfiles() {
  chrome.storage.local.get(['allUserProfiles', 'lastProfileName'], (result) => {
    try {
      allProfiles = result.allUserProfiles ? JSON.parse(result.allUserProfiles) : [];
    } catch (e) {
      console.error("Error parsing profiles, resetting.", e);
      allProfiles = [];
    }
    
    profileSelect.innerHTML = '<option value="">-- New Profile --</option>'; 
    allProfiles.forEach(profile => {
      const option = document.createElement('option');
      option.value = profile.name;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });

    if (result.lastProfileName) {
      const lastProfile = allProfiles.find(p => p.name === result.lastProfileName);
      if (lastProfile) {
        profileNameInput.value = lastProfile.name;
        profileText.value = lastProfile.data;
        profileSelect.value = lastProfile.name;
      }
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
  const data = profileText.value;
  if (!name) {
    statusText.textContent = 'Please enter a profile name to save.';
    return;
  }
  const existingProfileIndex = allProfiles.findIndex(p => p.name === name);
  if (existingProfileIndex > -1) {
    allProfiles[existingProfileIndex].data = data;
  } else {
    allProfiles.push({ name, data });
  }
  chrome.storage.local.set({ lastProfileName: name }); 
  saveProfilesAndRefresh();
  profileSelect.value = name; 
  statusText.textContent = `Profile '${name}' saved!`;
});
deleteProfileButton.addEventListener('click', (e) => {
  e.preventDefault();
  const name = profileSelect.value;
  if (!name) {
    statusText.textContent = 'Please select a profile to delete.';
    return;
  }
  if (confirm(`Are you sure you want to delete profile: '${name}'?`)) {
    allProfiles = allProfiles.filter(p => p.name !== name);
    chrome.storage.local.remove('lastProfileName'); 
    saveProfilesAndRefresh();
    profileNameInput.value = '';
    profileText.value = '';
    statusText.textContent = `Profile '${name}' deleted.`;
  }
});
profileSelect.addEventListener('change', () => {
  const selectedName = profileSelect.value;
  if (selectedName) {
    const profile = allProfiles.find(p => p.name === selectedName);
    if (profile) {
      profileNameInput.value = profile.name;
      profileText.value = profile.data;
      chrome.storage.local.set({ lastProfileName: selectedName }); 
    }
  } else {
    profileNameInput.value = '';
    profileText.value = '';
    chrome.storage.local.remove('lastProfileName');
  }
});

// --- NEW IMAGE UPLOAD LOGIC (DIRECT API CALL) ---
imageUpload.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      fileStatus.textContent = "CRITICAL: Please set your GEMINI_API_KEY in popup.js!";
      return;
  }

  if (file.type.startsWith('image/')) {
    fileStatus.textContent = 'Processing image... (Calling Gemini CV)';
    imagePreviewContainer.style.display = 'none';

    try {
      // 1. Convert to Base64
      const base64Image = await fileToBase64(file);
      const rawBase64 = base64Image.split(',')[1];
      const mimeType = base64Image.split(':')[1].split(';')[0];
      
      // Show preview
      imagePreview.src = base64Image;
      imagePreviewContainer.style.display = 'block';

      // 2. Build the API payload
      const payload = {
          contents: [{
              parts: [
                  { text: "Extract all text from this document image. Return only the raw, transcribed text. Do not add commentary." },
                  { inlineData: { mimeType: mimeType, data: rawBase64 } }
              ]
          }],
      };
      
      // 3. Call the Gemini API
      const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      // 4. Extract the text
      const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (extractedText) {
        profileText.value = extractedText;
        fileStatus.textContent = 'Image text extracted! Ready to save.';
      } else {
        fileStatus.textContent = "AI returned no text. Check API Key/Permissions.";
        console.error("AI Response Error:", result);
      }

    } catch (error) {
      console.error("Image processing error:", error);
      fileStatus.textContent = `Error: ${error.message}`;
      clearImage();
    }
  } else {
    fileStatus.textContent = 'Please upload an image file (PNG, JPG).';
    imageUpload.value = null;
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

clearImageBtn.addEventListener('click', (e) => {
  e.preventDefault();
  clearImage();
});

function clearImage() {
  imagePreview.src = '';
  imagePreviewContainer.style.display = 'none';
  imageUpload.value = null; 
  fileStatus.textContent = '';
}
// --- END IMAGE UPLOAD LOGIC ---


// --- EXISTING LOGIC ---
document.addEventListener('DOMContentLoaded', loadProfiles);

// Main "Fill Form" button click logic
fillButton.addEventListener('click', async () => {
  statusText.textContent = ''; 
  setLoading(true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 1. Inject the scraping function
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: scrapePageForForms,
    });

    // 2. Find the results
    let scrapedFields = [];
    if (injectionResults && injectionResults.length > 0) {
      for (const result of injectionResults) {
        if (result.result && result.result.length > 0) {
          scrapedFields = result.result;
          break;
        }
      }
    }

    // 3. Check if we found anything
    if (scrapedFields.length === 0) {
      throw new Error("No form fields found on the page.");
    }

    statusText.textContent = `Found ${scrapedFields.length} fields. Asking AI...`;

    // Get the tone and language
    const tone = document.getElementById('tone-select').value;
    const lang = document.getElementById('language-input').value;

    // 4. Send to n8n (Workflow 1 - Form Filler)
    const aiResponse = await fetch(FORM_FILLER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userProfile: profileText.value,
        formFields: scrapedFields,
        selectedTone: tone, 
        language: lang
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`n8n workflow failed: ${aiResponse.statusText}`);
    }

    const fillData = await aiResponse.json();

    if (!fillData || fillData.length === 0) {
      throw new Error("AI returned no data (empty array).");
    }

    const rawGeminiResponse = fillData[0];

    if (!rawGeminiResponse.candidates || rawGeminiResponse.candidates.length === 0) {
      throw new Error("AI returned no candidates.");
    }
    
    const jsonText = rawGeminiResponse.candidates[0].content.parts[0].text;
    
    if (!jsonText) {
      throw new Error("AI returned no text.");
    }

    // "Jugaad Chat" logic
    const dataObject = JSON.parse(jsonText);

    if (!dataObject.formData || !dataObject.followUpQuestion) {
      console.error("Invalid JSON structure from AI:", dataObject);
      throw new Error("AI returned an invalid data format.");
    }

    // 5. Inject the filler function
    statusText.textContent = "AI responded. Filling form...";
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: fillPage,
      args: [dataObject.formData] // Pass only the formData
    });

    // Show the follow-up question
    statusText.textContent = dataObject.followUpQuestion;

  } catch (error) {
    console.error("Form fill error:", error);
    statusText.textContent = `Error: ${error.message}`;
  } finally {
    setLoading(false); 
  }
});

function setLoading(isLoading) {
  fillButton.disabled = isLoading;
  if (isLoading && statusText && !statusText.textContent.includes('Listening')) {
     statusText.textContent = "Analyzing page...";
  }
}

// --- SCRAPING FUNCTION (UNCHANGED) ---
function scrapePageForForms() {
  const fields = [];
  const foundElements = new Set(); 

  const addField = (el, label) => {
    if (!el || el.hidden || el.disabled || foundElements.has(el) || !label || label.trim() === "") {
      return;
    }
    const uniqueId = `ai_filler_id_${fields.length}`;
    el.dataset.aiFillerId = uniqueId; 
    foundElements.add(el);
    
    fields.push({
      identifier: uniqueId,
      label: label.trim()
    });
  };

  // --- STRATEGY 1: Google Forms (by 'listitem' wrapper) ---
  try {
    document.querySelectorAll('div[role="listitem"]').forEach(questionBlock => {
      const labelEl = questionBlock.querySelector('div[role="heading"]');
      const inputEl = questionBlock.querySelector(
        'input[type="text"], input[type="email"], textarea'
      );
      
      if (labelEl && inputEl) {
        const labelText = labelEl.innerText || labelEl.textContent;
        addField(inputEl, labelText);
      }
    });
  } catch (e) {
    console.error("AI Filler: Error in Google Forms strategy:", e);
  }

  // --- STRATEGY 2: Microsoft Forms ---
  if (fields.length === 0) {
    try {
      document.querySelectorAll('div[data-automation-id="questionItem"]').forEach(questionBlock => {
        const labelEl = questionBlock.querySelector('[data-automation-id="questionTitle"]');
        const inputEl = questionBlock.querySelector(
          'input[data-automation-id="textInput"], textarea[data-automation-id="textInput"]'
        );
        
        if (labelEl && inputEl) {
          const labelText = labelEl.innerText || labelEl.textContent;
          addField(inputEl, labelText);
        }
      });
    } catch (e) {
      console.error("AI Filler: Error in MS Forms strategy:", e);
    }
  }
  
  // --- STRATEGY 3: FALLBACK (for standard HTML forms) ---
  if (fields.length === 0) {
    try {
      document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(el => {
        let labelText = "";
        if (el.id) {
          const labelEl = document.querySelector(`label[for="${el.id}"]`);
          if (labelEl) labelText = labelEl.innerText;
        }
        if (!labelText) {
          const parentLabel = el.closest('label');
          if (parentLabel) labelText = parentLabel.innerText.split('\n')[0];
        }
        if (!labelText) {
            labelText = el.ariaLabel || el.getAttribute('aria-label');
        }
        if (!labelText) {
          labelText = el.placeholder;
        }
        addField(el, labelText);
      });
    } catch (e) {
      console.error("AI Filler: Error in Fallback strategy:", e);
    }
  }

  return fields; 
}


// --- FILLER FUNCTION (UNCHANGED, with 'value' check) ---
function fillPage(dataObject) { 
  console.log("AI Data to fill:", dataObject);
  
  for (const [identifier, value] of Object.entries(dataObject)) {
    if (value && value.trim() !== "") {
      let el = document.querySelector(`[data-ai-filler-id="${identifier}"]`);
      
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      } else {
        console.warn(`Could not find element with ai-filler-id: ${identifier}`);
      }
    } else {
      console.log(`AI skipped field ${identifier} and will ask user for input.`);
    }
  }
}

// --- SPEECH RECOGNITION CODE (UNCHANGED) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  
  let baseText = ''; 
  let final_transcript_so_far = ''; 

  recognition.onstart = () => {
    statusText.textContent = 'Listening...';
    baseText = profileText.value;
    if (baseText.length > 0 && !baseText.endsWith(' ')) {
      baseText += ' '; 
    }
    final_transcript_so_far = ''; 
  };

  recognition.onresult = (event) => {
    let interim_transcript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript_so_far += event.results[i][0].transcript + ' ';
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    
    profileText.value = baseText + final_transcript_so_far + interim_transcript;
  };
  
  recognition.onend = () => {
    recordButton.textContent = 'Start Recording Bio';
    recordButton.classList.remove('recording');
    isRecording = false;
    statusText.textContent = ''; 
  };
  
  recognition.onerror = (event) => {
    let errorMsg = `Error: ${event.error}`; 
    if (event.error === 'not-allowed') {
        errorMsg = 'Mic access denied. Please allow.';
    } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please try again.';
    } else if (event.error === 'network') {
        errorMsg = 'Network error. Please check connection.';
    }
    
    statusText.textContent = errorMsg; 
    console.error(`Speech Recognition Error: ${event.error} - Message: ${event.message || 'No message'}`);
  };

  let isRecording = false;
  recordButton.addEventListener('click', (e) => {
    e.preventDefault(); 
    
    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        recordButton.textContent = 'Stop Recording';
        recordButton.classList.add('recording');
        isRecording = true;
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  });

} else {
  console.warn("Speech Recognition not supported by this browser.");
  statusText.textContent = 'Speech not supported.';
  recordButton.style.display = 'none';
}