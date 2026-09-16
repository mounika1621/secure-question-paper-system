let token = localStorage.getItem("qps_token");
let currentUser = JSON.parse(localStorage.getItem("qps_user") || "null");

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showApp() {
  document.getElementById("loginCard").classList.toggle("hidden", !!token);
  document.getElementById("app").classList.toggle("hidden", !token);
  if (token && currentUser) {
    document.getElementById("welcome").textContent = `Welcome, ${currentUser.name}`;
    document.getElementById("role").textContent = `Role: ${currentUser.role}`;
    document.getElementById("uploadCard").style.display =
      ["setter", "admin"].includes(currentUser.role) ? "block" : "none";
    document.getElementById("auditCard").style.display =
      currentUser.role === "admin" ? "block" : "none";
    loadPapers();
    if (currentUser.role === "admin") loadLogs();
  }
}

async function login() {
  const msg = document.getElementById("loginMsg");
  msg.textContent = "Checking...";
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  });
  const data = await response.json();
  if (!response.ok) {
    msg.textContent = data.error || "Login failed";
    return;
  }
  token = data.token;
  currentUser = data.user;
  localStorage.setItem("qps_token", token);
  localStorage.setItem("qps_user", JSON.stringify(currentUser));
  showApp();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("qps_token");
  localStorage.removeItem("qps_user");
  showApp();
}

async function uploadPaper() {
  const file = document.getElementById("paper").files[0];
  const msg = document.getElementById("uploadMsg");

  if (!file) {
    msg.textContent = "Choose a PDF or DOCX file.";
    return;
  }

  const form = new FormData();
  form.append("title", document.getElementById("title").value);
  form.append("subject", document.getElementById("subject").value);
  form.append("exam_date", new Date(document.getElementById("examDate").value).toISOString());
  form.append("paper", file);

  msg.textContent = "Encrypting and uploading...";
  const response = await fetch("/api/papers/upload", {
    method: "POST",
    headers: authHeaders(),
    body: form
  });
  const data = await response.json();
  msg.textContent = response.ok ? data.message : data.error;
  if (response.ok) loadPapers();
}

async function loadPapers() {
  const box = document.getElementById("papers");
  const response = await fetch("/api/papers", { headers: authHeaders() });
  if (!response.ok) return;
  const papers = await response.json();

  box.innerHTML = papers.map(p => `
    <div class="paper">
      <strong>${escapeHtml(p.title)}</strong>
      <div>${escapeHtml(p.subject || "No subject")}</div>
      <div><span class="badge">${p.status}</span></div>
      <div>Exam: ${new Date(p.exam_date).toLocaleString()}</div>
      <div>SHA-256: <code>${p.sha256_hash}</code></div>
      ${["reviewer","admin"].includes(currentUser.role) && p.status === "PENDING_REVIEW"
        ? `<button onclick="review('${p.id}','approve')">Approve</button>
           <button class="secondary" onclick="review('${p.id}','reject')">Reject</button>` : ""}
      ${["controller","admin"].includes(currentUser.role)
        ? `<button onclick="downloadPaper('${p.id}')">Release / Download</button>` : ""}
    </div>
  `).join("") || "<p>No question papers yet.</p>";
}

async function review(id, action) {
  const response = await fetch(`/api/papers/${id}/${action}`, {
    method: "POST",
    headers: authHeaders()
  });
  const data = await response.json();
  alert(data.message || data.error);
  loadPapers();
}

async function downloadPaper(id) {
  const response = await fetch(`/api/papers/${id}/download`, {
    headers: authHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    alert(data.error || "Release denied");
    return;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const name = match ? match[1] : "question-paper.pdf";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  loadPapers();
}

async function loadLogs() {
  const box = document.getElementById("logs");
  const response = await fetch("/api/admin/audit-logs", { headers: authHeaders() });
  if (!response.ok) return;
  const logs = await response.json();
  box.innerHTML = logs.map(l =>
    `<pre>${escapeHtml(JSON.stringify(l, null, 2))}</pre>`
  ).join("") || "<p>No logs.</p>";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

showApp();