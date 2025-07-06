import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import DiaryScreen from '../screens/DiaryScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceDetails from '../screens/PlaceDetails';
import ReviewsScreen from '../screens/ReviewsScreen';
import AllPlacesScreen from '../screens/AllPlacesScreen';
import TravelPlansScreen from '../screens/TravelPlansScreen';
import PlanDetailScreen from '../screens/PlanDetail';
import NotificationScreen from '../screens/NotificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const homeName = "Home";
const mapName = " Map";
const diaryName = "Diary";
const favoiteName = "Favorite";
const profileName = "Profile";

function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={homeName}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => 
          focused ? (
            <View style={{
              width: '100%',
              alignItems: 'center', 
              justifyContent: 'center',
              // marginTop: 5,
            }}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#22B37A',
                  minWidth: 50,
                  textAlign: 'center',
                }}
              >
                {route.name}
              </Text>
              <View style={{
                borderBottomWidth: 2, 
                borderBottomColor: '#22B37A',
                minWidth: 15,
                marginTop: -3,
              }} />
            </View>
          ) : (
            <Icon name={
              route.name === homeName ? 'home-outline' :
              route.name === mapName ? 'location-outline' :
              route.name === favoiteName ? 'heart-outline' : 
              route.name === diaryName ? 'book-outline' : 
              'person-outline'
            } size={28} color={color} />
          ),
          tabBarLabel: ({ focused }) => focused ? null : <Text style={{ fontSize: 12 }}>{route.name}</Text>,
          tabBarActiveTintColor: '#22B37A',
          tabBarInactiveTintColor: 'black',
          tabBarShowLabel: false, // ซ่อน Label
          // tabBarLabelStyle: {
          //   fontSize: 14,
          // },
          tabBarStyle: {
            height: 60,
            paddingBottom: 10,
            paddingTop: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            position: 'absolute',
            borderRadius: 55,
            margin: 30,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 5,
          },
          tabBarItemStyle: {
            width: 100,
            alignItems: 'center',
            justifyContent: 'center',
          },
          keyboardHidesTabBar: true,
        })}
      >
      <Tab.Screen name={homeName} component={HomeStackNavigator} options={{ headerShown: false }}/>
      <Tab.Screen name={mapName} component={MapStackNavigator} options={{ headerShown: false }}/>
      <Tab.Screen name={favoiteName} component={FavoriteStackNavigator} options={{ headerShown: false }}/>
      <Tab.Screen name={diaryName} component={DiaryScreen} options={{ headerShown: false }}/>
      <Tab.Screen name={profileName} component={ProfileScreen} options={{ headerShown: false }}/>
    </Tab.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="AllPlaces" component={AllPlacesScreen} />
      <Stack.Screen name="PlaceDetails" component={PlaceDetails} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="TravelPlans" component={TravelPlansScreen} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />

    </Stack.Navigator>
  );
}

function MapStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapScreen" component={MapScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="PlaceDetails" component={PlaceDetails} />
    </Stack.Navigator>
  );
}

function FavoriteStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoriteScreen" component={FavoriteScreen} />
      <Stack.Screen name="PlaceDetails" component={PlaceDetails} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
    </Stack.Navigator>
  );
}

export default function MainContainer() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
