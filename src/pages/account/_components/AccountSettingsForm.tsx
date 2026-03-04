import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";

type InitialUser = {
  name: string | null;
  email: string;
};

type Props = {
  initialUser: InitialUser;
};

export function AccountSettingsForm({ initialUser }: Props) {
  const { data: sessionData } = authClient.useSession();

  const name = sessionData?.user?.name ?? initialUser.name;
  const email = sessionData?.user?.email ?? initialUser.email;

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <ChangeNameSection currentName={name ?? ""} />
      <ChangeEmailSection currentEmail={email} />
      <ChangePasswordSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change name
// ---------------------------------------------------------------------------

function ChangeNameSection({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const { error: authError } = await authClient.updateUser({ name });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Failed to update name. Please try again.");
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <h2 className="card-title text-lg">Display name</h2>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="alert" className="alert alert-success text-sm">
            <span>Display name updated.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <label className="input w-full">
              <User size={16} className="opacity-50" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSuccess(false);
                }}
                required
                disabled={loading}
              />
            </label>
          </fieldset>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || name === currentName}
          >
            {loading && (
              <span className="loading loading-spinner loading-sm" />
            )}
            Save name
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change email
// ---------------------------------------------------------------------------

function ChangeEmailSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    const { error: authError } = await authClient.changeEmail({
      newEmail,
      callbackURL: "/account",
    });

    setLoading(false);

    if (authError) {
      setError(
        authError.message ?? "Failed to send verification. Please try again.",
      );
      return;
    }

    setSent(true);
    setNewEmail("");
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title text-lg">Email address</h2>
          <p className="text-base-content/60 mt-0.5 text-sm">
            Current:{" "}
            <span className="text-base-content/80 font-medium">
              {currentEmail}
            </span>
          </p>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        {sent && (
          <div role="alert" className="alert alert-success text-sm">
            <span>
              Verification link sent! Check your new inbox and click the link to
              confirm the change.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">New email</legend>
            <label className="input w-full">
              <Mail size={16} className="opacity-50" />
              <input
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setSent(false);
                }}
                required
                disabled={loading}
              />
            </label>
          </fieldset>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading && (
              <span className="loading loading-spinner loading-sm" />
            )}
            Send verification email
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: authError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });

    setLoading(false);

    if (authError) {
      setError(
        authError.message ?? "Failed to change password. Please try again.",
      );
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <h2 className="card-title text-lg">Password</h2>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="alert" className="alert alert-success text-sm">
            <span>Password changed successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Current password</legend>
            <label className="input w-full">
              <Lock size={16} className="opacity-50" />
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="opacity-50 hover:opacity-100"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">New password</legend>
            <label className="input w-full">
              <Lock size={16} className="opacity-50" />
              <input
                type={showNew ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <button
                type="button"
                tabIndex={-1}
                className="opacity-50 hover:opacity-100"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Confirm new password</legend>
            <label className="input w-full">
              <Lock size={16} className="opacity-50" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          </fieldset>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading && (
              <span className="loading loading-spinner loading-sm" />
            )}
            Change password
          </button>
        </form>
      </div>
    </div>
  );
}
