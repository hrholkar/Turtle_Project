import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/constants/colors';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15_000,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version of the app is ready. Do you want to download it?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Update',
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                },
              },
            ]
          );
        }
      } catch (error) {
        console.log(`Error fetching latest Expo update: ${error}`);
      }
    }

    // Only check for updates in production (not in Expo Go)
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bg.primary },
            headerTintColor: Colors.text.primary,
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            contentStyle: { backgroundColor: Colors.bg.primary },
            animation: 'ios_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="turtle/[id]"
            options={{ title: 'Turtle Profile', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="pending/[id]"
            options={{ title: 'Verify Sighting', headerBackTitle: '' }}
          />
          <Stack.Screen
            name="result"
            options={{ title: 'Identification Result', headerBackTitle: '' }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
