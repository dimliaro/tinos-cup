/* =============================================================================
   TINOS CUP — ΔΕΔΟΜΕΝΑ ΤΟΥΡΝΟΥΑ  (η "πηγή αλήθειας")
   -----------------------------------------------------------------------------
   ΟΔΗΓΙΕΣ ΓΙΑ ΤΟΝ ΔΙΑΧΕΙΡΙΣΤΗ:
   - Εδώ ορίζεις περιόδους, ηλικιακές κατηγορίες, ομάδες και αγώνες.
   - Για να βάλεις σκορ: στο match δώσε homeScore / awayScore (αριθμούς).
     Αν είναι null, ο αγώνας θεωρείται ΧΩΡΙΣ αποτέλεσμα (δεν μετράει στη βαθμολογία).
   - Η ΒΑΘΜΟΛΟΓΙΑ υπολογίζεται ΑΥΤΟΜΑΤΑ (Νίκη 3, Ισοπαλία 1, Ήττα 0).
   - Μπορείς να αλλάζεις σκορ και από τη σελίδα admin.html (πιο εύκολο),
     και μετά να κάνεις "Export" για να ενημερώσεις αυτό το αρχείο.
   ============================================================================= */

window.TINOS_DATA = {
  tournament: {
    name: "TINOS CUP",
    subtitle: "FOOTBALL TOURNAMENT",
    hashtag: "#TINOSCUP",
    slogan: "Η ΤΗΝΟΣ ΠΑΙΖΕΙ ΜΠΑΛΑ",
  },

  /* ⭐ ΤΡΕΧΟΥΣΑ ΠΕΡΙΟΔΟΣ ⭐
     Βάλε εδώ το id της περιόδου που "τρέχει" τώρα (π.χ. "p4").
     Όταν ανοίγει το link, η σελίδα φορτώνει ΑΥΤΟΜΑΤΑ σε αυτή την περίοδο.
     Τα id είναι: p1, p2, p3, p4, p5, p6, p7 (βλέπε παρακάτω). */
  currentPeriodId: "p4",

  // Οι περίοδοι που φαίνονται στην αριστερή στήλη.
  // Κάθε περίοδος έχει μία ή περισσότερες ηλικιακές κατηγορίες (categories).
  periods: [
    {
      id: "p1",
      label: "1η ΠΕΡΙΟΔΟΣ",
      categories: [
        {
          id: "p1-boys-k10",
          gender: "BOYS",
          ageLabel: "K10",
          dateRange: "13 ΙΟΥΝΙΟΥ - 15 ΙΟΥΝΙΟΥ",
          teams: [
            { id: "aek",   name: "ΑΕΚ ΤΗΝΟΥ",     short: "ΑΕΚ", color: "#f6c945" },
            { id: "pao",   name: "ΠΑΝΑΘΗΝΑΪΚΟΣ",  short: "ΠΑΟ", color: "#0f7a3d" },
            { id: "ofh",   name: "ΟΦΗ",           short: "ΟΦΗ", color: "#111111" },
            { id: "aris",  name: "ΑΡΗΣ",          short: "ΑΡΗΣ", color: "#f5d000" },
          ],
          fixtures: [
            { matchday: 1, matches: [
              { home: "aek", away: "ofh",  homeScore: 2, awayScore: 1, date: "13/06", time: "10:00" },
              { home: "pao", away: "aris", homeScore: 0, awayScore: 0, date: "13/06", time: "10:00" },
            ]},
            { matchday: 2, matches: [
              { home: "aek", away: "pao",  homeScore: 1, awayScore: 3, date: "14/06", time: "10:00" },
              { home: "ofh", away: "aris", homeScore: null, awayScore: null, date: "14/06", time: "10:00" },
            ]},
            { matchday: 3, matches: [
              { home: "aris", away: "aek", homeScore: null, awayScore: null, date: "15/06", time: "10:00" },
              { home: "pao",  away: "ofh", homeScore: null, awayScore: null, date: "15/06", time: "10:00" },
            ]},
          ],
        },
      ],
    },

    { id: "p2", label: "2η ΠΕΡΙΟΔΟΣ", categories: [] },

    {
      id: "p3",
      label: "3η ΠΕΡΙΟΔΟΣ",
      categories: [
        {
          // === Η ΚΑΤΗΓΟΡΙΑ ΤΗΣ ΦΩΤΟΓΡΑΦΙΑΣ ===
          id: "p3-boys-k8",
          gender: "BOYS",
          ageLabel: "K8",
          dateRange: "18 ΙΟΥΝΙΟΥ - 20 ΙΟΥΝΙΟΥ",
          teams: [
            { id: "panery", name: "ΠΑΝΕΡΥΘΡΑΙΚΟΣ",   short: "ΠΑΝ", color: "#c8102e" },
            { id: "skorp",  name: "ΣΚΟΡΠΙΟΣ ΦΥΛΗΣ",  short: "ΣΚΟ", color: "#2b2b2b" },
            { id: "olymp",  name: "ΟΛΥΜΠΙΑΚΟΣ ΒΟΥΛΑΣ", short: "ΟΛΥ", color: "#c8102e" },
            { id: "pas",    name: "ΠΑΣ ΤΗΝΟΥ",       short: "ΠΑΣ", color: "#1e4fa3" },
          ],
          fixtures: [
            { matchday: 1, matches: [
              { home: "panery", away: "skorp", homeScore: null, awayScore: null, date: "20/06", time: "16:30" },
              { home: "olymp",  away: "pas",   homeScore: null, awayScore: null, date: "20/06", time: "16:30" },
            ]},
            { matchday: 2, matches: [
              { home: "panery", away: "olymp", homeScore: null, awayScore: null, date: "21/06", time: "08:30" },
              { home: "skorp",  away: "pas",   homeScore: null, awayScore: null, date: "21/06", time: "08:30" },
            ]},
            { matchday: 3, matches: [
              { home: "pas",   away: "panery", homeScore: null, awayScore: null, date: "21/06", time: "16:30" },
              { home: "olymp", away: "skorp",  homeScore: null, awayScore: null, date: "21/06", time: "16:30" },
            ]},
          ],
        },
      ],
    },

    {
      id: "p4",
      label: "4η ΠΕΡΙΟΔΟΣ",
      categories: [
        {
          id: "p4-girls-k15",
          gender: "GIRLS",
          ageLabel: "K15",
          dateRange: "23 ΙΟΥΝΙΟΥ - 25 ΙΟΥΝΙΟΥ",
          teams: [
            { id: "g15-myk",   name: "ΑΟ ΜΥΚΟΝΟΥ",            short: "ΜΥΚ", color: "#1565c0", logo: "logos/AE Mykonou.png" },
            { id: "g15-agpar", name: "ΑΟ ΑΓΙΑΣ ΠΑΡΑΣΚΕΥΗΣ",    short: "ΑΓΠ", color: "#2e7d32", logo: "logos/AO Agias Paraskevis.png" },
            { id: "g15-diag",  name: "ΔΙΑΓΟΡΑΣ ΡΑΧΕΣ ΙΚΑΡΙΑΣ", short: "ΔΙΑ", color: "#c62828", logo: "logos/Diagoras Raches Ikarias.png" },
            { id: "g15-syros", name: "ΝΕΟΣ ΑΟ ΣΥΡΟΥ",          short: "ΣΥΡ", color: "#6a1b9a", logo: "logos/Neos AO Syrou.png" },
            { id: "g15-santa", name: "SANTA FC",               short: "SAN", color: "#ef6c00", logo: "logos/AO Agias Paraskevis.png" },
          ],
          // 5 ομάδες → μονός γύρος, 5 αγωνιστικές. Κάθε αγωνιστική 1 ομάδα κάνει ΡΕΠΟ (bye).
          fixtures: [
            { matchday: 1, bye: "g15-myk", matches: [
              { home: "g15-agpar", away: "g15-santa", homeScore: null, awayScore: null, date: "23/06", time: "" },
              { home: "g15-diag",  away: "g15-syros", homeScore: null, awayScore: null, date: "23/06", time: "" },
            ]},
            { matchday: 2, bye: "g15-syros", matches: [
              { home: "g15-myk",   away: "g15-santa", homeScore: null, awayScore: null, date: "23/06", time: "" },
              { home: "g15-agpar", away: "g15-diag",  homeScore: null, awayScore: null, date: "23/06", time: "" },
            ]},
            { matchday: 3, bye: "g15-agpar", matches: [
              { home: "g15-myk",   away: "g15-syros", homeScore: null, awayScore: null, date: "24/06", time: "" },
              { home: "g15-santa", away: "g15-diag",  homeScore: null, awayScore: null, date: "24/06", time: "" },
            ]},
            { matchday: 4, bye: "g15-santa", matches: [
              { home: "g15-myk",   away: "g15-diag",  homeScore: null, awayScore: null, date: "24/06", time: "" },
              { home: "g15-syros", away: "g15-agpar", homeScore: null, awayScore: null, date: "24/06", time: "" },
            ]},
            { matchday: 5, bye: "g15-diag", matches: [
              { home: "g15-myk",   away: "g15-agpar", homeScore: null, awayScore: null, date: "25/06", time: "" },
              { home: "g15-syros", away: "g15-santa", homeScore: null, awayScore: null, date: "25/06", time: "" },
            ]},
          ],
        },
      ],
    },
    { id: "p5", label: "5η ΠΕΡΙΟΔΟΣ", categories: [] },
    { id: "p6", label: "6η ΠΕΡΙΟΔΟΣ", categories: [] },
    { id: "p7", label: "7η ΠΕΡΙΟΔΟΣ", categories: [] },
  ],
};
