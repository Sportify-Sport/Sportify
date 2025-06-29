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

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
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
  const { register } = useAuth();

  const handleContinue = async () => {
    // Validation
    const datePattern = /^\d{4}\-(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])$/;
    if (!datePattern.test(birthdate)) {
      Alert.alert("Error", "Please enter a valid birthdate in the format yyyy-mm-dd.");
      return;
    }

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,12}$/;
    if (!passwordPattern.test(password)) {
      Alert.alert(
        "Error",
        "Password must be 5-12 characters long and include one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (!firstName || !lastName || !gender || !birthdate || !email || !password || !confirmPassword || !favoriteSport || !cityId) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
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

  const handleGoogleSignup = () => {
    console.log("Sign up with Google pressed");
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
                  setCitySuggestions([]);
                }}
                style={styles.suggestionItem}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

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

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignup}
        >
          <Image
            source={require("../../assets/images/google.png")}
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

      <EmailVerificationModal
        visible={showVerificationModal}
        onClose={handleSkipVerification}
        onVerified={handleVerificationComplete}
      />
    </View>
  );
};

export default Signup;
