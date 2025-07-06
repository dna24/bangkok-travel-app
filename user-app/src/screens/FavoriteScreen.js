import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { apiClient, getUserId } from "../../services/apiClient";
import { FontAwesome } from "@expo/vector-icons";

const FavoriteScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); // เพิ่ม navigation

  const fetchFavorites = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      const response = await apiClient.get(`/favplaces/`);
      const favoritePlaces = response.data.filter(
        (fav) => fav.user_id === userId
      );

      const placeRequests = favoritePlaces.map((fav) =>
        apiClient.get(`/places/${fav.place_id}/`).then((res) => ({
          ...res.data,
          fav_id: fav.fav_id,
        }))
      );

      const places = await Promise.all(placeRequests);
      setFavorites(places);
    } catch (error) {
      console.error("Error fetching favorite places:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const removeFavorite = async (fav_id) => {
    if (!fav_id) {
      console.error("Favorite ID is undefined");
      return;
    }

    Alert.alert(
      "ยืนยันการลบ",
      "คุณต้องการลบสถานที่นี้ออกจากรายการโปรดหรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          onPress: async () => {
            try {
              await apiClient.delete(`/favplaces/${fav_id}/`);
              setFavorites(favorites.filter((item) => item.fav_id !== fav_id));
            } catch (error) {
              console.error("Error removing favorite:", error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
      return (
          <View style={styles.containerload}>
              <ActivityIndicator size="large" color="#22B37A" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>สถานที่ที่ชื่นชอบ</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.place_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("PlaceDetails", { id: item.place_id })
            } // เพิ่มการนำทาง
          >
            <Image source={{ uri: item.place_img }} style={styles.image} />
            <View style={styles.infoContainer}>
              <Text style={styles.placeName}>{item.place_name}</Text>
              <Text style={styles.placeType}>{item.place_type}</Text>
            </View>
            <TouchableOpacity
              onPress={() => removeFavorite(item.fav_id, item.place_name)}
            >
              <FontAwesome name="heart" size={24} color="#22B37A" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 100,
  },
  header: { paddingTop: 4, paddingBottom: 30 },
  headerText: {
    fontSize: 18,
    fontFamily: "NotoSansThai_700Bold",
    marginTop: 30,
  },
  containerload: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 5, 
    elevation: 5, 
    margin: 10,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  placeName: {
    fontWeight: "bold",
    fontFamily: "NotoSansThai_700Bold",
  },
  placeType: {
    fontSize: 12,
    color: "#22B37A",
    borderWidth: 1,
    borderColor: "#22B37A",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginTop: 5,
    fontFamily: "NotoSansThai_400Regular",
  },
});

export default FavoriteScreen;
