import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useGroupNavigation = (cityId, cityName, logout) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(`/group/${cityId}`, { state: { cityName } });
  }, [cityId, cityName, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login'); 
  }, [logout, navigate]);

  const navigateToGroupLogs = useCallback((groupId) => {
    navigate(`/logs/group/${groupId}`);
  }, [navigate]);

  return { handleBack, handleLogout, navigateToGroupLogs };
};

export default useGroupNavigation;