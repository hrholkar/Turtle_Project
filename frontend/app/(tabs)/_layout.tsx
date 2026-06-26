import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

function TabIcon({
  name,
  color,
  focused,
  badgeCount,
}: {
  name: string;
  color: string;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={tabIconStyles.wrapper}>
      <Ionicons name={name as any} size={24} color={color} />
      {badgeCount != null && badgeCount > 0 && (
        <View style={tabIconStyles.badge}>
          <Text style={tabIconStyles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.status.error,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.bg.secondary,
          borderTopColor: Colors.border.subtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Colors.accent.blue,
        tabBarInactiveTintColor: Colors.text.disabled,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        headerStyle: { backgroundColor: Colors.bg.primary, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: { fontWeight: '600', color: Colors.text.primary },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'TurtleTrack',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Identify',
          headerTitle: 'Identify Turtle',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'scan' : 'scan-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="turtles"
        options={{
          title: 'Directory',
          headerTitle: 'Turtle Directory',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'list' : 'list-outline'} color={color} focused={focused} />
          ),
        }}
      />
      {/* pending.tsx kept on disk but hidden from navigation */}
      <Tabs.Screen name="pending" options={{ href: null }} />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Analytics',
          headerTitle: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
