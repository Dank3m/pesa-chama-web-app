import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  theme?: 'light' | 'dark';
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, theme = 'light', subtext }) => {
  const isDarkVariant = theme === 'dark';
  
  return (
    <div className={`p-4 md:p-6 rounded-3xl flex items-center gap-4 transition-transform hover:scale-[1.02] shadow-sm ${
      isDarkVariant 
        ? 'bg-gradient-to-r from-[#2b2b2b] to-[#3a3a3a] text-white' 
        : 'bg-white dark:bg-gray-800 text-dark dark:text-white'
    }`}>
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 ${
        isDarkVariant 
          ? 'bg-gray-700 bg-opacity-50' 
          : 'bg-blue-50 dark:bg-gray-700 text-primary'
      }`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm mb-1 truncate ${isDarkVariant ? 'text-gray-300' : 'text-subtext dark:text-gray-400'}`} title={title}>{title}</p>
        <h3 className="text-xl md:text-2xl font-bold truncate" title={value}>{value}</h3>
        {subtext && <p className={`text-xs mt-1 truncate ${isDarkVariant ? 'text-gray-400' : 'text-subtext dark:text-gray-500'}`} title={subtext}>{subtext}</p>}
      </div>
    </div>
  );
};

export default StatCard;