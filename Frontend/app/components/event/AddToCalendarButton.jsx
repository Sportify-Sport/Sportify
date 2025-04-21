// components/event/AddToCalendarButton.jsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, Alert, Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

export default function AddToCalendarButton({ event }) {
  const [calendarId, setCalendarId] = useState(null);

  // Request calendar permissions and set the default calendar after component mounts
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android') {
          const { status } = await Calendar.requestCalendarPermissionsAsync();
          if (status === 'granted') {
            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
            const defaultCalendar = calendars.find(cal => cal.allowsModifications);
            if (defaultCalendar) {
              setCalendarId(defaultCalendar.id);
            }
          }
        } else if (Platform.OS === 'ios') {
          const { status } = await Calendar.requestCalendarPermissionsAsync();
          if (status === 'granted') {
            const defaultCalendar = await Calendar.getDefaultCalendarAsync();
            setCalendarId(defaultCalendar.id);
          }
        }
      } catch (error) {
        console.error('Error getting calendar permissions:', error);
      }
    })();
  }, []);

  // Handler to add event to the calendar
  const handleAddToCalendar = async () => {
    if (!calendarId) {
      Alert.alert('No calendar found', 'Unable to locate a calendar to add the event.');
      return;
    }

    try {
      const startDate = new Date(event.startDatetime);
      const endDate = new Date(event.endDatetime);
      // Use Calendar.createEventAsync to create a new event in the user's calendar
      const createdId = await Calendar.createEventAsync(calendarId, {
        title: event.eventName,
        startDate,
        endDate,
        location: event.locationName,
        timeZone: Calendar.TimeZone || undefined,
      });
      console.log('Event added to calendar, id:', createdId);
      Alert.alert('Success', 'Event added to your calendar!');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Could not add event to calendar.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handleAddToCalendar}
      className="bg-gray-200 py-3 rounded-lg mb-4"
    >
      <Text className="text-gray-800 text-center font-bold">Add to Calendar</Text>
    </TouchableOpacity>
  );
}
