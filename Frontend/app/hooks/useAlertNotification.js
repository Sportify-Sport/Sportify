// hooks/useAlertNotification.js
import { useState, useCallback } from 'react';

export default function useAlertNotification() {
  const [alert, setAlert] = useState({
    visible: false,
    message: '',
    type: 'error',
  });
  
  const showAlert = useCallback((message, type = 'error') => {
    setAlert({
      visible: true,
      message,
      type,
    });
  }, []);
  
  const hideAlert = useCallback(() => {
    setAlert(current => ({
      ...current,
      visible: false,
    }));
  }, []);
  
  return {
    alert,
    showAlert,
    hideAlert,
  };
}
