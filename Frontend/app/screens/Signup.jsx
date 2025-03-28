import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import styles from '../../styles/SignupStyles';
import { getApiBaseUrl } from "../config/apiConfig";

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [city, setCity] = useState('');
  const [cityId, setCityId] = useState(''); // Store cityId
  const [citySuggestions, setCitySuggestions] = useState([]);

  // Initialize the router
  const router = useRouter();

  const handleContinue = async () => {
    // Date format validation (yyyy/mm/dd)
    const datePattern = /^\d{4}\-(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])$/;
    if (!datePattern.test(birthdate)) {
      alert('Please enter a valid birthdate in the format yyyy-mm-dd.');
      return;
    }

    // Password validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,12}$/;
    if (!passwordPattern.test(password)) {
      alert('Password must be 5-12 characters long and include one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Check if all fields are filled
    if (!firstName || !lastName || !gender || !birthdate || !email || !password || !confirmPassword || !favoriteSport || !cityId) {
      alert('Please fill in all fields.');
      return;
    }

    // Confirm password check
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    // Map favorite sport to sportId
    let sportId;
    if (favoriteSport === 'Football') {
      sportId = 1;
    } else if (favoriteSport === 'Basketball') {
      sportId = 2;
    } else if (favoriteSport === 'Marathon') {
      sportId = 3;
    } else {
      alert('Please select a valid favorite sport.');
      return;
    }

    // Map gender to "M" or "F"
    const genderValue = gender === 'Male' ? 'M' : 'F';

    // Format birthdate (mm/dd/yyyy to yyyy-mm-dd)
    const formattedBirthdate = birthdate.split('/').reverse().join('-');

    // API call
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          birthDate: formattedBirthdate,
          email,
          password,
          favSportId: sportId,
          cityId,
          gender: genderValue, // Send "M" or "F"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Registration successful, Go to the Login page to enter your account`);
        router.push('/screens/Login');
      } else {
        const errorData = await response.json();
        alert(`Registration failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred during registration -', error);
    }
  };

  const handleGoogleSignup = () => {
    // Handle Google signup logic
    console.log('Sign up with Google pressed');
  };

  const handleSigninNavigation = () => {
    router.push('../(tabs)');
  };

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

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.underlineTitle}>___________</Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Gender</Text>
        <Picker
          selectedValue={gender}
          style={styles.picker}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
        </Picker>

        <Text style={styles.label}>Birthdate</Text>
        <TextInput
          style={styles.input}
          placeholder="yyyy-mm-dd"
          value={birthdate}
          onChangeText={setBirthdate}
        />

        <Text style={styles.label}>Your Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.label}>Favorite Sport</Text>
        <Picker
          selectedValue={favoriteSport}
          onValueChange={(itemValue) => setFavoriteSport(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Sport" value="" />
          <Picker.Item label="Football" value="Football" />
          <Picker.Item label="Basketball" value="Basketball" />
          <Picker.Item label="Marathon" value="Marathon" />
        </Picker>

        <Text style={styles.label}>City</Text>
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
                  console.log(item.name, item.id);
                  setCitySuggestions([]);
                }}
                style={styles.suggestionItem}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>________________       Or       ________________</Text>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup}>
          <Image
            source={require('../../assets/images/google.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>

        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleSigninNavigation}>
            <Text style={styles.signinLink}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Signup;
