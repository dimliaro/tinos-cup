/* =============================================================================
   TINOS CUP — Board (γραφικό 1920×1080 για TV) + export PNG μέσω html2canvas
   ============================================================================= */
(function () {
  "use strict";
  const { computeStandings } = window.TinosStandings;

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const teamById = (cat, id) => (cat.teams || []).find((t) => t.id === id) || { name: "—", short: "?" };

  function crest(team) {
    const c = el("span", "bd-crest");
    if (team && team.logo) {
      c.classList.add("logo");
      const img = el("img");
      img.src = team.logo; img.alt = team.name || "";
      c.appendChild(img);
    } else {
      c.style.background = (team && team.color) || "#1a2a4a";
      c.textContent = (team && (team.short || (team.name || "?").slice(0, 3).toUpperCase())) || "?";
    }
    return c;
  }
  function calIcon() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`;
  }

  // -------------------------------------------------------------- build board
  function buildBoard(data, period, cat) {
    const board = el("div", "board");
    board.appendChild(el("div", "bd-streak s1"));
    board.appendChild(el("div", "bd-streak s2"));
    board.appendChild(el("div", "bd-pitch"));
    const wrap = el("div", "bd-wrap");

    // header
    const header = el("div", "bd-header");
    const logo = el("div", "bd-logo");
    const li = el("img"); li.src = "logos/tinos-cup-mark.png"; li.alt = "TINOS CUP";
    logo.appendChild(li);
    const titleImg = el("img", "bd-titleimg"); titleImg.src = "logos/tinos-cup-title.png"; titleImg.alt = "TINOS CUP";
    const titleWrap = el("div"); titleWrap.appendChild(titleImg);
    const catBox = el("div", "bd-cat",
      `<span class="g">${esc(cat.gender || "")}</span>
       <span class="a">${esc(cat.ageLabel || "")}</span>
       <span class="d">${calIcon()} ${esc(cat.dateRange || "")}</span>`);
    header.append(logo, titleWrap, catBox);
    wrap.appendChild(header);

    // body
    const body = el("div", "bd-body");

    // --- periods column ---
    const pcol = el("div", "bd-col");
    const ppanel = el("div", "bd-panel bd-periods");
    ppanel.appendChild(el("div", "bd-ptitle", "ΠΕΡΙΟΔΟΙ"));
    const plist = el("div", "bd-plist");
    (data.periods || []).forEach((p) => {
      plist.appendChild(el("div", "bd-pbtn" + (p.id === period.id ? " active" : ""), esc(p.label)));
    });
    ppanel.appendChild(plist);
    pcol.appendChild(ppanel);
    body.appendChild(pcol);

    // --- results column ---
    const rcol = el("div", "bd-col");
    const rpanel = el("div", "bd-panel");
    rpanel.appendChild(el("div", "bd-ptitle", "ΑΠΟΤΕΛΕΣΜΑΤΑ ΟΜΙΛΟΥ"));
    let n = 0;
    (cat.fixtures || []).forEach((fx) => {
      rpanel.appendChild(el("div", "bd-band", `${fx.matchday}η ΑΓΩΝΙΣΤΙΚΗ`));
      const ml = el("div", "bd-mlist");
      if (fx.bye) {
        const b = teamById(cat, fx.bye);
        const chip = el("div", "bd-bye");
        chip.appendChild(crest(b));
        chip.appendChild(el("span", null, `ΡΕΠΟ: <b>${esc(b.name)}</b>`));
        ml.appendChild(chip);
      }
      (fx.matches || []).forEach((m) => {
        n++;
        const home = teamById(cat, m.home), away = teamById(cat, m.away);
        const played = typeof m.homeScore === "number" && typeof m.awayScore === "number";
        const row = el("div", "bd-match");
        row.appendChild(el("span", "bd-num", String(n)));
        const h = el("div", "bd-team h");
        h.appendChild(el("span", "nm", esc(home.name))); h.appendChild(crest(home));
        const sc = el("div", "bd-score" + (played ? "" : " pending"));
        sc.innerHTML = played
          ? `<span>${m.homeScore}</span><span class="sep">-</span><span>${m.awayScore}</span>`
          : `<span>VS</span>`;
        const a = el("div", "bd-team a");
        a.appendChild(crest(away)); a.appendChild(el("span", "nm", esc(away.name)));
        row.append(h, sc, a);
        ml.appendChild(row);
      });
      rpanel.appendChild(ml);
    });
    rcol.appendChild(rpanel);
    body.appendChild(rcol);

    // --- right column (standings + schedule) ---
    const right = el("div", "bd-col");
    const spanel = el("div", "bd-panel");
    spanel.appendChild(el("div", "bd-ptitle", "ΒΑΘΜΟΛΟΓΙΑ"));
    const sbox = el("div", "bd-stbox");
    const table = computeStandings(cat);
    const t = el("table", "bd-standings");
    t.innerHTML = `<thead><tr><th></th><th class="tc">ΟΜΑΔΕΣ</th><th>ΑΓ</th><th>Ν</th><th>Ι</th><th>Η</th><th>ΓΚΟΛ</th><th>ΔΓ</th><th>Β</th></tr></thead>`;
    const tb = el("tbody");
    table.forEach((r, i) => {
      const gd = (r.gd > 0 ? "+" : "") + r.gd;
      const tr = el("tr");
      const tc = el("td", "tcell");
      const tc2 = el("span", "tc2");
      tc2.appendChild(crest(r.team)); tc2.appendChild(el("span", null, esc(r.team.name)));
      tc.appendChild(tc2);
      tr.appendChild(el("td", null, `<span class="rk">${i + 1}</span>`));
      tr.appendChild(tc);
      tr.appendChild(el("td", null, String(r.played)));
      tr.appendChild(el("td", null, String(r.win)));
      tr.appendChild(el("td", null, String(r.draw)));
      tr.appendChild(el("td", null, String(r.loss)));
      tr.appendChild(el("td", "goals", `${r.gf}-${r.ga}`));
      tr.appendChild(el("td", null, gd));
      tr.appendChild(el("td", "pts", String(r.points)));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    sbox.appendChild(t);
    spanel.appendChild(sbox);
    right.appendChild(spanel);

    const schPanel = el("div", "bd-panel");
    schPanel.appendChild(el("div", "bd-ptitle", "ΑΓΩΝΙΣΤΙΚΕΣ"));
    const sch = el("div", "bd-sched");
    (cat.fixtures || []).forEach((fx) => {
      sch.appendChild(el("div", "bd-sday", `${fx.matchday}η Αγωνιστική`));
      (fx.matches || []).forEach((m) => {
        const home = teamById(cat, m.home), away = teamById(cat, m.away);
        const r = el("div", "bd-srow");
        r.appendChild(el("span", "tm", `${esc(home.name)} - ${esc(away.name)}`));
        r.appendChild(el("span", "dt", esc(m.date || "")));
        r.appendChild(el("span", "ti", esc(m.time || "")));
        sch.appendChild(r);
      });
      if (fx.bye) {
        const r = el("div", "bd-srow bye");
        r.appendChild(el("span", "tm", `Ρεπό: ${esc(teamById(cat, fx.bye).name)}`));
        r.appendChild(el("span", "dt", "")); r.appendChild(el("span", "ti", ""));
        sch.appendChild(r);
      }
    });
    schPanel.appendChild(sch);
    right.appendChild(schPanel);
    body.appendChild(right);

    wrap.appendChild(body);

    // footer
    const footer = el("div", "bd-footer");
    footer.appendChild(el("div", "bd-slogan", `<span>—</span>${esc((data.tournament && data.tournament.slogan) || "Η ΤΗΝΟΣ ΠΑΙΖΕΙ ΜΠΑΛΑ")}<span>—</span>`));
    footer.appendChild(el("span", "bd-hash", esc((data.tournament && data.tournament.hashtag) || "#TINOSCUP")));
    wrap.appendChild(footer);

    board.appendChild(wrap);
    return board;
  }

  // -------------------------------------------------------------- helpers
  function waitImages(root) {
    const imgs = [...root.querySelectorAll("img")];
    return Promise.all(imgs.map((img) => img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise((res) => { img.onload = img.onerror = () => res(); })));
  }

  function safeName(cat) {
    return ("TINOS-CUP-" + (cat.gender || "") + "-" + (cat.ageLabel || ""))
      .replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") + ".png";
  }

  async function exportPng(data, period, cat) {
    if (typeof html2canvas !== "function") throw new Error("Λείπει η βιβλιοθήκη html2canvas.");
    const board = buildBoard(data, period, cat);
    board.style.position = "fixed";
    board.style.left = "-10000px";
    board.style.top = "0";
    document.body.appendChild(board);
    try {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      await waitImages(board);
      const wrap = board.querySelector(".bd-wrap");
      const h = Math.max(1080, (wrap ? wrap.scrollHeight : board.scrollHeight));
      board.style.height = h + "px";
      const canvas = await html2canvas(board, {
        width: 1920, height: h, windowWidth: 1920, windowHeight: h,
        scale: 2, backgroundColor: "#04102a", useCORS: true, logging: false,
      });
      await new Promise((res) => canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = safeName(cat);
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        res();
      }, "image/png"));
    } finally {
      board.remove();
    }
  }

  window.TinosBoard = { buildBoard, exportPng };
})();
