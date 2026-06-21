/* =============================================================================
   TINOS CUP — Admin (πλήρης επεξεργασία + ζωντανή βαθμολογία + αυτόματη δημοσίευση)
   -----------------------------------------------------------------------------
   - Επεξεργάζεσαι ΤΑ ΠΑΝΤΑ: ομάδες, αγωνιστικές, ποιος παίζει με ποιον,
     ημερομηνίες/ώρες, σκορ, ρεπό, τρέχουσα περίοδος.
   - "Αποθήκευση & Δημοσίευση": κάνει commit το js/data.js στο GitHub μέσω API,
     οπότε ενημερώνεται αυτόματα το live site (~1 λεπτό). Χρειάζεται μία φορά
     GitHub token (Ρυθμίσεις) που μένει ΜΟΝΟ στον browser σου.
   ============================================================================= */
(function () {
  "use strict";

  const { computeStandings } = window.TinosStandings;
  const DATA = window.TINOS_DATA;

  const DRAFT_KEY = "tinoscup_admin_draft";
  const TOKEN_KEY = "tinoscup_gh_token";
  const AUTH_KEY = "tinoscup_admin_auth";
  // SHA-256 του "admin:TinosCup2026!" (ο κωδικός δεν αποθηκεύεται σε καθαρό κείμενο)
  const CRED_HASH = "0e31b16d728fc0803532226ea431a336976686c3153ac0e8d4324f528a270be8";
  const REPO = "dimliaro/tinos-cup";
  const BRANCH = "main";
  const FILE = "js/data.js";

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ---------------------------------------------------------------- working copy
  let work;
  try {
    const d = localStorage.getItem(DRAFT_KEY);
    work = d ? JSON.parse(d) : JSON.parse(JSON.stringify(DATA));
  } catch (e) { work = JSON.parse(JSON.stringify(DATA)); }
  if (!work.periods) work = JSON.parse(JSON.stringify(DATA));

  let pIndex = work.periods.findIndex((p) => p.categories && p.categories.length);
  if (pIndex < 0) pIndex = 0;
  let cIndex = 0;

  const persist = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(work)); } catch (e) {} };
  const uid = (pfx) => (pfx || "t") + Math.random().toString(36).slice(2, 7);
  const teamById = (cat, id) => (cat.teams || []).find((t) => t.id === id) || { name: "—" };

  // ---------------------------------------------------------------- top selectors
  function fillSelectors() {
    const sp = $("#selPeriod");
    sp.innerHTML = "";
    work.periods.forEach((p, i) => {
      const o = el("option", null, p.label + (p.categories.length ? "" : " (κενή)"));
      o.value = i; sp.appendChild(o);
    });
    sp.value = pIndex;
    sp.onchange = () => { pIndex = +sp.value; cIndex = 0; fillCategories(); renderEditor(); };

    const sc2 = $("#selCurrent");
    sc2.innerHTML = "";
    work.periods.forEach((p) => {
      const o = el("option", null, p.label);
      o.value = p.id; sc2.appendChild(o);
    });
    sc2.value = work.currentPeriodId || work.periods[0].id;
    sc2.onchange = () => { work.currentPeriodId = sc2.value; persist(); flash("Ορίστηκε τρέχουσα περίοδος: " + sc2.value); };

    fillCategories();
  }

  function fillCategories() {
    const sc = $("#selCategory");
    sc.innerHTML = "";
    const cats = work.periods[pIndex].categories;
    if (!cats.length) {
      sc.appendChild(el("option", null, "—"));
      sc.disabled = true;
    } else {
      sc.disabled = false;
      cats.forEach((c, i) => {
        const o = el("option", null, `${c.gender || "?"} ${c.ageLabel || ""}`);
        o.value = i; sc.appendChild(o);
      });
      if (cIndex >= cats.length) cIndex = 0;
      sc.value = cIndex;
    }
    sc.onchange = () => { cIndex = +sc.value; renderEditor(); };
  }

  // ---------------------------------------------------------------- small builders
  function labeledInput(labelTxt, value, onChange, opts) {
    opts = opts || {};
    const wrap = el("label", "adm-field");
    wrap.appendChild(el("span", "adm-field-label", labelTxt));
    const inp = el("input", "adm-input");
    inp.type = opts.type || "text";
    if (opts.placeholder) inp.placeholder = opts.placeholder;
    if (opts.size) inp.style.width = opts.size;
    inp.value = value == null ? "" : value;
    inp.addEventListener(opts.event || "input", () => onChange(inp.value));
    wrap.appendChild(inp);
    return wrap;
  }

  function teamSelect(cat, selectedId, onChange) {
    const s = el("select", "adm-select");
    s.appendChild(el("option", null, "—")).value = "";
    cat.teams.forEach((t) => {
      const o = el("option", null, esc(t.name));
      o.value = t.id;
      if (t.id === selectedId) o.selected = true;
      s.appendChild(o);
    });
    s.value = selectedId || "";
    s.onchange = () => onChange(s.value);
    return s;
  }

  function miniBtn(txt, cls, onClick) {
    const b = el("button", "adm-mini " + (cls || ""), txt);
    b.type = "button";
    b.onclick = onClick;
    return b;
  }

  // ---------------------------------------------------------------- editor
  function renderEditor() {
    const editor = $("#editor");
    editor.innerHTML = "";
    const period = work.periods[pIndex];

    // --- ενέργειες κατηγορίας (πρόσθεση/διαγραφή) ---
    const catBar = el("div", "adm-catbar");
    catBar.appendChild(miniBtn("＋ Νέα κατηγορία", "add", () => {
      period.categories.push({
        id: uid("cat-"), gender: "BOYS", ageLabel: "K10",
        dateRange: "", teams: [], fixtures: [],
      });
      cIndex = period.categories.length - 1;
      persist(); fillCategories(); renderEditor();
    }));
    editor.appendChild(catBar);

    const cat = period.categories[cIndex];
    if (!cat) {
      editor.appendChild(el("div", "empty-state", "<h3>Δεν υπάρχει κατηγορία σε αυτή την περίοδο.</h3><p>Πάτα «Νέα κατηγορία».</p>"));
      renderPreview();
      return;
    }

    // === META ===
    const meta = el("section", "adm-section");
    meta.appendChild(el("div", "adm-section-title", "Στοιχεία κατηγορίας"));
    const metaRow = el("div", "adm-row");
    metaRow.appendChild(labeledInput("Φύλο (BOYS/GIRLS)", cat.gender, (v) => { cat.gender = v.toUpperCase(); persist(); fillCategories(); }, { event: "change", size: "120px" }));
    metaRow.appendChild(labeledInput("Ηλικία (π.χ. K15)", cat.ageLabel, (v) => { cat.ageLabel = v.toUpperCase(); persist(); fillCategories(); }, { event: "change", size: "110px" }));
    metaRow.appendChild(labeledInput("Ημερομηνίες (κείμενο)", cat.dateRange, (v) => { cat.dateRange = v; persist(); }, { placeholder: "23 ΙΟΥΝΙΟΥ - 25 ΙΟΥΝΙΟΥ", size: "240px" }));
    meta.appendChild(metaRow);
    meta.appendChild(miniBtn("🗑 Διαγραφή κατηγορίας", "del", () => {
      if (!confirm("Διαγραφή ΟΛΗΣ της κατηγορίας;")) return;
      period.categories.splice(cIndex, 1); cIndex = 0;
      persist(); fillCategories(); renderEditor();
    }));
    editor.appendChild(meta);

    // === TEAMS ===
    const teamsSec = el("section", "adm-section");
    teamsSec.appendChild(el("div", "adm-section-title", "Ομάδες"));
    cat.teams.forEach((t) => {
      const row = el("div", "adm-team-row");
      const nm = el("input", "adm-input grow"); nm.value = t.name || ""; nm.placeholder = "Όνομα ομάδας";
      nm.addEventListener("change", () => { t.name = nm.value; if (!t.short) t.short = nm.value.slice(0, 3).toUpperCase(); persist(); renderEditor(); });
      const sh = el("input", "adm-input"); sh.style.width = "62px"; sh.value = t.short || ""; sh.placeholder = "ΣΥΝΤ";
      sh.addEventListener("change", () => { t.short = sh.value.toUpperCase(); persist(); });
      const col = el("input", "adm-input"); col.type = "color"; col.style.width = "44px"; col.value = t.color || "#1a2a4a";
      col.addEventListener("change", () => { t.color = col.value; persist(); });
      const lg = el("input", "adm-input"); lg.style.width = "150px"; lg.value = t.logo || ""; lg.placeholder = "logos/αρχείο.png";
      lg.addEventListener("change", () => { t.logo = lg.value || undefined; persist(); });
      row.append(nm, sh, col, lg, miniBtn("✕", "del", () => {
        if (!confirm("Διαγραφή ομάδας «" + (t.name || "") + "»;")) return;
        cat.teams = cat.teams.filter((x) => x !== t);
        // καθάρισε αναφορές σε αγώνες/ρεπό
        cat.fixtures.forEach((fx) => {
          if (fx.bye === t.id) delete fx.bye;
          fx.matches.forEach((m) => { if (m.home === t.id) m.home = ""; if (m.away === t.id) m.away = ""; });
        });
        persist(); renderEditor();
      }));
      teamsSec.appendChild(row);
    });
    teamsSec.appendChild(miniBtn("＋ Προσθήκη ομάδας", "add", () => {
      cat.teams.push({ id: uid("t-"), name: "Νέα ομάδα", short: "ΝΕΑ", color: "#1a2a4a" });
      persist(); renderEditor();
    }));
    editor.appendChild(teamsSec);

    // === FIXTURES ===
    const fxSec = el("section", "adm-section");
    fxSec.appendChild(el("div", "adm-section-title", "Αγωνιστικές & Αγώνες"));
    cat.fixtures.forEach((fx, fi) => {
      const block = el("div", "adm-md");
      const head = el("div", "adm-md-head");
      head.appendChild(el("span", "adm-md-title", (fx.matchday || fi + 1) + "η Αγωνιστική"));
      // bye
      const byeWrap = el("label", "adm-inline");
      byeWrap.appendChild(el("span", null, "Ρεπό:"));
      byeWrap.appendChild(teamSelect(cat, fx.bye || "", (v) => { if (v) fx.bye = v; else delete fx.bye; persist(); renderPreview(); }));
      head.appendChild(byeWrap);
      head.appendChild(miniBtn("🗑 Αγωνιστική", "del", () => {
        if (!confirm("Διαγραφή αγωνιστικής;")) return;
        cat.fixtures.splice(fi, 1);
        cat.fixtures.forEach((f, k) => { f.matchday = k + 1; });
        persist(); renderEditor();
      }));
      block.appendChild(head);

      fx.matches.forEach((m) => {
        const mrow = el("div", "adm-match2");
        mrow.appendChild(teamSelect(cat, m.home, (v) => { m.home = v; persist(); renderPreview(); }));
        const hs = el("input", "adm-input score"); hs.type = "number"; hs.min = 0; hs.value = m.homeScore ?? ""; hs.placeholder = "–";
        const as = el("input", "adm-input score"); as.type = "number"; as.min = 0; as.value = m.awayScore ?? ""; as.placeholder = "–";
        const onScore = () => {
          const hv = hs.value.trim(), av = as.value.trim();
          if (hv === "" || av === "") { m.homeScore = null; m.awayScore = null; }
          else { m.homeScore = Math.max(0, parseInt(hv, 10) || 0); m.awayScore = Math.max(0, parseInt(av, 10) || 0); }
          persist(); renderPreview();
        };
        hs.addEventListener("input", onScore); as.addEventListener("input", onScore);
        mrow.appendChild(hs);
        mrow.appendChild(el("span", "adm-vs", "-"));
        mrow.appendChild(as);
        mrow.appendChild(teamSelect(cat, m.away, (v) => { m.away = v; persist(); renderPreview(); }));
        const dt = el("input", "adm-input"); dt.style.width = "70px"; dt.value = m.date || ""; dt.placeholder = "23/06";
        dt.addEventListener("input", () => { m.date = dt.value; persist(); });
        const tm = el("input", "adm-input"); tm.style.width = "64px"; tm.value = m.time || ""; tm.placeholder = "17:00";
        tm.addEventListener("input", () => { m.time = tm.value; persist(); });
        mrow.append(dt, tm, miniBtn("✕", "del", () => {
          fx.matches = fx.matches.filter((x) => x !== m); persist(); renderEditor();
        }));
        block.appendChild(mrow);
      });

      block.appendChild(miniBtn("＋ Αγώνας", "add", () => {
        fx.matches.push({ home: "", away: "", homeScore: null, awayScore: null, date: "", time: "" });
        persist(); renderEditor();
      }));
      fxSec.appendChild(block);
    });
    fxSec.appendChild(miniBtn("＋ Προσθήκη αγωνιστικής", "add", () => {
      const md = (cat.fixtures[cat.fixtures.length - 1]?.matchday || cat.fixtures.length) + 1;
      cat.fixtures.push({ matchday: md, matches: [{ home: "", away: "", homeScore: null, awayScore: null, date: "", time: "" }] });
      persist(); renderEditor();
    }));
    editor.appendChild(fxSec);

    renderPreview();
  }

  // ---------------------------------------------------------------- preview
  function renderPreview() {
    const host = $("#previewStandings");
    host.innerHTML = "";
    const cat = work.periods[pIndex].categories[cIndex];
    if (!cat) return;
    const table = computeStandings(cat);
    const t = el("table", "standings");
    t.innerHTML = `<thead><tr><th></th><th class="team-col">ΟΜΑΔΕΣ</th>
      <th>ΑΓ</th><th>Ν</th><th>Ι</th><th>Η</th><th>ΓΚΟΛ</th><th>ΔΓ</th><th>Β</th></tr></thead>`;
    const tb = el("tbody");
    table.forEach((r, i) => {
      const gd = (r.gd > 0 ? "+" : "") + r.gd;
      const tr = el("tr", i === 0 ? "top" : "");
      tr.innerHTML = `<td><span class="rank">${i + 1}</span></td>
        <td class="team-cell"><span class="tc"><span class="crest" style="background:${r.team.color || "#1a2a4a"}">${esc(r.team.short || "?")}</span>${esc(r.team.name)}</span></td>
        <td>${r.played}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.loss}</td>
        <td class="goals">${r.gf}-${r.ga}</td><td>${gd}</td><td class="pts">${r.points}</td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    host.appendChild(t);
  }

  // ---------------------------------------------------------------- data.js text
  function buildDataJs() {
    const header =
`/* =============================================================================
   TINOS CUP — ΔΕΔΟΜΕΝΑ ΤΟΥΡΝΟΥΑ
   Δημιουργήθηκε από το admin.html στις ${new Date().toLocaleString("el-GR")}.
   ============================================================================= */
window.TINOS_DATA = `;
    return header + JSON.stringify(work, null, 2) + ";\n";
  }

  function b64utf8(str) { return btoa(unescape(encodeURIComponent(str))); }

  async function exportCurrentPng() {
    const period = work.periods[pIndex];
    const cat = period && period.categories[cIndex];
    if (!cat) { flash("Διάλεξε κατηγορία για να βγει το γραφικό.", true); return; }
    try {
      flash("Δημιουργία PNG…");
      await window.TinosBoard.exportPng(work, period, cat);
      flash("✓ Κατέβηκε το PNG (1920×1080) για " + (cat.gender || "") + " " + (cat.ageLabel || "") + ".");
    } catch (e) {
      flash("Σφάλμα PNG: " + (e.message || e), true);
    }
  }

  function downloadDataJs() {
    const blob = new Blob([buildDataJs()], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "data.js";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------- status
  let flashTimer;
  function flash(msg, isErr) {
    const s = $("#adminStatus");
    s.textContent = msg;
    s.className = "admin-status show" + (isErr ? " err" : " ok");
    clearTimeout(flashTimer);
    if (!isErr) flashTimer = setTimeout(() => { s.className = "admin-status"; }, 6000);
  }

  // ---------------------------------------------------------------- GitHub save
  const ghHeaders = (token) => ({
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  async function saveToGitHub() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { openSettings(true); flash("Βάλε πρώτα GitHub token στις Ρυθμίσεις.", true); return; }
    const btn = $("#btnSave");
    btn.disabled = true;
    flash("Αποθήκευση στο GitHub…");
    const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
    try {
      let sha;
      const g = await fetch(`${api}?ref=${BRANCH}&t=${Date.now()}`, { headers: ghHeaders(token) });
      if (g.ok) { sha = (await g.json()).sha; }
      else if (g.status === 401) throw new Error("Άκυρο token (401). Έλεγξε το token στις Ρυθμίσεις.");
      else if (g.status === 404) { sha = undefined; } // νέο αρχείο
      else throw new Error("Ανάγνωση απέτυχε (" + g.status + ")");

      const body = {
        message: "Admin: ενημέρωση δεδομένων " + new Date().toLocaleString("el-GR"),
        content: b64utf8(buildDataJs()),
        branch: BRANCH,
      };
      if (sha) body.sha = sha;

      const r = await fetch(api, { method: "PUT", headers: ghHeaders(token), body: JSON.stringify(body) });
      if (!r.ok) {
        let detail = r.status;
        try { detail = (await r.json()).message || detail; } catch (e) {}
        if (r.status === 403 || r.status === 401) throw new Error("Χωρίς δικαίωμα εγγραφής. Το token πρέπει να έχει Contents: Read & write στο " + REPO + ".");
        throw new Error("Αποθήκευση απέτυχε: " + detail);
      }
      flash("✓ Αποθηκεύτηκε! Θα φανεί live σε ~1 λεπτό. Δημιουργία PNG…");
      try { await exportCurrentPng(); } catch (e2) {}
    } catch (e) {
      flash(e.message || String(e), true);
    } finally {
      btn.disabled = false;
    }
  }

  // ---------------------------------------------------------------- settings (token)
  function openSettings(show) {
    const box = $("#adminSettings");
    box.hidden = show === true ? false : box.hidden ? false : true;
    refreshTokenState();
  }
  function refreshTokenState() {
    const has = !!localStorage.getItem(TOKEN_KEY);
    const st = $("#tokenState");
    if (st) { st.textContent = has ? "✓ Token αποθηκευμένο σε αυτόν τον browser." : "Δεν υπάρχει token."; st.className = "token-state " + (has ? "ok" : ""); }
  }

  function resetDraft() {
    if (!confirm("Επαναφορά στα δημοσιευμένα δεδομένα (θα χαθούν οι μη αποθηκευμένες αλλαγές);")) return;
    localStorage.removeItem(DRAFT_KEY);
    location.reload();
  }

  // ---------------------------------------------------------------- login gate
  async function sha256hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function unlock() {
    const gate = $("#loginGate");
    if (gate) gate.style.display = "none";
  }
  function initAuth() {
    const gate = $("#loginGate");
    if (!gate) return;
    if (sessionStorage.getItem(AUTH_KEY) === "1") { unlock(); return; }
    const form = $("#loginForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = $("#loginUser").value.trim();
      const p = $("#loginPass").value;
      let ok = false;
      try { ok = (await sha256hex(u + ":" + p)) === CRED_HASH; } catch (err) { ok = false; }
      if (ok) {
        sessionStorage.setItem(AUTH_KEY, "1");
        $("#loginErr").textContent = "";
        unlock();
      } else {
        $("#loginErr").textContent = "Λάθος όνομα χρήστη ή κωδικός.";
        $("#loginPass").value = "";
      }
    });
  }

  // ---------------------------------------------------------------- init
  document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    fillSelectors();
    renderEditor();
    $("#btnSave").onclick = saveToGitHub;
    $("#btnExportPng").onclick = exportCurrentPng;
    $("#btnExport").onclick = downloadDataJs;
    $("#btnReset").onclick = resetDraft;
    $("#btnSettings").onclick = () => openSettings();
    $("#btnSaveToken").onclick = () => {
      const v = $("#ghToken").value.trim();
      if (!v) { flash("Κενό token.", true); return; }
      localStorage.setItem(TOKEN_KEY, v);
      $("#ghToken").value = "";
      refreshTokenState();
      flash("Token αποθηκεύτηκε στον browser.");
    };
    $("#btnClearToken").onclick = () => { localStorage.removeItem(TOKEN_KEY); refreshTokenState(); flash("Token διαγράφηκε."); };
    refreshTokenState();
  });
})();
