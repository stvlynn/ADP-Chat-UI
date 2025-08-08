import React, { useEffect } from 'react';
import { pinwheel } from 'ldrs';

interface LoadingSpinnerProps {
  size?: string;
  stroke?: string;
  speed?: string;
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "35",
  stroke = "3.5",
  speed = "0.9",
  color = "#80CBC4", // Using our teal color from the palette
  className = ""
}) => {
  useEffect(() => {
    // Register the pinwheel component
    pinwheel.register();
  }, []);

  return (
    <div className={`loading-spinner-container ${className}`}>
      {React.createElement('l-pinwheel', {
        size,
        stroke,
        speed,
        color
      })}
    </div>
  );
};

export default LoadingSpinner;
