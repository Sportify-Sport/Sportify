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

  return { handleBack, handleLogout };
};

export default useEventNavigation;