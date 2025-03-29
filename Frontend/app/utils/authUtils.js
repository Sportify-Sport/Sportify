import jwtDecode from "jwt-decode";
import getApiBaseUrl from "../config/apiConfig";

// This function checks if a token didn't expire
const checkTokenValidity = (token) => {
  if (!token) return false;
  
  try {
    const apiUrl = getApiBaseUrl();
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decodedToken.exp > currentTime && decodedToken.iss === apiUrl && decodedToken.aud === apiUrl;
  } catch (error) {
    return false;
  }
};

export default checkTokenValidity;
