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
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import styles from '../../styles/ProfileStyles';
import getApiBaseUrl from "../config/apiConfig";

export default function Profile() {
  const router = useRouter();

  // State variables (initially using placeholder values)
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [name, setName] = useState('Loading...');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('0000-00-00');
  const [prevBirthdate, setPrevBirthdate] = useState(birthdate);
  const [city, setCity] = useState('');
  const [cityId, setCityId] = useState(''); // Stored cityId from profile API / suggestions
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [gender, setGender] = useState('M'); // "M" or "F"
  const [favoriteSport, setFavoriteSport] = useState('loading'); // "Football", "Basketball", "Marathon"
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState(0);
  const apiUrl = getApiBaseUrl();

  // Fetch the user profile when the component mounts
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
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

      // Update state with fetched data
      setName(`${profileData.firstName} ${profileData.lastName}`);
      setEmail(profileData.email);
      const formattedBirthdate = profileData.birthDate.split('T')[0];
      setBirthdate(formattedBirthdate);
      setPrevBirthdate(formattedBirthdate);
      setBio(profileData.bio);
      setGender(profileData.gender);
      
      // Map favorite sport id to string
      let sport;
      switch(profileData.favSportId) {
        case 1: 
          sport = 'Football'; 
          break;
        case 2: 
          sport = 'Basketball'; 
          break;
        case 3: 
          sport = 'Marathon'; 
          break;
        default: 
          sport = '';
      }
      setFavoriteSport(sport);

      // Update profile image (assuming the filename is appended to a base URL)
      setProfileImage(`${apiUrl}/Images/${profileData.profileImage}`);

      // Save cityId from the response for later use
      setCityId(profileData.cityId);

      // Fetch the city name from the government API using cityId
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

  useEffect(() => {
    fetchUserProfile();
  }, []);

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

  // City search function for editing mode
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
      setCity(''); // Clear if not selected from suggestions
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

 // Function to handle image selection and upload
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
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            // Upload image to backend
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
            // Upload image to backend
            uploadProfileImage(uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ],
    { cancelable: true }
  );
};

// Helper function to upload the profile image to the backend
const uploadProfileImage = async (imageUri) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      navigation.replace('/screens/Login');
      return;
    }

    // Extract file name from the URI
    const fileName = imageUri.split('/').pop();
    // Determine file type (e.g., image/jpeg)
    const match = /\.(\w+)$/.exec(fileName);
    const fileType = match ? `image/${match[1]}` : `image`;

    // Build FormData and append the image file
    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    });

    // Upload the image with a PUT request
    const response = await fetch(`${apiUrl}/api/Users/profile/image`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        // Do not manually set 'Content-Type'; let fetch set it automatically for multipart/form-data
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Image Upload Response:', data);
    if (!response.ok) {
      Alert.alert('Error', data.message || 'An error occurred while uploading the image.');
    } else {
      Alert.alert('Success', 'Profile image updated successfully.');
    }
  } catch (error) {
    console.error('Error uploading profile image:', error);
    Alert.alert('Error', 'An error occurred while uploading the profile image.');
  }
};

  // Function to update the user profile
  const handleSaveProfile = async () => {
    // Validate that required fields are not empty (birthdate, city, gender, favorite sport)
    if (!birthdate || !city || !gender || !favoriteSport) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Index');
        return;
      }
  
      // Map the favoriteSport string to an id
      let favSportId;
      switch(favoriteSport) {
        case 'Football':
          favSportId = 1;
          break;
        case 'Basketball':
          favSportId = 2;
          break;
        case 'Marathon':
          favSportId = 3;
          break;
        default:
          favSportId = '';
      }
  
      // Create a plain object for the update parameters
      const profileData = {
        BirthDate: birthdate,
        FavSportId: favSportId,
        CityId: cityId,
        Bio: bio,
        Gender: gender === 'M' ? 'M' : 'F'
      };
  
      // Send the request with JSON.stringify
      const response = await fetch(`${apiUrl}/api/Users/profile/details`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
  
      const data = await response.json();
      console.log('Full Response:', data);
      if (!response.ok) {
        // Show only the title from the error response
        Alert.alert('Error', data.title || 'An error occurred.');
      } else {
        Alert.alert('Success', 'Profile updated successfully.');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating the profile.');
    }
  };

  // Toggle editing mode or save if editing is active
  const handleEditPress = () => {
    if (isEditing) {
      // When saving, run the update flow
      handleSaveProfile();
    } else {
      setIsEditing(true);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            router.replace('../screens/Login');
          }
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
<View style={styles.imageWrapper}>
  <TouchableOpacity onPress={handleChangeImage}>
    <Image source={{ uri: profileImage }} style={styles.profileImage} />
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
          onPress={handleEditPress}
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

// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   Image, 
//   TouchableOpacity, 
//   TextInput, 
//   Alert, 
//   ScrollView, 
//   FlatList
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { Ionicons } from '@expo/vector-icons';
// import { Picker } from '@react-native-picker/picker';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRouter } from "expo-router";
// import getApiBaseUrl from "../config/apiConfig";
// export default function Profile() {
//   const router = useRouter();

//   // State variables (unchanged)
//   const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
//   const [name, setName] = useState('Loading...');
//   const [bio, setBio] = useState('');
//   const [email, setEmail] = useState('');
//   const [birthdate, setBirthdate] = useState('0000-00-00');
//   const [prevBirthdate, setPrevBirthdate] = useState(birthdate);
//   const [city, setCity] = useState('');
//   const [cityId, setCityId] = useState('');
//   const [citySuggestions, setCitySuggestions] = useState([]);
//   const [gender, setGender] = useState('M');
//   const [favoriteSport, setFavoriteSport] = useState('loading');
//   const [isEditing, setIsEditing] = useState(false);
//   const [age, setAge] = useState(0);
//   const apiUrl = getApiBaseUrl();

//   // Fetch user profile (unchanged)
//   const fetchUserProfile = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         router.replace('/screens/Login');
//         return;
//       }

//       const profileResponse = await fetch(`${apiUrl}/api/Users/GetUserProfile`, {
//         method: 'GET',
//         headers: {
//           'accept': '*/*',
//           'Authorization': 'Bearer ' + token
//         }
//       });

//       if (!profileResponse.ok) {
//         throw new Error('Failed to fetch profile');
//       }

//       const profileData = await profileResponse.json();

//       setName(`${profileData.firstName} ${profileData.lastName}`);
//       setEmail(profileData.email);
//       const formattedBirthdate = profileData.birthDate.split('T')[0];
//       setBirthdate(formattedBirthdate);
//       setPrevBirthdate(formattedBirthdate);
//       setBio(profileData.bio);
//       setGender(profileData.gender);
      
//       let sport;
//       switch(profileData.favSportId) {
//         case 1: 
//           sport = 'Football'; 
//           break;
//         case 2: 
//           sport = 'Basketball'; 
//           break;
//         case 3: 
//           sport = 'Marathon'; 
//           break;
//         default: 
//           sport = '';
//       }
//       setFavoriteSport(sport);

//       setProfileImage(`${apiUrl}/Images/${profileData.profileImage}`);
//       setCityId(profileData.cityId);

//       if (profileData.cityId) {
//         const cityResponse = await fetch(
//         `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${profileData.cityId}}`
//         );
//         const cityData = await cityResponse.json();
//         if (cityData.success && cityData.result && cityData.result.records) {
//           const record = cityData.result.records.find(r => 
//             r._id.toString() === profileData.cityId.toString()
//           );
//           if (record) {
//             setCity(record['city_name_en']);
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching user profile:', error);
//       Alert.alert('Error', 'Could not load profile data.');
//     }
//   };

//   useEffect(() => {
//     fetchUserProfile();
//   }, []);

//   // Calculate age (unchanged)
//   useEffect(() => {
//     const today = new Date();
//     const birth = new Date(birthdate);
//     let calculatedAge = today.getFullYear() - birth.getFullYear();
//     const m = today.getMonth() - birth.getMonth();
//     if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
//       calculatedAge--;
//     }
//     setAge(calculatedAge);
//   }, [birthdate]);

//   // City search function (unchanged)
//   const searchCities = async (query) => {
//     if (query.length < 3) {
//       setCitySuggestions([]);
//       return;
//     }
//     const apiUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&q=${encodeURIComponent(query)}&limit=5`;
//     try {
//       const response = await fetch(apiUrl);
//       const data = await response.json();
//       if (data.success && data.result && data.result.records) {
//         const suggestions = data.result.records
//           .filter(record => record['city_name_en'] && record['city_name_en'].trim() !== '')
//           .map(record => ({
//             id: record._id,
//             name: record['city_name_en']
//           }));
//         setCitySuggestions(suggestions);
//       } else {
//         setCitySuggestions([]);
//       }
//     } catch (error) {
//       console.error('Error fetching cities from gov API:', error);
//       setCitySuggestions([]);
//     }
//   };

//   const handleCityBlur = () => {
//     if (!citySuggestions.some((suggestion) => suggestion.name === city)) {
//       setCity('');
//     }
//   };

//   const handleBirthdateBlur = () => {
//     const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
//     if (!regex.test(birthdate)) {
//       Alert.alert('Invalid Format', 'Please enter a valid birthdate in the format yyyy-mm-dd.');
//       setBirthdate(prevBirthdate);
//       return;
//     }

//     const birthDateObj = new Date(birthdate);
//     const today = new Date();
//     let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
//     const monthDiff = today.getMonth() - birthDateObj.getMonth();
//     const dayDiff = today.getDate() - birthDateObj.getDate();
//     if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
//       calculatedAge--;
//     }
//     if (calculatedAge < 13 || calculatedAge > 90) {
//       Alert.alert('Invalid Age', 'Age must be between 13 and 90 years.');
//       setBirthdate(prevBirthdate);
//       return;
//     }
//     setPrevBirthdate(birthdate);
//   };

//   // Updated: Simplified handleChangeImage to only open gallery
//   const handleChangeImage = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permissionResult.granted) {
//         Alert.alert('Permission required', 'Media library permission is required to select a photo.');
//         return;
//       }

//       let result = await ImagePicker.launchImageLibraryAsync({
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.5,
//       });

//       if (!result.canceled) {
//         const uri = result.assets[0].uri;
//         setProfileImage(uri);
//         uploadProfileImage(uri);
//       }
//     } catch (error) {
//       console.error('Error selecting image from gallery:', error);
//       Alert.alert('Error', 'An error occurred while selecting the image.');
//     }
//   };

//   const uploadProfileImage = async (imageUri) => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         router.replace('/screens/Login');
//         return;
//       }

//       const fileName = imageUri.split('/').pop();
//       const match = /\.(\w+)$/.exec(fileName);
//       const fileType = match ? `image/${match[1]}` : `image`;

//       const formData = new FormData();
//       formData.append('profileImage', {
//         uri: imageUri,
//         name: fileName,
//         type: fileType,
//       });

//       const response = await fetch(`${apiUrl}/api/Users/profile/image`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': 'Bearer ' + token,
//         },
//         body: formData,
//       });

//       const data = await response.json();
//       console.log('Image Upload Response:', data);
//       if (!response.ok) {
//         Alert.alert('Error', data.message || 'An error occurred while uploading the image.');
//       } else {
//         Alert.alert('Success', 'Profile image updated successfully.');
//       }
//     } catch (error) {
//       console.error('Error uploading profile image:', error);
//       Alert.alert('Error', 'An error occurred while uploading the profile image.');
//     }
//   };

//   // Update profile (unchanged)
//   const handleSaveProfile = async () => {
//     if (!birthdate || !city || !gender || !favoriteSport) {
//       Alert.alert('Missing Fields', 'Please fill in all required fields.');
//       return;
//     }
  
//     try {
//       const token = await AsyncStorage.getItem('token');
//       if (!token) {
//         router.replace('Index');
//         return;
//       }
  
//       let favSportId;
//       switch(favoriteSport) {
//         case 'Football':
//           favSportId = 1;
//           break;
//         case 'Basketball':
//           favSportId = 2;
//           break;
//         case 'Marathon':
//           favSportId = 3;
//           break;
//         default:
//           favSportId = '';
//       }
  
//       const profileData = {
//         BirthDate: birthdate,
//         FavSportId: favSportId,
//         CityId: cityId,
//         Bio: bio,
//         Gender: gender === 'M' ? 'M' : 'F'
//       };
  
//       const response = await fetch(`${apiUrl}/api/Users/profile/details`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': 'Bearer ' + token,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(profileData)
//       });
  
//       const data = await response.json();
//       console.log('Full Response:', data);
//       if (!response.ok) {
//         Alert.alert('Error', data.title || 'An error occurred.');
//       } else {
//         Alert.alert('Success', 'Profile updated successfully.');
//         setIsEditing(false);
//       }
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       Alert.alert('Error', 'An error occurred while updating the profile.');
//     }
//   };

//   const handleEditPress = () => {
//     if (isEditing) {
//       handleSaveProfile();
//     } else {
//       setIsEditing(true);
//     }
//   };

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('token');
//     router.replace('../screens/Login');
//   };

// // Inside your component's return statement:

//   return (
//     <View className="flex-1 bg-white">
//       {/* Gradient Header */}
//       <View className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-blue-200 via-green-500 to-transparent" />
//       <ScrollView className="flex-1 px-4 pt-12">
//         {/* Profile Image with Edit Icon */}
//         <View className="items-center mb-6">
//           <View className="relative">
//             <TouchableOpacity onPress={handleChangeImage}>
//               <Image 
//                 source={{ uri: profileImage }} 
//                 className="w-24 h-24 rounded-full bg-gray-200" 
//               />
//             </TouchableOpacity>
//             <TouchableOpacity 
//               className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1"
//               onPress={handleChangeImage}
//             >
//               <Ionicons name="pencil" size={16} color="white" />
//             </TouchableOpacity>
//           </View>
//           <Text className="text-2xl font-bold text-gray-800 mt-4"> Your Profile</Text>
//         </View>

//         {/* Name (split into First and Last Name for display) */}
//         <View className="mb-4">
//           <Text className="text-sm font-medium text-gray-600 mb-1">First Name</Text>
//           <TextInput
//             className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
//             value={name.split(' ')[0] || ''}
//             onChangeText={(text) => setName(`${text} ${name.split(' ')[1] || ''}`)}
//             editable={isEditing}
//           />
//         </View>
//         <View className="mb-4">
//           <Text className="text-sm font-medium text-gray-600 mb-1">Last Name</Text>
//           <TextInput
//             className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
//             value={name.split(' ')[1] || ''}
//             onChangeText={(text) => setName(`${name.split(' ')[0] || ''} ${text}`)}
//             editable={isEditing}
//           />
//         </View>

//         {/* Email */}
//         <View className="mb-4">
//           <Text className="text-sm font-medium text-gray-600 mb-1">Email</Text>
//           <TextInput
//             className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
//             value={email}
//             editable={false}
//           />
//         </View>

//         {/* Bio */}
//         <View className="mb-4">
//           <Text className="text-sm font-medium text-gray-600 mb-1">Bio</Text>
//           <TextInput
//             className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
//             value={bio}
//             onChangeText={setBio}
//             multiline
//             numberOfLines={3}
//             editable={isEditing}
//           />
//         </View>

//         {/* Birthdate and Age */}
//         <View className="flex-row justify-between mb-4">
//           <View className="flex-1 mr-2">
//             <Text className="text-sm font-medium text-gray-600 mb-1">Birth</Text>
//             <TextInput
//               className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
//               value={birthdate}
//               onChangeText={setBirthdate}
//               onBlur={handleBirthdateBlur}
//               placeholder="yyyy-mm-dd"
//               editable={isEditing}
//             />
//           </View>
//           <View className="flex-1 ml-2">
//             <Text className="text-sm font-medium text-gray-600 mb-1">Age</Text>
//             <Text className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800">
//               {age}
//             </Text>
//           </View>
//         </View>

//         {/* City with Suggestions */}
//         <View className="mb-4">
//           <Text className="text-sm font-medium text-gray-600 mb-1">City</Text>
//           <TextInput
//             className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800"
//             placeholder="Start typing a city..."
//             value={city}
//             onChangeText={(text) => {
//               setCity(text);
//               searchCities(text);
//             }}
//             onBlur={handleCityBlur}
//             editable={isEditing}
//           />
//           {isEditing && citySuggestions.length > 0 && (
//             <FlatList
//               data={citySuggestions}
//               keyExtractor={(item, index) => index.toString()}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   onPress={() => {
//                     setCity(item.name);
//                     setCityId(item.id);
//                     setCitySuggestions([]);
//                   }}
//                   className="bg-white border border-gray-200 px-4 py-2"
//                 >
//                   <Text className="text-gray-800">{item.name}</Text>
//                 </TouchableOpacity>
//               )}
//               className="mt-1 max-h-40"
//             />
//           )}
//         </View>

//         {/* Gender and Favorite Sport */}
//         <View className="flex-row justify-between mb-4">
//           <View className="flex-1 mr-2">
//             <Text className="text-sm font-medium text-gray-600 mb-1">Gender</Text>
//             {isEditing ? (
//               <View className="border border-gray-300 rounded-lg bg-white">
//                 <Picker
//                   selectedValue={gender}
//                   onValueChange={(itemValue) => setGender(itemValue)}
//                   className="text-gray-800"
//                 >
//                   <Picker.Item label="Male" value="M" />
//                   <Picker.Item label="Female" value="F" />
//                 </Picker>
//               </View>
//             ) : (
//               <Text className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800">
//                 {gender === 'M' ? 'Male' : 'Female'}
//               </Text>
//             )}
//           </View>
//           <View className="flex-1 ml-2">
//             <Text className="text-sm font-medium text-gray-600 mb-1">Favorite Sport</Text>
//             {isEditing ? (
//               <View className="border border-gray-300 rounded-lg bg-white">
//                 <Picker
//                   selectedValue={favoriteSport}
//                   onValueChange={(itemValue) => setFavoriteSport(itemValue)}
//                   className="text-gray-800"
//                 >
//                   <Picker.Item label="Football" value="Football" />
//                   <Picker.Item label="Basketball" value="Basketball" />
//                   <Picker.Item label="Marathon" value="Marathon" />
//                 </Picker>
//               </View>
//             ) : (
//               <Text className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800">
//                 {favoriteSport}
//               </Text>
//             )}
//           </View>
//         </View>

//         {/* Edit/Save and Logout Buttons */}
//         <View className="flex-row justify-between mb-6">
//           <TouchableOpacity
//             className="flex-1 bg-green-600 rounded-lg py-3 mr-2 flex-row justify-center items-center"
//             onPress={handleEditPress}
//           >
//             <Ionicons name="pencil" size={20} color="white" />
//             <Text className="text-white font-semibold ml-2">{isEditing ? 'Save' : 'Edit'}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             className="flex-1 bg-red-600 rounded-lg py-3 ml-2 flex-row justify-center items-center"
//             onPress={handleLogout}
//           >
//             <Ionicons name="log-out-outline" size={20} color="white" />
//             <Text className="text-white font-semibold ml-2">Logout</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }




