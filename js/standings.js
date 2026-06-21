/* =============================================================================
   TINOS CUP — Υπολογισμός Βαθμολογίας & βοηθητικές συναρτήσεις
   Νίκη = 3 πόντοι, Ισοπαλία = 1, Ήττα = 0
   ============================================================================= */
(function () {
  "use strict";

  const POINTS = { win: 3, draw: 1, loss: 0 };

  // Επιστρέφει true αν ο αγώνας έχει έγκυρο αποτέλεσμα (έχει παιχτεί).
  function isPlayed(match) {
    return (
      typeof match.homeScore === "number" &&
      typeof match.awayScore === "number" &&
      !Number.isNaN(match.homeScore) &&
      !Number.isNaN(match.awayScore)
    );
  }

  // Όλοι οι αγώνες μιας κατηγορίας σε ένα flat array (με αναφορά στο matchday).
  function allMatches(category) {
    const out = [];
    (category.fixtures || []).forEach((fx) => {
      (fx.matches || []).forEach((m) => out.push({ ...m, matchday: fx.matchday }));
    });
    return out;
  }

  // Υπολογίζει τον πίνακα βαθμολογίας μιας κατηγορίας.
  function computeStandings(category) {
    const rows = {};
    (category.teams || []).forEach((t) => {
      rows[t.id] = {
        team: t,
        played: 0, win: 0, draw: 0, loss: 0,
        gf: 0, ga: 0, gd: 0, points: 0,
      };
    });

    allMatches(category).forEach((m) => {
      if (!isPlayed(m)) return;
      const h = rows[m.home];
      const a = rows[m.away];
      if (!h || !a) return; // αγνόησε αγώνες με άγνωστη ομάδα

      h.played++; a.played++;
      h.gf += m.homeScore; h.ga += m.awayScore;
      a.gf += m.awayScore; a.ga += m.homeScore;

      if (m.homeScore > m.awayScore) {
        h.win++; a.loss++; h.points += POINTS.win;
      } else if (m.homeScore < m.awayScore) {
        a.win++; h.loss++; a.points += POINTS.win;
      } else {
        h.draw++; a.draw++; h.points += POINTS.draw; a.points += POINTS.draw;
      }
    });

    const table = Object.values(rows);
    table.forEach((r) => { r.gd = r.gf - r.ga; });

    // Κατάταξη:
    //   1) Πόντοι
    //   2) Σε ισοβαθμία → ΜΕΤΑΞΥ ΤΟΥΣ αγώνες (head-to-head): κερδίζει όποιος έχει
    //      νίκη/περισσότερους πόντους στα παιχνίδια ανάμεσα στις ισόβαθμες ομάδες.
    //   3) Αν δεν λύνεται από τα μεταξύ τους (π.χ. ισοπαλία) → Διαφορά Τερμάτων
    //   4) → Γκολ Υπέρ → Αλφαβητικά
    table.sort((x, y) => y.points - x.points); // πρώτα μόνο με πόντους

    // Λύσε τις ισοβαθμίες μέσα σε κάθε γκρουπ ομάδων με ίδιους πόντους.
    let i = 0;
    while (i < table.length) {
      let j = i;
      while (j < table.length && table[j].points === table[i].points) j++;
      if (j - i > 1) orderTiedGroup(table.slice(i, j), category)
        .forEach((r, k) => { table[i + k] = r; });
      i = j;
    }

    return table;
  }

  // Διατάσσει ομάδες με ίσους πόντους με βάση τα ΜΕΤΑΞΥ ΤΟΥΣ αποτελέσματα,
  // και μετά (αν χρειαστεί) με διαφορά τερμάτων κ.λπ.
  function orderTiedGroup(group, category) {
    const ids = new Set(group.map((r) => r.team.id));
    const h = {};
    group.forEach((r) => { h[r.team.id] = { pts: 0, gf: 0, ga: 0 }; });

    allMatches(category).forEach((m) => {
      if (!isPlayed(m)) return;
      if (!ids.has(m.home) || !ids.has(m.away)) return; // μόνο μεταξύ τους
      const H = h[m.home], A = h[m.away];
      H.gf += m.homeScore; H.ga += m.awayScore;
      A.gf += m.awayScore; A.ga += m.homeScore;
      if (m.homeScore > m.awayScore) H.pts += POINTS.win;
      else if (m.homeScore < m.awayScore) A.pts += POINTS.win;
      else { H.pts += POINTS.draw; A.pts += POINTS.draw; }
    });

    return group.sort((x, y) => {
      const hx = h[x.team.id], hy = h[y.team.id];
      return (
        (hy.pts - hx.pts) ||                       // μεταξύ τους: πόντοι
        ((hy.gf - hy.ga) - (hx.gf - hx.ga)) ||     // μεταξύ τους: διαφορά τερμάτων
        (y.gd - x.gd) ||                           // συνολική διαφορά τερμάτων
        (y.gf - x.gf) ||                           // συνολικά γκολ υπέρ
        x.team.name.localeCompare(y.team.name, "el")
      );
    });
  }

  window.TinosStandings = { computeStandings, allMatches, isPlayed, POINTS };
})();
