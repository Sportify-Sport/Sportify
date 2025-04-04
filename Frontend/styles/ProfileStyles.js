import { StyleSheet } from "react-native"
export default StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
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
        color: '#555',
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
});