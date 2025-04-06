// import React, { useState } from "react";
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
// import { useRouter } from "expo-router";
// import { useFilters } from "../context/FilterContext";
//  import getApiBaseUrl from "../config/apiConfig";

// const SearchFilter = () => {
//   const router = useRouter();
//   const { filters, setFilters } = useFilters();

//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [isFocus, setIsFocus] = useState({
//     sport: false,
//     city: false,
//     age: false,
//     gender: false,
//   });

//   const filterOptions = {
//     sport: [
//       { label: "None", value: null },
//       { label: "Football", value: "football" },
//       { label: "Basketball", value: "basketball" },
//       { label: "Tennis", value: "tennis" },
//     ],
//     city: [
//       { label: "None", value: null },
//       { label: "Haifa", value: "haifa" },
//       { label: "Tel Aviv", value: "tel-aviv" },
//       { label: "Jerusalem", value: "jerusalem" },
//     ],
//     age: [
//       { label: "None", value: null },
//       { label: "Under 18", value: "under-18" },
//       { label: "18-25", value: "18-25" },
//       { label: "26-40", value: "26-40" },
//     ],
//     gender: [
//       { label: "None", value: null },
//       { label: "Male", value: "male" },
//       { label: "Female", value: "female" },
//     ],
//   };

//   const handleDateChange = (event, selectedDate) => {
//     setShowDatePicker(Platform.OS === "ios");
//     if (selectedDate) {
//       setFilters({ ...filters, date: selectedDate });
//     } else {
//       setFilters({ ...filters, date: null });
//     }
//   };

//   const handleResetFilters = () => {
//     setFilters({
//       sport: null,
//       city: null,
//       age: null,
//       gender: null,
//       date: null,
//     });
//   };

//   const handleApplyFilters = () => {
//     // Gather all selected filters into a query object
//     const queryParams = {};
//     if (filters.sport) queryParams.sport = filters.sport;
//     if (filters.city) queryParams.city = filters.city;
//     if (filters.age) queryParams.age = filters.age;
//     if (filters.gender) queryParams.gender = filters.gender;
//     if (filters.date) queryParams.date = filters.date.toISOString();

//     // Simulate an API request with the filters
//      const baseUrl = getApiBaseUrl();
//     const url = new URL(`${baseUrl}/api/search`);
//     Object.keys(queryParams).forEach((key) =>
//       url.searchParams.append(key, queryParams[key])
//     );

//     console.log("Simulated API Request URL:", url.toString());

//     // Navigate back to SearchScreen
//     router.back();
//   };

//   return (
//     <ScrollView className="flex-1 bg-white p-5" contentContainerStyle={{ paddingBottom: 30 }}>
//       <TouchableOpacity className="mb-4" onPress={() => router.back()}>
//         <Ionicons name="arrow-back" size={24} color="black" />
//       </TouchableOpacity>

//       <Text className="text-2xl font-bold mb-6">Filter By</Text>

//       <View className="mb-6">
//         <Text className="text-lg font-semibold mb-2">Sport</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.sport && { borderColor: "#10B981" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={styles.selectedTextStyle}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.sport}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.sport ? "Select sport" : "..."}
//           searchPlaceholder="Search..."
//           value={filters.sport}
//           onFocus={() => setIsFocus({ ...isFocus, sport: true })}
//           onBlur={() => setIsFocus({ ...isFocus, sport: false })}
//           onChange={(item) => {
//             setFilters({ ...filters, sport: item.value });
//             setIsFocus({ ...isFocus, sport: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="tennisball-outline"
//               size={20}
//               color={isFocus.sport ? "#10B981" : "gray"}
//             />
//           )}
//         />
//       </View>

//       <View className="mb-6">
//         <Text className="text-lg font-semibold mb-2">City</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.city && { borderColor: "#10B981" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={styles.selectedTextStyle}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.city}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.city ? "Select city" : "..."}
//           searchPlaceholder="Search..."
//           value={filters.city}
//           onFocus={() => setIsFocus({ ...isFocus, city: true })}
//           onBlur={() => setIsFocus({ ...isFocus, city: false })}
//           onChange={(item) => {
//             setFilters({ ...filters, city: item.value });
//             setIsFocus({ ...isFocus, city: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="location-outline"
//               size={20}
//               color={isFocus.city ? "#10B981" : "gray"}
//             />
//           )}
//         />
//       </View>

//       <View className="mb-6">
//         <Text className="text-lg font-semibold mb-2">Age</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.age && { borderColor: "#10B981" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={styles.selectedTextStyle}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.age}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.age ? "Select age" : "..."}
//           searchPlaceholder="Search..."
//           value={filters.age}
//           onFocus={() => setIsFocus({ ...isFocus, age: true })}
//           onBlur={() => setIsFocus({ ...isFocus, age: false })}
//           onChange={(item) => {
//             setFilters({ ...filters, age: item.value });
//             setIsFocus({ ...isFocus, age: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="people-outline"
//               size={20}
//               color={isFocus.age ? "#10B981" : "gray"}
//             />
//           )}
//         />
//       </View>

//       <View className="mb-6">
//         <Text className="text-lg font-semibold mb-2">Gender</Text>
//         <Dropdown
//           style={[styles.dropdown, isFocus.gender && { borderColor: "#10B981" }]}
//           placeholderStyle={styles.placeholderStyle}
//           selectedTextStyle={styles.selectedTextStyle}
//           inputSearchStyle={styles.inputSearchStyle}
//           iconStyle={styles.iconStyle}
//           data={filterOptions.gender}
//           search
//           maxHeight={300}
//           labelField="label"
//           valueField="value"
//           placeholder={!isFocus.gender ? "Select gender" : "..."}
//           searchPlaceholder="Search..."
//           value={filters.gender}
//           onFocus={() => setIsFocus({ ...isFocus, gender: true })}
//           onBlur={() => setIsFocus({ ...isFocus, gender: false })}
//           onChange={(item) => {
//             setFilters({ ...filters, gender: item.value });
//             setIsFocus({ ...isFocus, gender: false });
//           }}
//           renderLeftIcon={() => (
//             <Ionicons
//               name="person-outline"
//               size={20}
//               color={isFocus.gender ? "#10B981" : "gray"}
//             />
//           )}
//         />
//       </View>

//       <View className="mb-6">
//         <Text className="text-lg font-semibold mb-2">Start Date</Text>
//         <TouchableOpacity
//           className="flex-row items-center justify-between border border-gray-300 rounded-lg p-3"
//           onPress={() => setShowDatePicker(true)}
//         >
//           <Text className="text-gray-600">
//             {filters.date ? filters.date.toLocaleDateString() : "dd/mm/yyyy"}
//           </Text>
//           <Ionicons name="calendar-outline" size={24} color="#10B981" />
//         </TouchableOpacity>
//       </View>

//       {showDatePicker && (
//         <DateTimePicker
//           value={filters.date || new Date()}
//           mode="date"
//           display="default"
//           onChange={handleDateChange}
//         />
//       )}

//       <TouchableOpacity
//         className="bg-gray-500 py-3 rounded-lg items-center mt-4"
//         onPress={handleResetFilters}
//       >
//         <Text className="text-white font-bold text-lg">Reset Filters</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         className="bg-green-500 py-3 rounded-lg items-center mt-4"
//         onPress={handleApplyFilters}
//       >
//         <Text className="text-white font-bold text-lg">Apply Filters</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// const styles = {
//   dropdown: {
//     height: 50,
//     borderColor: "gray",
//     borderWidth: 0.5,
//     borderRadius: 8,
//     paddingHorizontal: 8,
//   },
//   placeholderStyle: {
//     fontSize: 16,
//     color: "gray",
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
//   },
// };

// export default SearchFilter;



import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFilters } from "../context/FilterContext";
import getApiBaseUrl from "../config/apiConfig";

const SearchFilter = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams(); // Get the type parameter
  const { filters, setFilters } = useFilters();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocus, setIsFocus] = useState({
    sport: false,
    city: false,
    age: false,
    gender: false,
  });

  const filterOptions = {
    sport: [
      { label: "None", value: null },
      { label: "Football", value: "football" },
      { label: "Basketball", value: "basketball" },
      { label: "Tennis", value: "tennis" },
    ],
    city: [
      { label: "None", value: null },
      { label: "Haifa", value: "haifa" },
      { label: "Tel Aviv", value: "tel-aviv" },
      { label: "Jerusalem", value: "jerusalem" },
    ],
    age: [
      { label: "None", value: null },
      { label: "Under 18", value: "under-18" },
      { label: "18-25", value: "18-25" },
      { label: "26-40", value: "26-40" },
    ],
    gender: [
      { label: "None", value: null },
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
    ],
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFilters({ ...filters, date: selectedDate });
    } else {
      setFilters({ ...filters, date: null });
    }
  };

  const handleResetFilters = () => {
    setFilters({
      sport: null,
      city: null,
      age: null,
      gender: null,
      date: null,
    });
  };

  const handleApplyFilters = () => {
    const queryParams = {};
    if (filters.sport) queryParams.sport = filters.sport;
    if (filters.city) queryParams.city = filters.city;
    if (filters.age) queryParams.age = filters.age;
    if (filters.gender) queryParams.gender = filters.gender;
    if (type === "event" && filters.date) queryParams.date = filters.date.toISOString();

    const baseUrl = getApiBaseUrl();
    const url = new URL(`${baseUrl}/api/search`);
    Object.keys(queryParams).forEach((key) =>
      url.searchParams.append(key, queryParams[key])
    );

    console.log("Simulated API Request URL:", url.toString());

    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-white p-5" contentContainerStyle={{ paddingBottom: 30 }}>
      <TouchableOpacity className="mb-4" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text className="text-2xl font-bold mb-6">Filter By</Text>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Sport</Text>
        <Dropdown
          style={[styles.dropdown, isFocus.sport && { borderColor: "#10B981" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={filterOptions.sport}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus.sport ? "Select sport" : "..."}
          searchPlaceholder="Search..."
          value={filters.sport}
          onFocus={() => setIsFocus({ ...isFocus, sport: true })}
          onBlur={() => setIsFocus({ ...isFocus, sport: false })}
          onChange={(item) => {
            setFilters({ ...filters, sport: item.value });
            setIsFocus({ ...isFocus, sport: false });
          }}
          renderLeftIcon={() => (
            <Ionicons
              name="tennisball-outline"
              size={20}
              color={isFocus.sport ? "#10B981" : "gray"}
            />
          )}
        />
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">City</Text>
        <Dropdown
          style={[styles.dropdown, isFocus.city && { borderColor: "#10B981" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={filterOptions.city}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus.city ? "Select city" : "..."}
          searchPlaceholder="Search..."
          value={filters.city}
          onFocus={() => setIsFocus({ ...isFocus, city: true })}
          onBlur={() => setIsFocus({ ...isFocus, city: false })}
          onChange={(item) => {
            setFilters({ ...filters, city: item.value });
            setIsFocus({ ...isFocus, city: false });
          }}
          renderLeftIcon={() => (
            <Ionicons
              name="location-outline"
              size={20}
              color={isFocus.city ? "#10B981" : "gray"}
            />
          )}
        />
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Age</Text>
        <Dropdown
          style={[styles.dropdown, isFocus.age && { borderColor: "#10B981" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={filterOptions.age}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus.age ? "Select age" : "..."}
          searchPlaceholder="Search..."
          value={filters.age}
          onFocus={() => setIsFocus({ ...isFocus, age: true })}
          onBlur={() => setIsFocus({ ...isFocus, age: false })}
          onChange={(item) => {
            setFilters({ ...filters, age: item.value });
            setIsFocus({ ...isFocus, age: false });
          }}
          renderLeftIcon={() => (
            <Ionicons
              name="people-outline"
              size={20}
              color={isFocus.age ? "#10B981" : "gray"}
            />
          )}
        />
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Gender</Text>
        <Dropdown
          style={[styles.dropdown, isFocus.gender && { borderColor: "#10B981" }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={filterOptions.gender}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus.gender ? "Select gender" : "..."}
          searchPlaceholder="Search..."
          value={filters.gender}
          onFocus={() => setIsFocus({ ...isFocus, gender: true })}
          onBlur={() => setIsFocus({ ...isFocus, gender: false })}
          onChange={(item) => {
            setFilters({ ...filters, gender: item.value });
            setIsFocus({ ...isFocus, gender: false });
          }}
          renderLeftIcon={() => (
            <Ionicons
              name="person-outline"
              size={20}
              color={isFocus.gender ? "#10B981" : "gray"}
            />
          )}
        />
      </View>

      {/* Show Date Picker only for events */}
      {type !== "group" && (
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2">Start Date</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between border border-gray-300 rounded-lg p-3"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-gray-600">
              {filters.date ? filters.date.toLocaleDateString() : "dd/mm/yyyy"}
            </Text>
            <Ionicons name="calendar-outline" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && type !== "group" && (
        <DateTimePicker
          value={filters.date || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <TouchableOpacity
        className="bg-gray-500 py-3 rounded-lg items-center mt-4"
        onPress={handleResetFilters}
      >
        <Text className="text-white font-bold text-lg">Reset Filters</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-green-500 py-3 rounded-lg items-center mt-4"
        onPress={handleApplyFilters}
      >
        <Text className="text-white font-bold text-lg">Apply Filters</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "gray",
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
};

export default SearchFilter;