import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import getApiBaseUrl from '../config/apiConfig';

// Import components
import Header from '../components/home/Header';
import EventCarousel from '../components/home/EventCarousel';
import SportsList from '../components/home/SportsList';
import MyEventsList from '../components/home/MyEventsList';
import MyGroupsList from '../components/home/MyGroupsList';
import LoadingIndicator from '../components/common/LoadingIndicator';

// Import hooks
import useAuth from '../hooks/useAuth';
import useSports from '../hooks/useSports';
import useHomeData from '../hooks/useHomeData';

const apiUrl = getApiBaseUrl();

export default function Index() {
  // Add refreshing state
  const [refreshing, setRefreshing] = useState(false);
  
  // Use custom hooks to fetch data
  const { token, loading: authLoading, refreshAuth } = useAuth();
  const { sportsList, sportsMap, refreshSports } = useSports(token);
  const { 
    recommendedEvents, 
    myEventsList, 
    myGroupsList, 
    profileName, 
    loading: dataLoading,
    refreshData 
  } = useHomeData(token);
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Refresh all data in parallel
      await Promise.all([
        refreshData(),
        refreshSports(),
        refreshAuth()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData, refreshSports, refreshAuth]);
  
  // Show loading state if any data is still loading
  if (authLoading || dataLoading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-white p-4"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#65DA84"]}  // Android
          tintColor="#65DA84"   // iOS
          title="Refreshing..."  // iOS
        />
      }
    >
      <Header token={token} profileName={profileName} />
      
      <EventCarousel events={recommendedEvents} apiUrl={apiUrl} />
      
      <SportsList sports={sportsList} />
      
      <MyEventsList 
        events={myEventsList} 
        token={token} 
        sportsMap={sportsMap} 
        apiUrl={apiUrl} 
      />
      
      <MyGroupsList 
        groups={myGroupsList} 
        token={token} 
        sportsMap={sportsMap} 
        apiUrl={apiUrl} 
      />
    </ScrollView>
  );
}
