// components/common/AlertNotification.jsx
import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

export default function AlertNotification({ message, type = 'error', visible, onHide }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Automatically hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onHide) onHide();
        });
      }, 3000);
      
      // Clear the timer on unmount or when visibility changes
      return () => clearTimeout(timer);
    }
  }, [visible, opacity, onHide]);
  
  if (!visible) return null;
  
  const backgroundColor = type === 'error' ? '#f8d7da' : '#d4edda';
  const textColor = type === 'error' ? '#721c24' : '#155724';
  const borderColor = type === 'error' ? '#f5c6cb' : '#c3e6cb';
  
  return (
    <Animated.View 
      className={`absolute top-4 left-4 right-4 z-50 rounded-lg p-4 border`}
      style={{ 
        opacity,
        backgroundColor,
        borderColor
      }}
    >
      <Text style={{ color: textColor }} className="font-medium text-center">
        {message}
      </Text>
    </Animated.View>
  );
}
