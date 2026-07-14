import { useEffect, useState } from 'react';

// Unified 2-step OTP modal, used by both Signup and public Report Issue.
//
// Props:
//   initialEmail   - if provided, step 2 (OTP) opens directly (email already known)
//   autoSend       - if true AND initialEmail is set, calls onSendOtp(email) as soon
//                    as the modal mounts. Set this to FALSE when the OTP was already
//                    dispatched by the action that opened the modal (e.g. signup's
//                    /auth/register call already emails the OTP) — otherwise it fires twice.
//   onSendOtp(email) -> Promise   called to (re)send the OTP; must reject with Error(message) on failure
//   onVerify(otp, email) -> Promise   called when the person submits the code
//   onClose()
//   durationSeconds - countdown length (120 for guest reporting, 600 for signup)
//   title
const OtpModal = ({
  initialEmail = '',
  autoSend = true,
  durationSeconds = 120,
  title = 'Verify your email',
  onSendOtp,
  onVerify,
  onClose
}) => {
  const [step, setStep] = useState(initialEmail ? 'otp' : 'email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Only auto-fire the send when we start directly on the OTP step AND the
  // caller says the OTP hasn't been sent yet.
  useEffect(() => {
    if (initialEmail && autoSend) {
      handleSend(initialEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const expired = secondsLeft <= 0;

  const handleSend = async (targetEmail) => {
    setError('');
    setSending(true);
    try {
      await onSendOtp(targetEmail);
      setStep('otp');
      setSecondsLeft(durationSeconds);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    handleSend(email.trim());
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (expired) {
      setError('Code expired — request a new one');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      await onVerify(otp, email);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4">
      <div className="bg-panel border-t-4 border-hazard rounded-sm w-full max-w-sm p-6 shadow-2xl">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 mb-1">{title}</h2>

        {step === 'email' ? (
          <>
            <p className="text-sm text-ink mb-4">
              Enter your email — we'll send you a verification code before submitting.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                className="w-full border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {error && <p className="error-text">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 !bg-transparent !text-ink border border-line hover:!bg-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-brand hover:bg-brand-dark text-white"
                >
                  {sending ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-ink mb-4">
              Enter the code sent to <span className="font-mono font-semibold">{email}</span>
            </p>
            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                autoFocus
                className="w-full border border-line rounded-sm px-3 py-2 text-center tracking-[0.4em] font-mono text-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />

              {error && <p className="error-text">{error}</p>}

              <div className="flex items-center justify-between text-xs font-mono text-muted">
                <span className={expired ? 'text-critical font-semibold' : ''}>
                  {expired ? 'Code expired' : `Expires in ${minutes}:${seconds}`}
                </span>
                <button
                  type="button"
                  disabled={!expired || sending}
                  onClick={() => handleSend(email)}
                  className={`!bg-transparent !p-0 underline uppercase tracking-tag ${
                    expired ? '!text-brand cursor-pointer' : '!text-muted cursor-not-allowed'
                  }`}
                >
                  {sending ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 !bg-transparent !text-ink border border-line hover:!bg-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || otp.length !== 6 || expired}
                  className="flex-1 bg-brand hover:bg-brand-dark text-white"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default OtpModal;
