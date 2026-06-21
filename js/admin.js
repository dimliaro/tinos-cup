/* =============================================================================
   TINOS CUP — Admin (εισαγωγή σκορ, ζωντανή βαθμολογία, export data.js)
   ============================================================================= */
(function () {
  "use strict";

  const { computeStandings } = window.TinosStandings;
  const DATA = window.TINOS_DATA;
  const STORAGE_KEY = "tinoscup_score_overrides";

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // working copy + overrides
  const work = JSON.parse(JSON.stringify(DATA));
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (e) { overrides = {}; }

  const keyFor = (p, c, fx, m) => [p.id, c.id, fx.matchday, m.home, m.away].join("|");

  // εφάρμοσε αποθηκευμένα overrides στο working copy
  work.periods.forEach((p) => p.categories.forEach((c) =>
    c.fixtures.forEach((fx) => fx.matches.forEach((m) => {
      const k = keyFor(p, c, fx, m);
      if (overrides[k]) { m.homeScore = overrides[k].homeScore; m.awayScore = overrides[k].awayScore; }
    }))));

  let pIndex = work.periods.findIndex((p) => p.categories.length);
  if (pIndex < 0) pIndex = 0;
  let cIndex = 0;

  const teamById = (cat, id) => cat.teams.find((t) => t.id === id) || { name: "—" };

  // ---------------------------------------------------------------- selectors
  function fillSelectors() {
    const sp = $("#selPeriod");
    sp.innerHTML = "";
    work.periods.forEach((p, i) => {
      const o = el("option", null, p.label + (p.categories.length ? "" : " (κενή)"));
      o.value = i;
      sp.appendChild(o);
    });
    sp.value = pIndex;
    sp.onchange = () => { pIndex = +sp.value; cIndex = 0; fillCategories(); renderEditor(); };
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
        const o = el("option", null, `${c.gender} ${c.ageLabel}`);
        o.value = i; sc.appendChild(o);
      });
      sc.value = cIndex;
    }
    sc.onchange = () => { cIndex = +sc.value; renderEditor(); };
  }

  // ---------------------------------------------------------------- editor
  function renderEditor() {
    const editor = $("#editor");
    editor.innerHTML = "";
    const period = work.periods[pIndex];
    const cat = period.categories[cIndex];
    if (!cat) {
      editor.appendChild(el("div", "empty-state", "<h3>Δεν υπάρχουν αγώνες σε αυτή την περίοδο.</h3>"));
      renderPreview();
      return;
    }

    cat.fixtures.forEach((fx) => {
      editor.appendChild(el("div", "matchday-band", `${fx.matchday}η ΑΓΩΝΙΣΤΙΚΗ`));
      const list = el("div", "admin-match-list");
      fx.matches.forEach((m) => {
        const home = teamById(cat, m.home), away = teamById(cat, m.away);
        const row = el("div", "admin-match");
        row.innerHTML = `
          <span class="am-team home">${home.name}</span>
          <input type="number" min="0" class="am-score" data-side="home" value="${m.homeScore ?? ""}" placeholder="–" />
          <span class="am-sep">-</span>
          <input type="number" min="0" class="am-score" data-side="away" value="${m.awayScore ?? ""}" placeholder="–" />
          <span class="am-team away">${away.name}</span>`;

        const inputs = row.querySelectorAll(".am-score");
        const onChange = () => {
          const hv = inputs[0].value.trim();
          const av = inputs[1].value.trim();
          const k = keyFor(period, cat, fx, m);
          if (hv === "" || av === "") {
            m.homeScore = null; m.awayScore = null;
            delete overrides[k];
          } else {
            m.homeScore = Math.max(0, parseInt(hv, 10) || 0);
            m.awayScore = Math.max(0, parseInt(av, 10) || 0);
            overrides[k] = { homeScore: m.homeScore, awayScore: m.awayScore };
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
          renderPreview();
        };
        inputs.forEach((inp) => inp.addEventListener("input", onChange));
        list.appendChild(row);
      });
      editor.appendChild(list);
    });
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
        <td class="team-cell"><span class="tc"><span class="crest" style="background:${r.team.color || "#1a2a4a"}">${r.team.short || "?"}</span>${r.team.name}</span></td>
        <td>${r.played}</td><td>${r.win}</td><td>${r.draw}</td><td>${r.loss}</td>
        <td class="goals">${r.gf}-${r.ga}</td><td>${gd}</td><td class="pts">${r.points}</td>`;
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    host.appendChild(t);
  }

  // ---------------------------------------------------------------- export
  function exportData() {
    const header =
`/* =============================================================================
   TINOS CUP — ΔΕΔΟΜΕΝΑ ΤΟΥΡΝΟΥΑ
   Δημιουργήθηκε από το admin.html στις ${new Date().toLocaleString("el-GR")}.
   Αντικατέστησε το περιεχόμενο του js/data.js με αυτό και κάνε commit/push.
   ============================================================================= */
window.TINOS_DATA = `;
    const body = JSON.stringify(work, null, 2);
    const blob = new Blob([header + body + ";\n"], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "data.js";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function resetOverrides() {
    if (!confirm("Να διαγραφούν όλες οι τοπικές αλλαγές σκορ (επιστροφή στα δεδομένα του data.js);")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  // ---------------------------------------------------------------- init
  document.addEventListener("DOMContentLoaded", () => {
    fillSelectors();
    renderEditor();
    $("#btnExport").onclick = exportData;
    $("#btnReset").onclick = resetOverrides;
  });
})();
