import React from 'react';
import { ShieldX, Home } from 'lucide-react';

interface UnauthorizedProps {
  onNavigate: () => void;
}

const Unauthorized: React.FC<UnauthorizedProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <ShieldX size={40} className="text-red-500" />
      </div>

      <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">
        Access Denied
      </h2>

      <p className="text-subtext dark:text-gray-400 text-center max-w-md mb-8">
        You don't have permission to view this page. This area is restricted to administrators and treasurers only.
      </p>

      <button
        onClick={onNavigate}
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
      >
        <Home size={20} />
        Go to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
