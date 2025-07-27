import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import EmailVerificationModal from "../components/modals/EmailVerificationModal";
import styles from "../../styles/SignupStyles";
import guestIcon from "../../assets/images/guest-icon-design-vector.jpg";
import DateTimePickerModal from 'react-native-modal-datetime-picker';


const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteSport, setFavoriteSport] = useState("");
  const [city, setCity] = useState("");
  const [cityId, setCityId] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const router = useRouter();
  const { register, continueAsGuest } = useAuth();

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleContinue = async () => {
    const now = new Date();
    const minBirthDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    const maxBirthDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());

    if (!firstName?.trim()) {
      Alert.alert("Error", "First name is required");
      return;
    }
    if (firstName.length > 50) {
      Alert.alert("Error", "First name cannot exceed 50 characters");
      return;
    }
    if (!/^[a-zA-Z\s\-']+$/.test(firstName)) {
      Alert.alert("Error", "First name contains invalid characters");
      return;
    }

    if (!lastName?.trim()) {
      Alert.alert("Error", "Last name is required");
      return;
    }
    if (lastName.length > 50) {
      Alert.alert("Error", "Last name cannot exceed 50 characters");
      return;
    }
    if (!/^[a-zA-Z\s\-']+$/.test(lastName)) {
      Alert.alert("Error", "Last name contains invalid characters");
      return;
    }

    if (!birthdate) {
      Alert.alert("Error", "Birthdate is required");
      return;
    }
    // Validate date format yyyy-mm-dd (keep this)
    const datePattern = /^\d{4}\-(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])$/;
    if (!datePattern.test(birthdate)) {
      Alert.alert("Error", "Please enter a valid birthdate in the format yyyy-mm-dd.");
      return;
    }
    // Validate birthdate range
    const bd = new Date(birthdate);
    if (bd < minBirthDate || bd > maxBirthDate) {
      Alert.alert("Error", "Birth date must be between 13 and 120 years ago");
      return;
    }

    if (!email?.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }
    if (email.length > 100) {
      Alert.alert("Error", "Email cannot exceed 100 characters");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert("Error", "Invalid email format");
      return;
    }

    if (!password) {
      Alert.alert("Error", "Password is required");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }
    if (password.length > 100) {
      Alert.alert("Error", "Password cannot exceed 100 characters");
      return;
    }
    // Password complexity: at least one uppercase, one lowercase, one digit
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      Alert.alert("Error", "Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    if (!gender) {
      Alert.alert("Error", "Gender is required");
      return;
    }

    if (!confirmPassword) {
      Alert.alert("Error", "Please confirm your password");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!favoriteSport) {
      Alert.alert("Error", "Favorite sport is required");
      return;
    }

    if (!cityId) {
      Alert.alert("Error", "City is required");
      return;
    }


    let sportId;
    if (favoriteSport === "Football") sportId = 1;
    else if (favoriteSport === "Basketball") sportId = 2;
    else if (favoriteSport === "Marathon") sportId = 3;

    const genderValue = gender === "Male" ? "M" : "F";

    setLoading(true);
    const result = await register({
      firstName,
      lastName,
      birthDate: birthdate,
      email,
      password,
      favSportId: sportId,
      cityId,
      gender: genderValue,
    });
    setLoading(false);

    if (result.success) {
      setShowVerificationModal(true);
    } else {
      Alert.alert("Registration Failed", result.error);
    }
  };

  const searchCities = async (query) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const CityApiUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&q=${encodeURIComponent(
      query
    )}&limit=5`;

    try {
      const response = await fetch(CityApiUrl);
      const data = await response.json();
      if (data.success && data.result && data.result.records) {
        const suggestions = data.result.records
          .filter((record) => record["city_name_en"] && record["city_name_en"].trim() !== "")
          .map((record) => ({
            id: record._id,
            name: record["city_name_en"],
          }));
        setCitySuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCitySuggestions([]);
    }
  };

  const handleCityBlur = () => {
    if (!citySuggestions.some((suggestion) => suggestion.name === city)) {
      setCity("");
    }
  };

  const handleGuestLogin = async () => {
    await continueAsGuest();
    router.replace('../(tabs)');
  };

  const handleSigninNavigation = () => {
    router.push("./Login");
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    router.replace('../(tabs)');
  };

  const handleSkipVerification = () => {
    setShowVerificationModal(false);
    router.replace('../(tabs)');
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
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
        </Picker>

        <Text style={styles.label}>Birthdate</Text>
        <TouchableOpacity onPress={showDatePicker}>
          <TextInput
            style={styles.input}
            placeholder="yyyy-mm-dd"
            value={birthdate}
            editable={false} // Prevent manual editing
            pointerEvents="none" // Prevents focus
          />
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 13))} // At least 13 years old
          minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))} // At most 120 years old
          onConfirm={(date) => {
            const formatted = date.toISOString().split("T")[0];
            setBirthdate(formatted);
            hideDatePicker();
          }}
          onCancel={hideDatePicker}
        />

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
          <View style={{ maxHeight: 150 }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {citySuggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCity(item.name);
                    setCityId(item.id);
                    setCitySuggestions([]);
                  }}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Your Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
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

        <TouchableOpacity
          style={[styles.continueButton, loading && { opacity: 0.5 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.orText}>________________ Or ________________</Text>

        <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
          <Text style={styles.guestButtonText}>Continue as a guest</Text>
          <Image source={guestIcon} style={styles.guestIcon} />
        </TouchableOpacity>

        <View style={styles.signinContainer}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleSigninNavigation}>
            <Text style={styles.signinLink}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EmailVerificationModal
        visible={showVerificationModal}
        onClose={handleSkipVerification}
        onVerified={handleVerificationComplete}
      />
    </View>
  );
};

export default Signup;
