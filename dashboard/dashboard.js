/**
 * Scoutr Workspace Controller
 * Modular controller managing Multi-Profile Builder, Dynamic Live Feed Matching,
 * Telemetry Sentinel, and Application Pipeline.
 */

// Global State
let jobsData = [];
let applications = [];
let userProfiles = [];
let activeProfileIndex = 0;
let activeFilter = 'all';
let searchQuery = '';

// DOM Cache
const jobGrid = document.getElementById('job-grid-container');
const appTableBody = document.getElementById('app-table-body');
const emptyTrackerState = document.getElementById('empty-tracker-state');
const tabButtons = document.querySelectorAll('.w-tab');
const viewPanes = document.querySelectorAll('.view-pane');
const searchInput = document.getElementById('job-search-input');
const filterPills = document.querySelectorAll('.f-pill');
const jobsCountBadge = document.getElementById('jobs-count-badge');
const profileCountBadge = document.getElementById('profile-count-badge');
const trackerCountBadge = document.getElementById('tracker-count-badge');
const feedProfileName = document.getElementById('feed-profile-name');

// Profile Form Elements
const profilePillsContainer = document.getElementById('profile-pills-container');
const profileEditForm = document.getElementById('profile-edit-form');
const profLabelInput = document.getElementById('prof-label');
const profFullNameInput = document.getElementById('prof-fullname');
const profEmailInput = document.getElementById('prof-email');
const profPhoneInput = document.getElementById('prof-phone');
const profLocationInput = document.getElementById('prof-location');
const profWorkAuthInput = document.getElementById('prof-work-auth');
const profLinkedinInput = document.getElementById('prof-linkedin');
const profGithubInput = document.getElementById('prof-github');
const profPortfolioInput = document.getElementById('prof-portfolio');
const profTwitterInput = document.getElementById('prof-twitter');
const profTargetRolesInput = document.getElementById('prof-target-roles');
const profSkillsInput = document.getElementById('prof-skills');
const profNarrativeInput = document.getElementById('prof-narrative');
const resumeRawText = document.getElementById('resume-raw-text');
const btnParseResume = document.getElementById('btn-parse-resume-text');
const btnClearHistory = document.getElementById('clear-history-btn');
const btnDeleteProfile = document.getElementById('btn-delete-profile');
const btnCreateNewProfile = document.getElementById('btn-create-new-profile');

// Onboarding Modal DOM Elements
const onboardingModal = document.getElementById('onboarding-modal');
const closeOnboardingBtn = document.getElementById('close-onboarding-btn');
const skipOnboardingBtn = document.getElementById('skip-onboarding-btn');
const onboardForm = document.getElementById('onboard-form');

function openOnboardingModal() {
  if (onboardingModal) onboardingModal.classList.add('active');
}
function closeOnboardingModal() {
  if (onboardingModal) onboardingModal.classList.remove('active');
}

// Modals
const appModal = document.getElementById('app-modal');
const appForm = document.getElementById('app-form');
const extGuideModal = document.getElementById('ext-guide-modal');
const toastEl = document.getElementById('toast');

// Bootstrap Application
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide && lucide.createIcons) lucide.createIcons();

  loadProfiles();
  await loadJobsFeed(false); // Cost-efficient: Loads from local cache instantly on page load
  loadApplications();
  setupEventListeners();
  checkFirstTimeOnboarding();
});

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3200);
}

// ==========================================================================
// 1. MULTI-PROFILE & RESUME STATE MANAGER
// ==========================================================================
function loadProfiles() {
  let savedProfiles = [];
  try {
    const raw = localStorage.getItem('allUserProfiles');
    if (raw) savedProfiles = JSON.parse(raw);
  } catch (e) {
    savedProfiles = [];
  }

  if (!Array.isArray(savedProfiles)) {
    savedProfiles = [];
  }

  userProfiles = savedProfiles;
  activeProfileIndex = userProfiles.length > 0 ? 0 : -1;

  renderProfilePills();
  populateProfileForm();
  updateProfileBadges();

  if (userProfiles.length === 0) {
    setTimeout(() => {
      openOnboardingModal();
    }, 400);
  }
}

function saveProfilesToStorage(profiles) {
  try {
    localStorage.setItem('allUserProfiles', JSON.stringify(profiles));
    localStorage.setItem('lastProfileName', profiles[activeProfileIndex]?.name || profiles[0]?.name || '');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        allUserProfiles: profiles,
        lastProfileName: profiles[activeProfileIndex]?.name || profiles[0]?.name || ''
      });
    }
  } catch (e) {
    console.warn("Storage sync error", e);
  }
}

function renderProfilePills() {
  if (!profilePillsContainer) return;
  if (userProfiles.length === 0) {
    profilePillsContainer.innerHTML = `<span style="font-size:12px; color:var(--text-muted); padding:4px 8px;">No profiles created yet. Use the form below to create your primary persona.</span>`;
    return;
  }
  profilePillsContainer.innerHTML = userProfiles.map((prof, idx) => `
    <button class="prof-tab-pill ${idx === activeProfileIndex ? 'active' : ''}" onclick="selectProfile(${idx})">
      <span>${escapeHtml(prof.name || `Profile ${idx + 1}`)}</span>
    </button>
  `).join('');
}

window.selectProfile = function (idx) {
  if (idx < 0 || idx >= userProfiles.length) return;
  activeProfileIndex = idx;
  renderProfilePills();
  populateProfileForm();
  updateProfileBadges();
  renderJobs();
  showToast(`Active matching profile: "${userProfiles[idx].name}"`);
};

function populateProfileForm() {
  const current = userProfiles[activeProfileIndex];
  if (!current) return;

  if (profLabelInput) profLabelInput.value = current.name || '';
  if (profFullNameInput) profFullNameInput.value = current.fullname || '';
  if (profEmailInput) profEmailInput.value = current.email || '';
  if (profPhoneInput) profPhoneInput.value = current.phone || '';
  if (profLocationInput) profLocationInput.value = current.location || '';
  if (profWorkAuthInput) profWorkAuthInput.value = current.workAuth || 'US Citizen / Permanent Resident';
  if (profLinkedinInput) profLinkedinInput.value = current.linkedin || '';
  if (profGithubInput) profGithubInput.value = current.github || '';
  if (profPortfolioInput) profPortfolioInput.value = current.portfolio || '';
  if (profTwitterInput) profTwitterInput.value = current.twitter || '';
  if (profTargetRolesInput) profTargetRolesInput.value = current.targetRoles || '';
  if (profSkillsInput) profSkillsInput.value = current.skills || '';
  if (profNarrativeInput) profNarrativeInput.value = current.narrative || '';
}

function updateProfileBadges() {
  const current = userProfiles[activeProfileIndex];
  const name = current?.name || 'Default';
  if (profileCountBadge) profileCountBadge.textContent = userProfiles.length;
  if (feedProfileName) feedProfileName.textContent = name;
  const userDisplay = document.getElementById('user-name-display');
  if (userDisplay) {
    const firstName = current?.fullname ? current.fullname.split(' ')[0] : 'Profile';
    userDisplay.textContent = `${firstName} (${name})`;
  }
  const avatar = document.getElementById('user-avatar-badge');
  if (avatar) {
    avatar.textContent = current?.fullname ? current.fullname.charAt(0).toUpperCase() : 'P';
  }
}

function showSearchingState(query = '') {
  if (!jobGrid) return;
  const label = query ? `Scouting live portals for "${escapeHtml(query)}"...` : 'Scouting live startup feeds & ATS endpoints...';
  jobGrid.innerHTML = `
    <div class="search-loading-container" style="grid-column: 1 / -1;">
      <div class="searching-pulse-radar">
        <div class="radar-circle circle-1"></div>
        <div class="radar-circle circle-2"></div>
        <div class="radar-circle circle-3"></div>
        <i data-lucide="sparkles" class="radar-icon"></i>
      </div>
      <p class="searching-title">${label}</p>
      <p class="searching-sub">Querying Ashby, Greenhouse, Lever, Y Combinator, and Wellfound live pipelines</p>
      <div class="skeleton-cards-wrap">
        <div class="job-card-skeleton"></div>
        <div class="job-card-skeleton"></div>
        <div class="job-card-skeleton"></div>
      </div>
    </div>
  `;
  if (window.lucide && lucide.createIcons) lucide.createIcons();
}

async function loadJobsFeed(forceLiveScrape = false) {
  const currentProf = userProfiles[activeProfileIndex] || {};
  const query = currentProf.targetRoles || currentProf.name || '';

  if (jobsData.length === 0) {
    showSearchingState(query);
  }

  try {
    const url = forceLiveScrape 
      ? `/api/jobs?refresh=true&q=${encodeURIComponent(query)}` 
      : (query ? `/api/jobs?q=${encodeURIComponent(query)}` : `/api/jobs`);
    
    const res = await fetch(url);
    if (res.ok) {
      const liveJobs = await res.json();
      if (Array.isArray(liveJobs) && liveJobs.length > 0) {
        jobsData = liveJobs;
        renderJobs();
        return;
      }
    }
  } catch (e) {
    console.warn('[FEED] Fetch error:', e);
  }

  // Fallback to pre-warmed memory feed if network offline
  if (window.SCRAPED_JOBS_FEED && Array.isArray(window.SCRAPED_JOBS_FEED) && window.SCRAPED_JOBS_FEED.length > 0) {
    jobsData = window.SCRAPED_JOBS_FEED;
  }
  renderJobs();
}

function calculateJobMatch(job, profile) {
  if (!profile) return { score: 85, matchedSkills: [] };

  const parseKeywords = (str) => (str || '')
    .toLowerCase()
    .split(/[,/\n|]+/)
    .map(s => s.trim())
    .filter(s => s.length > 1);

  const profileSkills = parseKeywords(profile.skills);
  const profileRoles = parseKeywords(profile.targetRoles);

  const jobTitle = (job.title || '').toLowerCase();
  const jobDesc = (job.description || '').toLowerCase();
  const jobStack = (job.techStack || []).map(t => t.toLowerCase());

  // Match Skills
  const matchedSkills = [];
  profileSkills.forEach(skill => {
    if (jobStack.some(js => js.includes(skill) || skill.includes(js)) || jobDesc.includes(skill)) {
      matchedSkills.push(skill);
    }
  });

  // Match Roles
  let roleMatch = false;
  profileRoles.forEach(role => {
    if (jobTitle.includes(role) || role.split(' ').every(w => jobTitle.includes(w))) {
      roleMatch = true;
    }
  });

  // Dynamic Score Calculation
  let base = 60;
  if (roleMatch) base += 22;
  base += Math.min(16, matchedSkills.length * 6);

  const score = Math.min(99, Math.max(65, base));
  return { score, matchedSkills };
}

function renderJobs() {
  if (!jobGrid) return;

  const currentProfile = userProfiles[activeProfileIndex];

  // Calculate Match Scores & Sort
  const scoredJobs = jobsData.map(job => {
    const matchResult = calculateJobMatch(job, currentProfile);
    return {
      ...job,
      matchScore: matchResult.score,
      matchedSkills: matchResult.matchedSkills
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const filtered = scoredJobs.filter(job => {
    let matchesSource = false;
    if (activeFilter === 'all') {
      matchesSource = true;
    } else if (activeFilter === 'Ashby') {
      matchesSource = (job.source && job.source.toLowerCase().includes('ashby')) || (job.atsType === 'ashby') || (job.applyUrl && job.applyUrl.includes('ashby'));
    } else if (activeFilter === 'Greenhouse') {
      matchesSource = (job.source && job.source.toLowerCase().includes('greenhouse')) || (job.atsType === 'greenhouse') || (job.applyUrl && job.applyUrl.includes('greenhouse'));
    } else if (activeFilter === 'Lever') {
      matchesSource = (job.source && job.source.toLowerCase().includes('lever')) || (job.atsType === 'lever') || (job.applyUrl && job.applyUrl.includes('lever'));
    } else if (activeFilter === 'Y Combinator') {
      matchesSource = (job.source && job.source.toLowerCase().includes('combinator')) || (job.atsType === 'ycombinator') || (job.applyUrl && job.applyUrl.includes('workatastartup'));
    } else if (activeFilter === 'Wellfound') {
      matchesSource = (job.source && job.source.toLowerCase().includes('wellfound')) || (job.atsType === 'wellfound') || (job.applyUrl && job.applyUrl.includes('wellfound'));
    } else {
      matchesSource = job.source && job.source.toLowerCase().includes(activeFilter.toLowerCase());
    }

    let matchesQuery = true;
    if (searchQuery && searchQuery.trim()) {
      const qWords = searchQuery.toLowerCase().trim().split(/[\s,+/]+/).filter(w => w.length > 0);
      const titleLower = (job.title || '').toLowerCase();
      const companyLower = (job.company || '').toLowerCase();
      const descLower = (job.description || '').toLowerCase();
      const stackStr = (job.techStack || []).join(' ').toLowerCase();
      const sourceStr = (job.source || '').toLowerCase();
      const locStr = (job.location || '').toLowerCase();
      const combined = `${titleLower} ${companyLower} ${descLower} ${stackStr} ${sourceStr} ${locStr}`;

      matchesQuery = qWords.every(w => combined.includes(w));
    }
    return matchesSource && matchesQuery;
  });

  if (jobsCountBadge) jobsCountBadge.textContent = filtered.length;

  if (filtered.length === 0) {
    const term = searchQuery ? `"${escapeHtml(searchQuery)}"` : `"${escapeHtml(activeFilter)}"`;
    jobGrid.innerHTML = `
      <div class="empty-feed-state" style="grid-column: 1 / -1;">
        <p class="empty-headline">No matching jobs found for ${term}</p>
        <p class="empty-sub">Try broadening your search query or selecting "All Sources".</p>
      </div>
    `;
    return;
  }

  jobGrid.innerHTML = filtered.map((job, idx) => {
    const isTopMatch = job.matchScore >= 90;
    const matchPillClass = isTopMatch ? 'star-match-pill top-match' : 'star-match-pill';

    let atsClass = 'source-tag-pill';
    const sLower = (job.source || '').toLowerCase();
    if (sLower.includes('ashby')) atsClass += ' source-ashby';
    else if (sLower.includes('greenhouse')) atsClass += ' source-greenhouse';
    else if (sLower.includes('lever')) atsClass += ' source-lever';
    else if (sLower.includes('combinator')) atsClass += ' source-yc';
    else if (sLower.includes('wellfound')) atsClass += ' source-wellfound';

    const isSelected = selectedJobId === job.id || (!selectedJobId && idx === 0);

    return `
      <div class="job-card ${isSelected ? 'selected' : ''}" data-job-id="${job.id}" onclick="selectJob('${job.id}')">
        <div>
          <div class="card-header-flex">
            <div class="card-title-group">
              <h3>${escapeHtml(job.title)}</h3>
              <div class="card-meta">
                <strong>${escapeHtml(job.company)}</strong>
                <span class="${atsClass} mono">${escapeHtml(job.source || 'Scraped')}</span>
                ${job.batch ? `<span class="batch-pill">${escapeHtml(job.batch)}</span>` : ''}
              </div>
            </div>
            <div class="${matchPillClass}">
              <span>${job.matchScore}% Match</span>
            </div>
          </div>

          <p class="card-desc">${escapeHtml(job.description || '')}</p>

          <div class="card-tags-row">
            <span class="tag-salary">${escapeHtml(job.salaryRange || 'Competitive')}</span>
            ${(job.techStack || []).slice(0, 3).map(t => {
      const isMatched = (job.matchedSkills || []).some(ms => ms.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(ms.toLowerCase()));
      return `<span class="${isMatched ? 'tag-tech tag-matched' : 'tag-tech'}">${escapeHtml(t)}</span>`;
    }).join('')}
          </div>
        </div>

        <div class="card-bottom-bar">
          <span class="loc-text">${escapeHtml(job.location || 'Remote')}</span>
          <button class="btn-apply-cta" onclick="event.stopPropagation(); applyToJob('${job.id}')">
            <span>Apply ↗</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Auto-select first job if none selected (silently, without forcing mobile-detail-open)
  if (filtered.length > 0) {
    const targetJob = filtered.find(j => j.id === selectedJobId) || filtered[0];
    selectedJobId = targetJob.id;
    renderJobDetail(targetJob, false);
  }

  if (window.lucide && lucide.createIcons) lucide.createIcons();
}

let selectedJobId = null;

window.selectJob = function (jobId, isExplicitTap = true) {
  selectedJobId = jobId;

  document.querySelectorAll('.job-card').forEach(card => {
    if (card.dataset.jobId === jobId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  const job = jobsData.find(j => j.id === jobId);
  if (job) {
    renderJobDetail(job, isExplicitTap);
  }
};

function renderJobDetail(job, isExplicitTap = false) {
  const drawerPlaceholder = document.getElementById('detail-placeholder');
  const drawerCard = document.getElementById('detail-card');
  if (!drawerCard) return;

  if (drawerPlaceholder) drawerPlaceholder.style.display = 'none';
  drawerCard.style.display = 'block';

  const currentProf = userProfiles[activeProfileIndex] || {};
  const matchResult = calculateJobMatch(job, currentProf);

  const titleEl = document.getElementById('detail-title');
  const compEl = document.getElementById('detail-company');
  const batchEl = document.getElementById('detail-batch');
  const locEl = document.getElementById('detail-location');
  const salaryEl = document.getElementById('detail-salary');
  const equityEl = document.getElementById('detail-equity');
  const dateEl = document.getElementById('detail-date');
  const atsPill = document.getElementById('detail-ats-pill');
  const matchScoreEl = document.getElementById('detail-match-score');
  const descEl = document.getElementById('detail-desc');
  const tagsRow = document.getElementById('detail-tech-tags');
  const btnApply = document.getElementById('detail-btn-apply');
  const btnCopyPitch = document.getElementById('detail-btn-copy-pitch');
  const btnTrack = document.getElementById('detail-btn-track');

  if (titleEl) titleEl.textContent = job.title || 'Role';
  if (compEl) compEl.textContent = job.company || 'Startup';
  if (batchEl) batchEl.textContent = job.batch || 'Startup';
  if (locEl) locEl.textContent = job.location || 'Remote';
  if (salaryEl) salaryEl.textContent = job.salaryRange || 'Competitive';
  if (equityEl) equityEl.textContent = job.equity || '0.25% - 1.0%';
  if (dateEl) dateEl.textContent = job.postedDate ? `Posted ${job.postedDate}` : 'Live Verified';
  if (descEl) descEl.textContent = job.description || 'Full engineering scope scraped via Bright Data Scraper Studio.';

  if (atsPill) {
    atsPill.textContent = job.source || 'Scraped';
    atsPill.className = 'source-tag-pill mono';
    const sLower = (job.source || '').toLowerCase();
    if (sLower.includes('ashby')) atsPill.className += ' source-ashby';
    else if (sLower.includes('greenhouse')) atsPill.className += ' source-greenhouse';
    else if (sLower.includes('lever')) atsPill.className += ' source-lever';
    else if (sLower.includes('combinator')) atsPill.className += ' source-yc';
    else if (sLower.includes('wellfound')) atsPill.className += ' source-wellfound';
  }

  if (matchScoreEl) {
    matchScoreEl.textContent = `${matchResult.score}% Match`;
    matchScoreEl.className = matchResult.score >= 90 ? 'star-match-pill top-match' : 'star-match-pill';
  }

  if (tagsRow) {
    tagsRow.innerHTML = (job.techStack || []).map(t => {
      const isMatched = matchResult.matchedSkills.some(ms => ms.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(ms.toLowerCase()));
      return `<span class="${isMatched ? 'tag-tech tag-matched' : 'tag-tech'}">${escapeHtml(t)} ${isMatched ? '✓' : ''}</span>`;
    }).join('');
  }

  if (btnApply) {
    btnApply.onclick = () => applyToJob(job.id);
  }

  if (btnCopyPitch) {
    btnCopyPitch.onclick = () => {
      const myName = currentProf.fullname || 'a passionate candidate';
      const mySkills = currentProf.skills || 'modern software engineering';
      const pitch = `Hi ${job.company} team, I'm ${myName}. I have strong hands-on experience in ${mySkills.split(',').slice(0, 3).join(', ')} and would love to bring my expertise to the ${job.title} role!`;
      navigator.clipboard.writeText(pitch);
      showToast('Copied tailored intro pitch to clipboard!');
    };
  }

  if (btnTrack) {
    btnTrack.onclick = () => {
      const today = new Date().toLocaleDateString('en-GB');
      const exists = applications.some(a => a.company === job.company && a.role === job.title);
      if (!exists) {
        applications.unshift({
          id: Date.now().toString(),
          company: job.company,
          role: job.title,
          source: job.source,
          status: "Applied",
          date: today,
          notes: `Added from Discovery Stream`
        });
        saveApplications();
        showToast(`Added ${job.company} to your Application Pipeline!`);
      } else {
        showToast(`${job.company} is already in your Pipeline!`);
      }
    };
  }

  // Mobile UX: ONLY activate mobile-detail-open class if user explicitly tapped a card!
  const explorerLayout = document.querySelector('.split-explorer-layout');
  if (explorerLayout && window.innerWidth <= 860) {
    if (isExplicitTap) {
      explorerLayout.classList.add('mobile-detail-open');
      const detailDrawer = document.getElementById('job-detail-drawer');
      if (detailDrawer) {
        detailDrawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  if (window.lucide && lucide.createIcons) lucide.createIcons();
}

window.applyToJob = async function (jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;

  const today = new Date().toLocaleDateString('en-GB');

  // Pre-flight link health check
  try {
    const checkRes = await fetch(`/api/verify-link?url=${encodeURIComponent(job.applyUrl)}`);
    if (checkRes.ok) {
      const status = await checkRes.json();
      if (status.active === false) {
        showToast(`Sentinel Alert: ${job.company} posting is no longer active (404/expired).`);
        return;
      }
    }
  } catch (e) { }

  try {
    localStorage.setItem('scoutr_active_job', JSON.stringify({
      id: job.id,
      company: job.company,
      title: job.title,
      batch: job.batch || '',
      applyUrl: job.applyUrl || '',
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Storage write error", e);
  }

  const exists = applications.some(a => a.company === job.company && a.role === job.title);
  if (!exists) {
    applications.unshift({
      id: Date.now().toString(),
      company: job.company,
      role: job.title,
      source: job.source,
      status: "Applied",
      date: today,
      notes: `Discovered via ${job.source || 'Scraper Studio'}`
    });
    saveApplications();
  }

  showToast(`Staged application for ${job.company}! Opening application portal...`);

  if (job.applyUrl) {
    window.open(job.applyUrl, '_blank');
  }
};

// ==========================================================================
// 3. APPLICATION PIPELINE TRACKER
// ==========================================================================
function loadApplications() {
  const saved = localStorage.getItem('scoutr_applications');
  applications = saved ? JSON.parse(saved) : [];
  renderApplications();
}

function saveApplications() {
  localStorage.setItem('scoutr_applications', JSON.stringify(applications));
  renderApplications();
}

let activeTrackerFilter = 'all';

function renderApplications() {
  if (trackerCountBadge) trackerCountBadge.textContent = applications.length;

  // Calculate Metrics
  const countTotal = applications.length;
  const countApplied = applications.filter(a => a.status === 'Applied').length;
  const countClicked = applications.filter(a => a.status === 'Clicked / Viewed').length;
  const countInterview = applications.filter(a => a.status === 'Interviewing' || a.status === 'Technical Round').length;
  const countOffers = applications.filter(a => a.status === 'Offer Received').length;
  const countRejected = applications.filter(a => a.status === 'Rejected').length;

  const elTotal = document.getElementById('pipe-stat-total');
  const elApplied = document.getElementById('pipe-stat-applied');
  const elClicked = document.getElementById('pipe-stat-clicked');
  const elInterview = document.getElementById('pipe-stat-interview');
  const elOffers = document.getElementById('pipe-stat-offers');
  const elRejected = document.getElementById('pipe-stat-rejected');

  if (elTotal) elTotal.textContent = countTotal;
  if (elApplied) elApplied.textContent = countApplied;
  if (elClicked) elClicked.textContent = countClicked;
  if (elInterview) elInterview.textContent = countInterview;
  if (elOffers) elOffers.textContent = countOffers;
  if (elRejected) elRejected.textContent = countRejected;

  if (!appTableBody) return;

  const filteredApps = applications.filter(app => {
    if (activeTrackerFilter === 'all') return true;
    if (activeTrackerFilter === 'Interviewing') return app.status === 'Interviewing' || app.status === 'Technical Round';
    return app.status === activeTrackerFilter;
  });

  if (filteredApps.length === 0) {
    appTableBody.innerHTML = '';
    if (emptyTrackerState) emptyTrackerState.style.display = 'block';
    return;
  }

  if (emptyTrackerState) emptyTrackerState.style.display = 'none';

  appTableBody.innerHTML = filteredApps.map(app => {
    let statusClass = 'status-applied';
    if (app.status === 'Clicked / Viewed') statusClass = 'status-clicked';
    else if (app.status === 'Interviewing' || app.status === 'Technical Round') statusClass = 'status-interviewing';
    else if (app.status === 'Offer Received') statusClass = 'status-offer';
    else if (app.status === 'Rejected') statusClass = 'status-rejected';

    return `
      <tr>
        <td><strong>${escapeHtml(app.company)}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--text-dark);">${escapeHtml(app.role)}</div>
          <small class="mono" style="color: var(--text-muted); font-size: 11px;">${escapeHtml(app.source || 'Scraped')}</small>
        </td>
        <td class="mono" style="font-size: 11.5px;">${escapeHtml(app.date)}</td>
        <td>
          <select class="status-select-pill ${statusClass}" onchange="updateAppStatus('${app.id}', this.value)">
            <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="Clicked / Viewed" ${app.status === 'Clicked / Viewed' ? 'selected' : ''}>Clicked / Staged</option>
            <option value="Interviewing" ${app.status === 'Interviewing' ? 'selected' : ''}>Interviewing</option>
            <option value="Technical Round" ${app.status === 'Technical Round' ? 'selected' : ''}>Technical Round</option>
            <option value="Offer Received" ${app.status === 'Offer Received' ? 'selected' : ''}>Offer Received</option>
            <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected / Closed</option>
          </select>
        </td>
        <td>
          <div class="table-actions-cell">
            ${app.applyUrl ? `<a href="${escapeHtml(app.applyUrl)}" target="_blank" class="btn-table-icon" title="Open Public Application Portal"><i data-lucide="external-link" class="w-icon"></i></a>` : ''}
            <button class="btn-table-icon" onclick="deleteApplication('${app.id}')" title="Delete record">
              <i data-lucide="trash-2" class="w-icon"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide && lucide.createIcons) lucide.createIcons();
}

window.updateAppStatus = function (id, newStatus) {
  const app = applications.find(a => a.id === id);
  if (app) {
    app.status = newStatus;
    saveApplications();
    showToast(`Updated ${app.company} status to "${newStatus}"!`);
  }
};

window.deleteApplication = function (id) {
  if (!confirm('Are you sure you want to remove this application from your pipeline?')) return;
  applications = applications.filter(a => a.id !== id);
  saveApplications();
  renderApplications();
  showToast('Application record removed.');
};

// ==========================================================================
// 4. RESUME AUTO-PARSER & EVENT LISTENERS
// ==========================================================================
function parseResumeText() {
  const text = (resumeRawText?.value || '').trim();
  if (!text) {
    showToast('Please paste some resume text first!');
    return;
  }

  // Regex Heuristics
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  const githubMatch = text.match(/(https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+)/i);

  if (emailMatch && profEmailInput) profEmailInput.value = emailMatch[0];
  if (phoneMatch && profPhoneInput) profPhoneInput.value = phoneMatch[0];
  if (linkedinMatch && profLinkedinInput) profLinkedinInput.value = linkedinMatch[0];
  if (githubMatch && profGithubInput) profGithubInput.value = githubMatch[0];

  // Tech stack discovery
  const knownSkills = ['Python', 'PyTorch', 'React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'Docker', 'AWS', 'LangChain', 'GraphQL', 'TailwindCSS', 'Go', 'Rust', 'Kubernetes'];
  const extractedSkills = knownSkills.filter(s => text.toLowerCase().includes(s.toLowerCase()));

  if (extractedSkills.length > 0 && profSkillsInput) {
    profSkillsInput.value = extractedSkills.join(', ');
  }

  if (profNarrativeInput && !profNarrativeInput.value) {
    profNarrativeInput.value = text.slice(0, 300) + '...';
  }

  showToast('Extracted profile fields from resume text!');
}

function checkFirstTimeOnboarding() {
  const completed = localStorage.getItem('scoutr_onboarding_completed');
  if (!completed && onboardingModal) {
    onboardingModal.classList.add('active');
  }
}

function setupEventListeners() {
  // Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      viewPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(btn.dataset.tab);
      if (targetView) targetView.classList.add('active');
    });
  });

  // Search & Realtime Dynamic Portal Scraping
  let searchDebounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderJobs();

      clearTimeout(searchDebounceTimer);
      const trimmed = (searchQuery || '').trim();
      if (trimmed.length >= 2) {
        searchDebounceTimer = setTimeout(async () => {
          const streamPill = document.getElementById('pipeline-status-text');
          if (streamPill) streamPill.textContent = `Scraping live for "${trimmed}"...`;
          
          try {
            const res = await fetch(`/api/jobs?q=${encodeURIComponent(trimmed)}`);
            if (res.ok) {
              const dynamicJobs = await res.json();
              if (Array.isArray(dynamicJobs) && dynamicJobs.length > 0) {
                // Merge freshly scraped jobs into jobsData avoiding duplicates
                const existingIds = new Set(jobsData.map(j => j.id));
                let newCount = 0;
                dynamicJobs.forEach(job => {
                  if (!existingIds.has(job.id)) {
                    jobsData.unshift(job);
                    existingIds.add(job.id);
                    newCount++;
                  }
                });
                renderJobs();
                if (newCount > 0) {
                  showToast(`Scraped ${newCount} live startup roles matching "${trimmed}"!`);
                }
              }
            }
          } catch (err) {
            console.warn('[SEARCH SCRAPE] Error:', err);
          } finally {
            if (streamPill) streamPill.textContent = 'Operational';
          }
        }, 500);
      }
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.source;
      renderJobs();
    });
  });

  // Profile Form Save
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedProfile = {
        name: profLabelInput.value.trim() || 'Custom Profile',
        fullname: profFullNameInput.value.trim(),
        email: profEmailInput.value.trim(),
        phone: profPhoneInput.value.trim(),
        location: profLocationInput.value.trim(),
        workAuth: profWorkAuthInput.value,
        linkedin: profLinkedinInput.value.trim(),
        github: profGithubInput.value.trim(),
        portfolio: profPortfolioInput.value.trim(),
        twitter: profTwitterInput.value.trim(),
        targetRoles: profTargetRolesInput.value.trim(),
        skills: profSkillsInput.value.trim(),
        narrative: profNarrativeInput.value.trim()
      };

      userProfiles[activeProfileIndex] = updatedProfile;
      saveProfilesToStorage(userProfiles);
      renderProfilePills();
      updateProfileBadges();
      renderJobs();
      showToast('Profile saved & synced with Extension!');
      loadJobsFeed(true);
    });
  }

  // Create New Profile Button
  if (btnCreateNewProfile) {
    btnCreateNewProfile.addEventListener('click', () => {
      const newPreset = {
        name: `Target Profile ${userProfiles.length + 1}`,
        fullname: userProfiles[0]?.fullname || '',
        email: userProfiles[0]?.email || '',
        phone: userProfiles[0]?.phone || '',
        location: userProfiles[0]?.location || '',
        workAuth: userProfiles[0]?.workAuth || 'Authorized to work in US/Remote',
        linkedin: userProfiles[0]?.linkedin || '',
        github: userProfiles[0]?.github || '',
        portfolio: userProfiles[0]?.portfolio || '',
        twitter: userProfiles[0]?.twitter || '',
        targetRoles: '',
        skills: '',
        narrative: ''
      };

      userProfiles.push(newPreset);
      activeProfileIndex = userProfiles.length - 1;
      saveProfilesToStorage(userProfiles);
      renderProfilePills();
      populateProfileForm();
      updateProfileBadges();
      showToast('Created new profile preset!');
    });
  }

  // Delete Profile Button
  if (btnDeleteProfile) {
    btnDeleteProfile.addEventListener('click', () => {
      if (userProfiles.length <= 1) {
        showToast('You must keep at least 1 career profile!');
        return;
      }
      if (!confirm(`Are you sure you want to delete profile "${userProfiles[activeProfileIndex]?.name || 'Current Profile'}"?`)) return;
      userProfiles.splice(activeProfileIndex, 1);
      activeProfileIndex = Math.max(0, activeProfileIndex - 1);
      saveProfilesToStorage(userProfiles);
      renderProfilePills();
      populateProfileForm();
      updateProfileBadges();
      renderJobs();
      showToast('Profile deleted.');
    });
  }

  // Resume Ingestion Button
  if (btnParseResume) {
    btnParseResume.addEventListener('click', parseResumeText);
  }

  // Self-Healing Simulation
  const healSimBtn = document.getElementById('run-heal-simulation-btn');
  const terminalBody = document.getElementById('telemetry-terminal');

  if (healSimBtn && terminalBody) {
    healSimBtn.addEventListener('click', () => {
      healSimBtn.disabled = true;
      const now = new Date().toLocaleTimeString();

      const lines = [
        `<div class="term-line"><span class="term-time">[${now}]</span> <span class="term-highlight">ANOMALY:</span> DOM layout mutation detected on target portal. Selector [class='salary'] missing.</div>`,
        `<div class="term-line"><span class="term-time">[${now}]</span> <span class="term-heal">AUTONOMOUS HEAL:</span> Executing: bdata scraper heal c_wf_talent_41e9 "salary moved to data-test"...</div>`,
        `<div class="term-line"><span class="term-time">[${now}]</span> <span class="term-success">HEALED:</span> Scraper Studio regenerated AST. 100% extraction restored in 1.4s!</div>`
      ];

      lines.forEach((line, i) => {
        setTimeout(() => {
          terminalBody.innerHTML += line;
          terminalBody.scrollTop = terminalBody.scrollHeight;
          if (i === lines.length - 1) {
            healSimBtn.disabled = false;
            showToast('Self-healing loop demonstrated successfully!');
          }
        }, (i + 1) * 800);
      });
    });
  }

  // Pipeline Tracker Stage Filter Buttons
  const pipeStatButtons = document.querySelectorAll('.pipe-stat-btn');
  pipeStatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pipeStatButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTrackerFilter = btn.dataset.trackerFilter || 'all';
      renderApplications();
    });
  });

  // User Switcher & Header Actions
  const userSwitcherBtn = document.getElementById('user-switcher-btn');
  if (userSwitcherBtn) {
    userSwitcherBtn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      viewPanes.forEach(p => p.classList.remove('active'));
      const profileTabBtn = document.querySelector('[data-tab="profile-view"]');
      if (profileTabBtn) profileTabBtn.classList.add('active');
      const profileView = document.getElementById('profile-view');
      if (profileView) profileView.classList.add('active');
    });
  }

  // Trigger Pipeline Sync Button (On-Demand Live API Scraping)
  const triggerPipelineBtn = document.getElementById('trigger-pipeline-btn');
  if (triggerPipelineBtn) {
    triggerPipelineBtn.addEventListener('click', async () => {
      triggerPipelineBtn.disabled = true;
      triggerPipelineBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-icon" style="animation: spin 1s linear infinite;"></i><span>Syncing...</span>';
      if (window.lucide && lucide.createIcons) lucide.createIcons();
      showToast('Syncing live scrapers with ATS portals...');
      await loadJobsFeed(true);
      setTimeout(() => {
        triggerPipelineBtn.disabled = false;
        triggerPipelineBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-icon"></i><span>Sync Pipeline</span>';
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        showToast('Pipeline sync complete! Updated live jobs.');
      }, 500);
    });
  }

  // Onboarding Modal Handlers
  const closeOnboardingBtn = document.getElementById('close-onboarding-btn');
  const skipOnboardingBtn = document.getElementById('skip-onboarding-btn');

  const closeOnboard = () => {
    localStorage.setItem('scoutr_onboarding_completed', 'true');
    if (onboardingModal) onboardingModal.classList.remove('active');
  };

  if (closeOnboardingBtn) closeOnboardingBtn.addEventListener('click', closeOnboard);
  if (skipOnboardingBtn) {
    skipOnboardingBtn.addEventListener('click', () => {
      if (userProfiles.length === 0) {
        const defaultProfile = {
          name: 'Software Engineer',
          fullname: 'Candidate',
          email: '',
          phone: '',
          location: 'Remote',
          workAuth: 'Authorized to work',
          linkedin: '',
          github: '',
          portfolio: '',
          twitter: '',
          targetRoles: 'Software Engineer, Full Stack, AI Engineer',
          skills: 'Python, TypeScript, React, Node.js, SQL',
          narrative: 'Software engineer building modern web and AI applications.'
        };
        userProfiles = [defaultProfile];
        activeProfileIndex = 0;
        saveProfilesToStorage(userProfiles);
        renderProfilePills();
        populateProfileForm();
        updateProfileBadges();
        renderJobs();
      }
      closeOnboard();
    });
  }

  if (onboardForm) {
    onboardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const primaryProfile = {
        name: document.getElementById('onboard-target').value.trim() || 'Primary Target',
        fullname: document.getElementById('onboard-name').value.trim(),
        email: document.getElementById('onboard-email').value.trim(),
        phone: '',
        location: 'Remote',
        workAuth: 'Authorized to work',
        linkedin: document.getElementById('onboard-linkedin').value.trim(),
        github: document.getElementById('onboard-github').value.trim(),
        portfolio: '',
        twitter: '',
        targetRoles: document.getElementById('onboard-target').value.trim(),
        skills: document.getElementById('onboard-skills').value.trim(),
        narrative: `Experienced in ${document.getElementById('onboard-skills').value.trim()} applying for ${document.getElementById('onboard-target').value.trim()} roles.`
      };

      userProfiles.unshift(primaryProfile);
      activeProfileIndex = 0;
      saveProfilesToStorage(userProfiles);
      renderProfilePills();
      populateProfileForm();
      updateProfileBadges();
      renderJobs();
      closeOnboard();
      showToast('Profile created! Live jobs matched to your stack.');
    });
  }

  // Telemetry Modal
  const openTelemetryBtn = document.getElementById('open-telemetry-btn');
  const closeTelemetryModalBtn = document.getElementById('close-telemetry-modal-btn');
  const telemetryModal = document.getElementById('telemetry-modal');

  if (openTelemetryBtn && telemetryModal) openTelemetryBtn.addEventListener('click', () => telemetryModal.classList.add('active'));
  if (closeTelemetryModalBtn && telemetryModal) closeTelemetryModalBtn.addEventListener('click', () => telemetryModal.classList.remove('active'));

  // Manual Add Modal Handlers
  const openAddAppModalBtn = document.getElementById('open-add-app-modal-btn');
  const closeAppModalBtn = document.getElementById('close-app-modal-btn');
  const cancelAppBtn = document.getElementById('cancel-app-btn');

  if (openAddAppModalBtn && appModal) openAddAppModalBtn.addEventListener('click', () => appModal.classList.add('active'));
  if (closeAppModalBtn && appModal) closeAppModalBtn.addEventListener('click', () => appModal.classList.remove('active'));
  if (cancelAppBtn && appModal) cancelAppBtn.addEventListener('click', () => appModal.classList.remove('active'));

  if (appForm) {
    appForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const company = document.getElementById('manual-company').value.trim();
      const role = document.getElementById('manual-role').value.trim();
      const source = document.getElementById('manual-source').value.trim() || 'Manual Log';
      const status = document.getElementById('manual-status').value;

      if (company && role) {
        applications.unshift({
          id: Date.now().toString(),
          company,
          role,
          source,
          status,
          date: new Date().toLocaleDateString('en-GB')
        });
        saveApplications();
        appModal.classList.remove('active');
        appForm.reset();
        showToast('Application logged to pipeline!');
      }
    });
  }

  // Mobile Back Button to Return to Feed
  const mobileBackBtn = document.getElementById('btn-mobile-back-jobs');
  if (mobileBackBtn) {
    mobileBackBtn.addEventListener('click', () => {
      const explorerLayout = document.querySelector('.split-explorer-layout');
      if (explorerLayout) {
        explorerLayout.classList.remove('mobile-detail-open');
        const gridContainer = document.getElementById('job-grid-container');
        if (gridContainer) gridContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
