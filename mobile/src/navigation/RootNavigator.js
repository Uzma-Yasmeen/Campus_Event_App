import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import ParticipantsScreen from '../screens/ParticipantsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TabIcon from '../components/TabIcon';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.ink
  }
};

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTitleStyle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  headerTintColor: theme.colors.ink,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: theme.colors.bg }
};

function Tabs() {
  const { isOrganizer } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border
        },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />
      })}
    >
      <Tab.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
      <Tab.Screen name="Registered" component={MyEventsScreen} options={{ title: 'Registered' }} />
      {isOrganizer && (
        <Tab.Screen name="Create" component={CreateEventScreen} options={{ title: 'Create' }} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={theme.colors.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="EventDetails"
              component={EventDetailsScreen}
              options={{ title: 'Event' }}
            />
            <Stack.Screen
              name="Participants"
              component={ParticipantsScreen}
              options={{ title: 'Participants' }}
            />
            <Stack.Screen
              name="EditEvent"
              component={CreateEventScreen}
              options={{ title: 'Edit event' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Create account' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }
});
