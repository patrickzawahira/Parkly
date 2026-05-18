import React from 'react';
import parklyLogo from '../assets/parkly-logo-new.jpg';

interface ParklyLogoProps {
  size?: number;
  orientation?: 'horizontal' | 'vertical';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
  imageClassName?: string;
}

/**
 * Reusable Parkly logo component so we can keep branding consistent everywhere.
 */
export const ParklyLogo: React.FC<ParklyLogoProps> = ({
  size = 64,
  orientation = 'horizontal',
  showText = true,
  subtitle,
  className = '',
  textClassName = '',
  imageClassName = '',
}) => {
  const containerClasses =
    orientation === 'vertical'
      ? 'flex flex-col items-center justify-center gap-3'
      : 'flex items-center gap-3';

  const imageStyles: React.CSSProperties = {
    height: size,
    width: 'auto',
    objectFit: 'contain'
  };

  return (
    <div className={`${containerClasses} ${className}`.trim()}>
      <img
        src={parklyLogo}
        alt="Parkly logo"
        style={imageStyles}
        className={`rounded-3xl drop-shadow-lg ${imageClassName}`.trim()}
      />

      {showText && (
        <div
          className={`leading-tight ${orientation === 'vertical' ? 'text-center' : ''} ${textClassName}`.trim()}
        >
          <div className="text-2xl font-black tracking-tight">Parkly</div>
          {subtitle && <div className="text-sm font-medium opacity-80">{subtitle}</div>}
        </div>
      )}
    </div>
  );
};


