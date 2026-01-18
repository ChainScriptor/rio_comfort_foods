# Οδηγίες για Προσαρμογή Email Invitation στο Clerk

## Βήμα 1: Ανέβασμα Logo στο Cloudinary

1. Ανοίξτε terminal στο backend folder
2. Εκτελέστε: `npm run upload:logo`
3. Αντίγραψε το URL που θα εμφανιστεί

**Εναλλακτικά:** Ανέβασε το `comfort1.svg` χειροκίνητα στο Cloudinary στο folder "logos" με public_id "comfort1-logo"

## Βήμα 2: Πρόσβαση στο Clerk Dashboard

1. Πηγαίνετε στο [Clerk Dashboard](https://dashboard.clerk.com)
2. Επιλέξτε το project σας
3. Μεταβείτε στο **Emails** → **Templates**

## Βήμα 3: Επεξεργασία του Invitation Template

1. Βρείτε το template **"Invitation"** (ή "Organization invitation" αν χρησιμοποιείτε organizations)
2. Κάντε κλικ στο **"Edit"**

## Βήμα 4: Προσθήκη Logo

Στο template editor, προσθέστε το logo σας χρησιμοποιώντας το URL από το Cloudinary:

```html
<img src="YOUR_CLOUDINARY_URL_HERE" alt="Rio Comfort Foods" style="max-width: 200px; height: auto;" />
```

## Βήμα 4: Προσαρμογή του Μηνύματος

Χρησιμοποιήστε το παρακάτω template (ή το `clerk-invitation-email-template.html` που δημιουργήθηκε):

### Subject Line:
```
Καλώς ήρθατε στο Rio Comfort Foods - Πρόσκληση B2B
```

### Email Body Template:

Μπορείτε να χρησιμοποιήσετε το αρχείο `clerk-invitation-email-template.html` ως βάση.

### Handlebars Variables που μπορείτε να χρησιμοποιήσετε:

- `{{app.name}}` - Όνομα της εφαρμογής
- `{{app.logo_url}}` - URL του logo (αν έχει οριστεί στο Clerk)
- `{{action_url}}` - Link για αποδοχή της πρόσκλησης
- `{{invitation.expires_in_days}}` - Ημέρες μέχρι τη λήξη
- `{{inviter.name}}` - Όνομα του admin που έστειλε την πρόσκληση
- `{{invitation.public_metadata.customerId}}` - Το ΑΦΜ που προσθέσατε

## Βήμα 5: Upload του Logo

Για να χρησιμοποιήσετε το `comfort1.svg`:

1. Ανέβαστε το αρχείο σε ένα public hosting (Cloudinary, S3, ή public folder)
2. Αντιγράψτε το URL
3. Χρησιμοποιήστε το URL στο template

**Εναλλακτικά:** Μπορείτε να ορίσετε το logo στο Clerk Dashboard → **Branding** → **Logo**, και μετά χρησιμοποιήστε `{{app.logo_url}}` στο template.

## Παράδειγμα Custom Template:

Χρησιμοποιήστε το αρχείο `clerk-invitation-email-template.html` ως βάση. Αντικαταστήστε το `{{app.logo_url}}` με το Cloudinary URL του logo σας.

### Subject Line (Θέμα Email):
```
Καλώς ήρθατε στο Rio Comfort Foods - Πρόσκληση B2B
```

### Βασικό Template:

```html
<div style="text-align: center; padding: 20px; background-color: #121212;">
  <img src="YOUR_CLOUDINARY_URL_HERE" alt="Rio Comfort Foods" style="max-width: 200px;" />
</div>

<h1 style="color: #121212; text-align: center;">Καλώς ήρθατε στο Rio Comfort Foods!</h1>

<p>Έχετε λάβει πρόσκληση να δημιουργήσετε λογαριασμό στην πλατφόρμα B2B του <strong>Rio Comfort Foods</strong>.</p>

<p>Μέσω της εφαρμογής θα μπορείτε να:</p>
<ul>
  <li>Παρακολουθήσετε το κατάλογο προϊόντων</li>
  <li>Κάνετε παραγγελίες online</li>
  <li>Διαχειριστείτε τις διευθύνσεις αποστολής σας</li>
  <li>Παρακολουθήσετε το ιστορικό των παραγγελιών σας</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{action_url}}" style="background-color: #FFD700; color: #121212; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold;">
    Αποδοχή Πρόσκλησης
  </a>
</div>

<p style="text-align: center; color: #666;">Αυτή η πρόσκληση λήγει σε <strong>{{invitation.expires_in_days}} ημέρες</strong>.</p>
```

## Σημείωση:

Το Clerk δεν επιτρέπει programmatic customization του email template μέσω API. Η προσαρμογή πρέπει να γίνει μέσω του Dashboard.
