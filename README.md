# TINOS CUP — Football Tournament Site

Στατικό site (HTML/CSS/JS, χωρίς build) για τα τουρνουά Tinos Cup:
αποτελέσματα, **αυτόματη βαθμολογία** (Νίκη 3 / Ισοπαλία 1 / Ήττα 0),
εναλλαγή **περιόδων**, **tabs** ανά ηλικιακή κατηγορία και **overview**.

## Άνοιγμα τοπικά
Διπλό κλικ στο `index.html`, ή για να δουλέψουν σωστά τα σχετικά αρχεία:
```bash
npx http-server -p 8099      # και άνοιξε http://localhost:8099
```

## Σελίδες
- `index.html` — το δημόσιο site (αυτό που βλέπει ο κόσμος).
- `admin.html` — διαχείριση σκορ (μόνο για σένα).

## Πώς ενημερώνω σκορ
1. Άνοιξε `admin.html`, διάλεξε Περίοδο + Κατηγορία.
2. Γράψε τα σκορ. Η βαθμολογία ενημερώνεται **ζωντανά** και αποθηκεύεται
   στον browser σου (προεπισκόπηση).
3. Πάτα **Export data.js** → κατεβαίνει νέο `data.js`.
4. Αντικατέστησε το `js/data.js` με αυτό και κάνε commit/push.
   Έτσι το βλέπουν όλοι.

## Πού αλλάζω ομάδες / αγώνες / περιόδους
Όλα στο `js/data.js` — έχει σχόλια. Δομή:
`tournament → periods[] → categories[] → teams[] / fixtures[] → matches[]`.
Λογότυπα ομάδων: βάλε `logo: "assets/logos/ομαδα.png"` σε κάθε ομάδα
(αλλιώς δείχνει αρχικά με χρώμα).

## Ανέβασμα στο διαδίκτυο (GitHub Pages, δωρεάν)
1. Φτιάξε public repo `tinos-cup` στο GitHub.
2. Ανέβασε όλα τα αρχεία.
3. Settings → Pages → Branch `main` / `/root` → Save.
4. Σε ~1 λεπτό: `https://<username>.github.io/tinos-cup`.
