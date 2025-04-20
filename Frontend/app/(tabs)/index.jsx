import React from 'react';
import { ScrollView } from 'react-native';
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
  // Use custom hooks to fetch data
  const { token, loading: authLoading } = useAuth();
  const { sportsList, sportsMap } = useSports(token);
  const { 
    recommendedEvents, 
    myEventsList, 
    myGroupsList, 
    profileName, 
    loading: dataLoading 
  } = useHomeData(token);
  
  // Show loading state if any data is still loading
  if (authLoading || dataLoading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
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
