import { useEffect, useState } from 'react';

// durationSeconds: 120 for guest reporting (2 min), 600 for signup (10 min).
// onVerify(otp) should return a promise; reject with an Error(message) to show it.
// onResend() optional — if provided, a "Resend OTP" link appears once the timer hits 0.
const OtpModal = ({
  email,
  durationSeconds = 120,
  title = 'Verify your email',
  onVerify,
  onResend,
  onClose
}) => {
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const expired = secondsLeft <= 0;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (expired) {
      setError('OTP expired — request a new one');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onVerify(otp);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!onResend) return;
    setError('');
    try {
      await onResend();
      setSecondsLeft(durationSeconds);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4">
      <div className="bg-panel border-t-4 border-hazard rounded-sm w-full max-w-sm p-6 shadow-2xl">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 mb-1">{title}</h2>
        <p className="text-sm text-ink mb-4">
          Enter the code sent to <span className="font-mono font-semibold">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
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
            {onResend && expired && (
              <button
                type="button"
                onClick={handleResend}
                className="!bg-transparent !p-0 !text-brand underline uppercase tracking-tag"
              >
                Resend OTP
              </button>
            )}
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
              disabled={loading || otp.length !== 6 || expired}
              className="flex-1 bg-brand hover:bg-brand-dark text-white"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpModal;
