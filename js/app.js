/* =============================================================================
   TINOS CUP — App (rendering, εναλλαγή περιόδου, tabs, overview)
   ============================================================================= */
(function () {
  "use strict";

  const { computeStandings } = window.TinosStandings;
  const DATA = window.TINOS_DATA;
  const STORAGE_KEY = "tinoscup_score_overrides";

  // ---- Συγχώνευση τοπικών αλλαγών (από admin) πάνω στα δεδομένα ----------
  // Επιτρέπει preview σκορ χωρίς commit. Κλειδί: periodId|catId|md|home|away
  function applyOverrides(data) {
    let ov;
    try { ov = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (e) { ov = {}; }
    if (!ov || !Object.keys(ov).length) return data;

    data.periods.forEach((p) => p.categories.forEach((c) => {
      c.fixtures.forEach((fx) => fx.matches.forEach((m) => {
        const key = [p.id, c.id, fx.matchday, m.home, m.away].join("|");
        if (ov[key]) {
          m.homeScore = ov[key].homeScore;
          m.awayScore = ov[key].awayScore;
        }
      }));
    }));
    return data;
  }

  // deep clone ώστε τα overrides να μην πειράζουν το αρχικό window.TINOS_DATA
  const data = applyOverrides(JSON.parse(JSON.stringify(DATA)));

  // ---------------------------------------------------------------- helpers
  const $ = (sel, el = document) => el.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const teamById = (cat, id) => cat.teams.find((t) => t.id === id) || { name: "—", short: "?", color: "#33415f" };

  function crest(team, big) {
    const hasLogo = !!team.logo;
    const c = el("span", "crest" + (hasLogo ? " has-logo" : ""));
    if (hasLogo) {
      const img = el("img");
      img.src = team.logo; img.alt = team.name;
      // αν δεν φορτώσει το logo, πέσε πίσω σε χρωματιστό κύκλο με αρχικά
      img.onerror = () => {
        c.classList.remove("has-logo");
        c.style.background = team.color || "#1a2a4a";
        c.innerHTML = team.short || "?";
      };
      c.appendChild(img);
    } else {
      c.style.background = team.color || "#1a2a4a";
      c.textContent = team.short || (team.name || "?").slice(0, 3).toUpperCase();
    }
    return c;
  }

  // ---------------------------------------------------------------- state
  let activePeriodId = (data.periods.find((p) => p.categories.length) || data.periods[0]).id;
  let activeTab = "overview"; // "overview" ή category id
  let activeGender = "ALL";   // "ALL" | "BOYS" | "GIRLS" — φίλτρο φύλου
  let activeAge = "ALL";      // "ALL" | "K8".."K15" — φίλτρο ηλικιακού γκρουπ

  // Όλα τα ηλικιακά γκρουπ (εμφανίζονται πάντα ως επιλογές, ακόμη κι αν δεν έχουν αγώνες).
  const AGE_GROUPS = ["K8", "K9", "K10", "K11", "K12", "K13", "K14", "K15"];

  function currentPeriod() { return data.periods.find((p) => p.id === activePeriodId); }

  // Κατηγορίες μιας περιόδου, φιλτραρισμένες με βάση φύλο + ηλικιακό γκρουπ.
  function catsFor(period) {
    if (!period) return [];
    return period.categories.filter((c) => {
      const gOk = activeGender === "ALL" || (c.gender || "").toUpperCase() === activeGender;
      const aOk = activeAge === "ALL" || (c.ageLabel || "").toUpperCase() === activeAge;
      return gOk && aOk;
    });
  }

  // Αν η τρέχουσα περίοδος δεν έχει κατηγορίες για τα ενεργά φίλτρα,
  // πήγαινε στην πρώτη περίοδο που έχει.
  function ensurePeriodWithCats() {
    if (catsFor(currentPeriod()).length) return;
    const firstWith = data.periods.find((p) => catsFor(p).length);
    if (firstWith) activePeriodId = firstWith.id;
  }

  // ============================================================ RENDER: header
  function renderHeader(cat) {
    const badge = $("#categoryBadge");
    if (!cat) {
      badge.innerHTML = `<div class="cat-line"><span class="age">—</span></div>`;
      return;
    }
    badge.innerHTML = `
      <div class="cat-line">
        <span class="gender">${cat.gender || ""}</span>
        <span class="age">${cat.ageLabel || ""}</span>
      </div>
      <span class="date-chip">${calIcon()} ${cat.dateRange || ""}</span>`;
  }
  function calIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`;
  }

  // ============================================================ RENDER: filters (φύλο + ηλικία)
  function segButton(label, isActive, onClick) {
    const b = el("button", "seg-btn" + (isActive ? " active" : ""), label);
    b.onclick = onClick;
    return b;
  }

  function renderGenderSwitch() {
    const host = $("#genderSwitch");
    if (!host) return;
    host.innerHTML = "";
    const opts = [
      { id: "ALL",   label: "ΟΛΑ" },
      { id: "BOYS",  label: '<span class="seg-ic">♂</span>BOYS' },
      { id: "GIRLS", label: '<span class="seg-ic">♀</span>GIRLS' },
    ];
    opts.forEach((o) => host.appendChild(segButton(o.label, activeGender === o.id, () => {
      activeGender = o.id;
      activeTab = "overview";
      ensurePeriodWithCats();
      render();
    })));
  }

  function renderAgeSwitch() {
    const host = $("#ageSwitch");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(segButton("ΟΛΕΣ", activeAge === "ALL", () => {
      activeAge = "ALL"; activeTab = "overview"; ensurePeriodWithCats(); render();
    }));
    AGE_GROUPS.forEach((g) => host.appendChild(segButton(g, activeAge === g, () => {
      activeAge = g; activeTab = "overview"; ensurePeriodWithCats(); render();
    })));
  }

  // ============================================================ RENDER: sidebar
  function renderSidebar() {
    const list = $("#periodList");
    list.innerHTML = "";
    data.periods.forEach((p) => {
      const b = el("button", "period-btn" + (p.id === activePeriodId ? " active" : "") + (catsFor(p).length ? "" : " empty"));
      b.textContent = p.label;
      b.onclick = () => {
        activePeriodId = p.id;
        activeTab = "overview";
        render();
      };
      list.appendChild(b);
    });
  }

  // ============================================================ RENDER: tabs
  function renderTabs() {
    const cats = catsFor(currentPeriod());
    const tabs = $("#tabs");
    tabs.innerHTML = "";
    if (!cats.length) return;

    const mk = (id, label) => {
      const t = el("button", "tab" + (activeTab === id ? " active" : ""));
      t.textContent = label;
      t.onclick = () => { activeTab = id; render(); };
      return t;
    };
    tabs.appendChild(mk("overview", "OVERVIEW"));
    cats.forEach((c) => tabs.appendChild(mk(c.id, `${c.gender} ${c.ageLabel}`)));
  }

  // ============================================================ RENDER: standings table
  function standingsTable(cat, compact) {
    const table = computeStandings(cat);
    const t = el("table", "standings");
    t.innerHTML = `
      <thead><tr>
        <th></th><th class="team-col">ΟΜΑΔΕΣ</th>
        <th>ΑΓ</th><th>Ν</th><th>Ι</th><th>Η</th>
        <th>ΓΚΟΛ</th><th>ΔΓ</th><th>Β</th>
      </tr></thead>`;
    const tb = el("tbody");
    table.forEach((r, i) => {
      const tr = el("tr", i === 0 ? "top" : "");
      const gd = (r.gd > 0 ? "+" : "") + r.gd;
      tr.innerHTML = `
        <td><span class="rank">${i + 1}</span></td>
        <td class="team-cell"><span class="tc"></span></td>
        <td>${r.played}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.loss}</td>
        <td class="goals">${r.gf}-${r.ga}</td><td>${gd}</td>
        <td class="pts">${r.points}</td>`;
      tr.querySelector(".tc").appendChild(crest(r.team));
      tr.querySelector(".tc").appendChild(el("span", null, r.team.name));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  // ============================================================ RENDER: results column
  function renderResults(cat) {
    const wrap = el("section", "panel");
    wrap.appendChild(el("div", "panel-title", "ΑΠΟΤΕΛΕΣΜΑΤΑ ΟΜΙΛΟΥ"));
    let n = 0;
    cat.fixtures.forEach((fx) => {
      wrap.appendChild(el("div", "matchday-band", `${fx.matchday}η ΑΓΩΝΙΣΤΙΚΗ`));
      if (fx.bye) {
        const byeTeam = teamById(cat, fx.bye);
        const chip = el("div", "bye-note");
        chip.appendChild(crest(byeTeam));
        chip.appendChild(el("span", null, `ΡΕΠΟ: <b>${byeTeam.name}</b>`));
        wrap.appendChild(chip);
      }
      const ml = el("div", "match-list");
      fx.matches.forEach((m) => {
        n++;
        const home = teamById(cat, m.home);
        const away = teamById(cat, m.away);
        const played = typeof m.homeScore === "number" && typeof m.awayScore === "number";
        const row = el("div", "match-row");

        const num = el("span", "match-num", String(n));
        const h = el("div", "team home");
        h.appendChild(el("span", "tname", home.name)); h.appendChild(crest(home));
        const a = el("div", "team away");
        a.appendChild(el("span", "tname", away.name)); a.appendChild(crest(away));

        const sb = el("div", "score-box" + (played ? "" : " pending"));
        sb.innerHTML = played
          ? `<span>${m.homeScore}</span><span class="sep">-</span><span>${m.awayScore}</span>`
          : `<span>VS</span>`;

        row.appendChild(num); row.appendChild(h); row.appendChild(sb); row.appendChild(a);
        ml.appendChild(row);
      });
      wrap.appendChild(ml);
    });
    return wrap;
  }

  // ============================================================ RENDER: right column
  function renderRight(cat) {
    const col = el("div", "rightcol");

    const standings = el("section", "panel");
    standings.appendChild(el("div", "panel-title", "ΒΑΘΜΟΛΟΓΙΑ"));
    const box = el("div", "std-wrap"); box.style.padding = "0 14px 16px";
    box.appendChild(standingsTable(cat));
    standings.appendChild(box);
    col.appendChild(standings);

    const sched = el("section", "panel");
    sched.appendChild(el("div", "panel-title", "ΑΓΩΝΙΣΤΙΚΕΣ"));
    const s = el("div", "schedule");
    cat.fixtures.forEach((fx) => {
      s.appendChild(el("div", "sched-day", `${fx.matchday}η Αγωνιστική`));
      fx.matches.forEach((m) => {
        const home = teamById(cat, m.home), away = teamById(cat, m.away);
        const r = el("div", "sched-row");
        r.appendChild(el("span", "teams", `${home.name} - ${away.name}`));
        r.appendChild(el("span", "date", m.date || ""));
        r.appendChild(el("span", "time", m.time || ""));
        s.appendChild(r);
      });
      if (fx.bye) {
        const r = el("div", "sched-row bye");
        r.appendChild(el("span", "teams", `Ρεπό: ${teamById(cat, fx.bye).name}`));
        r.appendChild(el("span", "date", ""));
        r.appendChild(el("span", "time", ""));
        s.appendChild(r);
      }
    });
    sched.appendChild(s);
    col.appendChild(sched);
    return col;
  }

  // ============================================================ RENDER: overview
  function renderOverview(period) {
    const wrap = el("div", "overview-grid");
    catsFor(period).forEach((cat) => {
      const card = el("section", "panel ov-card");
      card.appendChild(el("div", "ov-head",
        `<span class="ov-title"><b>${cat.gender}</b> ${cat.ageLabel}</span>
         <span class="ov-date">${cat.dateRange || ""}</span>`));
      const box = el("div", "std-wrap"); box.style.padding = "4px 14px 8px";
      box.appendChild(standingsTable(cat, true));
      card.appendChild(box);
      card.style.cursor = "pointer";
      card.onclick = () => { activeTab = cat.id; render(); };
      wrap.appendChild(card);
    });
    return wrap;
  }

  // ============================================================ MAIN RENDER
  function render() {
    const period = currentPeriod();
    renderGenderSwitch();
    renderAgeSwitch();
    renderSidebar();
    renderTabs();

    const cats = catsFor(period);
    const main = $("#mainArea");
    main.innerHTML = "";

    if (!cats.length) {
      renderHeader(null);
      const e = el("div", "panel");
      e.appendChild(el("div", "empty-state",
        `<h3>Δεν υπάρχουν προγραμματισμένοι αγώνες</h3><p>Επίλεξε άλλη περίοδο ή άλλη κατηγορία.</p>`));
      main.appendChild(e);
      return;
    }

    // Διασφάλισε ότι το ενεργό tab υπάρχει στις (φιλτραρισμένες) κατηγορίες
    if (activeTab !== "overview" && !cats.find((c) => c.id === activeTab)) {
      activeTab = "overview";
      renderTabs();
    }

    if (activeTab === "overview") {
      renderHeader(cats[0]);
      main.appendChild(renderOverview(period));
      return;
    }

    const cat = cats.find((c) => c.id === activeTab);
    renderHeader(cat);
    const grid = el("div", "results-grid");
    grid.appendChild(renderResults(cat));
    grid.appendChild(renderRight(cat));
    main.appendChild(grid);
  }

  document.addEventListener("DOMContentLoaded", render);
})();
