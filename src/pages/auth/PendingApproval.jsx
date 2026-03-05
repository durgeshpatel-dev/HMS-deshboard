import { Link } from 'react-router-dom';
import { Clock, Utensils } from 'lucide-react';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Saffron & Sage</h1>
        </div>

        {/* Pending Message */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Account Pending Approval
          </h2>

          <p className="text-gray-600 mb-6">
            Thank you for signing up! Your account is currently pending approval from our team.
            You'll receive a notification once your account has been approved.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
              <br />
              Our team will review your application within 24-48 hours. You'll be able to login
              once approved.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          © 2026 Saffron & Sage. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
