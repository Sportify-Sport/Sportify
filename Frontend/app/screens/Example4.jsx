// import React, { useEffect, useState } from "react";
// import { View, Text } from "react-native";
// import { apiFetch } from "../utils/apiUtils"; // Use apiFetch for token-based API calls

// const MyEvents = () => {
//   const [events, setEvents] = useState([]);

//   useEffect(() => {
//     const fetchEvents = async () => {
//       const response = await apiFetch("https://your-api.com/events");
//       if (response) {
//         const data = await response.json();
//         setEvents(data);
//       } else {
//         // Handle no data or show guest message
//         setEvents([]);
//       }
//     };

//     fetchEvents();
//   }, []);

//   return (
//     <View>
//       <Text>My Events</Text>
//       {events.length === 0 ? (
//         <Text>No events or login required</Text>
//       ) : (
//         events.map((event, index) => (
//           <Text key={index}>{event.name}</Text>
//         ))
//       )}
//     </View>
//   );
// };

// export default MyEvents;
