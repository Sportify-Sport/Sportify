import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFilters } from "../context/FilterContext";
const SearchFilter = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { filters, setFilters } = useFilters();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocus, setIsFocus] = useState({
    sport: false,
    age: false,
    gender: false,
  });
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Local state to manage dropdown and date picker values
  const [sport, setSport] = useState(filters.sport || null);
  const [city, setCity] = useState(filters.city || null);
  const [age, setAge] = useState(filters.age || null);
  const [gender, setGender] = useState(filters.gender || null);
  const [startDate, setStartDate] = useState(
    filters.startDate ? new Date(filters.startDate) : null
  );

  // Sync local state with filters from context when the screen mounts or filters change
  useEffect(() => {
    setSport(filters.sport || null);
    setCity(filters.city || null);
    setAge(filters.age || null);
    setGender(filters.gender || null);
    setStartDate(filters.startDate ? new Date(filters.startDate) : null);
  }, [filters]);

  // Search cities dynamically from the gov API
  const searchCities = async (query) => {
    if (query.length === 0) {
      setCitySuggestions([]);
      return;
    }

    const CityApiUrl = `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&q=${encodeURIComponent(
      query
    )}&limit=5`;

    try {
      const response = await fetch(CityApiUrl);
      const data = await response.json();
      if (data.success && data.result && data.result.records) {
        const suggestions = data.result.records
          .filter((record) => record["city_name_en"] && record["city_name_en"].trim() !== "")
          .map((record) => ({
            id: record._id,
            name: record["city_name_en"],
          }));
        setCitySuggestions(suggestions);
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching cities from gov API:", error);
      setCitySuggestions([]);
    }
  };

  const filterOptions = {
    sport: [
      { label: "None", value: null },
      { label: "Football", value: "1" },
      { label: "Basketball", value: "2" },
      { label: "Marathon", value: "3" },
    ],
    age: [
      { label: "None", value: null },
      { label: "13-18", value: "13-18" },
      { label: "18-30", value: "18-30" },
      { label: "30+", value: "30+" },
    ],
    gender: [
      { label: "None", value: null },
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Mixed", value: "Mixed" },
    ],
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
    } else {
      setStartDate(null);
    }
  };

  const handleResetFilters = () => {
    setSport(null);
    setCity(null);
    setCityQuery("");
    setAge(null);
    setGender(null);
    setStartDate(null);
    setFilters({
      sport: null,
      city: null,
      age: null,
      gender: null,
      startDate: null,
    });
  };

  const handleApplyFilters = () => {
    setFilters({
      sport,
      city,
      age,
      gender,
      startDate: startDate ? startDate.toISOString() : null,
    });
    router.back();
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity.id);
    setCityQuery(selectedCity.name);
    setShowCitySuggestions(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 bg-white"
    >
      <ScrollView 
        className="flex-1 p-5" 
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity className="mb-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#065f46" />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-green-800 mb-6">Filter By</Text>

        {/* Sport Filter */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-green-700 mb-2">Sport</Text>
          <View className={`relative border ${isFocus.sport ? "border-green-800" : "border-green-200"} rounded-lg bg-green-50`}>
            <View className="flex-row items-center px-3">
              <Ionicons
                name="tennisball-outline"
                size={20}
                color={isFocus.sport ? "#065f46" : "#9CA3AF"}
                className="mr-2"
              />
              <View className="flex-1">
                <Text className={`py-3 ${sport ? "text-green-800" : "text-gray-400"}`}>
                  {sport ? filterOptions.sport.find(item => item.value === sport)?.label : "Select sport"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </View>
            <TouchableOpacity 
              className="absolute inset-0"
              onPress={() => setIsFocus({ ...isFocus, sport: !isFocus.sport })}
            />
            {isFocus.sport && (
              <View className="mt-1 border border-green-200 rounded-lg bg-white max-h-60">
                <FlatList
                  data={filterOptions.sport}
                  keyExtractor={(item) => item.value || "none"}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`px-4 py-3 ${sport === item.value ? "bg-green-100" : ""}`}
                      onPress={() => {
                        setSport(item.value);
                        setIsFocus({ ...isFocus, sport: false });
                      }}
                    >
                      <Text className={`${sport === item.value ? "text-green-800 font-semibold" : "text-gray-700"}`}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </View>

        {/* City Filter - Modified to show suggestions immediately */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-green-700 mb-2">City</Text>
          <View className="relative">
            <View className="flex-row items-center border border-green-200 rounded-lg bg-green-50 px-3">
              <Ionicons
                name="location-outline"
                size={20}
                color={city ? "#065f46" : "#9CA3AF"}
                className="mr-2"
              />
              <TextInput
                className="flex-1 py-3 text-green-800"
                placeholder="Search city..."
                placeholderTextColor="#9CA3AF"
                value={cityQuery}
                onChangeText={(text) => {
                  setCityQuery(text);
                  searchCities(text);
                  setShowCitySuggestions(text.length > 0);
                }}
                onFocus={() => setShowCitySuggestions(cityQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
              />
              {cityQuery && (
                <TouchableOpacity onPress={() => {
                  setCityQuery("");
                  setCity(null);
                  setCitySuggestions([]);
                }}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            {showCitySuggestions && (
              <View className="mt-1 border border-green-200 rounded-lg bg-white max-h-60">
                {citySuggestions.length > 0 ? (
                  <FlatList
                    data={citySuggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className="px-4 py-3 border-b border-green-100"
                        onPress={() => handleCitySelect(item)}
                      >
                        <Text className="text-gray-700">{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View className="px-4 py-3">
                    <Text className="text-gray-500">No cities found</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* The rest of the content */}
        <View>
          {/* Age Filter */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-green-700 mb-2">Age</Text>
            <View className={`relative border ${isFocus.age ? "border-green-800" : "border-green-200"} rounded-lg bg-green-50`}>
              <View className="flex-row items-center px-3">
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={isFocus.age ? "#065f46" : "#9CA3AF"}
                  className="mr-2"
                />
                <View className="flex-1">
                  <Text className={`py-3 ${age ? "text-green-800" : "text-gray-400"}`}>
                    {age ? filterOptions.age.find(item => item.value === age)?.label : "Select age group"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </View>
              <TouchableOpacity 
                className="absolute inset-0"
                onPress={() => setIsFocus({ ...isFocus, age: !isFocus.age })}
              />
              {isFocus.age && (
                <View className="mt-1 border border-green-200 rounded-lg bg-white max-h-60">
                  <FlatList
                    data={filterOptions.age}
                    keyExtractor={(item) => item.value || "none"}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className={`px-4 py-3 ${age === item.value ? "bg-green-100" : ""}`}
                        onPress={() => {
                          setAge(item.value);
                          setIsFocus({ ...isFocus, age: false });
                        }}
                      >
                        <Text className={`${age === item.value ? "text-green-800 font-semibold" : "text-gray-700"}`}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Gender Filter */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-green-700 mb-2">Gender</Text>
            <View className={`relative border ${isFocus.gender ? "border-green-800" : "border-green-200"} rounded-lg bg-green-50`}>
              <View className="flex-row items-center px-3">
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={isFocus.gender ? "#065f46" : "#9CA3AF"}
                  className="mr-2"
                />
                <View className="flex-1">
                  <Text className={`py-3 ${gender ? "text-green-800" : "text-gray-400"}`}>
                    {gender ? filterOptions.gender.find(item => item.value === gender)?.label : "Select gender"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </View>
              <TouchableOpacity 
                className="absolute inset-0"
                onPress={() => setIsFocus({ ...isFocus, gender: !isFocus.gender })}
              />
              {isFocus.gender && (
                <View className="mt-1 border border-green-200 rounded-lg bg-white max-h-60">
                  <FlatList
                    data={filterOptions.gender}
                    keyExtractor={(item) => item.value || "none"}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className={`px-4 py-3 ${gender === item.value ? "bg-green-100" : ""}`}
                        onPress={() => {
                          setGender(item.value);
                          setIsFocus({ ...isFocus, gender: false });
                        }}
                      >
                        <Text className={`${gender === item.value ? "text-green-800 font-semibold" : "text-gray-700"}`}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Date Picker (only for events) */}
          {type !== "group" && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-green-700 mb-2">Start Date</Text>
              <TouchableOpacity
                className="flex-row items-center justify-between border border-green-200 rounded-lg p-3 bg-green-50"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className={`${startDate ? "text-green-800" : "text-gray-400"}`}>
                  {startDate ? startDate.toLocaleDateString() : "Select date"}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#065f46" />
              </TouchableOpacity>
            </View>
          )}
                   {/* Date Picker (only for events) */}
                   {type !== "group" && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-green-700 mb-2">End Date</Text>
              <TouchableOpacity
                className="flex-row items-center justify-between border border-green-200 rounded-lg p-3 bg-green-50"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className={`${startDate ? "text-green-800" : "text-gray-400"}`}>
                  {startDate ? startDate.toLocaleDateString() : "Select date"}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#065f46" />
              </TouchableOpacity>
            </View>
          )}

          {showDatePicker && type !== "group" && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-4 mt-6">
            <TouchableOpacity
              className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
              onPress={handleResetFilters}
            >
              <Text className="text-gray-800 font-bold text-lg">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-green-600 py-3 rounded-lg items-center"
              onPress={handleApplyFilters}
            >
              <Text className="text-white font-bold text-lg">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SearchFilter;