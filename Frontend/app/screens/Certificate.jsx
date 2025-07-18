import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
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

// Format date like "June 2, 2025" and time like "15:30"
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
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
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-5 left-4 z-10 p-2"
            >
                <Ionicons name="arrow-back" size={32} color="#65DA84" />
            </TouchableOpacity>

            <ScrollView className="flex-1 bg-slate-50 px-5 pt-16">
                <View className="items-center pb-5">
                    <View ref={viewRef} className="w-full bg-white rounded-2xl shadow-lg p-8 mb-5">
                        {/* Header Section */}
                        <View className="items-center mb-6 pb-4">
                            <Text className="text-3xl font-bold text-green-600 text-center mb-2">
                                Certificate of Participation
                            </Text>
                            <View className="w-full h-px bg-gray-200 mb-3" />
                        </View>

                        {/* Personal Information */}
                        <Text className="text-xl text-gray-600 text-center">
                            This certifies that
                        </Text>
                        <View className="items-center mb-6">
                            <Text className="text-2xl font-semibold text-green-600 text-center mb-1">
                                {name}
                            </Text>
                            <Text className="text-base text-gray-600 text-center">
                                {email}
                            </Text>
                        </View>

                        {/* Status Section */}
                        <View className="items-center mb-6">
                            <Text className="text-xl text-gray-700 text-center mb-1">
                                has participated as a
                            </Text>
                            <Text className="text-xl font-bold text-blue-600 text-center">
                                {statusText}
                            </Text>
                        </View>

                        {/* Event Details */}
                        <View className="items-center mb-6 bg-gray-50 rounded-lg p-4">
                            <Text className="text-lg font-semibold text-gray-700 text-center mb-2">
                                in the {eventType}
                            </Text>
                            <Text className="text-xl font-bold text-gray-900 text-center mb-3">
                                {event?.eventName}
                            </Text>

                            <View className="items-center space-y-2">
                                <View className="flex-row items-center">
                                    <Text className="text-base text-gray-700 text-center">
                                        📍 {event?.locationName}
                                    </Text>
                                </View>
                                <Text className="text-base text-gray-700 text-center">
                                    in {event?.cityName.trim()}
                                </Text>

                                <View className="mt-3 space-y-1">
                                    <View className="flex-row items-center justify-center">
                                        <Text className="text-base text-gray-700 text-center mr-1"> 📅</Text>
                                        <Text className="text-base text-gray-700 text-center">
                                            Start: {formatDate(event?.startDatetime)} at {formatTime(event?.startDatetime)}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center justify-center">
                                        <Text className="text-base text-gray-700 text-center mr-1">📅</Text>
                                        <Text className="text-base text-gray-700 text-center">
                                            End: {formatDate(event?.endDatetime)} at {formatTime(event?.endDatetime)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Teams Section */}
                        {teamsText ? (
                            <View className="items-center mb-6 bg-blue-50 rounded-lg p-4">
                                <Text className="text-base text-gray-800 text-center leading-6">
                                    {teamsText}
                                </Text>
                            </View>
                        ) : null}

                        {/* Footer Section */}
                        <View className="items-center border-t border-gray-200 pt-4">
                            <Text className="text-sm text-gray-600 text-center mb-2">
                                Issued on: {dateText}
                            </Text>
                            <Text className="text-sm font-medium text-gray-500 text-center italic">
                                🏅 Certificate generated by Sportify
                            </Text>
                        </View>
                    </View>

                    {/* Download/Share Button */}
                    <TouchableOpacity
                        onPress={shareCertificate}
                        className="flex-row items-center justify-center bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg shadow-md active:scale-95"
                    >
                        <Ionicons name="download-outline" size={20} color="white" className="mr-2" />
                        <Ionicons name="share-social-outline" size={20} color="white" className="mr-2" />
                        <Text className="text-white font-bold text-base ml-2">
                            Download or Share Certificate
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    );
}