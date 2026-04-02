import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, RotateCcw } from 'lucide-react';
import AuthService from '../../services/auth.service';
import Button from '../../components/common/Button';

const VerifySignupOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email) {
      setError('Missing email context. Please sign up again.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      await AuthService.verifySignupOtp(email, otp);
      navigate('/pending-approval');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Missing email context. Please sign up again.');
      return;
    }

    setResending(true);
    try {
      const result = await AuthService.resendSignupOtp(email);
      const sent = result?.data?.sent ?? result?.sent;
      const message = result?.message;

      if (sent === false) {
        setError(message || 'Could not resend OTP. Please sign up again.');
      } else {
        setInfo(message || 'If eligible, a new OTP has been sent to your email.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-3">
            <MailCheck className="w-7 h-7 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Email OTP</h1>
          <p className="text-sm text-gray-600 mt-2">Enter the 6-digit OTP sent to {email || 'your email'}.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {info && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{info}</div>}

        <form onSubmit={onVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent tracking-widest text-center text-lg"
              placeholder="123456"
              maxLength={6}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          {resending ? 'Resending...' : 'Resend OTP'}
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Back to{' '}
          <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifySignupOtp;
