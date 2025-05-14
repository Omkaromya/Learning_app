/**
 * Session timeout utility to handle automatic logout after inactivity
 * @param {number} timeoutMinutes - Timeout in minutes (default: 30)
 * @param {Function} onTimeout - Callback function to execute when timeout occurs
 * @returns {Object} - Object with methods to reset and clear the timeout
 */
const createSessionTimeout = (timeoutMinutes = 30, onTimeout) => {
  let timeoutId = null;
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds

  // Function to reset the timeout
  const resetTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);
  };

  // Function to clear the timeout
  const clearTimeout = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Set up event listeners for user activity
  const setupActivityListeners = () => {
    const events = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });
    
    // Initial setup
    resetTimeout();
  };

  // Remove event listeners
  const removeActivityListeners = () => {
    const events = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];
    
    events.forEach(event => {
      document.removeEventListener(event, resetTimeout);
    });
    
    clearTimeout();
  };

  return {
    resetTimeout,
    clearTimeout,
    setupActivityListeners,
    removeActivityListeners
  };
};

export default createSessionTimeout; 