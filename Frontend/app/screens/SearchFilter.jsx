// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   Platform,
// } from "react-native";
// import { Dropdown } from "react-native-element-dropdown";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import { useFilters } from "../context/FilterContext";
// import getApiBaseUrl from "../config/apiConfig";

// const SearchFilter = () => {
//   const router = useRouter();
//   const { type } = useLocalSearchParams();
//   const { filters, setFilters } = useFilters();

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [isFocus, setIsFocus] = useState({
//     sport: false,
//     city: false,
//     age: false,
//     gender: false,
//   });
//   const [cityOptions, setCityOptions] = useState([
//     { label: "None", value: null },
//   ]);

//   // Local state to manage dropdown and date picker values
//   const [sport, setSport] = useState(filters.sport || null);
//   const [city, setCity] = useState(filters.city || null);
//   const [age, setAge] = useState(filters.age || null);
//   const [gender, setGender] = useState(filters.gender || null);
//   const [startDate, setStartDate] = useState(filters.startDate ? new Date(filters.startDate) : null);

//   // Sync local state with filters from context when the screen mounts or filters change
//   useEffect(() => {
//     setSport(filters.sport || null);
//     setCity(filters.city || null);
//     setAge(filters.age || null);
//     setGender(filters.gender || null);
//     setStartDate(filters.startDate ? new Date(filters.startDate) : null);
//   }, [filters]);

//   // Fetch city options
//   useEffect(() => {
//     const fetchCities = async () => {
//       try {
//         try {
//           // Fetch from government API
//           const response = await fetch(
//             `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&limit=1000`
//           );
//           const data = await response.json();

//           if (data.success && data.result?.records) {
//             const apiCities = data.result.records
//               // Filter out cities without an English name
//               .filter(record => record.city_name_en && record.city_name_en.trim() !== "")
//               .map(record => ({
//                 label: record.city_name_en,
//                 value: record._id.toString(), // Use the numeric city ID as the value
//               }));

//             // Remove duplicates and sort alphabetically
//             const uniqueCities = [
//               { label: "None", value: null },
//               ...Array.from(new Map(apiCities.map(city => [city.value, city])).values())
//                 .sort((a, b) => a.label.localeCompare(b.label)),
//             ];

//             setCityOptions(uniqueCities);
//             return;
//           }
//         } catch (error) {
//           console.log("Using fallback cities after API failure:", error);
//         }

//         // Fallback to common cities with IDs (manually mapped for fallback)
//         const fallbackCities = [
//           { label: "Tel Aviv", value: "5000" }, // Example IDs (replace with actual IDs if known)
//           { label: "Jerusalem", value: "3000" },
//           { label: "Haifa", value: "4000" },
//         ].sort((a, b) => a.label.localeCompare(b.label));

//         setCityOptions([
//           { label: "None", value: null },
//           ...fallbackCities,
//         ]);
//       } catch (error) {
//         console.error("Error setting up cities:", error);
//         // Minimum fallback
//         setCityOptions([
//           { label: "None", value: null },
//           { label: "Tel Aviv", value: "5000" },
//           { label: "Jerusalem", value: "3000" },
//           { label: "Haifa", value: "4000" },
//         ]);
//       }
//     };

//     fetchCities();
//   }, []);

//   const filterOptions = {
//     sport: [
//       { label: "None", value: null },
//       { label: "Football", value: "1" },
//       { label: "Basketball", value: "2" },
//       { label: "Marathon", value: "3" },
//     ],
//     age: [
//       { label: "None", value: null },
//       { label: "13-18", value: "13-18" },
//       { label: "18-30", value: "18-30" },
//       { label: "30+", value: "30+" },
//     ],
//     gender: [
//       { label: "None", value: null },
//       { label: "Male", value: "Male" },
//       { label: "Female", value: "Female" },
//       { label: "Mixed", value: "Mixed" },
//     ],
//   };

//   const handleDateChange = (event, selectedDate) => {
//     setShowDatePicker(Platform.OS === "ios");
//     if (selectedDate) {
//       setStartDate(selectedDate);
//     } else {
//       setStartDate(null);
//     }
//   };

//   const handleResetFilters = () => {
//     setSport(null);
//     setCity(null);
//     setAge(null);
//     setGender(null);
//     setStartDate(null);
//     setFilters({
//       sport: null,
//       city: null,
//       age: null,
//       gender: null,
//       startDate: null,
//     });
//   };

//   const handleApplyFilters = () => {
//     // Update the filters in context with the current values
//     setFilters({
//       sport,
//       city, // This will now be the city ID (e.g., "5000")
//       age,
//       gender,
//       startDate: startDate ? startDate.toISOString() : null,
//     });

//     // Navigate back to SearchScreen
//     router.back();
//   };

//   return (
//     <ScrollView className="flex-1 bg-white p-5" contentContainerStyle={{ paddingBottom: 30 }}>
//       <TouchableOpacity className="mb-4" onPress={() => router.back()}>
//         <Ionicons name="arrow-back" size={24} color="#065f46" />
//       </TouchableOpacity>

//       <Text className="text-2xl font-bold text-green-800 mb-6">Filter By</Text>

//       {/* Sport Filter */}
//       <View className="mb-6">
//         <Text className="text-lg font-semibold text-green-700 mb-2">Sport</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.sport && { borderColor: "#065f46" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={[styles.selectedTextStyle, { color: '#065f46' }]}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.sport}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.sport ? "Select sport" : "..."}
//           searchPlaceholder="Search..."
//           value={sport}
//           onFocus={() => setIsFocus({ ...isFocus, sport: true })}
//           onBlur={() => setIsFocus({ ...isFocus, sport: false })}
//           onChange={(item) => {
//             setSport(item.value);
//             setIsFocus({ ...isFocus, sport: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="tennisball-outline"
//               size={20}
//               color={isFocus.sport ? "#065f46" : "#9CA3AF"}
//             />
//           )}
//         />
//       </View>

//       {/* City Filter */}
//       <View className="mb-6">
//         <Text className="text-lg font-semibold text-green-700 mb-2">City</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.city && { borderColor: "#065f46" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={[styles.selectedTextStyle, { color: '#065f46' }]}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={cityOptions}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.city ? "Select city" : "..."}
//           searchPlaceholder="Search..."
//           value={city}
//           onFocus={() => setIsFocus({ ...isFocus, city: true })}
//           onBlur={() => setIsFocus({ ...isFocus, city: false })}
//           onChange={(item) => {
//             setCity(item.value);
//             setIsFocus({ ...isFocus, city: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="location-outline"
//               size={20}
//               color={isFocus.city ? "#065f46" : "#9CA3AF"}
//             />
//           )}
//         />
//       </View>

//       {/* Age Filter */}
//       <View className="mb-6">
//         <Text className="text-lg font-semibold text-green-700 mb-2">Age Group</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.age && { borderColor: "#065f46" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={[styles.selectedTextStyle, { color: '#065f46' }]}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.age}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.age ? "Select age group" : "..."}
//           searchPlaceholder="Search..."
//           value={age}
//           onFocus={() => setIsFocus({ ...isFocus, age: true })}
//           onBlur={() => setIsFocus({ ...isFocus, age: false })}
//           onChange={(item) => {
//             setAge(item.value);
//             setIsFocus({ ...isFocus, age: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="people-outline"
//               size={20}
//               color={isFocus.age ? "#065f46" : "#9CA3AF"}
//             />
//           )}
//         />
//       </View>

//       {/* Gender Filter */}
//       <View className="mb-6">
//         <Text className="text-lg font-semibold text-green-700 mb-2">Gender</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.gender && { borderColor: "#065f46" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={[styles.selectedTextStyle, { color: '#065f46' }]}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.gender}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.gender ? "Select gender" : "..."}
//           searchPlaceholder="Search..."
//           value={gender}
//           onFocus={() => setIsFocus({ ...isFocus, gender: true })}
//           onBlur={() => setIsFocus({ ...isFocus, gender: false })}
//           onChange={(item) => {
//             setGender(item.value);
//             setIsFocus({ ...isFocus, gender: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="person-outline"
//               size={20}
//               color={isFocus.gender ? "#065f46" : "#9CA3AF"}
//             />
//           )}
//         />
//       </View>

//       {/* Date Picker (only for events) */}
//       {type !== "group" && (
//         <View className="mb-6">
//           <Text className="text-lg font-semibold text-green-700 mb-2">Start Date</Text>
//           <TouchableOpacity
//             className="flex-row items-center justify-between border border-green-200 rounded-lg p-3"
//             onPress={() => setShowDatePicker(true)}
//           >
//             <Text className="text-green-800">
//               {startDate ? startDate.toLocaleDateString() : "Select date"}
//             </Text>
//             <Ionicons name="calendar-outline" size={24} color="#065f46" />
//           </TouchableOpacity>
//         </View>
//       )}

//       {showDatePicker && type !== "group" && (
//         <DateTimePicker
//           value={startDate || new Date()}
//           mode="date"
//           display="default"
//           onChange={handleDateChange}
//         />
//       )}

//       {/* Action Buttons */}
//       <View className="flex-row space-x-4 mt-6">
//         <TouchableOpacity
//           className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
//           onPress={handleResetFilters}
//         >
//           <Text className="text-gray-800 font-bold text-lg">Reset</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           className="flex-1 bg-green-600 py-3 rounded-lg items-center"
//           onPress={handleApplyFilters}
//         >
//           <Text className="text-white font-bold text-lg">Apply</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = {
//   dropdown: {
//     height: 50,
//     borderColor: "#D1FAE5",
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     backgroundColor: "#F0FDF4",
//   },
//   placeholderStyle: {
//     fontSize: 16,
//     color: "#9CA3AF",
//   },
//   selectedTextStyle: {
//     fontSize: 16,
//   },
//   iconStyle: {
//     width: 20,
//     height: 20,
//   },
//   inputSearchStyle: {
//     height: 40,
//     fontSize: 16,
//     color: "#065f46",
//     backgroundColor: "#F0FDF4",
//   },
// };

// export default SearchFilter;







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
            <Text className="text-lg font-semibold text-green-700 mb-2">Age Group</Text>
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