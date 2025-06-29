import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ScrollView, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import { useAuth } from '../context/AuthContext';
import EmailVerificationModal from '../components/modals/EmailVerificationModal';
import styles from '../../styles/ProfileStyles';
import getApiBaseUrl from "../config/apiConfig";

export default function Profile() {
  const router = useRouter();
  const { logout, token, isEmailVerified, isGuest, user } = useAuth();

  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [name, setName] = useState('Loading...');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('0000-00-00');
  const [prevBirthdate, setPrevBirthdate] = useState('0000-00-00');
  const [city, setCity] = useState('');
  const [cityId, setCityId] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [gender, setGender] = useState('M');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    if (isGuest) {
      setName("Guest User");
      setEmail("guest@example.com");
      return;
    }
    if (token) {
      fetchUserProfile();
    }
  }, [token, isGuest]);

  useEffect(() => {
    if (birthdate && birthdate !== '0000-00-00') {
      const today = new Date();
      const birth = new Date(birthdate);
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    }
  }, [birthdate]);

  const fetchUserProfile = async () => {
    try {
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      const profileResponse = await fetch(`${apiUrl}/api/Users/GetUserProfile`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': 'Bearer ' + token
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();

      setName(`${profileData.firstName} ${profileData.lastName}`);
      setEmail(profileData.email);
      const formattedBirthdate = profileData.birthDate.split('T')[0];
      setBirthdate(formattedBirthdate);
      setPrevBirthdate(formattedBirthdate);
      setBio(profileData.bio || '');
      setGender(profileData.gender);
      
      let sport;
      switch(profileData.favSportId) {
        case 1: sport = 'Football'; break;
        case 2: sport = 'Basketball'; break;
        case 3: sport = 'Marathon'; break;
        default: sport = '';
      }
      setFavoriteSport(sport);

      setProfileImage(`${apiUrl}/Images/${profileData.profileImage}`);
      setCityId(profileData.cityId);

      if (profileData.cityId) {
        const cityResponse = await fetch(
          `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${profileData.cityId}}`
        );
        const cityData = await cityResponse.json();
        if (cityData.success && cityData.result && cityData.result.records) {
          const record = cityData.result.records.find(r => 
            r._id.toString() === profileData.cityId.toString()
          );
          if (record) {
            setCity(record['city_name_en']);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Could not load profile data.');
    }
  };

  const searchCities = async (query) => {
    if (query.length < 3) {
      setCitySuggestions([]);
      return;
    }
    const apiUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&q=${encodeURIComponent(query)}&limit=5`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success && data.result && data.result.records) {
        const suggestions = data.result.records
          .filter(record => record['city_name_en'] && record['city_name_en'].trim() !== '')
          .map(record => ({
            id: record._id,
            name: record['city_name_en']
          }));
        setCitySuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCitySuggestions([]);
    }
  };

  const handleCityBlur = () => {
    if (!citySuggestions.some((suggestion) => suggestion.name === city)) {
      setCity('');
    }
  };

  const handleBirthdateBlur = () => {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!regex.test(birthdate)) {
      Alert.alert('Invalid Format', 'Please enter a valid birthdate in the format yyyy-mm-dd.');
      setBirthdate(prevBirthdate);
      return;
    }

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
      setBirthdate(prevBirthdate);
      return;
    }
    setPrevBirthdate(birthdate);
  };

  const handleChangeImage = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign up or log in to change profile picture.');
      return;
    }

    if (!isEmailVerified) {
      Alert.alert('Email Verification Required', 'Please verify your email to change profile picture.');
      return;
    }

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
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              uploadProfileImage(uri);
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
              const uri = result.assets[0].uri;
              setProfileImage(uri);
              uploadProfileImage(uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const uploadProfileImage = async (imageUri) => {
    try {
      setImageLoading(true);
      
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      const fileName = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(fileName);
      const fileType = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('profileImage', {
        uri: imageUri,
        name: fileName,
        type: fileType,
      });

      const response = await fetch(`${apiUrl}/api/Users/profile/image`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data.message || 'An error occurred while uploading the image.');
      } else {
        Alert.alert('Success', 'Profile image updated successfully.');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', 'An error occurred while uploading the profile image.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign up or log in to edit profile.');
      return;
    }

    if (!isEmailVerified) {
      Alert.alert('Email Verification Required', 'Please verify your email first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Verify Now', onPress: () => setShowVerificationModal(true) }
      ]);
      return;
    }

    if (!birthdate || !city || !gender || !favoriteSport) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      let favSportId;
      switch(favoriteSport) {
        case 'Football': favSportId = 1; break;
        case 'Basketball': favSportId = 2; break;
        case 'Marathon': favSportId = 3; break;
        default: favSportId = '';
      }

      const profileData = {
        BirthDate: birthdate,
        FavSportId: favSportId,
        CityId: cityId,
        Bio: bio,
        Gender: gender
      };

      const response = await fetch(`${apiUrl}/api/Users/profile/details`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data.title || 'An error occurred.');
      } else {
        Alert.alert('Success', 'Profile updated successfully.');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating the profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign up or log in to edit profile.');
      return;
    }

    if (isEditing) {
      handleSaveProfile();
    } else {
      setIsEditing(true);
    }
  };

  const handleLogout = () => {
    if (isGuest) {
      Alert.alert(
        "Exit Guest Mode",
        "Are you sure you want to exit guest mode?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => router.replace('../screens/Login') }
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            await logout();
            router.replace('../screens/Login');
          }
        }
      ]
    );
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    // Refresh profile data to get updated verification status
    fetchUserProfile();
  };

  if (isGuest) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />
        </View>

        <Text style={styles.name}>Guest User</Text>
        
        <View style={[styles.infoContainer, { marginTop: 20 }]}>
          <Text style={styles.label}>🚀 Ready to join?</Text>
          <Text style={styles.infoText}>
            Sign up to create your profile, join events, and connect with other sports enthusiasts!
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('../screens/Signup')}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!isEmailVerified && (
        <View style={styles.verificationBanner}>
          <Ionicons name="warning" size={20} color="#ff6b6b" />
          <Text style={styles.verificationText}>
            Please verify your email to edit your profile
          </Text>
          <TouchableOpacity onPress={() => setShowVerificationModal(true)}>
            <Text style={styles.verifyButton}>Verify</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.imageWrapper}>
        <TouchableOpacity onPress={handleChangeImage} disabled={imageLoading}>
          {imageLoading ? (
            <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#65DA84" />
            </View>
          ) : (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          )}
          <View style={styles.editIconContainer}>
            <Ionicons name="pencil" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

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
            placeholder="Tell us about yourself..."
          />
        ) : (
          <Text style={styles.infoText}>{bio || "No bio yet"}</Text>
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
        <Text style={styles.label}>City:</Text>
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
          style={[styles.editButton, loading && { opacity: 0.5 }]}
          onPress={handleEditPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="pencil" size={20} color="#fff" />
              <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <EmailVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handleVerificationComplete}
      />
    </ScrollView>
  );
}
