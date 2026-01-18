import { Router } from "express";

const router = Router();

// Route to handle invitation acceptance redirect
// This route receives the invitation ticket from Clerk and redirects to mobile app
router.get("/accept", (req, res) => {
  const { __clerk_ticket } = req.query;

  if (!__clerk_ticket) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Σφάλμα</h1>
          <p>Η πρόσκληση δεν είναι έγκυρη. Παρακαλώ ελέγξτε το link.</p>
        </div>
      </body>
      </html>
    `);
  }

  // HTML page that attempts to open mobile app, then falls back to instructions
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Opening App...</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #121212;
          color: white;
        }
        .container {
          text-align: center;
          padding: 20px;
          max-width: 400px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #FFD700;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .instructions {
          margin-top: 30px;
          padding: 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: none;
        }
        .instructions.show {
          display: block;
        }
        button {
          background-color: #FFD700;
          color: #121212;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover {
          background-color: #ffed4e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Ανοίγει η εφαρμογή...</h1>
        <div class="spinner"></div>
        <p>Παρακαλώ περιμένετε...</p>
        
        <div class="instructions" id="instructions">
          <h2>Δεν άνοιξε η εφαρμογή;</h2>
          <p>Παρακαλώ:</p>
          <ol style="text-align: left; display: inline-block;">
            <li>Βεβαιωθείτε ότι έχετε εγκαταστήσει την εφαρμογή</li>
            <li>Πατήστε το κουμπί παρακάτω για να ανοίξει η εφαρμογή</li>
            <li>Ή ανοίξτε την εφαρμογή χειροκίνητα</li>
          </ol>
          <button onclick="openApp()">Άνοιγμα Εφαρμογής</button>
        </div>
      </div>

      <script>
        // Try to open mobile app with deep link
        function openApp() {
          const ticket = "${__clerk_ticket}";
          const deepLink = "mobile://sign-up?__clerk_ticket=" + encodeURIComponent(ticket);
          
          // Try to open the app
          window.location.href = deepLink;
          
          // Show instructions after a delay if app doesn't open
          setTimeout(() => {
            document.getElementById('instructions').classList.add('show');
          }, 2000);
        }

        // Auto-try to open app when page loads
        window.onload = function() {
          openApp();
          
          // Show instructions after 3 seconds if still on page
          setTimeout(() => {
            document.getElementById('instructions').classList.add('show');
          }, 3000);
        };
      </script>
    </body>
    </html>
  `);
});

export default router;
