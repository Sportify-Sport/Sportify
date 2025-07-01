import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useEventNavigation = (cityId, cityName, logout) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(`/event/${cityId}`, { state: { cityName } });
  }, [cityId, cityName, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const navigateToEventLogs = useCallback((eventId) => {
    navigate(`/logs/event/${eventId}`);
  }, [navigate]);
  return { handleBack, handleLogout, navigateToEventLogs };
};

export default useEventNavigation;