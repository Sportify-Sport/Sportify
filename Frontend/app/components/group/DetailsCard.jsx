// components/group/DetailsCard.js
import React from 'react';
import { View, Text } from 'react-native';

export default function DetailsCard({ group, sportsMap }) {
  const formattedGender =
    group.gender === 'M' ? 'Male' :
      group.gender === 'F' ? 'Female' : group.gender || '—';
  return (
    <View>
      <View className="h-px bg-green-400 mb-4" />
      <View className="bg-white p-4 rounded-xl shadow mb-4">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Details</Text>
        <Text className="text-green-800 font-bold text-lg mb-4 leading-relaxed">
          {group.description}
        </Text>
        <View className="space-y-3">
          {[
            ['Sport', sportsMap[group.sportId] || '—'],
            ['City', group.cityName || '—'],
            ['Members', `${group.totalMembers}/${group.maxMemNum}`],
            ['Min Age', group.minAge],
            ['Gender', group.gender],
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between">
              <Text className="text-gray-700 text-lg">{label}</Text>
              <Text className="text-gray-900 font-medium text-lg">{value}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className="h-px bg-green-400 mb-4" />
    </View>
  );
}
