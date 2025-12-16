import { useSignIn } from "@clerk/clerk-react";
import { SignInPage } from "../components/ui/sign-in.jsx";
import { useNavigate } from "react-router";


function LoginPage() {
  const { signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const handleSignIn = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!signIn) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      alert(error?.errors?.[0]?.message || "Η σύνδεση απέτυχε. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      alert("Αποτυχία σύνδεσης με Google. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  const handleAppleSignIn = async () => {
    if (!signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_apple",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (error) {
      console.error("Apple sign in error:", error);
      alert("Αποτυχία σύνδεσης με Apple. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  const handleResetPassword = () => {
    // Clerk handles password reset through their UI
    // You can redirect to Clerk's password reset page or show a modal
    alert("Επαναφορά κωδικού πρόσβασης - ανακατεύθυνση στη σελίδα επαναφοράς του Clerk");
  };

  const handleCreateAccount = () => {
    // Redirect to sign up page or show sign up modal
    alert("Δημιουργία λογαριασμού - ανακατεύθυνση στη σελίδα εγγραφής");
  };

  return (
    <div className="bg-base-100 text-base-content">
      <SignInPage
        title={<span className="font-light text-base-content tracking-tighter">Καλώς ήρθατε στο Comfort Foods</span>}
        description="Συνδεθείτε στον λογαριασμό διαχείρισης και διαχειριστείτε την πλατφόρμα e‑commerce"
        heroImageSrc="/download.svg"
        testimonials={[]}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}

export default LoginPage;
