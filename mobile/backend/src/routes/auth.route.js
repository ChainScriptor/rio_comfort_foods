import { Router } from "express";
import { ENV } from "../config/env.js";

const router = Router();

// Sign-up page that accepts invitation tokens
router.get("/sign-up", (req, res) => {
  const { __clerk_ticket } = req.query;
  const clerkPublishableKey = ENV.CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;


  // Validate that publishable key exists
  if (!clerkPublishableKey) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="el">
      <head>
        <meta charset="UTF-8">
        <title>Configuration Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            text-align: center;
            background: #121212;
            color: white;
          }
          h1 { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1>Σφάλμα Ρύθμισης</h1>
        <p>Το CLERK_PUBLISHABLE_KEY δεν έχει οριστεί στο backend.</p>
        <p>Παρακαλώ ελέγξτε το .env file στο backend folder.</p>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="el">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Εγγραφή - Rio Comfort Foods</title>
      <script 
        async
        crossorigin="anonymous"
        data-clerk-publishable-key="${clerkPublishableKey}"
        src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
        type="text/javascript">
      </script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          padding: 20px;
        }
        .container {
          width: 100%;
          max-width: 450px;
          text-align: center;
        }
        .logo {
          margin-bottom: 40px;
        }
        .logo img {
          max-width: 200px;
          height: auto;
        }
        .signup-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 40px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 30px;
          font-size: 16px;
        }
        #clerk-sign-up {
          width: 100%;
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid #22c55e;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="/comfort1.svg" alt="Rio Comfort Foods" style="max-width: 200px; height: auto; margin-bottom: 10px;" />
          <p style="color: rgba(255, 255, 255, 0.6);">B2B Platform</p>
        </div>
        <div class="signup-container">
          <h1>Δημιουργία Λογαριασμού</h1>
          <p class="subtitle">Συμπληρώστε τα στοιχεία σας για να ξεκινήσετε</p>
          <div id="clerk-sign-up">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>

      <script>
        const ticket = ${JSON.stringify(__clerk_ticket || '')};
        
        // Wait for Clerk to load (it auto-initializes with data-clerk-publishable-key)
        window.addEventListener('load', async function() {
          try {
            // Clerk should already be initialized via data-clerk-publishable-key attribute
            if (typeof Clerk === 'undefined') {
              throw new Error('Clerk SDK failed to load');
            }
            
            await Clerk.load();
            
            // If user is already signed in, redirect to welcome
            if (Clerk.user) {
              window.location.href = '/welcome';
              return;
            }

            // Configure sign-up with invitation ticket if present
            const signUpConfig = {
              afterSignUpUrl: '/welcome',
              redirectUrl: '/welcome',
            };

            if (ticket) {
              signUpConfig.initialValues = {
                ticket: ticket
              };
            }

            // Mount Clerk SignUp component
            Clerk.mountSignUp(
              document.getElementById('clerk-sign-up'),
              signUpConfig
            );
          } catch (error) {
            document.getElementById('clerk-sign-up').innerHTML = 
              '<p style="color: #ef4444;">Σφάλμα φόρτωσης Clerk. Παρακαλώ ανανεώστε τη σελίδα.</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Welcome page with OS detection and store links
router.get("/welcome", (req, res) => {
  const clerkPublishableKey = ENV.CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  
  if (!clerkPublishableKey) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="el">
      <head>
        <meta charset="UTF-8">
        <title>Configuration Error</title>
      </head>
      <body style="font-family: Arial; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444;">Σφάλμα Ρύθμισης</h1>
        <p>Το CLERK_PUBLISHABLE_KEY δεν έχει οριστεί στο backend.</p>
        <p>Παρακαλώ ελέγξτε το .env file.</p>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="el">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Καλώς ήρθατε - Rio Comfort Foods</title>
      <script 
        async
        crossorigin="anonymous"
        data-clerk-publishable-key="${clerkPublishableKey}"
        src="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
        type="text/javascript">
      </script>
      <script src="https://cdn.jsdelivr.net/npm/qrcode.react@3.1.0/dist/index.umd.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          padding: 20px;
        }
        .container {
          width: 100%;
          max-width: 600px;
          text-align: center;
        }
        .logo {
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #22c55e;
          font-size: 36px;
          margin-bottom: 10px;
        }
        .welcome-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 50px 40px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 20px;
        }
        .welcome-title {
          font-size: 32px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .user-name {
          color: #22c55e;
          font-weight: 600;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 18px;
          margin-bottom: 40px;
          line-height: 1.6;
        }
        .store-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }
        .store-button {
          display: inline-block;
          transition: transform 0.2s, opacity 0.2s;
          cursor: pointer;
        }
        .store-button:hover {
          transform: scale(1.05);
          opacity: 0.9;
        }
        .store-button img {
          height: 60px;
          width: auto;
        }
        .qr-section {
          margin-top: 40px;
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .qr-title {
          font-size: 18px;
          margin-bottom: 20px;
          color: rgba(255, 255, 255, 0.8);
        }
        .qr-container {
          display: inline-block;
          padding: 20px;
          background: white;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .sign-out-btn {
          margin-top: 30px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .sign-out-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }
        .loading {
          padding: 40px;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid #22c55e;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .welcome-card {
            padding: 30px 20px;
          }
          .welcome-title {
            font-size: 24px;
          }
          .store-buttons {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="/comfort1.svg" alt="Rio Comfort Foods" style="max-width: 200px; height: auto;" />
        </div>
        <div class="welcome-card">
          <div id="welcome-content">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>

      <script>
        // OS Detection
        function detectOS() {
          const userAgent = navigator.userAgent || navigator.vendor || window.opera;
          
          if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'ios';
          }
          if (/android/i.test(userAgent)) {
            return 'android';
          }
          return 'desktop';
        }

        // Store URLs (placeholders - replace with actual app store links)
        const storeUrls = {
          ios: 'https://apps.apple.com/app/id123456789',
          android: 'https://play.google.com/store/apps/details?id=com.comfortfoods.app',
        };

        // App Store Badge SVG (simplified - use official badges in production)
        const appStoreBadge = \`<svg width="180" height="60" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="180" height="60" rx="8" fill="black"/>
          <text x="90" y="35" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Download on the</text>
          <text x="90" y="50" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="middle">App Store</text>
        </svg>\`;

        const playStoreBadge = \`<svg width="180" height="60" viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="180" height="60" rx="8" fill="black"/>
          <text x="90" y="30" font-family="Arial" font-size="10" fill="white" text-anchor="middle">GET IT ON</text>
          <text x="90" y="48" font-family="Arial" font-size="14" font-weight="bold" fill="white" text-anchor="middle">Google Play</text>
        </svg>\`;

        function renderWelcomePage(user, os) {
          const userName = user?.firstName || user?.fullName || 'Χρήστη';
          let storeButtonsHTML = '';
          let qrSectionHTML = '';

          if (os === 'ios') {
            storeButtonsHTML = \`
              <a href="\${storeUrls.ios}" target="_blank" class="store-button">
                <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=2010-09-13" alt="Download on the App Store" />
              </a>
            \`;
          } else if (os === 'android') {
            storeButtonsHTML = \`
              <a href="\${storeUrls.android}" target="_blank" class="store-button">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 80px;" />
              </a>
            \`;
          } else {
            // Desktop: show both buttons and QR code
            storeButtonsHTML = \`
              <a href="\${storeUrls.ios}" target="_blank" class="store-button">
                <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=2010-09-13" alt="Download on the App Store" />
              </a>
              <a href="\${storeUrls.android}" target="_blank" class="store-button">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height: 80px;" />
              </a>
            \`;
            
            // Generate QR code for mobile app download
            const qrUrl = storeUrls.android; // Use Android link for QR (or create a universal link)
            qrSectionHTML = \`
              <div class="qr-section">
                <div class="qr-title">Σκανάρετε τον κώδικα QR για να κατεβάσετε την εφαρμογή</div>
                <div class="qr-container">
                  <div id="qr-code"></div>
                </div>
              </div>
            \`;
          }

          return \`
            <h1 class="welcome-title">
              Ο λογαριασμός σας ενεργοποιήθηκε, <span class="user-name">\${userName}</span>!
            </h1>
            <p class="subtitle">
              Κατεβάστε την εφαρμογή για να ξεκινήσετε τις παραγγελίες σας.
            </p>
            <div class="store-buttons">
              \${storeButtonsHTML}
            </div>
            \${qrSectionHTML}
            <button class="sign-out-btn" onclick="signOut()">Αποσύνδεση</button>
          \`;
        }

        async function signOut() {
          if (typeof Clerk !== 'undefined') {
            await Clerk.signOut();
            window.location.href = '/sign-up';
          }
        }

        // Wait for Clerk to load (it auto-initializes with data-clerk-publishable-key attribute)
        window.addEventListener('load', async function() {
          try {
            // Clerk should already be initialized via data-clerk-publishable-key attribute
            if (typeof Clerk === 'undefined') {
              throw new Error('Clerk SDK failed to load');
            }
            
            await Clerk.load();
            // Check if user is signed in
            if (!Clerk.user) {
              window.location.href = '/sign-up';
              return;
            }

            const user = Clerk.user;
            const os = detectOS();
            
            // Render welcome page
            document.getElementById('welcome-content').innerHTML = renderWelcomePage(user, os);

            // Generate QR code if on desktop
            if (os === 'desktop' && typeof QRCode !== 'undefined') {
              const qrContainer = document.getElementById('qr-code');
              if (qrContainer) {
                // Use a simple QR code library or API
                const qrUrl = storeUrls.android;
                qrContainer.innerHTML = \`
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(qrUrl)}" alt="QR Code" />
                \`;
              }
            }
          } catch (error) {
            document.getElementById('welcome-content').innerHTML = 
              '<p style="color: #ef4444;">Σφάλμα φόρτωσης Clerk. Παρακαλώ ανανεώστε τη σελίδα.</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

export default router;
