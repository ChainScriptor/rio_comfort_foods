# PWA Build & Deploy (Sevalla)

## Για να φαίνονται τα εικονίδια στο Sevalla

Στο **Sevalla** πρέπει να τρέχει **ακριβώς** αυτό το build, ώστε το `dist` να περιέχει και τα SVG (tab bar) και τα fonts (υπόλοιπα εικονίδια):

- **Build command:** `cd mobile && npm install && npm run export:web`
- **Publish/Output directory:** `mobile/dist`

Μετά από αλλαγή του build command, κάνε **νέο deploy** (trigger rebuild) ώστε να ανέβει το νέο `dist`.

### Έλεγχος μετά το deploy

Άνοιξε στο browser ένα URL γραμματοσειράς που ζητάει η εφαρμογή, π.χ.:

`https://<το-domain-του-pwa>/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf`

- Αν φορτώνει το αρχείο (ή εμφανίζει download) → τα fonts σερβίρονται σωστά.
- Αν βγάζει 404 ή σε στέλνει στην αρχική → το build δεν τρέχει `npm run export:web` ή το publish directory δεν είναι το `mobile/dist`.

---

## Build command

Για να δημιουργηθεί ο φάκελος `dist` (PWA) **με τα fonts των εικονιδίων** πριν το deploy, χρησιμοποίησε:

```bash
cd mobile && npm install && npm run export:web
```

Το `export:web` τρέχει `expo export --platform web` και στη συνέχεια το script `scripts/copy-vector-icon-fonts.js`, που αντιγράφει τα `.ttf` των `@expo/vector-icons` στο `dist` (το Expo δεν τα αντιγράφει μόνο του).

## Γραμματοσειρές εικονιδίων (Ionicons / Vector Icons)

Τα εικονίδια χρησιμοποιούν font αρχεία (`.ttf`). Το bundle αναφέρει paths τύπου `/assets/node_modules/@expo/vector-icons/.../Fonts/Ionicons.xxxx.ttf`, αλλά το `expo export --platform web` **δεν** αντιγράφει αυτά τα αρχεία στο `dist`. Γι’ αυτό χρησιμοποιούμε το script `copy-vector-icon-fonts.js` μετά το export.

- Ο **server** (backend) σερβίρει γραμματοσειρές με σωστό `Content-Type` και δεν στέλνει `index.html` για `.ttf`/`.woff`.
- Τα εικονίδια της **tab bar** (Κατάστημα, Καλάθι, Προφίλ) είναι πλέον SVG και μπαίνουν μέσα στο bundle· δεν χρειάζονται ξεχωριστά αρχεία.
