# PWA Build & Deploy (Sevalla)

## Build command

Για να δημιουργηθεί ο φάκελος `dist` (PWA) **με τα fonts των εικονιδίων** πριν το deploy, χρησιμοποίησε:

```bash
cd mobile && npm install && npm run export:web
```

Το `export:web` τρέχει `expo export --platform web` και στη συνέχεια το script `scripts/copy-vector-icon-fonts.js`, που αντιγράφει τα `.ttf` των `@expo/vector-icons` στο `dist` (το Expo δεν τα αντιγράφει μόνο του).

Στο Sevalla:

- **Build command:** `cd mobile && npm install && npm run export:web`
- **Publish/Output directory:** `mobile/dist`

## Γραμματοσειρές εικονιδίων (Ionicons / Vector Icons)

Τα εικονίδια χρησιμοποιούν font αρχεία (`.ttf`). Το bundle αναφέρει paths τύπου `/assets/node_modules/@expo/vector-icons/.../Fonts/Ionicons.xxxx.ttf`, αλλά το `expo export --platform web` **δεν** αντιγράφει αυτά τα αρχεία στο `dist`. Γι’ αυτό χρησιμοποιούμε το script `copy-vector-icon-fonts.js` μετά το export.

- Ο **server** (backend) σερβίρει γραμματοσειρές με σωστό `Content-Type` και δεν στέλνει `index.html` για `.ttf`/`.woff`.
- Αν τα εικονίδια ακόμα εμφανίζονται ως κουτάκια, βεβαιώσου ότι το **Build command** στο Sevalla είναι `npm run export:web` (όχι μόνο `npx expo export --platform web`), ώστε να τρέχει και το copy script.
