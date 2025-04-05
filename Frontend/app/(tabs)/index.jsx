import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const SLIDE_INTERVAL = 5000;

export default function Index() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  const [slides] = useState([
    { id: '1', title: 'Event One', image: 'https://longgame.sportbusiness.com/wp-content/uploads/2024/01/GettyImages-1244938240-e1705885891186.jpg' },
    { id: '2', title: 'Event Two', image: 'https://www.partstown.com/about-us/wp-content/uploads/2022/10/World-Cup-Soccer-Photo.jpg' },
    { id: '3', title: 'Event Three', image: 'https://lh3.googleusercontent.com/aoVDl6oZtr_4Yhb_bDeG7Vh5c2mtq0wzPsCJ5gmBMBPta7R84uwOl97Uf1L3p5NEJBz-8nFoA5bv=w1440-ns-nd-rj' },
    { id: '4', title: 'Event Four', image: 'https://images.squarespace-cdn.com/content/v1/5e18bb1a4e7d940d7e0195fa/bb19401b-34e1-42ad-87ba-1cc725eaba1c/2024_Eugene_Marathon_Nelson_07.jpg' },
  ]);

  const [sports] = useState([
    { id: 'football', name: 'Football', image: 'https://images.unsplash.com/photo-1552318965-6e6be7484ada?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'basketball', name: 'Basketball', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'marathon', name: 'Marathon', image: 'https://images.unsplash.com/photo-1518770503887-693a00951e1a?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  ]);

  const [myEvents] = useState([
    { id: 'e1', name: 'Marathon Dash', image: 'https://assets-chicagomarathon-com.s3.amazonaws.com/wp-content/uploads/2024/12/Runner-information.jpg', date: '2025-04-10', sport: 'Marathon' },
    { id: 'e2', name: 'City Football', image: 'https://www.nbc.com/sites/nbcblog/files/styles/scale_1280/public/2024/07/paris-2024-olympics-soccer.jpg', date: '2025-04-15', sport: 'Football' },
    { id: 'e3', name: 'Court Battle', image: 'https://www.sportico.com/wp-content/uploads/2023/09/USATSI_20331080-e1695073916227.jpg?w=1280&h=720&crop=1', date: '2025-04-20', sport: 'Basketball' },
    { id: 'e4', name: 'Night Run', image: 'https://www.roadid.com/cdn/shop/articles/marathon-runners-blurred.jpg?v=1613687381&width=1500', date: '2025-04-25', sport: 'Marathon' },
  ]);

  const [myGroups] = useState([
    { id: 'g1', name: 'Runners Club', image: 'https://res.cloudinary.com/peloton-cycle/image/fetch/c_fill,dpr_1.0,w_1024,h_768,x_2262,y_1379/f_auto/q_auto/https://images.ctfassets.net/6ilvqec50fal/FbOXaCWxwuI975XgxlDms/1d9bc48af213a35b62fa2dc8a1dbb362/Running_Marathon.jpg', sport: 'Marathon' },
    { id: 'g2', name: 'Hoop Dreams', image: 'https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,f_jpg,h_276,q_60,w_400/v1/clients/indiana/BASKETBALL_EXP_HEADER3_a1c1bd64-e003-4443-a1a5-e72b92172ed7.jpg', sport: 'Basketball' },
    { id: 'g3', name: 'Goal Getters', image: 'https://assets.goal.com/images/v3/getty-2201476691/crop/MM5DKMBQGQ5DEOBRGU5G433XMU5DAORVGIYQ====/GettyImages-2201476691.jpg?auto=webp&format=pjpg&width=3840&quality=60', sport: 'Football' },
    { id: 'g4', name: 'Night Sprinters', image: 'https://images.everydayhealth.com/images/healthy-living/fitness/what-happens-to-your-body-when-you-run-a-marathon-1440x810.jpg', sport: 'Marathon' },
  ]);

  const slideRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => setToken(t));
  }, []);

  const goPrev = () => {
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    setCurrentIndex(prevIndex);
    slideRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  };

  const goNext = () => {
    const nextIndex = (currentIndex + 1) % slides.length;
    setCurrentIndex(nextIndex);
    slideRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  useEffect(() => {
    const interval = setInterval(goNext, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const renderSlide = ({ item }) => (
    <View className="w-full" style={{ width }}>
      <Image source={{ uri: item.image }} className="w-full h-48 rounded-lg" />
      <View className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
        <Text className="text-white">{item.title}</Text>
      </View>
    </View>
  );

  const renderSport = ({ item }) => (
    <View className="items-center mx-2">
      <Image source={{ uri: item.image }} className="w-16 h-16 rounded-full" />
      <Text className="mt-1 text-sm text-gray-700">{item.name}</Text>
    </View>
  );

  const renderMyEvent = (item) => (
    <TouchableOpacity key={item.id} onPress={() => token && router.replace('/myevents')} disabled={!token}>
      <View className={`flex-row items-center rounded-lg shadow px-4 py-2 m-1 ${token ? 'bg-white' : 'bg-gray-100'}`}>
        <Image source={{ uri: item.image }} className="w-12 h-12 rounded" />
        <View className="ml-3">
          <Text className={`${token ? 'font-semibold text-black' : 'text-gray-500'}`}>{item.name}</Text>
          <Text className="text-gray-500 text-sm">{item.date}</Text>
          <Text className="text-gray-500 text-sm">{item.sport}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMyGroup = (item) => (
    <TouchableOpacity key={item.id} onPress={() => token && router.replace('/mygroups')} disabled={!token}>
      <View className={`flex-row items-center rounded-lg shadow px-4 py-2 m-1 ${token ? 'bg-white' : 'bg-gray-100'}`}>
        <Image source={{ uri: item.image }} className="w-12 h-12 rounded" />
        <View className="ml-3">
          <Text className={`${token ? 'font-semibold text-black' : 'text-gray-500'}`}>{item.name}</Text>
          <Text className="text-gray-500 text-sm">{item.sport}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-3xl font-bold">
          Welcome, {token ? 'User FullName' : 'guest'}!
        </Text>
        {!token && (
          <TouchableOpacity
            className="bg-[#65DA84] px-4 py-2 rounded-full"
            onPress={() => router.replace('/screens/Login')}
          >
            <Text className="text-white">Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event Recommendations */}
      <View className="mb-6">
        <Text className="text-xl font-semibold mb-2">Event Recommendations</Text>
        <View className="relative">
          <FlatList
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            ref={slideRef}
          />
          <TouchableOpacity onPress={goPrev} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full">
            <Text className="text-white text-xl">‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full">
            <Text className="text-white text-xl">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sports Section */}
      <View className="mb-6">
        <Text className="text-xl font-semibold mb-2">Sports</Text>
        <FlatList
          data={sports}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderSport}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* My Events */}
      <View className="mb-6">
        <TouchableOpacity
          className="flex-row items-center mb-2"
          onPress={() => token && router.replace('/myevents')}
          disabled={!token}
        >
          <Text className={`text-xl font-semibold ${token ? '' : 'text-gray-400'}`}>My Events</Text>
          <Text className={`${token ? 'text-[#65DA84]' : 'text-gray-400'} ml-1`}>›</Text>
        </TouchableOpacity>
        <View className="h-40">
          <ScrollView showsVerticalScrollIndicator={false}>
            {token
              ? myEvents.map(renderMyEvent)
              : <View className="flex-1 justify-center items-center py-8"><Text className="text-gray-500">Sign in to see your events</Text></View>
            }
          </ScrollView>
        </View>
      </View>

      {/* My Groups */}
      <View className="mb-6">
        <TouchableOpacity
          className="flex-row items-center mb-2"
          onPress={() => token && router.replace('/mygroups')}
          disabled={!token}
        >
          <Text className={`text-xl font-semibold ${token ? '' : 'text-gray-400'}`}>My Groups</Text>
          <Text className={`${token ? 'text-[#65DA84]' : 'text-gray-400'} ml-1`}>›</Text>
        </TouchableOpacity>
        <View className="h-40">
          <ScrollView showsVerticalScrollIndicator={false}>
            {token
              ? myGroups.map(renderMyGroup)
              : <View className="flex-1 justify-center items-center py-8"><Text className="text-gray-500">Sign in to see your groups</Text></View>
            }
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}
