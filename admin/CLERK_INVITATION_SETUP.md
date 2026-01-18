# Οδηγίες για Ρύθμιση Invitation Flow στο Clerk

## Βήμα 1: Whitelist του Redirect URL στο Clerk Dashboard

Για να λειτουργήσει σωστά το invitation flow με το mobile app, πρέπει να whitelist το redirect URL:

1. Πηγαίνετε στο [Clerk Dashboard](https://dashboard.clerk.com)
2. Επιλέξτε το project σας
3. Μεταβείτε στο **Settings** → **Paths**
4. Στο **Allowed redirect URLs**, προσθέστε:
   - `mobile://sign-up`
   - `mobile://*` (για να επιτρέψετε όλα τα deep links)

**Σημαντικό:** Χωρίς αυτό το whitelist, το Clerk θα απορρίψει το redirect URL και θα εμφανίσει σφάλμα.

## Βήμα 2: Πώς Λειτουργεί το Invitation Flow

1. **Admin στέλνει πρόσκληση:**
   - Ο admin χρησιμοποιεί το `InviteCustomerForm` στο admin panel
   - Εισάγει email και ΑΦΜ
   - Το backend δημιουργεί invitation στο Clerk με `redirectUrl: "mobile://sign-up"`

2. **Χρήστης λαμβάνει email:**
   - Πατάει το link "Αποδοχή Πρόσκλησης" στο email
   - Ανοίγει το Clerk's hosted sign-up page (web)

3. **Χρήστης ολοκληρώνει εγγραφή:**
   - Κάνει sign-up με Google ή Apple
   - Το Clerk δημιουργεί τον λογαριασμό με `publicMetadata.customerId`

4. **Redirect στο mobile app:**
   - Μετά την επιτυχημένη εγγραφή, το Clerk κάνει redirect στο `mobile://sign-up`
   - Το mobile app ανοίγει στο `sign-up` route
   - Αν ο χρήστης είναι ήδη signed in, redirect στο main app `/(tabs)`
   - Αν όχι, redirect στο regular auth screen `/(auth)`

5. **Συγχρονισμός με Database:**
   - Το Inngest webhook (`clerk/user.created`) ανιχνεύει τον νέο χρήστη
   - Αν έχει `publicMetadata.customerId`, δημιουργεί User document στο MongoDB
   - Αν δεν έχει, παραλείπει τη δημιουργία (invitation-only access)

## Βήμα 3: Testing

Για να δοκιμάσετε το invitation flow:

1. **Στείλτε πρόσκληση:**
   - Χρησιμοποιήστε το admin panel για να στείλετε invitation
   - Ελέγξτε ότι το email έχει λάβει την πρόσκληση

2. **Accept invitation:**
   - Πατήστε το link στο email
   - Ολοκληρώστε την εγγραφή στο Clerk's hosted page
   - Ελέγξτε ότι το mobile app ανοίγει αυτόματα

3. **Verify user creation:**
   - Ελέγξτε στο MongoDB ότι δημιουργήθηκε User document
   - Ελέγξτε ότι το `publicMetadata.customerId` είναι σωστό

## Troubleshooting

### Πρόβλημα: "Redirect URL mismatch" error

**Λύση:** Βεβαιωθείτε ότι το `mobile://sign-up` είναι whitelisted στο Clerk Dashboard → Settings → Paths → Allowed redirect URLs

### Πρόβλημα: Mobile app δεν ανοίγει μετά την εγγραφή

**Λύση:** 
- Ελέγξτε ότι το `scheme: "mobile"` είναι σωστά ορισμένο στο `app.json`
- Ελέγξτε ότι το mobile app είναι εγκατεστημένο στη συσκευή
- Για iOS: Ελέγξτε ότι το Associated Domains είναι ρυθμισμένο (για universal links)
- Για Android: Ελέγξτε ότι τα intent filters είναι σωστά (για app links)

### Πρόβλημα: User δεν δημιουργείται στο database

**Λύση:**
- Ελέγξτε ότι το Inngest webhook είναι ενεργό
- Ελέγξτε τα logs του Inngest για errors
- Ελέγξτε ότι το `publicMetadata.customerId` υπάρχει στο Clerk user

### Πρόβλημα: User δεν μπορεί να συνδεθεί μετά την εγγραφή

**Λύση:**
- Ελέγξτε ότι το `protectRoute` middleware επιτρέπει πρόσβαση
- Ελέγξτε ότι το `publicMetadata.customerId` είναι σωστό
- Ελέγξτε ότι ο User document δημιουργήθηκε στο MongoDB

## Σημειώσεις

- Το invitation flow χρησιμοποιεί το Clerk's hosted sign-up page, όχι custom sign-up page
- Το `redirectUrl` πρέπει να είναι whitelisted στο Clerk Dashboard
- Το `publicMetadata.customerId` μεταφέρεται αυτόματα από το invitation στον user
- Το Inngest webhook χειρίζεται τον συγχρονισμό με το database
