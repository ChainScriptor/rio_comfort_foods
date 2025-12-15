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
      alert(error?.errors?.[0]?.message || "Failed to sign in. Please try again.");
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
      alert("Failed to sign in with Google. Please try again.");
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
      alert("Failed to sign in with Apple. Please try again.");
    }
  };

  const handleResetPassword = () => {
    // Clerk handles password reset through their UI
    // You can redirect to Clerk's password reset page or show a modal
    alert("Password reset functionality - redirect to Clerk password reset");
  };

  const handleCreateAccount = () => {
    // Redirect to sign up page or show sign up modal
    alert("Create account functionality - redirect to sign up page");
  };

  return (
    <div className="bg-base-100 text-base-content">
      <SignInPage
        title={<span className="font-light text-base-content tracking-tighter">Welcome to Comfort Foods</span>}
        description="Access your admin account and manage your e-commerce platform"
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
