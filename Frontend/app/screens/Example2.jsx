// import React, { useEffect, useState } from "react";
// import { View, Text } from "react-native";

// const SportComponent = () => {
//   const [sports, setSports] = useState([]);

//   useEffect(() => {
//     const fetchSports = async () => {
//       try {
//         const response = await fetch("https://your-api.com/sports");
//         const data = await response.json();
//         setSports(data);
//       } catch (error) {
//         console.error("Error fetching sports:", error);
//       }
//     };

//     fetchSports();
//   }, []);

//   return (
//     <View>
//       <Text>Sport List</Text>
//       {sports.map((sport, index) => (
//         <Text key={index}>{sport.name}</Text>
//       ))}
//     </View>
//   );
// };

// export default SportComponent;
