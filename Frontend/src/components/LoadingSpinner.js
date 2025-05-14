import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = '#1976d2' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner-wrapper">
        <div 
          className={`spinner spinner-${size}`}
          style={{ 
            borderTopColor: color,
            borderRightColor: color,
            borderBottomColor: color,
            borderLeftColor: 'transparent'
          }}
        />
        <div 
          className={`spinner-inner spinner-inner-${size}`}
          style={{ 
            borderTopColor: color,
            borderRightColor: color,
            borderBottomColor: color,
            borderLeftColor: 'transparent'
          }}
        />
      </div>
      <div className="loading-text">
        <span>L</span>
        <span>o</span>
        <span>a</span>
        <span>d</span>
        <span>i</span>
        <span>n</span>
        <span>g</span>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </div>
    </div>
  );
};

export default LoadingSpinner; 