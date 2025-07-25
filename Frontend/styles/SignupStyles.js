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
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 5,
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
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
    marginVertical: 15,
    fontSize: 14,
    color: '#999',
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
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  signinText: {
    fontSize: 14,
    color: '#333',
  },
  signinLink: {
    fontSize: 14,
    color: '#2e86de',
    marginBottom: 40,
  },
  suggestionItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
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
});
