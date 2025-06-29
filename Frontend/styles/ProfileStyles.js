import { StyleSheet } from "react-native"
const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
        alignItems: 'center',
        backgroundColor: 'white',
    },
    imageContainer: {
        marginVertical: 20,
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75, // Circular image
        borderWidth: 3,
        borderColor: '#65DA84',
        backgroundColor: '#ccc',
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
    },
    infoContainer: {
        width: '100%',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    halfWidth: {
        width: '48%',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: 'green',
        marginBottom: 5,
    },
    infoText: {
        fontSize: 16,
        color: '#333',
        backgroundColor: '#eaeaea',
        padding: 10,
        borderRadius: 8,
    },
    input: {
        fontSize: 16,
        padding: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    picker: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        width: '100%',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#65DA84',
        paddingVertical: 10,
        width: '45%',         // Equal width for the button
        borderRadius: 25,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        paddingVertical: 10,
        width: '45%',         // Equal width for the button
        borderRadius: 25,
        marginLeft: 10,       // Spacing between the two buttons
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '500',
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
     imageWrapper: {
        marginBottom: 10,
        position: 'relative',      // make children positionable
        alignSelf: 'center',   // or 'center', depending on your layout
      },
      profileImage: {
        width: 130,                // or whatever size you need
        height: 130,
        borderRadius: 65,
      },
      editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB', // Tailwind “blue‑600”
        borderRadius: 12,           // half of width/height for circle
        padding: 4,
      },
});

const additionalStyles = {
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  verificationText: {
    flex: 1,
    marginLeft: 10,
    color: '#856404',
    fontSize: 14,
  },
  verifyButton: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
  },
};

export default { ...styles, ...additionalStyles };