// mockData.js
const events = [
  {
    id: "1",
    type: "event",
    title: "⚽ LionHeart vs TigerHeart – Clash of the...",
    date: "15/3/2025 To 16/3/2025",
    location: "Haifa",
    image: "https://example.com/football.png",
    sport: "football",
    gender: "male",
  },
  {
    id: "2",
    type: "event",
    title: "LionHeart",
    date: "",
    location: "Haifa",
    image: "https://example.com/lionheart.png",
    sport: "football",
    gender: "male",
  },
  {
    id: "3",
    type: "event",
    title: "Elite Running Marathon",
    date: "15/3/2025 To 16/3/2025",
    location: "Haifa",
    image: "https://example.com/marathon.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "4",
    type: "event",
    title: "Tennis Championship 2025",
    date: "20/4/2025 To 22/4/2025",
    location: "Tel Aviv",
    image: "https://example.com/tennis.png",
    sport: "tennis",
    gender: "female",
  },
  {
    id: "5",
    type: "event",
    title: "Basketball Finals",
    date: "10/5/2025 To 12/5/2025",
    location: "Jerusalem",
    image: "https://example.com/basketball.png",
    sport: "basketball",
    gender: "male",
  },
  {
    id: "6",
    type: "event",
    title: "Football Friendly Match",
    date: "25/5/2025",
    location: "Haifa",
    image: "https://example.com/football2.png",
    sport: "football",
    gender: "both",
  },
  {
    id: "7",
    type: "event",
    title: "Marathon for Charity",
    date: "1/6/2025",
    location: "Tel Aviv",
    image: "https://example.com/marathon2.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "8",
    type: "event",
    title: "Marathon for Charity",
    date: "1/6/2025",
    location: "Tel Aviv",
    image: "https://example.com/marathon2.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "9",
    type: "event",
    title: "Marathon for Charity",
    date: "1/6/2025",
    location: "Tel Aviv",
    image: "https://example.com/marathon2.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "10",
    type: "event",
    title: "Marathon for Charity",
    date: "1/6/2025",
    location: "Tel Aviv",
    image: "https://example.com/marathon2.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "11",
    type: "event",
    title: "Marathon for Charity",
    date: "1/6/2025",
    location: "Tel Aviv",
    image: "https://example.com/marathon2.png",
    sport: "running",
    gender: "both",
  },
];

const groups = [
  {
    id: "1",
    type: "group",
    name: "Haifa Football Club",
    location: "Haifa",
    image: "https://example.com/haifa_fc.png",
    sport: "football",
    gender: "male",
  },
  {
    id: "2",
    type: "group",
    name: "Tel Aviv Runners",
    location: "Tel Aviv",
    image: "https://example.com/tel_aviv_runners.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "3",
    type: "group",
    name: "Jerusalem Tennis League",
    location: "Jerusalem",
    image: "https://example.com/jerusalem_tennis.png",
    sport: "tennis",
    gender: "both",
  },
  {
    id: "4",
    type: "group",
    name: "Basketball Enthusiasts",
    location: "Haifa",
    image: "https://example.com/basketball_group.png",
    sport: "basketball",
    gender: "male",
  },
  {
    id: "5",
    type: "group",
    name: "Women’s Football Team",
    location: "Tel Aviv",
    image: "https://example.com/womens_football.png",
    sport: "football",
    gender: "female",
  },
  {
    id: "7",
    type: "group",
    name: "Running for Fun",
    location: "Jerusalem",
    image: "https://example.com/running_group.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "8",
    type: "group",
    name: "Running for Fun",
    location: "Jerusalem",
    image: "https://example.com/running_group.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "9",
    type: "group",
    name: "Running for Fun",
    location: "Jerusalem",
    image: "https://example.com/running_group.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "10",
    type: "group",
    name: "Running for Fun",
    location: "Jerusalem",
    image: "https://example.com/running_group.png",
    sport: "running",
    gender: "both",
  },
  {
    id: "11",
    type: "group",
    name: "Running for Fun",
    location: "Jerusalem",
    image: "https://example.com/running_group.png",
    sport: "running",
    gender: "both",
  },
];

// export const fetchItems = async (type, page, limit, filters = {}) => {
//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   let data = type === "event" ? events : groups;

//   if (Object.keys(filters).length > 0) {
//     data = data.filter((item) => {
//       return Object.entries(filters).every(([key, value]) => {
//         if (!value) return true;
//         if (key === "date") {
//           const itemDate = item.date ? new Date(item.date.split(" To ")[0]) : null;
//           const filterDate = value ? new Date(value) : null;
//           return itemDate && filterDate
//             ? itemDate.toDateString() === filterDate.toDateString()
//             : true;
//         }
//         return item[key] === value;
//       });
//     });
//   }

//   const start = (page - 1) * limit;
//   const end = start + limit;
//   const paginatedData = data.slice(start, end);

//   return {
//     items: paginatedData,
//     hasMore: end < data.length,
//   };
// };

// // export const searchItems = async (query, type) => {
// //   await new Promise((resolve) => setTimeout(resolve, 500));

// //   let data = type === "event" ? events : groups; // Filter based on type
// //   const filteredItems = data.filter((item) =>
// //     (item.title || item.name).toLowerCase().includes(query.toLowerCase())
// //   );

// //   return filteredItems.slice(0, 5); // Limit to 5 suggestions
// // };


// export const searchItems = async (query, type) => {
//   await new Promise((resolve) => setTimeout(resolve, 500));

//   let data = type === "event" ? events : groups;
//   const filteredItems = data.filter((item) =>
//     (item.title || item.name).toLowerCase().startsWith(query.toLowerCase()) // Match at the start
//   );

//   return filteredItems.slice(0, 5); // Limit to 5 suggestions
// };


export const fetchItems = async (type, page, limit, filters = {}, query = "") => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let data = type === "event" ? events : groups;

  // Apply search query filter
  if (query) {
    data = data.filter((item) =>
      (item.title || item.name).toLowerCase().startsWith(query.toLowerCase())
    );
  }

  // Apply additional filters (e.g., gender, sport)
  if (Object.keys(filters).length > 0) {
    data = data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        if (key === "date") {
          const itemDate = item.date ? new Date(item.date.split(" To ")[0]) : null;
          const filterDate = value ? new Date(value) : null;
          return itemDate && filterDate
            ? itemDate.toDateString() === filterDate.toDateString()
            : true;
        }
        return item[key] === value;
      });
    });
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = data.slice(start, end);

  return {
    items: paginatedData,
    hasMore: end < data.length,
  };
};

export const searchItems = async (query, type, filters = {}) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = type === "event" ? events : groups;

  // Apply search query filter
  data = data.filter((item) =>
    (item.title || item.name).toLowerCase().startsWith(query.toLowerCase())
  );

  // Apply additional filters
  if (Object.keys(filters).length > 0) {
    data = data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        if (key === "date") {
          const itemDate = item.date ? new Date(item.date.split(" To ")[0]) : null;
          const filterDate = value ? new Date(value) : null;
          return itemDate && filterDate
            ? itemDate.toDateString() === filterDate.toDateString()
            : true;
        }
        return item[key] === value;
      });
    });
  }

  return data.slice(0, 5); // Limit to 5 suggestions
};