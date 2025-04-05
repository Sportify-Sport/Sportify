import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#3CCF4E',
    marginBottom: -30,
    textAlign: 'center',
  },
  underlineTitle: {
    fontSize: 28,
    fontWeight: '1000',
    color: '#3CCF4E',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#2e86de',
    marginTop: 5,
    textAlign: 'right',
  },
  continueButton: {
    backgroundColor: '#3CCF4E', // Green button color
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  orText: {
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 50,
    fontSize: 14,
    color: '#999',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  guestButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
  },
  guestIcon: {
    width: 30,        
    height: 30,        
    marginRight: 0,    
    resizeMode: 'contain',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  googleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
  },
  googleIcon: {
    width: 24,        
    height: 24,        
    marginRight: 8,    
    resizeMode: 'contain',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#333',
  },
  signupLink: {
    fontSize: 14,
    color: '#2e86de',
  },
});
