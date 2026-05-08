import React from 'react';

interface VinsolLogoProps {
  className?: string;
  size?: number;
}

const VinsolLogo: React.FC<VinsolLogoProps> = ({ className = '', size = 120 }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={size} height={size * 0.3} viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* V */}
        <path d="M10 10 L25 50 L40 10" stroke="#141414" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        
        {/* I */}
        <line x1="55" y1="10" x2="55" y2="50" stroke="#141414" strokeWidth="4" strokeLinecap="round"/>
        
        {/* N */}
        <path d="M70 50 L70 10 L95 50 L95 10" stroke="#141414" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        
        {/* S */}
        <path d="M110 15 Q105 10 115 10 Q125 10 125 20 Q125 30 115 30 Q105 30 105 40 Q105 50 115 50 Q125 50 120 45" stroke="#141414" strokeWidth="4" strokeLinecap="round" fill="none"/>
        
        {/* O */}
        <circle cx="145" cy="30" r="15" stroke="#141414" strokeWidth="4" fill="none"/>
        
        {/* L */}
        <path d="M170 10 L170 50 L190 50" stroke="#141414" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  );
};

export default VinsolLogo;
