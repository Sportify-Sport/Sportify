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
        borderRadius: 75,
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
        width: '45%',         
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
        width: '45%',         
        borderRadius: 25,
        marginLeft: 10,      
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '500',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        paddingVertical: 10,
        width: '50%',
        borderRadius: 25,
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    changePassButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',     
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1.5,           
        borderColor: '#000',          
    },
    changePassText: {
        color: '#000',               
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
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
        position: 'relative',      
        alignSelf: 'center', 
    },
    profileImage: {
        width: 130,               
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