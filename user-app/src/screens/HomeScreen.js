import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
  Dimensions,
  Alert 
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { apiClient, getUserId } from "../../services/apiClient";

const { width } = Dimensions.get("window");
const SPACING = 10;
const ITEM_WIDTH = width - SPACING * 2;

const HomeScreen = ({ navigation }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlan, setShowPlan] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);

  const banners = [
    require("../../assets/banner1.png"),
    require("../../assets/banner2.png"),
    require("../../assets/banner3.png"),
  ];

  const emergencyNumbers = [
    {
      id: 1,
      icon: require("../../assets/flammable.png"),
      number: "199",
      description: "แจ้งเหตุไฟไหม้/ดับเพลิง",
    },
    {
      id: 2,
      icon: require("../../assets/ambulance.png"),
      number: "1669",
      description: "สถาบันการแพทย์ฉุกเฉิน",
    },
    {
      id: 3,
      icon: require("../../assets/car-accident.png"),
      number: "1543",
      description: "อุบัติเหตุบนทางด่วน",
    },
    {
      id: 4,
      icon: require("../../assets/car-lost.png"),
      number: "1192",
      description: "แจ้งรถหาย/ถูกขโมย",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await getUserId();
        const [placesRes, reviewsRes, favRes, recommendRes] = await Promise.all([
          apiClient.get("places/"),
          apiClient.get("reviews/"),
          apiClient.get("favplaces/"),
          apiClient.get(`recommend-places/${userId}/`),
        ]);
  
        const reviewsData = reviewsRes.data;
        const placesData = placesRes.data.map((place) => {
          const approvedReviews = reviewsData.filter(
            (review) =>
              review.place_id === place.place_id &&
              review.review_status === "approved"
          );
          return {
            ...place,
            reviews: approvedReviews,
            avg_rating: calculateAverageRating(approvedReviews),
          };
        });
  
        setPlaces(placesData);
        setFavoritePlaces(favRes.data);
        setRecommendedPlaces(recommendRes.data.recommended_places || []);
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("เกิดข้อผิดพลาด", "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);  

  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + review.review_rate, 0);
    return (total / reviews.length).toFixed(1);
  };

  const toggleFavorite = async (placeId) => {
    const userId = await getUserId(); // Get the user_id
    const favItem = favoritePlaces.find((fav) => fav.place_id === placeId);

    try {
      if (favItem) {
        // If favItem exists, it means this place is already a favorite. We need to remove it using fav_id.
        await apiClient.delete(`favplaces/${favItem.fav_id}/`); // Remove using fav_id
        setFavoritePlaces(
          favoritePlaces.filter((fav) => fav.fav_id !== favItem.fav_id)
        ); // Update local state
      } else {
        // If it's not in favorites, add it by sending place_id and user_id.
        const response = await apiClient.post("favplaces/", {
          user_id: userId,
          place_id: placeId,
        });
        setFavoritePlaces([...favoritePlaces, response.data]); // Add to the local favorites list
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  const renderBanner = ({ item }) => (
    <Image source={item} style={styles.bannerImage} />
  );

  const dotPosition = Animated.divide(scrollX, ITEM_WIDTH);

  const togglePlanButton = () => {
    setShowPlan((prevShowPlan) => {
      const newValue = !prevShowPlan;
      Animated.timing(slideAnim, {
        toValue: newValue ? 0 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return newValue;
    });
  };

  if (loading) {
    return (
      <View style={styles.containerload}>
        <ActivityIndicator size="large" color="#22B37A" />
      </View>
    );
  }

  return (
    <View style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>หน้าหลัก</Text>
        </View>
        {/* ส่วนของ banner */}
        <FlatList
          data={banners}
          renderItem={renderBanner}
          keyExtractor={(item, index) => index.toString()}
          paddingHorizontal={5}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          decelerationRate="fast"
          snapToInterval={ITEM_WIDTH}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
        />
        <View style={styles.dotContainer}>
          {banners.map((_, index) => {
            const opacity = dotPosition.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return (
              <Animated.View key={index} style={[styles.dot, { opacity }]} />
            );
          })}
        </View>

        {/* ส่วนของ สถานที่แนะนำ */}
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>สถานที่แนะนำ</Text>
            {places.length > 1 && (
              <TouchableOpacity
                onPress={() => navigation.navigate("AllPlaces")}
              >
                <Text style={styles.viewAll}>ดูทั้งหมด</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={recommendedPlaces.slice(0, 5)}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image
                  source={{
                    uri: `https://api-4x16.onrender.com${item.place_img}`,
                  }}
                  style={styles.image}
                />
                <TouchableOpacity
                  style={styles.heartIcon}
                  onPress={() => toggleFavorite(item.place_id)}
                >
                  <FontAwesome
                    name={
                      favoritePlaces.some(
                        (fav) => fav.place_id === item.place_id
                      )
                        ? "heart"
                        : "heart-o"
                    }
                    size={20}
                    color="#FF5A5F"
                  />
                </TouchableOpacity>

                <Text style={styles.rating}>
                  <FontAwesome name="star" size={12} color="#000" />{" "}
                  {item.avg_rating !== null
                    ? parseFloat(item.avg_rating).toFixed(1).replace(/\.0$/, "")
                    : "ยังไม่มีคะแนน"}
                  /5
                  {/* <Text style={styles.ratinggrey}>
                    {" "}
                    ({item.reviews.length ?? 0})
                  </Text> */}
                </Text>
                <Text
                  style={styles.cardTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.place_name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("PlaceDetails", { id: item.place_id })
                  }
                >
                  <Text style={styles.buttonText}>รายละเอียด</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.place_id.toString()}
            horizontal
            paddingVertical={4}
          />

          {/* ส่วน เบอร์โทรฉุกเฉิน */}
          <View style={styles.emergencyBox}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 10,
                marginBottom: 10,
              }}
            >
              <Image
                source={require("../../assets/phone.png")}
                style={styles.emergencyIcon}
              />
              <Text style={styles.emergencyTitle}>เบอร์โทรฉุกเฉิน</Text>
            </View>
            {emergencyNumbers.map((item) => (
              <View key={item.id} style={styles.emergencyItem}>
                <Image source={item.icon} style={styles.emergencyIcon} />
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.emergencyNumber}>{item.number}</Text>
                  <Text style={styles.emergencyText}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        {showPlan && (
          <TouchableOpacity onPress={() => navigation.navigate("TravelPlans")}>
            <Animated.View
              style={[
                styles.planButton,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <FontAwesome name="map" size={20} color="white" />
              <Text style={styles.planText}>วางแผน</Text>
            </Animated.View>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.addButton} onPress={togglePlanButton}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  containerload: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: { padding: 16, paddingTop: -10, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1, paddingBottom: 100, backgroundColor: "#fff" },
  header: { paddingTop: 20, paddingHorizontal: 15, paddingBottom: 10 },
  headerText: {
    fontSize: 18,
    fontFamily: "NotoSansThai_700Bold",
    marginTop: 30,
  },
  bannerImage: {
    width: ITEM_WIDTH,
    height: 180,
    resizeMode: "cover",
    borderRadius: 10,
    marginTop: 15,
  },
  dotContainer: {
    osition: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#888",
    marginHorizontal: 4,
  },
  sectionTitle: { fontSize: 18, fontFamily: "NotoSansThai_700Bold" },
  card: {
    width: 150,
    padding: 10,
    marginRight: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 10,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  viewAll: {
    fontSize: 14,
    color: "#22B37A",
    fontFamily: "NotoSansThai_700Bold",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "NotoSansThai_700Bold",
    marginTop: 5,
    flex: 1,
    maxWidth: 140,
    overflow: "hidden",
  },
  heartIcon: { position: "absolute", top: 15, right: 15, zIndex: 1 },
  rating: {
    fontSize: 12,
    color: "black",
    marginTop: 5,
    fontFamily: "NotoSansThai_400Regular",
  },
  ratinggrey: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
    fontFamily: "NotoSansThai_400Regular",
  },
  buttonText: {
    color: "black",
    marginTop: 10,
    fontFamily: "NotoSansThai_400Regular",
  },
  emergencyBox: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 15,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 1,
    borderColor: "#ddd",
  },
  emergencyTitle: {
    fontSize: 16,
    fontFamily: "NotoSansThai_700Bold",
  },
  emergencyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#22B37A",
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  emergencyDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyNumber: {
    fontSize: 16,
    fontFamily: "NotoSansThai_700Bold",
    color: "black",
    marginRight: 10,
  },
  emergencyText: {
    fontSize: 14,
    fontFamily: "NotoSansThai_400Regular",
    color: "#888",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    alignItems: "flex-end",
  },
  planButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  planText: {
    color: "white",
    fontFamily: "NotoSansThai_700Bold",
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: "#28a745",
    padding: 5,
    borderRadius: 50,
    alignItems: "center",
    width: 55,
    height: 55,
    justifyContent: "center",
    elevation: 5,
  },
  addText: { color: "white", fontSize: 30, fontWeight: "bold" },
});

export default HomeScreen;
