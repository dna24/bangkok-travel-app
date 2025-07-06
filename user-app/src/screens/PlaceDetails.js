import React, { useEffect, useState } from "react";
import { 
    View, Text, Image, ScrollView, ActivityIndicator, 
    StyleSheet, Linking, TouchableOpacity 
} from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

const PlaceDetails = ({ route, navigation }) => {
    const { id } = route.params;
    const [place, setPlaces] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlaceDetails();
    }, [id]);

    const fetchPlaceDetails = async () => {
        try {
            // ดึงข้อมูลสถานที่
            const placeResponse = await apiClient.get(`places/${id}/`);
            setPlaces(placeResponse.data);
    
            // ดึงข้อมูลรีวิวที่เกี่ยวข้องกับสถานที่
            const reviewResponse = await apiClient.get(`reviews/`, { params: { place_id: id } });
            const reviewsData = reviewResponse.data;
    
            const approvedReviews = reviewsData.filter(review => review.place_id === placeResponse.data.place_id && review.review_status === "approved");
            setReviews(approvedReviews);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching places:", error);
            setLoading(false);
        }
    };

    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return null;
        const total = reviews.reduce((sum, review) => sum + review.review_rate, 0);
        return (total / reviews.length).toFixed(1);
    };

    const avgRating = calculateAverageRating(reviews);

    if (loading) {
        return (
            <View style={styles.containerload}>
                <ActivityIndicator size="large" color="#22B37A" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.headerText}>รายละเอียดสถานที่</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={styles.backIconContainer}>
                    <FontAwesome name="chevron-left" size={18} color="grey" />
                </View>
            </TouchableOpacity>
            {/* ภาพสถานที่ พร้อมปุ่ม "รีวิว" */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: place.place_img }} style={styles.image} />
                <TouchableOpacity 
                    style={styles.reviewButton} 
                    onPress={() => navigation.navigate("Reviews", { id: place.place_id })}>
                    <Text style={styles.reviewButtonText}>รีวิว</Text>
                </TouchableOpacity>
            </View>

            {/* คะแนนรีวิว */}
            <View style={styles.ratingContainer}>
                <FontAwesome name="star" size={16} color="black" />
                <Text style={styles.ratingText}>
                    {avgRating ?? "ยังไม่มีคะแนน"} / 5
                    ({reviews.length} รีวิว)
                </Text>
            </View>

            {/* ชื่อสถานที่ + ประเภท */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>{place.place_name}</Text>
            </View>
            <View style={styles.headerRow}>
                <Text style={styles.category}>{place.place_type ?? "ไม่มีข้อมูล"}</Text>
            </View>

            {/* ข้อมูลสถานที่ */}
            <View style={styles.infoBox}>
                <Text style={styles.infoText}><Text style={styles.boldText}>ที่อยู่ :</Text> {place.location}</Text>
                <Text style={[styles.infoText, { marginBottom: 2}]}><Text style={styles.boldText}>เวลาทำการ :</Text></Text>
                {place.openning_detail 
                ? place.openning_detail.split(',').map((line, index) => (
                    <Text key={index} style={[styles.infoText, { marginLeft: 40, marginBottom: 2 }]}>{line.trim()}</Text>
                    ))
                : <Text style={styles.infoText}>ไม่มีข้อมูล</Text>
                }
                <Text style={[styles.infoText, { marginTop: 8}]}><Text style={styles.boldText}>รายละเอียด :</Text> {place.description}</Text>
                <Text style={styles.infoText}><Text style={styles.boldText}>ช่องทางการติดต่อ</Text></Text>
                <Text style={styles.infoText}><Text style={styles.boldText}>เบอร์โทร :</Text> {place.phone_number || 'ไม่มีข้อมูล'}</Text>
                <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>
                    <Text style={styles.boldText}>เว็บไซต์ : </Text> 
                    {place.website ? (
                        <TouchableOpacity onPress={() => Linking.openURL(place.website)}>
                            <Text style={ styles.link}>{place.website}</Text>
                        </TouchableOpacity> ) : 'ไม่มีข้อมูล'}
                </Text>
                </View>        
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, padding: 16, paddingBottom: 100, backgroundColor: "#fff" },
    containerload: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    headerText: { fontSize: 18, fontFamily: 'NotoSansThai_700Bold', marginTop: 30, marginBottom: 10 },
    backButton: { position: 'absolute', top: 90, left: 25, zIndex: 1},
    backIconContainer: { 
        backgroundColor: '#fff', 
        borderRadius: 10, 
        padding: 10,
        width: 40,
        height: 40,
        borderWidth: 1, 
        borderColor: "#22B37A" , 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 4 
    },
    backText: { fontSize: 20, color: '#000' },
    imageContainer: {
        position: "relative",
        width: "100%",
    },
    image: {
        width: "100%",
        height: 250,
        borderRadius: 10,
        borderWidth: 1, 
        borderColor: "#22B37A" ,
        shadowColor: '#000', 
    },
    reviewButton: {
        position: "absolute",
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1, 
        borderColor: "#22B37A",
        paddingHorizontal: 28,
        paddingVertical: 8,
        borderRadius: 10,
    },
    reviewButtonText: {
        color: "#22B37A",
        fontSize: 14, 
        fontFamily: 'NotoSansThai_700Bold',  
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    ratingText: {
        fontSize: 14,
        marginLeft: 5,
        fontFamily: 'NotoSansThai_400Regular',
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontFamily: 'NotoSansThai_700Bold',  
    },
    category: {
        fontSize: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1, 
        borderColor: "#22B37A",
        overflow: "hidden",
        fontFamily: 'NotoSansThai_400Regular',
        marginTop: 5,
    },
    detailBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 15,
        borderRadius: 20,
        marginTop: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 1,
        borderColor: "#ddd",
    },
    link: {
        color: "black",
        fontSize: 14,
        fontFamily: 'NotoSansThai_400Regular',
        textDecorationLine: "underline",
        marginBottom: -5,
        marginLeft: 10,
    },
    reviewsTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
    },
    reviewCard: {
        backgroundColor: "#F8F8F8",
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
    },
    reviewUser: {
        fontFamily: 'NotoSansThai_700Bold',
        marginBottom: 5,
    },
    noReview: {
        fontStyle: "italic",
        color: "#999",
    },
    writeReviewButton: {
        backgroundColor: "#007AFF",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 20,
    },
    writeReviewText: {
        color: "#fff",
        fontWeight: "bold",
    },
    infoBox: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 8, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    infoText: { fontSize: 16, marginBottom: 8, marginLeft: 10, fontFamily: 'NotoSansThai_400Regular'},
    boldText: { fontFamily: 'NotoSansThai_700Bold' },
});

export default PlaceDetails;
