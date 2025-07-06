import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Linking,
  TextInput,
} from "react-native";
import MapboxGL from '@rnmapbox/maps';
import * as Location from "expo-location";
import { FontAwesome } from '@expo/vector-icons';
import { apiClient, getUserId } from '../../services/apiClient';

MapboxGL.setAccessToken("pk.eyJ1IjoiZGFueXIyNCIsImEiOiJjbTlxcXR6N3AweXRwMnFvbjQxcXdkb2M5In0.6uqKEfsvg1ULU7X_mkeIVQ");

const MapScreen = () => {
  const [places, setPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const slideAnim = useState(new Animated.Value(300))[0];
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    };

    const unsubscribe = navigation.addListener('focus', fetchLocation);
    fetchLocation();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const placesResponse = await apiClient.get('places/');
        setPlaces(placesResponse.data);
        setFilteredPlaces(placesResponse.data);

        console.log("Places fetched:", placesResponse.data);
      } catch (error) {
        console.error("Error fetching places:", error);
        setPlaces([]);
        setFilteredPlaces([]);
      }
    };

    const fetchFavorites = async () => {
      try {
        const response = await apiClient.get("favplaces/");
        setFavoritePlaces(
          response.data.map((fav) => ({
            ...fav,
            place_id: fav.place_id,
            fav_id: fav.fav_id,
          }))
        );
      } catch (error) {
        console.error("Error fetching favorite places:", error);
      }
    };

    fetchPlaces();
    fetchFavorites();
  }, []);

  const handleMarkerPress = (place) => {
    setSelectedPlace(place);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleNavigate = () => {
    if (selectedPlace) {
      const { lat, lng } = selectedPlace;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const closeDetails = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedPlace(null));
  };

  const toggleFavorite = async (placeId) => {
    const userId = await getUserId();
    const favItem = favoritePlaces.find((fav) => fav.place_id === placeId);

    try {
      if (favItem) {
        await apiClient.delete(`favplaces/${favItem.fav_id}/`);
        setFavoritePlaces(
          favoritePlaces.filter((fav) => fav.fav_id !== favItem.fav_id)
        );
      } else {
        const response = await apiClient.post("favplaces/", {
          user_id: userId,
          place_id: placeId,
        });
        setFavoritePlaces([...favoritePlaces, response.data]);
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const isFavorite = (placeId) => {
    return favoritePlaces.some((fav) => fav.place_id === placeId);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = places.filter((place) =>
        place.place_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPlaces(filtered);
    } else {
      setFilteredPlaces(places);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>แผนที่สถานที่</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาสถานที่..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#888"
        />
      </View>

      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={13}
          centerCoordinate={
            userLocation
              ? [userLocation.longitude, userLocation.latitude]
              : [100.5355006, 13.8247917]
          }
        />

        {userLocation && (
            <MapboxGL.MarkerView
                id="user-location"
                coordinate={[userLocation.longitude, userLocation.latitude]}
            >
                <Image source={require('../../assets/user-marker.png')} style={styles.placeMarker} />
            </MapboxGL.MarkerView>
        )}

        {filteredPlaces.map((place) => {
          if (!place.lat || !place.lng) return null;

          const isSelected = selectedPlace && selectedPlace.place_id === place.place_id;

          return (
            <MapboxGL.MarkerView
              key={place.place_id.toString()}
              id={place.place_id.toString()}
              coordinate={[parseFloat(place.lng), parseFloat(place.lat)]}
            >
              <TouchableOpacity onPress={() => handleMarkerPress(place)}>
                {isSelected && (
                  <View style={styles.markerLabel}>
                    <Text style={styles.markerLabelText}>{place.place_name}</Text>
                  </View>
                )}
                <Image
                  source={require("../../assets/place-marker.png")}
                  style={{ width: 40, height: 40, resizeMode: "contain" }}
                />
              </TouchableOpacity>
            </MapboxGL.MarkerView>
          );
        })}
      </MapboxGL.MapView>

      {selectedPlace && (
        <TouchableOpacity
          style={[styles.detailContainer, { transform: [{ translateY: slideAnim }] }]}
          onPress={() => navigation.navigate("PlaceDetails", { id: selectedPlace.place_id })}
        >
          <Image source={{ uri: selectedPlace.place_img }} style={styles.detailImage} />
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{selectedPlace.place_name}</Text>
            <Text style={styles.detailDesc} numberOfLines={2} ellipsizeMode="tail">
              {selectedPlace.description}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => navigation.navigate("Reviews", { id: selectedPlace.place_id })}
              >
                <Text style={styles.buttonText}>รีวิว <FontAwesome name="star" size={16} color="#28a745" /></Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
                <Text style={styles.buttonText}>นำทาง <FontAwesome name="location-arrow" size={16} color="#28a745" /></Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {selectedPlace && (
        <View style={styles.outerButtonRow}>
          <TouchableOpacity
            style={[styles.addButton, isFavorite(selectedPlace.place_id) && { backgroundColor: "#adadad" }]}
            onPress={() => toggleFavorite(selectedPlace.place_id)}
          >
            <Text style={styles.buttonAddText}>
              {isFavorite(selectedPlace.place_id) ? 'เพิ่มแล้ว ' : 'เพิ่ม '}
              <FontAwesome name="heart" size={20} color="white" />
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={closeDetails}>
            <FontAwesome name="times" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingTop: 20, paddingHorizontal: 15, paddingBottom: 10 },
  headerText: { fontSize: 18, fontFamily: 'NotoSansThai_700Bold', marginTop: 30 },
  searchContainer: {
    position: "absolute",
    top: 100,
    left: 15,
    right: 15,
    zIndex: 10,
  },
  searchInput: {
    height: 50,
    backgroundColor: "#fff",
    borderColor: "#28a745",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'NotoSansThai_400Regular',
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  map: {
    flex: 1,
  },
  placeMarker: {
    width: 30,
    height: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  detailContainer: {
    position: "absolute",
    bottom: 160,
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 5,
    marginHorizontal: "2.5%",
  },
  detailImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
    justifyContent: "center",
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansThai_700Bold',
    color: "#28a745",
  },
  detailDesc: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
    fontFamily: 'NotoSansThai_400Regular',
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  navigateButton: {
    padding: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#28a745",
    flex: 1,
    marginRight: 4,
    alignItems: "center",
  },
  reviewButton: {
    padding: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#28a745",
    flex: 1,
    marginRight: 4,
    alignItems: "center",
  },
  outerButtonRow: {
    position: "absolute",
    bottom: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  closeButton: {
    backgroundColor: "#AD0000",
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonAddText: {
    color: "white",
    fontSize: 16,
    flex: 1,
    textAlign: "center",
    fontFamily: 'NotoSansThai_700Bold',
  },
  markerLabel: {
    backgroundColor: "#28a745",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 5,
    maxWidth: 120,
  },
  markerLabelText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: 'NotoSansThai_700Bold',
    textAlign: "center",
  },  
});

export default MapScreen;
