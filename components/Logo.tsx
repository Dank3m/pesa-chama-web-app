import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
}

const Logo: React.FC<LogoProps> = ({ className = 'w-8 h-8', textClassName = 'text-2xl' }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`${className} bg-primary rounded-lg flex items-center justify-center text-white font-bold`}>
        P
      </div>
      <span className={`${textClassName} font-bold text-dark dark:text-white`}>PesaChama.</span>
    </div>
  );
};

export default Logo;
