// import React, { useEffect } from "react";
// import { View, Text } from "react-native";
// import { useAuth } from "../context/AuthContext";
// import SportComponent from "./SportComponent";
// import MyGroups from "./MyGroups";
// import MyEvents from "./MyEvents";

// const MyHomePage = () => {
//   const { user, logout } = useAuth();

//   // This will run when the user logs out or when the token expires
//   useEffect(() => {
//     if (!user) {
//       // Reset to Guest mode and perform necessary actions
//       // Optionally handle logout here if needed
//       // logout();  // Logout is optional depending on your case
//     }
//   }, [user]);

//   return (
//     <View>
//       {/* Show user or guest message */}
//       <Text>Hello {user ? user.name : "Guest"}</Text>

//       {/* Render the components */}
//       <SportComponent /> {/* No login required */}
//       <MyGroups /> {/* Requires login */}
//       <MyEvents /> {/* Requires login */}
//     </View>
//   );
// };

// export default MyHomePage;
