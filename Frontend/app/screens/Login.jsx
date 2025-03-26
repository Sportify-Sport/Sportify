import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../../styles/LoginStyles';
import googleIcon from '../../assets/images/google.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();

  // Regular expressions for validations
  const emailRegex = /^\S+@\S+\.\S+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{5,}$/;

  const handleLogin = async () => {
    // Reset any previous error message
    setErrorMessage('');

    // Validate email format
    if (!emailRegex.test(email)) {
      setErrorMessage('Invalid email format. Please enter a valid email.');
      return;
    }

    // Validate password: minimum one lowercase, one uppercase, one digit, one symbol, and at least 5 characters long
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        'Password must be at least 5 characters long and include one lowercase letter, one uppercase letter, one number, and one symbol.'
      );
      return;
    }

    try {
      // Call the API
      const response = await fetch('https://localhost:7059/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 200) {
        const data = await response.json();
        // Save the token in AsyncStorage
        await AsyncStorage.setItem('token', data.token);
        // Navigate to the index page inside your tabs folder
        router.push('../(tabs)');
    } else {
        // If the response is not 200, get the error message
        const errorData = await response.json();
        setErrorMessage('Login failed: ' + (errorData.message || 'Unknown error.'));
      }
    } catch (error) {
      setErrorMessage('Login failed: ' + error.message);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password pressed');
  };

  const handleGoogleLogin = () => {
    console.log('Login with Google pressed');
  };

  const handleSignupNavigation = () => {
    console.log('Navigate to Sign Up');
    router.push('/screens/Signup');
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.underlineTitle}>___________</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Text style={styles.label}>Your Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity onPress={togglePasswordVisibility}>
          <Ionicons
            name={isPasswordVisible ? 'eye' : 'eye-off'}
            size={24}
            color="gray"
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.continueButton} onPress={handleLogin}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>
        _________________       Or       _________________
      </Text>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Image 
          source={googleIcon} 
          style={styles.googleIcon} 
        />
        <Text style={styles.googleButtonText}>Login with Google</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don’t have an account?</Text>
        <TouchableOpacity onPress={handleSignupNavigation}>
          <Text style={styles.signupLink}> Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;
