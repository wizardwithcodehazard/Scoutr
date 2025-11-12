<div align="center">

# 🧿 **Clairis**  

### *Your Agentic AI Form Companion*
<img width="1024" height="329" alt="image" src="https://github.com/user-attachments/assets/5e764993-00d0-45b6-8148-9e28411e0ac5" />

> **Turn any form into a natural, inclusive conversation — instantly.**  
> **100% local • Serverless • Privacy-first • Multimodal**

[![GitHub stars](https://img.shields.io/github/stars/wizardwithcodehazard/clairis?style=social)](https://github.com/wizardwithcodehazard/clairis/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=google-chrome&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-Local_Orchestrator-FF6D60?logo=n8n&logoColor=white)


</div>

---

## 🌟 **The Future of Form Filling**

**Clairis** is a **standalone, serverless AI agent** that lives in your browser and transforms rigid digital forms into **empathetic, multilingual conversations**.

No backend. No data leaks. Just pure, local intelligence powered by **Google Gemini** and orchestrated by **n8n**.

---

## 🚀 **Core Superpowers**

| Feature | Magic Behind It |
|-------|----------------|
| 🧠 **Agentic Decision Engine** | `n8n` runs locally — full control over AI logic, validation, and JSON output |
| 🖼️ **Client-Side Vision** | Upload ID, screenshot, or doc → **instant OCR** via direct Gemini API call |
| 🗣️ **Human-Like Guidance** | Returns `formData` + `followUpQuestion` with **empathy & clarity** |
| 🌍 **Multilingual & Tone-Adaptive** | Hindi, Tamil, Bengali, etc. — tone shifts from formal to friendly on demand |
| 🎤 **Voice Input** | Speak your profile — **Web Speech API** fills it hands-free |
| 💾 **Local Profile Vault** | Save/load unlimited profiles with `chrome.storage.local` — **no database, no cloud** |

---

## 🏗️ **Architecture: Clean. Local. Secure.**

```mermaid
graph LR
    A[Browser Extension<br/>popup.js] -->|1. Input + CV| B(Gemini API<br/>Direct Call)
    A -->|2. Webhook POST| C[n8n Local Server]
    C -->|3. AI Prompt + Context| D(Gemini Chat Model)
    D -->|4. JSON Response| C
    C -->|5. formData + followUp| A
    A -->|6. Auto-fill + UX| E[Target Web Form]
```

> **All AI runs locally or via direct API calls. No middleman. No data stored.**

---

## 🔬 **Technical Brilliance**

### **1. Instant Vision Pipeline (No n8n File Bugs!)**

```js
fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=' + API_KEY, {
  method: 'POST',
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [
      { text: "Extract all visible text precisely." },
      { inline_data: { mime_type: "image/jpeg", data: base64Image }}
    ]}]
  })
})
```

→ **Text appears in Profile Data in <1s**

---

### **2. The Conversational JSON Contract**

```json
{
  "formData": {
    "full_name": "Priya Sharma",
    "role": "",
    "experience": "5"
  },
  "followUpQuestion": "Hi Priya! I filled your name and experience.\n\nThe role field is blank — based on your resume, would you like me to suggest:\n• *Senior ML Engineer*\n• *AI Research Lead*\n\nJust say the word! 😊"
}
```

- `""` = safely skipped  
- Multi-line, **warm, actionable** suggestions  
- Feels like a **real assistant**

---

## ⚙️ **Setup in 3 Minutes**

### **Prerequisites**
```bash
# You need:
- Google Gemini API Key
- Chrome (or Chromium browser)
- Node.js
```

---

### **Step 1: Launch n8n (Your Local Brain)**

```bash
npx n8n
```
→ Opens at **[http://localhost:5678](http://localhost:5678)**

---

### **Step 2: Import the Clairis Workflow**

1. In n8n: **Create New Workflow**  
2. Add nodes:  
   `Webhook` → `Google Gemini Chat Model` → `Respond to Webhook`  
3. Paste the **System Prompt** from `popup.js` (look for `SYSTEM_PROMPT`)  
4. **Activate Webhook** → Copy URL → Paste into `popup.js`

---

### **Step 3: Load the Extension**

1. Open `popup.js`  
   ```js
   const GEMINI_API_KEY = "your-key-here";
   const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/xxxx";
   ```
2. Go to `chrome://extensions/`  
   → Enable **Developer Mode**  
   → **Load unpacked** → Select the `clairis-extension/` folder

**Done.** Open any form. Click the **Clairis** icon. Speak, upload, or type.

---

## 📸 **See It in Action**

<div align="center">

### **n8n Workflow**
<img alt="n8n Workflow" src="https://github.com/user-attachments/assets/94195e3f-0bc5-4d58-b7e4-df4c29855c93" width="600" />

### **Clairis Extension**
<table>
<tr>
<td><img width="274" height="398" alt="Conversational Magic" src="https://github.com/user-attachments/assets/e5c1809f-46e6-4619-8c4c-3abb827c3c07" /></td>
<td><img width="343" height="470" alt="Vision Extraction" src="https://github.com/user-attachments/assets/8d271ea0-1519-4ede-bd7e-f46d78a8ffc4" /></td>
</tr>
</table>

</div>

---

## 🔥 **Why Clairis Stands Out**

| Old Way | **Clairis** |
|-------|-----------|
| Forms = frustration | **Forms = dialogue** |
| English only | **10+ Indian languages** |
| Blind to images | **Reads IDs, docs, screenshots** |
| Cloud-dependent | **100% local, private, offline-ready** |
| Generic output | **Empathetic, contextual, human** |

---

## 🎯 **Quick Demo Flow**

1. Click **Clairis** icon on any form  
2. **Speak**: “I’m a data scientist with 4 years at Flipkart”  
3. **Upload ID** → auto-extracts name, DOB, address  
4. **AI fills form** + asks: _“Should I list your role as ‘Senior Data Scientist’?”_  
5. Say **“Yes”** → done.

---

## 🛠️ **Project Structure**

```
clairis/
├── manifest.json
├── popup.html
├── popup.js          # Core logic 
├── icons
└── README.md
```

---
## 🌱 **Contributing**

We welcome **forks, issues, and PRs**!

```bash
git clone https://github.com/wizardwithcodehazard/clairis.git
# Make your magic
git commit -m "Add Telugu support"
git push
```

---

## 📄 **License**

[MIT License](LICENSE) — Free to use, modify, and ship.

---

<div align="center">

### **Clairis doesn’t just fill forms.**  
### **It understands people.**

**Made with precision • Runs with empathy**

</div>
