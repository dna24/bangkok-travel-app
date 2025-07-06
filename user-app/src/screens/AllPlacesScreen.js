import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';
import { FontAwesome } from '@expo/vector-icons';
import { apiClient, getUserId } from '../../services/apiClient';

const AllPlacesScreen = ({ navigation }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [open, setOpen] = useState(false);
  const [favoritePlaces, setFavoritePlaces] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placesResponse, reviewsResponse, favoritesResponse] = await Promise.all([
          apiClient.get("places/"),
          apiClient.get("reviews/"),
          apiClient.get("favplaces/"),
        ]);
  
        const placesData = placesResponse.data;
        const reviewsData = reviewsResponse.data;
        const favoritesData = favoritesResponse.data;
  
        const updatedPlaces = placesData.map(place => {
          const approvedReviews = reviewsData.filter(
            review => review.place_id === place.place_id && review.review_status === "approved"
          );
          return {
            ...place,
            reviews: approvedReviews,
            avg_rating: calculateAverageRating(approvedReviews),
          };
        });
  
        setPlaces(updatedPlaces);
        setFavoritePlaces(
          favoritesData.map((fav) => ({
            ...fav,
            place_id: fav.place_id,
            fav_id: fav.fav_id,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
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

  const filteredPlaces = places.filter(
    place => 
      place.place_name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedType === "" || place.place_type === selectedType)
  );

  const toggleFavorite = async (placeId) => {
    const userId = await getUserId(); // Get the user_id
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22B37A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>สถานที่ทั้งหมด</Text>
      </View>
      <TextInput
        style={styles.searchBar}
        placeholder="ค้นหาสถานที่..."
        value={search}
        onChangeText={setSearch}
      />

      <DropDownPicker
        open={open}
        value={selectedType}
        items={[
          { label: 'ทุกประเภท', value: '' },
          { label: 'พิพิธภัณฑ์ศิลปะ', value: 'พิพิธภัณฑ์ศิลปะ' },
          { label: 'พิพิธภัณฑ์ประวัติศาสตร์', value: 'พิพิธภัณฑ์ประวัติศาสตร์' },
          { label: 'พิพิธภัณฑ์วิทยาศาสตร์', value: 'พิพิธภัณฑ์วิทยาศาสตร์' },
          { label: 'พิพิธภัณฑ์ธรรมชาติวิทยา', value: 'พิพิธภัณฑ์ธรรมชาติวิทยา' },
          { label: 'พิพิธภัณฑ์วัฒนธรรม', value: 'พิพิธภัณฑ์วัฒนธรรม' },
          { label: 'พิพิธภัณฑ์สัตว์น้ำ', value: 'พิพิธภัณฑ์สัตว์น้ำ' },
          { label: 'ศูนย์การเรียนรู้ท้องถิ่น', value: 'ศูนย์การเรียนรู้ท้องถิ่น' },
          { label: 'ศูนย์การเรียนรู้ทางวิชาการ', value: 'ศูนย์การเรียนรู้ทางวิชาการ' },
        ]}
        setOpen={setOpen}
        setValue={setSelectedType}
        placeholder="เลือกประเภทสถานที่"
        style={styles.inputpicker}
        dropDownContainerStyle={styles.dropdown}
        listItemContainerStyle={styles.listItem}
      />

      <FlatList
        data={filteredPlaces}
        renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('PlaceDetails', { id: item.place_id })}>
          <View style={styles.card}>
            <Image source={{ uri: item.place_img }} style={styles.image} />
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.place_name}</Text>
              <Text style={styles.placeType}>{item.place_type}</Text>
              <Text style={styles.rating}>
                <FontAwesome name="star" size={12} color="#000" /> {item.avg_rating ?? "ยังไม่มีคะแนน"}/5 ({item.reviews.length} รีวิว)
              </Text>
            </View>  
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
          </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.place_id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 100, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingBottom: 20 },
  headerText: {
    fontSize: 18,
    fontFamily: "NotoSansThai_700Bold",
    marginTop: 30,
  },
  searchBar: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#28a745",
    fontFamily: 'NotoSansThai_400Regular',
  },
  title: { fontSize: 18, fontFamily: 'NotoSansThai_700Bold', marginBottom: 10 },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 1,
    alignItems: "center",
    marginRight: 1,
    marginLeft: 1
  },
  image: { width: 100, height: 100, borderRadius: 10, marginRight: 20 },
  textContainer: { flex: 1, justifyContent: "flex-start" },
  cardTitle: { fontSize: 16, fontFamily: 'NotoSansThai_700Bold', },
  placeType: { 
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#22B37A",
    fontFamily: 'NotoSansThai_400Regular',
    marginTop: 5,
    alignSelf: "flex-start",
    color: "gray",
  },
  rating: { fontSize: 12, color: "gray", marginTop: 5, fontFamily: 'NotoSansThai_400Regular' },
  detailsButton: { color: "#22B37A", marginTop: 10 },
  heartIcon: { position: "absolute", right: 10, bottom: 10, zIndex: 1 },
  inputpicker: { width: '100%', padding: 10, borderWidth: 1, borderColor: "#28a745", borderRadius: 10, marginBottom: 10, backgroundColor: '#FFF'},
  dropdown: { width: '100%', borderWidth: 1, borderColor: "#28a745", borderRadius: 10, backgroundColor: '#FFF', maxHeight: 320 },
  listItem: { height: 35 },
});

export default AllPlacesScreen;
