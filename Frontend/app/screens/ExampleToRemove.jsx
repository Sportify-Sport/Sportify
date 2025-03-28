import React, { useState, useEffect } from "react";
import { View, Text, FlatList } from "react-native";
import { useAuth } from "../context/AuthContext";  // Make sure to import the context

const HomeScreen = () => {
  const { user } = useAuth();  // Get user state from AuthContext
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch user data if user is logged in
    const fetchData = async () => {
      if (user) {
        // Fetch user-specific data if the user is logged in
        const groupsData = await fetchGroupsData();
        const eventsData = await fetchEventsData();

        setGroups(groupsData);
        setEvents(eventsData);
      } else {
        // Reset groups and events for guest view
        setGroups([]);
        setEvents([]);
      }
    };

    fetchData();
  }, [user]);  // Re-run the effect whenever `user` state changes

  return (
    <View>
      <Text>Welcome {user ? user.name : "Guest"}</Text> {/* Show guest or user */}
      
      {user ? (
        <>
          {/* User-specific content */}
          <Text>My Groups:</Text>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Text>{item.name}</Text>}
          />
          
          <Text>Recommended Events:</Text>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Text>{item.name}</Text>}
          />
        </>
      ) : (
        // Guest view when no user is logged in
        <Text>You are browsing as a guest. Please log in to see more features.</Text>
      )}
    </View>
  );
};

export default HomeScreen;
