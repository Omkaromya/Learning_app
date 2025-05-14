import React, { useEffect } from 'react';
import '../styles/Alert.css';

const Alert = ({ message, type, onClose }) => {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-message">{message}</span>
      <button className="alert-close" onClick={onClose}>×</button>
    </div>
  );
};

// Export both Alert and CustomAlert for backward compatibility
export { Alert as CustomAlert };
export default Alert; 