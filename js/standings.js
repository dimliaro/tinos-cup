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

    // Κατάταξη: Πόντοι → Διαφορά Γκολ → Γκολ Υπέρ → Αλφαβητικά
    table.sort((x, y) =>
      y.points - x.points ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      x.team.name.localeCompare(y.team.name, "el")
    );

    return table;
  }

  window.TinosStandings = { computeStandings, allMatches, isPlayed, POINTS };
})();
