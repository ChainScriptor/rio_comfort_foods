import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { inviteApi } from "../lib/api";
import { MailIcon, UserIcon, SendIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

function InviteCustomerForm() {
  const [email, setEmail] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const inviteMutation = useMutation({
    mutationFn: inviteApi.inviteCustomer,
    onSuccess: (data) => {
      setSuccessMessage(`Η πρόσκληση στάλθηκε επιτυχώς στο ${data.invitation.emailAddress}`);
      setErrorMessage("");
      setEmail("");
      setCustomerId("");
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.error || "Αποτυχία αποστολής πρόσκλησης. Παρακαλώ δοκιμάστε ξανά."
      );
      setSuccessMessage("");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset messages
    setSuccessMessage("");
    setErrorMessage("");

    // Basic validation
    if (!email || !customerId) {
      setErrorMessage("Παρακαλώ συμπληρώστε όλα τα πεδία");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Παρακαλώ εισάγετε έγκυρο email");
      return;
    }

    inviteMutation.mutate({ email, customerId });
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-xl mb-4">Αποστολή Πρόσκλησης Πελάτη (B2B)</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <MailIcon className="w-4 h-4" />
                Email
              </span>
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteMutation.isPending}
              required
            />
          </div>

          {/* Customer ID Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                ΑΦΜ
              </span>
            </label>
            <input
              type="text"
              placeholder="Εισάγετε το ΑΦΜ του πελάτη"
              className="input input-bordered w-full"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={inviteMutation.isPending}
              required
            />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success">
              <CheckCircleIcon className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="alert alert-error">
              <XCircleIcon className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Αποστολή...
                </>
              ) : (
                <>
                  <SendIcon className="w-4 h-4" />
                  Αποστολή Πρόσκλησης
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteCustomerForm;
