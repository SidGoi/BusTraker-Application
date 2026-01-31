import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import './global.css'

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('bus_session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        
        // Get the top-level folder name (e.g., '(user)', 'login')
        const currentRoot = segments[0];

        setTimeout(() => {
          if (!session) {
            // Only redirect to login if we aren't already on a login screen
            if (currentRoot !== 'login' && currentRoot !== 'admin-login' && currentRoot !== 'super-admin-login') {
              router.replace('/login');
            }
          } else {
            // Determine target path based on role
            let targetPath = '/(user)/dashboard';
            let targetRoot = '(user)';

            if (session.role === 'Admin') {
              targetPath = '/(admin)/dashboard';
              targetRoot = '(admin)';
            } else if (session.role === 'SuperAdmin') {
              targetPath = '/(super)/dashboard';
              targetRoot = '(super)';
            }

            // ONLY redirect if the user is not already in the correct group
            if (currentRoot !== targetRoot) {
              router.replace(targetPath as any);
            }
          }
          setIsReady(true);
        }, 100);
      } catch (e) {
        console.error("Auth Init Error", e);
        setIsReady(true);
      }
    };

    initializeAuth();
  }, [segments]); // Add segments here to react to path changes

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="admin-login" />
      <Stack.Screen name="super-admin-login" />
      <Stack.Screen name="(user)/dashboard" />
      <Stack.Screen name="(admin)/dashboard" />
      <Stack.Screen name="(super)/dashboard" />
    </Stack>
  );
}