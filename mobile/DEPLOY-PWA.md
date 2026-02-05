# PWA Build & Deploy (Sevalla)

## Build command

Για να δημιουργηθεί ο φάκελος `dist` (PWA) πριν το deploy:

```bash
cd mobile && npm install && npx expo export --platform web
```

Στο Sevalla μπορείς να ορίσεις:

- **Build command:** `cd mobile && npm install && npx expo export --platform web`
- **Publish/Output directory:** `mobile/dist` (αν το repo είναι root) ή αντίστοιχο path.

## Γραμματοσειρές εικονιδίων (Ionicons / Vector Icons)

Τα εικονίδια (Ionicons κ.λπ.) χρησιμοποιούν font αρχεία (`.ttf`). Το `npx expo export --platform web` τα συμπεριλαμβάνει στο bundle και τα paths είναι τύπου `/assets/node_modules/@expo/vector-icons/.../Fonts/Ionicons.xxxx.ttf`.

- Ο **server** (backend) έχει ρυθμιστεί ώστε **να μην στέλνει** `index.html` για URLs με extension (`.ttf`, `.woff`, `.js`, `.css`, κ.λπ.) και να σερβίρει γραμματοσειρές με σωστό `Content-Type`.
- Αν τα εικονίδια ακόμα εμφανίζονται ως κουτάκια, βεβαιώσου ότι:
  1. Το **Build command** στο Sevalla τρέχει πραγματικά `npx expo export --platform web` μέσα στο `mobile/` (όχι μόνο `npm run build` root).
  2. Μετά το build, το **deploy** περιλαμβάνει ολόκληρο το `mobile/dist` (συμπεριλαμβανομένου του `_expo/static` και όποιου `assets/` δημιουργεί το Expo).

Δεν απαιτείται επιπλέον βήμα για να “συμπεριληφθούν” οι γραμματοσειρές: το Expo export τις αναφέρει στο JS bundle και, αν χρειάζεται, τις αντιγράφει στο `dist`. Το κρίσιμο είναι το deploy να σερβίρει τα αρχεία από το `mobile/dist` χωρίς να αντικαθιστά requests για `.ttf`/`.woff` με `index.html` (κάτι που διορθώθηκε στο backend).
