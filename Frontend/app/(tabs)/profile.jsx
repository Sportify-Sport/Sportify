import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, ScrollView, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import styles from '../../styles/ProfileStyles';

export default function Profile() {
  // Dummy user data; later replace with API data
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150'); // placeholder image URL
  const [name, setName] = useState('John Doe');
  const [bio, setBio] = useState('This is a short bio about John Doe.');
  const [email, setEmail] = useState('john.doe@example.com');
  const [birthdate, setBirthdate] = useState('1990-01-01'); // yyyy-mm-dd
  const [prevBirthdate, setPrevBirthdate] = useState(birthdate);
  const [city, setCity] = useState('Haifa');
  const [cityId, setCityId] = useState(''); // Store cityId
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [gender, setGender] = useState('M'); // "M" or "F"
  const [favoriteSport, setFavoriteSport] = useState('Football'); // "Football", "Basketball", "Marathon"
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState(0);

  // Search cities dynamically from the gov API
  const searchCities = async (query) => {
    if (query.length < 3) {
      setCitySuggestions([]);
      return;
    }

    const apiUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=351d4347-8ee0-4906-8e5b-9533aef13595&q=${encodeURIComponent(query)}&limit=5`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success && data.result && data.result.records) {
        // Map each record to get only _id and תעתיק, and filter out records without a valid תעתיק
        const suggestions = data.result.records
          .filter(record => record['תעתיק'] && record['תעתיק'].trim() !== '')
          .map(record => ({
            id: record._id,
            name: record['תעתיק']
          }));
        setCitySuggestions(suggestions);
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching cities from gov API:', error);
      setCitySuggestions([]);
    }
  };

  const handleCityBlur = () => {
    if (!citySuggestions.some((suggestion) => suggestion.name === city)) {
      setCity(''); // Clear the input if the city is not selected from suggestions
    }
  };

  // Calculate age based on birthdate
  useEffect(() => {
    const today = new Date();
    const birth = new Date(birthdate);
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge);
  }, [birthdate]);

  const handleBirthdateBlur = () => {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!regex.test(birthdate)) {
      Alert.alert('Invalid Format', 'Please enter a valid birthdate in the format yyyy-mm-dd.');
      setBirthdate(prevBirthdate); // Revert to previous valid value
      return;
    }

    // Calculate age
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    const dayDiff = today.getDate() - birthDateObj.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      calculatedAge--;
    }
    if (calculatedAge < 13 || calculatedAge > 90) {
      Alert.alert('Invalid Age', 'Age must be between 13 and 90 years.');
      setBirthdate(prevBirthdate); // Revert to previous valid value
      return;
    }
    setPrevBirthdate(birthdate);
  };

  // Function to handle image selection
  const handleChangeImage = async () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option:',
      [
        {
          text: 'Take a picture',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
              Alert.alert('Permission required', 'Camera permission is required to take a photo.');
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setProfileImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from gallery',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
              Alert.alert('Permission required', 'Media library permission is required to select a photo.');
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              setProfileImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.imageContainer} onPress={handleChangeImage}>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
      </TouchableOpacity>

      <Text style={styles.name}>{name}</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Bio:</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            maxLength={255}
            value={bio}
            onChangeText={setBio}
          />
        ) : (
          <Text style={styles.infoText}>{bio}</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.infoText}>{email}</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoContainer, styles.halfWidth]}>
          <Text style={styles.label}>Birthdate:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={birthdate}
              onChangeText={setBirthdate}
              onBlur={handleBirthdateBlur}
              placeholder="yyyy-mm-dd"
            />
          ) : (
            <Text style={styles.infoText}>{birthdate}</Text>
          )}
        </View>
        <View style={[styles.infoContainer, styles.halfWidth]}>
          <Text style={styles.label}>Age:</Text>
          <Text style={styles.infoText}>{age}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>City</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Start typing a city..."
              value={city}
              onChangeText={(text) => {
                setCity(text);
                searchCities(text);
              }}
              onBlur={handleCityBlur}
            />
            {citySuggestions.length > 0 && (
              <FlatList
                data={citySuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCity(item.name);
                      setCityId(item.id);
                      setCitySuggestions([]);
                    }}
                    style={styles.suggestionItem}
                  >
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        ) : (
          <Text style={styles.infoText}>{city || "Not set"}</Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoContainer, styles.halfWidth]}>
          <Text style={styles.label}>Gender:</Text>
          {isEditing ? (
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Male" value="M" />
              <Picker.Item label="Female" value="F" />
            </Picker>
          ) : (
            <Text style={styles.infoText}>{gender === 'M' ? 'Male' : 'Female'}</Text>
          )}
        </View>
        <View style={[styles.infoContainer, styles.halfWidth]}>
          <Text style={styles.label}>Favorite Sport:</Text>
          {isEditing ? (
            <Picker
              selectedValue={favoriteSport}
              onValueChange={(itemValue) => setFavoriteSport(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Football" value="Football" />
              <Picker.Item label="Basketball" value="Basketball" />
              <Picker.Item label="Marathon" value="Marathon" />
            </Picker>
          ) : (
            <Text style={styles.infoText}>{favoriteSport}</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}