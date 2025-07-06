import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, FlatList, Animated, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; 
import { apiClient, getUserId } from '../../services/apiClient';
import ReviewForm from '../component/ReviewForm';

const BASE_URL = "https://api-4x16.onrender.com";  

const ReviewsScreen = ({ navigation, route }) => {
    const { id } = route.params;
    const [place, setPlace] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [createReview, setCreateReview] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [expanded, setExpanded] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageModalVisible, setImageModalVisible] = useState(false);

    useEffect(() => {
        fetchPlaceDetails();
        fetchUserId();
    }, [id]);

    const fetchPlaceDetails = async () => {
        try {
            // ดึงข้อมูลสถานที่
            const placeResponse = await apiClient.get(`places/${id}/`);
            setPlace(placeResponse.data);
    
            // ดึงข้อมูลรีวิวที่เกี่ยวข้องกับสถานที่
            const reviewResponse = await apiClient.get('reviews/', { params: { place_id: id } });
            const reviewsData = reviewResponse.data;
    
            const approvedReviews = reviewsData.filter(review => review.place_id === placeResponse.data.place_id && review.review_status === "approved");
            const sortedReviews = approvedReviews.sort((a, b) => b.review_id - a.review_id);

            setReviews(sortedReviews);
    
            // ดึงข้อมูลผู้ใช้งาน
            const userResponse = await apiClient.get('users_list/', { params: { place_id: id } });
            const userData = userResponse.data;
            
            const userMap = userData.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {});
            setUsers(userMap);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const fetchUserId = async () => {
        try {
            const userId = await getUserId();
            setCurrentUserId(userId);
        } catch (error) {
            console.error('Error fetching user ID:', error);
        }
    };

    const calculateAverageRating = () => {
        if (!reviews.length) return null;
        const total = reviews.reduce((sum, review) => sum + review.review_rate, 0);
        return (total / reviews.length).toFixed(1);
    };

    const calculateRatingDistribution = () => {
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            ratingCounts[review.review_rate] += 1;
        });
        return ratingCounts;
    };

    const avgRating = useMemo(() => calculateAverageRating(), [reviews]);
    const ratingDistribution = useMemo(() => calculateRatingDistribution(), [reviews]);    

    const toggleReviewButton = () => {
        const newValue = !createReview;
        setCreateReview(newValue);
    
        Animated.timing(slideAnim, {
            toValue: newValue ? -50 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };
    
    const toggleReviewModal = () => {
        setIsModalVisible(prevState => !prevState);
    };

    const handleShowMore = (reviewId) => {
        setExpanded(prevState => ({ ...prevState, [reviewId]: !prevState[reviewId] }));
    };

    const openImageModal = (imageUri) => {
        setSelectedImage(imageUri);
        setImageModalVisible(true);
    };
    
    const closeImageModal = () => {
        setImageModalVisible(false);
        setSelectedImage(null);
    };    

    const confirmDeleteReview = (reviewId) => {
        Alert.alert(
            "ยืนยันการลบ",
            "คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?",
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "ลบ",
                    onPress: () => handleDeleteReview(reviewId),
                    style: "destructive"
                }
            ]
        );
    };
    
    const handleDeleteReview = async (reviewId) => {
        try {
            await apiClient.delete(`reviews/${reviewId}/`);
            alert("ลบรีวิวเรียบร้อยแล้ว");
            fetchPlaceDetails();
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("เกิดข้อผิดพลาดในการลบรีวิว");
        }
    };
    
    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#22B37A" />
            </View>
        );
    }

    return (
        <View style={styles.scrollContainer}>
        <FlatList
            data={reviews}
            keyExtractor={(item) => item.review_id.toString()}
            ListHeaderComponent={
                <View>
                    <Text style={styles.headerText}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <View style={styles.backIconContainer}>
                                <FontAwesome name="chevron-left" size={18} color="grey" />
                            </View>
                        </TouchableOpacity>   รีวิว</Text>
                    <View style={styles.reviewCard}>
                        <View style={styles.ratingSection}>
                            {/* ระดับคะแนน */}
                            <View style={styles.ratingDistribution}>
                                {Object.keys(ratingDistribution).reverse().map(rating => (
                                    <View key={rating} style={styles.ratingRow}>
                                        <Text style={styles.ratingLabel}>{rating}</Text>
                                        <View style={styles.ratingBarContainer}>
                                            <View style={[styles.ratingBar, { width: `${(ratingDistribution[rating] / reviews.length) * 100}%` }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* คะแนนเฉลี่ยรีวิว */}
                            <View style={styles.ratingOverview}>
                                <Text style={styles.avgRating}>{avgRating || "N/A"}
                                <FontAwesome name="star" size={22} color="#28a745" /></Text>
                                <Text style={styles.reviewCount}>{reviews.length} Reviews</Text>
                            </View>
                        </View>
                    </View>
                </View>
            }
            renderItem={({ item }) => {
                const user = users[item.user_id] || {};
                const isExpanded = expanded[item.review_id];

                return (
                    <View style={styles.reviewCard}>
                        {/* ข้อมูลแสดงรีวิว */}
                        <View style={styles.userInfo}>
                        <Image source={{ uri: `${BASE_URL}${user.user_img}` }} style={styles.userImage} />
                            <Text style={styles.userName}>{user.user_name}</Text>
                        </View>
                        <View style={styles.rating}>
                            {[...Array(item.review_rate)].map((_, i) => (
                                <FontAwesome key={i} name="star" size={16} color="#28a745" />
                            ))}
                        </View>
                        {item.user_id === currentUserId && (
                            <TouchableOpacity 
                                style={styles.menuButton}
                                onPress={() => confirmDeleteReview(item.review_id)}
                            >
                                <FontAwesome name="ellipsis-v" size={20} color="gray" />
                            </TouchableOpacity>
                        )}
                        {item.images && item.images.length > 0 && (
                            <FlatList
                                data={item.images}
                                horizontal
                                keyExtractor={(img, index) => index.toString()}
                                renderItem={({ item: image }) => (
                                    <TouchableOpacity onPress={() => openImageModal(image.review_img)}>
                                        <Image source={{ uri: image.review_img }} style={styles.reviewImage} />
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        <Text
                            numberOfLines={isExpanded ? undefined : 4}
                            style={styles.reviewText}
                        >
                            {item.review_detail}
                        </Text>
                        { item.review_detail.length > 100 && (
                            <TouchableOpacity onPress={() => handleShowMore(item.review_id)}>
                                <Text style={styles.showMoreText}>
                                    {isExpanded ? " ย่อข้อความ" : " อ่านเพิ่มเติม"} <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={12}  />  
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            }}
            ListEmptyComponent={<Text style={styles.noReview}>ยังไม่มีรีวิว</Text>}
        />  
            {/* เขียนรีวิว */}
            <View style={styles.buttonContainer}>
                {createReview && (
                    <TouchableOpacity style={[styles.planButton, { transform: [{ translateY: slideAnim }] }]} onPress={() => toggleReviewModal(id)}>
                        <FontAwesome name="pencil" size={20} color="white"/>
                        <Text style={styles.planText}>เขียนรีวิว</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addButton} onPress={toggleReviewButton}>
                    <Text style={styles.addText}>+</Text>
                </TouchableOpacity>
            </View>

            {isImageModalVisible && (
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity style={styles.imageModalBackground} onPress={closeImageModal}>
                        <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} />
                    </TouchableOpacity>
                </View>
            )}

            {isModalVisible && <ReviewForm visible={isModalVisible} onClose={toggleReviewModal}  placeId={id} />}
        </View>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flex: 1, padding: 16, paddingBottom: 100, backgroundColor: "#fff" },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },
    backButton: { position: 'absolute', top: 90, left: 25, zIndex: 10},
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
        shadowRadius: 4 ,
        zIndex: 10,
    },
    ratingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    userInfo: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    userImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    userName: { fontFamily: 'NotoSansThai_700Bold', fontSize: 16 },
    rating: { flexDirection: "row", marginBottom: 5, marginTop: 5 },
    reviewText: { fontSize: 14, color: "#333", marginBottom: 5, fontFamily: 'NotoSansThai_400Regular', marginTop: 5 },
    reviewImage: { width: 100, height: 100, marginRight: 5, marginTop: 5, resizeMode: 'cover' },
    ratingSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 },
    ratingDistribution: { flex: 1, marginRight: 20 },
    ratingOverview: { alignItems: "flex-end" },
    avgRating: { fontSize: 26, fontFamily: 'NotoSansThai_700Bold', color: "#222" },
    reviewCount: { fontSize: 14, color: "#555", fontFamily: 'NotoSansThai_700Bold',  },
    reviewCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)',shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 1, padding: 14, borderRadius: 12, marginBottom: 12, marginLeft: 1, marginRight: 1, },
    ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    ratingLabel: { fontSize: 14, fontFamily: 'NotoSansThai_700Bold',  },
    ratingBarContainer: { flex: 1, height: 8, backgroundColor: "#eee", borderRadius: 4, marginLeft: 12 },
    ratingBar: { height: "100%", backgroundColor: "#28a745", borderRadius: 4, fontFamily: 'NotoSansThai_700Bold',  },
    noReview: { textAlign: "center", fontSize: 14, fontFamily: 'NotoSansThai_400Regular', color: "#999", marginTop: 20 },
    buttonContainer: { position: "absolute", bottom: 100, right: 20, alignItems: "flex-end" },
    planButton: { backgroundColor: "#28a745", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, flexDirection: "row", alignItems: "center", marginBottom: -40 },
    planText: { color: "white", fontFamily: 'NotoSansThai_700Bold', marginLeft: 5 },
    addButton: { backgroundColor: "#28a745", padding: 5, borderRadius: 50, alignItems: "center", width: 55, height: 55, justifyContent: "center", elevation: 5 },
    addText: { color: "white", fontSize: 30, fontWeight: "bold" },
    showMoreText: { color: "#28a745", fontFamily: 'NotoSansThai_400Regular', marginTop: 5, textAlign: "right",},
    headerText: { fontSize: 18, fontFamily: 'NotoSansThai_700Bold', marginTop: 30, marginBottom: 20 },
    menuButton: { position: "absolute", top: 5, right: 5, padding: 10, zIndex: 10,},  
    imageModalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    imageModalBackground: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenImage: {
        width: "90%",
        height: "70%",
        resizeMode: "contain",
    },    
});

export default ReviewsScreen;
