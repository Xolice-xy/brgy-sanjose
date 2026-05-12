const ADMIN_EMAIL    = 'admin';
const ADMIN_PASSWORD = 'admin123';

const DOCS = [
  { id:'clearance', name:'Barangay Clearance', emoji:'📄', days:'1–2 working days', fee:'Free', requirements:'Valid ID, filled-out form' },
  { id:'indigency', name:'Certificate of Indigency', emoji:'📋', days:'Same day', fee:'Free', requirements:'Valid ID, proof of residency' },
  { id:'residency', name:'Certificate of Residency', emoji:'🏠', days:'1 working day', fee:'Free', requirements:'Valid ID, utility bill' },
  { id:'business', name:'Business Permit', emoji:'🏢', days:'3–5 working days', fee:'₱150–₱500', requirements:'DTI/SEC reg., valid ID, lease contract' },
  { id:'death', name:'Death Certificate Copy', emoji:'📜', days:'2–3 working days', fee:'Free', requirements:'Valid ID, relationship to deceased' },
  { id:'good_moral', name:'Certificate of Good Moral', emoji:'⭐', days:'1 working day', fee:'Free', requirements:'Valid ID, school/employer request letter' },
];

const TIME_SLOTS = ['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM'];
const TAKEN_SLOTS = ['8:30 AM','10:00 AM','1:00 PM'];

let ANNOUNCEMENTS = [
  { id:'ann1', title:'Office Closure – National Holiday', body:'The Barangay Hall will be closed on May 12, 2026 in observance of the national holiday. All appointments on that date will be rescheduled.', date:'May 8, 2026', emoji:'🏛️', type:'Important' },
  { id:'ann2', title:'New Online Booking System Launched', body:'We are pleased to announce the launch of our new online appointment booking system. Residents can now schedule document requests from the comfort of their homes.', date:'May 1, 2026', emoji:'🎉', type:'News' },
  { id:'ann3', title:'Required Documents Reminder', body:'When claiming your documents, please bring at least 1 valid government-issued ID and any supporting documents listed in your appointment confirmation.', date:'Apr 25, 2026', emoji:'📋', type:'Reminder' },
  { id:'ann4', title:'Senior Citizens Priority Lane', body:'Senior citizens and PWDs may proceed to the priority lane at Window 3. No appointment required for barangay clearance and certificate of indigency for senior citizens.', date:'Apr 20, 2026', emoji:'🤝', type:'Policy' },
];

const STORE_USERS = 'bsj_users';
const STORE_SESSION = 'bsj_session';
const STORE_DATA = 'bsj_data_';
const STORE_QUEUE = 'bsj_queue_num';

function getUsers() { try { return JSON.parse(localStorage.getItem(STORE_USERS)||'[]'); } catch{ return []; } }
function saveUsers(u) { localStorage.setItem(STORE_USERS, JSON.stringify(u)); }
function getSession() { try { return JSON.parse(localStorage.getItem(STORE_SESSION)||'null'); } catch{ return null; } }
function setSession(u) { localStorage.setItem(STORE_SESSION, JSON.stringify(u)); }
function clearSession() { localStorage.removeItem(STORE_SESSION); }
function getUserData(email) { try { return JSON.parse(localStorage.getItem(STORE_DATA+email)||'{"appointments":[],"history":[]}'); } catch{ return {appointments:[],history:[]}; } }
function saveUserData(email, data) { localStorage.setItem(STORE_DATA+email, JSON.stringify(data)); }
function getQueueNum() { return parseInt(localStorage.getItem(STORE_QUEUE)||'47'); }
function saveQueueNum(n) { localStorage.setItem(STORE_QUEUE, String(n)); }

let adminCurrentQueue = 1;



let currentUser = null;
let isAdmin = false;
let selectedDoc = null;
let selectedTime = null;
let adminRequestFilter = 'all';

function switchToRegister() {
  document.getElementById('loginCard').style.display = 'none';
  document.getElementById('registerCard').style.display = 'block';
}
function switchToLogin() {
  document.getElementById('registerCard').style.display = 'none';
  document.getElementById('loginCard').style.display = 'block';
}

function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  if (!email || !pass) { errEl.textContent = '❌ Please fill in all fields.'; errEl.style.display = 'block'; return; }

  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
    const adminUser = { email: ADMIN_EMAIL, first: 'Barangay', last: 'Admin', isAdmin: true };
    setSession(adminUser);
    loadAdmin();
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
  if (!user) { errEl.style.display = 'block'; return; }
  setSession(user);
  loadApp(user);
}

function doRegister() {
  const first = document.getElementById('regFirst').value.trim();
  const last = document.getElementById('regLast').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pass = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.style.display = 'none';
  if (!first||!last||!email||!phone||!pass) { errEl.textContent = '❌ Please fill in all fields.'; errEl.style.display = 'block'; return; }
  if (pass.length < 6) { errEl.textContent = '❌ Password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  // Block admin email from registering
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) { errEl.textContent = '❌ This email cannot be used for registration.'; errEl.style.display = 'block'; return; }
  let users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) { errEl.textContent = '❌ Email already registered.'; errEl.style.display = 'block'; return; }
  const user = { email, password:pass, first, last, phone };
  users.push(user);
  saveUsers(users);
  setSession(user);
  loadApp(user);
}

function doLogout() {
  clearSession();
  currentUser = null;
  isAdmin = false;
  document.getElementById('login-page').classList.add('active');
  document.getElementById('app-page').classList.remove('active');
  document.getElementById('admin-page').classList.remove('active');
  switchToLogin();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

function loadAdmin() {
  isAdmin = true;
  currentUser = { email: ADMIN_EMAIL, first: 'Barangay', last: 'Admin', isAdmin: true };
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('app-page').classList.remove('active');
  document.getElementById('admin-page').classList.add('active');
  document.getElementById('adminDashDate').textContent = 'Today, ' + new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  renderAdminDashboard();
  renderAdminRequests();
  renderAdminResidents();
  renderAdminAnnouncements();
  renderAdminQueue();
}

function loadApp(user) {
  currentUser = user;
  isAdmin = false;
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('admin-page').classList.remove('active');
  document.getElementById('app-page').classList.add('active');
  const fullName = user.first + ' ' + user.last;
  document.getElementById('sidebarName').textContent = fullName;
  document.getElementById('sidebarAvatar').textContent = user.first[0] + user.last[0];
  document.getElementById('welcomeName').textContent = fullName + ' 👋';
  document.getElementById('dashDate').textContent = 'Today, ' + new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('apptName').value = fullName;
  document.getElementById('apptPhone').value = user.phone || '';
  renderAll();
}

function showTab(name, el) {
  document.querySelectorAll('#app-page .tab-view').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#residentSidebar .nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if(el) el.classList.add('active');
  if(name==='appointment') renderDocList();
  if(name==='history') renderHistory('all');
  if(name==='tracker') renderTracker();
  if(name==='queue') renderQueue();
  if(name==='dashboard') renderDashboard();
  if(name==='announcements') renderAnnouncements();
}

function showAdminTab(name, el) {
  document.querySelectorAll('#admin-page .tab-view').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#adminSidebar .nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if(el) el.classList.add('active');
  if(name==='admin-requests') renderAdminRequests();
  if(name==='admin-residents') renderAdminResidents();
  if(name==='admin-announcements') renderAdminAnnouncements();
  if(name==='admin-queue') renderAdminQueue();
  if(name==='admin-dashboard') renderAdminDashboard();
}

function getAllRequests() {
  const users = getUsers();
  let all = [];
  users.forEach(u => {
    const ud = getUserData(u.email);
    (ud.history || []).forEach(h => {
      all.push({ ...h, residentName: (h.residentName || u.first + ' ' + u.last), residentEmail: u.email });
    });
  });
  return all.sort((a,b) => new Date(b.date) - new Date(a.date));
}

function renderAdminDashboard() {
  const users = getUsers();
  const allReqs = getAllRequests();
  const processing = allReqs.filter(r => r.status === 'processing');
  const completed = allReqs.filter(r => r.status === 'completed');

  document.getElementById('adminStatResidents').textContent = users.length;
  document.getElementById('adminStatRequests').textContent = allReqs.length;
  document.getElementById('adminStatProcessing').textContent = processing.length;
  document.getElementById('adminStatCompleted').textContent = completed.length;
  document.getElementById('adminRequestsBadge').textContent = processing.length;

  const recentReqEl = document.getElementById('adminRecentRequests');
  const recent = allReqs.slice(0,5);
  if (recent.length === 0) {
    recentReqEl.innerHTML = `<div class="empty-state" style="padding:24px 0;"><div class="empty-icon">📋</div><div class="empty-text">No requests yet</div></div>`;
  } else {
    recentReqEl.innerHTML = recent.map(r => `
      <div class="history-item">
        <div class="history-icon">${r.emoji}</div>
        <div class="history-info">
          <div class="history-doc">${r.doc}</div>
          <div class="history-date">${r.residentName} · ${r.queue}</div>
        </div>
        <span class="badge badge-${r.status}">${r.status}</span>
      </div>`).join('');
  }

  const recentResEl = document.getElementById('adminRecentResidents');
  const recentRes = users.slice(-5).reverse();
  if (recentRes.length === 0) {
    recentResEl.innerHTML = `<div class="empty-state" style="padding:24px 0;"><div class="empty-icon">👥</div><div class="empty-text">No residents yet</div></div>`;
  } else {
    recentResEl.innerHTML = recentRes.map(u => `
      <div class="history-item" style="cursor:default;">
        <div class="history-icon" style="font-size:18px;font-weight:700;color:var(--orange-deep);">${u.first[0]}${u.last[0]}</div>
        <div class="history-info">
          <div class="history-doc">${u.first} ${u.last}</div>
          <div class="history-date">${u.email}</div>
        </div>
        <span class="badge badge-ready">Active</span>
      </div>`).join('');
  }
}

function renderAdminRequests() {
  const allReqs = getAllRequests();
  const search = (document.getElementById('requestSearch')?.value || '').toLowerCase();
  let filtered = allReqs;
  if (adminRequestFilter !== 'all') filtered = filtered.filter(r => r.status === adminRequestFilter);
  if (search) filtered = filtered.filter(r =>
    r.residentName.toLowerCase().includes(search) ||
    r.doc.toLowerCase().includes(search) ||
    r.queue.toLowerCase().includes(search)
  );

  const tbody = document.getElementById('adminRequestsTableBody');
  const emptyEl = document.getElementById('adminRequestsEmpty');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td><strong style="color:var(--orange-deep);">${r.queue}</strong></td>
      <td>${r.residentName}</td>
      <td>${r.emoji} ${r.doc}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.purpose}">${r.purpose}</td>
      <td>${r.date}</td>
      <td>${r.fee}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
      <td>
        <select class="status-select" onchange="updateRequestStatus('${r.residentEmail}','${r.id}',this.value)">
          <option value="processing" ${r.status==='processing'?'selected':''}>Processing</option>
          <option value="ready" ${r.status==='ready'?'selected':''}>Ready</option>
          <option value="completed" ${r.status==='completed'?'selected':''}>Completed</option>
          <option value="cancelled" ${r.status==='cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
    </tr>`).join('');
}

function filterAdminRequests(f, el) {
  adminRequestFilter = f;
  document.querySelectorAll('#requestFilterTabs .pill-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderAdminRequests();
}

function updateRequestStatus(email, histId, newStatus) {
  const ud = getUserData(email);
  const h = ud.history.find(x => x.id === histId);
  if (!h) return;
  h.status = newStatus;
  if (newStatus === 'completed' && !h.claimedOn) {
    h.claimedOn = new Date().toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'});
  }
  saveUserData(email, ud);
  renderAdminRequests();
  renderAdminDashboard();
  showToast('Status updated to "' + newStatus + '"', 'success');
}

function renderAdminResidents() {
  const users = getUsers();
  const search = (document.getElementById('residentSearch')?.value || '').toLowerCase();
  let filtered = users;
  if (search) filtered = users.filter(u =>
    (u.first + ' ' + u.last).toLowerCase().includes(search) ||
    u.email.toLowerCase().includes(search)
  );

  const tbody = document.getElementById('adminResidentsTableBody');
  const emptyEl = document.getElementById('adminResidentsEmpty');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  tbody.innerHTML = filtered.map(u => {
    const ud = getUserData(u.email);
    const total = (ud.history || []).length;
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--orange-main),var(--orange-bright));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;">${u.first[0]}${u.last[0]}</div>
          <div>
            <div style="font-weight:600;">${u.first} ${u.last}</div>
          </div>
        </div>
      </td>
      <td style="color:var(--text-sub);">${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td><strong style="color:var(--orange-deep);">${total}</strong></td>
      <td><span class="badge badge-ready">Active</span></td>
    </tr>`;
  }).join('');
}

function renderAdminQueue() {
  const allReqs = getAllRequests();
  const queued = allReqs.filter(r => r.status === 'processing');
  const total = allReqs.length;
  const completed = allReqs.filter(r => r.status === 'completed').length;
  const pct = total > 0 ? Math.round(completed/total*100) : 0;

  const currentLabel = 'A-' + String(adminCurrentQueue).padStart(3,'0');
  document.getElementById('adminLiveNum').textContent = currentLabel;
  document.getElementById('adminQueueCurrentLabel').textContent = currentLabel;
  document.getElementById('adminQueueTotal').textContent = total;
  document.getElementById('adminQueueWaiting').textContent = queued.length;
  document.getElementById('adminQueueProgressLabel').textContent = pct + '%';
  document.getElementById('adminQueueProgressBar').style.width = pct + '%';
}

function advanceQueue() {
  adminCurrentQueue++;
  renderAdminQueue();
  showToast('Now serving: A-' + String(adminCurrentQueue).padStart(3,'0'), 'info');
}

function resetQueue() {
  if (!confirm('Reset queue to A-001? This cannot be undone.')) return;
  adminCurrentQueue = 1;
  renderAdminQueue();
  showToast('Queue has been reset to A-001', 'info');
}

function jumpQueue() {
  const val = document.getElementById('jumpQueueInput').value.trim();
  const match = val.match(/A-(\d+)/i);
  if (!match) { showToast('Invalid format. Use A-XXX (e.g. A-025)', 'error'); return; }
  adminCurrentQueue = parseInt(match[1]);
  renderAdminQueue();
  document.getElementById('adminLiveNum').textContent = 'A-' + String(adminCurrentQueue).padStart(3,'0');
  showToast('Jumped to A-' + String(adminCurrentQueue).padStart(3,'0'), 'success');
  document.getElementById('jumpQueueInput').value = '';
}

function renderAdminAnnouncements() {
  const container = document.getElementById('adminAnnList');
  container.innerHTML = ANNOUNCEMENTS.map(a => `
    <div class="card" style="padding:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:16px;">${a.emoji}</span>
            <strong style="font-size:13px;">${a.title}</strong>
            <span class="tag">${a.type}</span>
          </div>
          <p style="font-size:12px;color:var(--text-sub);line-height:1.5;">${a.body.substring(0,80)}…</p>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteAnnouncement('${a.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function postAnnouncement() {
  const title = document.getElementById('newAnnTitle').value.trim();
  const type = document.getElementById('newAnnType').value;
  const body = document.getElementById('newAnnBody').value.trim();
  if (!title || !body) { showToast('Please fill in title and message.', 'error'); return; }
  const emojis = { Important:'📢', News:'🎉', Reminder:'📋', Policy:'🤝' };
  ANNOUNCEMENTS.unshift({
    id: 'ann_' + Date.now(),
    title, body, type,
    emoji: emojis[type] || '📢',
    date: new Date().toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})
  });
  document.getElementById('newAnnTitle').value = '';
  document.getElementById('newAnnBody').value = '';
  renderAdminAnnouncements();
  showToast('Announcement posted successfully!', 'success');
}

function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  ANNOUNCEMENTS = ANNOUNCEMENTS.filter(a => a.id !== id);
  renderAdminAnnouncements();
  showToast('Announcement deleted.', 'info');
}

function renderAll() {
  renderDocList();
  renderDashboard();
  renderTimeSlots();
  renderAnnouncements();
  renderQueue();
  renderTracker();
  renderHistory('all');
}

function renderDashboard() {
  if (!currentUser) return;
  const ud = getUserData(currentUser.email);
  const appts = ud.appointments || [];
  const hist = ud.history || [];
  const inQueue = appts.filter(a => a.status==='queued');
  const processing = hist.filter(h => h.status==='processing');
  const completed = hist.filter(h => h.status==='completed');

  document.getElementById('statAppts').textContent = appts.length;
  document.getElementById('statQueue').textContent = inQueue.length;
  document.getElementById('statPending').textContent = processing.length;
  document.getElementById('statDone').textContent = completed.length;
  document.getElementById('queueBadge').textContent = inQueue.length;

  const dashAppts = document.getElementById('dashAppts');
  if (appts.length === 0) {
    dashAppts.innerHTML = `<div class="empty-state" style="padding:24px 0;"><div class="empty-icon">📅</div><div class="empty-text">No upcoming appointments</div><div class="empty-sub">Book one to get started</div></div>`;
  } else {
    dashAppts.innerHTML = appts.slice(-3).reverse().map(a => {
      const d = new Date(a.date);
      return `<div class="appt-item">
        <div class="appt-date-box"><div class="appt-day">${d.getDate()}</div><div class="appt-month">${d.toLocaleString('en',{month:'short'}).toUpperCase()}</div></div>
        <div><div class="appt-doc">${a.docEmoji} ${a.doc}</div><div class="appt-meta">${a.time} · Queue ${a.queue}</div></div>
        <span class="badge badge-queue">${a.status}</span>
      </div>`;
    }).join('');
  }

  const dashHist = document.getElementById('dashHistory');
  const recent = hist.slice(-4).reverse();
  if (recent.length === 0) {
    dashHist.innerHTML = `<div class="empty-state" style="padding:24px 0;"><div class="empty-icon">🗂️</div><div class="empty-text">No transactions yet</div><div class="empty-sub">Your history will appear here</div></div>`;
  } else {
    dashHist.innerHTML = recent.map(h => `
      <div class="history-item">
        <div class="history-icon">${h.emoji}</div>
        <div class="history-info"><div class="history-doc">${h.doc}</div><div class="history-date">${h.daysAgo}</div></div>
        <span class="badge badge-${h.status}">${h.status}</span>
      </div>`).join('');
  }
}

function renderDocList() {
  document.getElementById('docList').innerHTML = DOCS.map(d => `
    <div class="doc-card ${selectedDoc?.id===d.id?'selected':''}" onclick="selectDoc('${d.id}')">
      <div class="doc-icon">${d.emoji}</div>
      <div class="doc-info"><div class="doc-name">${d.name}</div><div class="doc-days">⏱ ${d.days}</div></div>
      <div class="doc-fee">${d.fee}</div>
    </div>`).join('');
}

function selectDoc(id) {
  selectedDoc = DOCS.find(d => d.id===id);
  renderDocList();
  updateSummary();
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  container.innerHTML = TIME_SLOTS.map(t => {
    const taken = TAKEN_SLOTS.includes(t);
    const sel = selectedTime === t && !taken;
    return `<div class="time-slot ${taken?'taken':''} ${sel?'selected':''}" data-time="${t}" data-taken="${taken}">${t}</div>`;
  }).join('');
  container.querySelectorAll('.time-slot').forEach(el => {
    el.addEventListener('click', function() {
      if (this.dataset.taken === 'true') return;
      selectTime(this.dataset.time);
    });
  });
}

function selectTime(t) { selectedTime = t; renderTimeSlots(); updateSummary(); }

document.getElementById('apptDate').addEventListener('change', updateSummary);

function updateSummary() {
  const date = document.getElementById('apptDate').value;
  const summary = document.getElementById('apptSummary');
  const content = document.getElementById('summaryContent');
  if (selectedDoc && selectedTime && date) {
    summary.style.display = 'block';
    const d = new Date(date);
    content.innerHTML = `📄 <strong>Document:</strong> ${selectedDoc.name}<br>📅 <strong>Date:</strong> ${d.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}<br>🕐 <strong>Time:</strong> ${selectedTime}<br>💰 <strong>Fee:</strong> ${selectedDoc.fee}<br>📋 <strong>Requirements:</strong> ${selectedDoc.requirements}`;
  } else {
    summary.style.display = 'none';
  }
}

function confirmAppointment() {
  const name = document.getElementById('apptName').value.trim();
  const date = document.getElementById('apptDate').value;
  const phone = document.getElementById('apptPhone').value.trim();
  const purpose = document.getElementById('apptPurpose').value.trim();

  if (!selectedDoc) { showToast('Please select a document type.','error'); return; }
  if (!date) { showToast('Please choose an appointment date.','error'); return; }
  if (!selectedTime) { showToast('Please select a time slot.','error'); return; }
  if (!name) { showToast('Please enter your full name.','error'); return; }
  if (!phone) { showToast('Please enter your contact number.','error'); return; }
  if (!purpose) { showToast('Please enter the purpose of your request.','error'); return; }

  const d = new Date(date);
  if (d.getDay()===0||d.getDay()===6) { showToast('Appointments are only available Monday–Friday.','error'); return; }

  let qNum = getQueueNum() + 1;
  saveQueueNum(qNum);
  const queueLabel = 'A-0' + qNum;

  const appt = {
    id: 'appt_'+Date.now(),
    doc: selectedDoc.name, docId: selectedDoc.id, docEmoji: selectedDoc.emoji,
    date, time: selectedTime, name, phone, purpose,
    queue: queueLabel, status: 'queued', fee: selectedDoc.fee,
    createdAt: new Date().toISOString(),
  };

  let ud = getUserData(currentUser.email);
  ud.appointments = ud.appointments || [];
  ud.appointments.push(appt);

  const hist = {
    id: 'h'+Date.now(),
    doc: selectedDoc.name, docId: selectedDoc.id, emoji: selectedDoc.emoji,
    date, daysAgo: 'Today', status: 'processing', purpose,
    queue: queueLabel, fee: selectedDoc.fee, claimedOn: null,
    appointmentDate: d.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}),
    residentName: currentUser.first + ' ' + currentUser.last,
    residentEmail: currentUser.email,
  };
  ud.history = ud.history || [];
  ud.history.push(hist);
  saveUserData(currentUser.email, ud);

  document.getElementById('modalTicketNum').textContent = queueLabel;
  document.getElementById('modalDocType').textContent = selectedDoc.emoji+' '+selectedDoc.name;
  document.getElementById('modalApptDate').textContent = d.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}) + ' · ' + selectedTime;
  document.getElementById('modalRequirements').innerHTML = `📋 <strong>Please bring:</strong><br>${selectedDoc.requirements}`;
  document.getElementById('confirmModal').classList.add('open');

  selectedDoc = null; selectedTime = null;
  document.getElementById('apptDate').value = '';
  document.getElementById('apptPurpose').value = '';
  document.getElementById('apptSummary').style.display = 'none';
  renderDocList(); renderTimeSlots(); renderDashboard();
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('open');
  showTab('queue', document.querySelector('[onclick*="queue"]'));
}

function renderQueue() {
  if (!currentUser || isAdmin) return;
  const ud = getUserData(currentUser.email);
  const appts = (ud.appointments || []).filter(a => a.status==='queued');
  const container = document.getElementById('myTickets');
  document.getElementById('queueBadge').textContent = appts.length;

  const served = getQueueNum() - appts.length;
  const total = getQueueNum() + 4;
  document.getElementById('queueProgressLabel').textContent = served + ' / ' + total + ' served';
  document.getElementById('queueProgressBar').style.width = Math.round(served/total*100)+'%';

  if (appts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-text">No active queue tickets</div><div class="empty-sub">Book an appointment to get a queue number</div></div>`;
    return;
  }
  container.innerHTML = appts.map(a => {
    const d = new Date(a.date);
    const pos = parseInt(a.queue.replace('A-0','')) - served;
    const eta = Math.max(0,pos) * 8;
    return `<div class="queue-ticket" style="margin-bottom:16px;">
      <div class="ticket-label">Your Queue Number</div>
      <div class="ticket-number">${a.queue}</div>
      <div class="ticket-type">${a.docEmoji} ${a.doc}</div>
      <div style="font-size:12px;opacity:.65;margin:4px 0 16px;">${d.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})} · ${a.time}</div>
      <div style="display:flex;gap:20px;font-size:12px;">
        <div><div style="opacity:.6">Positions ahead</div><strong style="font-size:16px;">${Math.max(0,pos-1)}</strong></div>
        <div><div style="opacity:.6">Est. wait</div><strong style="font-size:16px;">${eta} min</strong></div>
      </div>
    </div>`;
  }).join('');
}

function renderTracker() {
  if (!currentUser || isAdmin) return;
  const ud = getUserData(currentUser.email);
  const docs = (ud.history || []).filter(h => h.status !== 'completed');
  const container = document.getElementById('trackerList');
  if (docs.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:80px 24px;"><div class="empty-icon">📦</div><div class="empty-text">No documents in progress</div><div class="empty-sub">Documents you've booked will appear here for tracking</div></div>`;
    return;
  }
  const STEPS = ['Submitted','Verification','Processing','Ready for Pickup','Completed'];
  container.innerHTML = docs.map(d => {
    const stepIdx = d.status==='processing'?2:d.status==='pending'?1:0;
    return `<div class="card" style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="doc-icon">${d.emoji}</div>
          <div><div class="doc-name" style="font-size:16px;">${d.doc}</div><div class="doc-days">Queue: ${d.queue} · ${d.fee}</div></div>
        </div>
        <span class="badge badge-${d.status}">${d.status}</span>
      </div>
      <div class="steps-tracker">
        ${STEPS.map((s,i) => `<div class="step-item ${i<stepIdx?'done':i===stepIdx?'current':''}">
          <div class="step-circle">${i<stepIdx?'✓':i+1}</div>
          <div class="step-label">${s}</div>
        </div>`).join('')}
      </div>
      <div style="margin-top:16px;background:var(--orange-pale);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--brown-dark);line-height:1.6;">
        📋 <strong>Purpose:</strong> ${d.purpose}<br>
        📅 <strong>Appointment:</strong> ${d.appointmentDate||d.date}
      </div>
    </div>`;
  }).join('');
}

function renderHistory(filter) {
  if (!currentUser || isAdmin) return;
  const ud = getUserData(currentUser.email);
  let hist = ud.history || [];
  if (filter !== 'all') hist = hist.filter(h => h.status===filter);
  hist = hist.slice().reverse();
  const container = document.getElementById('historyList');
  if (hist.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:80px 24px;"><div class="empty-icon">🗂️</div><div class="empty-text">No records found</div></div>`;
    return;
  }
  container.innerHTML = hist.map(h => `
    <div class="history-item" onclick="showHistDetail('${h.id}')">
      <div class="history-icon">${h.emoji}</div>
      <div class="history-info"><div class="history-doc">${h.doc}</div><div class="history-date">🕐 ${h.daysAgo} · Queue: ${h.queue}</div></div>
      <div class="history-right">
        <span class="badge badge-${h.status}">${h.status}</span>
        <div style="font-size:12px;color:var(--text-sub);margin-top:4px;">${h.fee}</div>
      </div>
    </div>`).join('');
}

function filterHistory(f, el) {
  document.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderHistory(f);
}

function showHistDetail(id) {
  if (!currentUser) return;
  const ud = getUserData(currentUser.email);
  const h = ud.history.find(x => x.id===id);
  if (!h) return;
  document.getElementById('histModalTitle').textContent = h.doc;
  document.getElementById('histModalBody').innerHTML = `
    <div style="text-align:center;font-size:48px;margin-bottom:16px;">${h.emoji}</div>
    <div style="background:var(--orange-pale);border-radius:12px;padding:16px;font-size:13px;color:var(--brown-dark);line-height:2;margin-bottom:16px;">
      <strong>Document:</strong> ${h.doc}<br>
      <strong>Queue Number:</strong> ${h.queue}<br>
      <strong>Fee:</strong> ${h.fee}<br>
      <strong>Status:</strong> <span class="badge badge-${h.status}">${h.status}</span><br>
      <strong>Purpose:</strong> ${h.purpose}<br>
      ${h.claimedOn?'<strong>Date Claimed:</strong> '+h.claimedOn+'<br>':''}
      ${!h.claimedOn?'<strong>Appointment:</strong> '+(h.appointmentDate||h.date)+'<br>':''}
    </div>
    <div style="font-size:12px;color:var(--text-sub);text-align:center;padding:10px;background:#F8F0E8;border-radius:10px;">🔒 This information is private and only visible to you.</div>`;
  document.getElementById('historyModal').classList.add('open');
}
function closeHistModal() { document.getElementById('historyModal').classList.remove('open'); }

function renderAnnouncements() {
  document.getElementById('announcementList').innerHTML = ANNOUNCEMENTS.map(a => `
    <div class="card">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="font-size:28px;margin-top:2px;">${a.emoji}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <div class="card-title" style="margin-bottom:0;">${a.title}</div>
            <span class="tag">${a.type}</span>
          </div>
          <p style="font-size:13px;color:var(--text-sub);line-height:1.6;margin-bottom:8px;">${a.body}</p>
          <div style="font-size:11px;color:var(--orange-deep);font-weight:600;">📅 ${a.date}</div>
        </div>
      </div>
    </div>`).join('');
}

function showToast(msg, type='info') {
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const tc = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); }, 3500);
}

(function initDate() {
  const d = new Date();
  d.setDate(d.getDate()+1);
  while (d.getDay()===0||d.getDay()===6) d.setDate(d.getDate()+1);
  const pad = n => String(n).padStart(2,'0');
  const min = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const dateInput = document.getElementById('apptDate');
  if(dateInput) { dateInput.min = min; dateInput.value = min; }
  renderTimeSlots();
})();

(function checkSession() {
  const s = getSession();
  if (!s) return;
  if (s.isAdmin || s.email === ADMIN_EMAIL) { loadAdmin(); }
  else { loadApp(s); }
})();

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if(e.target===o) o.classList.remove('open'); });
});