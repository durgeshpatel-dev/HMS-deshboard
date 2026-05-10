import { useState } from 'react';
import { Smartphone, Copy, Check } from 'lucide-react';

const AppDownloadCard = ({ link, toast }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!link) {
      toast.error('No download link configured by Super Admin');
      return;
    }
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('App download link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <Smartphone size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Waitstaff App Download</h2>
            <p className="text-sm text-gray-500">
              Share this link with your staff so they can download the order-taking mobile app.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 outline-none"
            value={link || 'Not configured by admin'}
            readOnly
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
              copied
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadCard;
