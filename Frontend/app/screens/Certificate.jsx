import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert, TouchableOpacity } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams } from 'expo-router';
import useAuth from '../hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


import { Buffer } from 'buffer';

function decodeJwt(token) {
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = Buffer.from(base64, 'base64').toString('utf8');
        return JSON.parse(decodedPayload);
    } catch {
        return null;
    }
}

// Format date like "June 2, 2025, 3:00 PM"
const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}, ${hour}:${minute}`;
};

export default function Certificate() {
    const { event: eventString } = useLocalSearchParams();
    const event = JSON.parse(eventString);
    const { token } = useAuth();
    const viewRef = useRef();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [statusText, setStatusText] = useState('');
    const [teamsText, setTeamsText] = useState('');
    const [dateText, setDateText] = useState('');
    const [eventType, setEventType] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (token) {
            const decoded = decodeJwt(token);
            if (decoded) {
                setName(decoded.name);
                setEmail(decoded.email);
            } else {
                console.error('Failed to decode token');
            }
        }

        const isTeam = event?.requiresTeams;
        const isParticipant = event?.isParticipant;
        const isAdmin = event?.isAdmin;
        const playWatch = event?.playWatch;

        if (isAdmin) {
            setStatusText('Administrator of the event');
        } else if (isTeam && isParticipant && playWatch) {
            setStatusText('Team Player');
        } else if (!isTeam && isParticipant && playWatch) {
            setStatusText('Individual Player');
        } else if (isParticipant && !playWatch) {
            setStatusText('Spectator');
        }

        // Set event type label
        if (isTeam) {
            setEventType('Teams Event');
        } else {
            setEventType('Marathon Event');
        }

        if (isTeam && event?.teams?.length) {
            setTeamsText('Team(s):\n' + event.teams.map(t => `• ${t.groupName}`).join('\n'));
        }

        const now = new Date();
        setDateText(now.toLocaleString());
    }, []);

    const shareCertificate = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 1,
            });

            const permission = await MediaLibrary.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission denied', 'Cannot save image without media library permission');
                return;
            }

            const savedUri = await MediaLibrary.saveToLibraryAsync(uri);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Sharing not supported', 'This device does not support sharing or downloading images.');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            Alert.alert('Error', 'An error occurred while trying to share or download the certificate.');
        }
    };

    return (
        <>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={32} color="#000" style={{ fontWeight: 'bold' }} />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.container}>
                <View ref={viewRef} style={styles.card}>
                    <Text style={styles.header}>Certificate of Participation</Text>
                    <Text style={styles.subHeader}>This certifies that</Text>

                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.email}>{email}</Text>

                    <Text style={styles.role}>has participated as a</Text>
                    <Text style={styles.status}>{statusText}</Text>

                    <View style={styles.eventDetails}>
                        <Text style={styles.eventType}>in the {eventType}</Text>
                        <Text style={styles.eventName}>{event?.eventName}</Text>
                        <Text style={styles.location}>📍 {event?.locationName}</Text>
                        <Text style={styles.location}>in {event?.cityName.trim()}</Text>
                        <Text style={styles.date}>
                            📅 Start Date: {formatDateTime(event?.startDatetime)}
                        </Text>
                        <Text style={styles.date}>
                            📅 End Date: {formatDateTime(event?.endDatetime)}
                        </Text>
                    </View>

                    {teamsText ? (
                        <Text style={styles.teams}>{teamsText}</Text>
                    ) : null}

                    <Text style={styles.issued}>Issued on: {dateText}</Text>

                    <Text style={styles.footer}>🏅 Certificate generated by Sportify</Text>
                </View>

                <TouchableOpacity
                    onPress={shareCertificate}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#4ade80', // optional green background
                        padding: 12,
                        borderRadius: 8,
                        marginTop: 16,
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="download-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Ionicons name="share-social-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Download or Share Certificate</Text>
                </TouchableOpacity>           
                 </ScrollView>
        </>

    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f0f4f8',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
        marginBottom: 20,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginLeft: 15,
        marginTop: 10,
        position: 'absolute',
        top: 20,
        left: 10,
        zIndex: 1,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 18,
        marginBottom: 8,
        color: '#333',
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 4,
        color: '#2c3e50',
    },
    email: {
        fontSize: 16,
        marginBottom: 16,
        color: '#555',
    },
    role: {
        fontSize: 18,
        color: '#333',
    },
    status: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2980b9',
    },
    eventDetails: {
        marginBottom: 16,
        alignItems: 'center',
    },
    eventType: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
        color: '#666',
        fontStyle: 'italic',
    },
    eventName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 4,
    },
    location: {
        fontSize: 16,
        color: '#444',
        marginBottom: 4,
    },
    date: {
        fontSize: 16,
        color: '#444',
    },
    teams: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
        color: '#333',
    },
    issued: {
        fontSize: 14,
        marginBottom: 8,
        color: '#666',
    },
    footer: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#888',
    },
});
