import React, { useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';

const App = () => {
  // Fetch cities from the API and log them to the console
  const fetchCities = async () => {
    try {
      const response = await fetch(
        'https://data.gov.il/api/3/action/datastore_search?resource_id=351d4347-8ee0-4906-8e5b-9533aef13595&limit=1000'
      );
      const json = await response.json();
      console.log('API Response:', json); // Log the entire API response

      // Check if the records exist and have the correct field
      if (json.result && json.result.records) {
        const cityList = json.result.records.map((record) => {
          console.log('Record:', record); // Log each record to inspect its structure
          return record.שם_ישוב; // Extract the city name
        });
        console.log('Cities:', cityList); // Log cities to the console
      } else {
        console.error('No records found in the API response');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  // Fetch cities when the component mounts
  useEffect(() => {
    fetchCities();
  }, []);

  return (
    <View style={styles.container}>
      <Button title="Fetch Cities" onPress={fetchCities} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;