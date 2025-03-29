// import React, { useEffect, useState } from "react";
// import { View, Text } from "react-native";
// import { apiFetch } from "../utils/apiUtils"; // Use apiFetch for token-based API calls

// const MyGroups = () => {
//   const [groups, setGroups] = useState([]);

//   useEffect(() => {
//     const fetchGroups = async () => {
//       const response = await apiFetch("https://your-api.com/groups");
//       if (response) {
//         const data = await response.json();
//         setGroups(data);
//       } else {
//         // Handle no data or show guest message
//         setGroups([]);
//       }
//     };

//     fetchGroups();
//   }, []);

//   return (
//     <View>
//       <Text>My Groups</Text>
//       {groups.length === 0 ? (
//         <Text>No groups or login required</Text>
//       ) : (
//         groups.map((group, index) => (
//           <Text key={index}>{group.name}</Text>
//         ))
//       )}
//     </View>
//   );
// };

// export default MyGroups;
