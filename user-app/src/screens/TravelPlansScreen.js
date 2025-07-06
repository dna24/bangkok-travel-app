import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated, ImageBackground } from 'react-native';
import { apiClient, getUserId  } from '../../services/apiClient';
import { FontAwesome } from '@expo/vector-icons'; 
import CreatePlanModal from '../component/CreatePlanModal';
import Icon from "react-native-vector-icons/AntDesign";

const TravelPlansScreen = ({ navigation }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createPlan, setCreatePlan] = useState(false);
    const [slideAnim] = useState(new Animated.Value(300));
    const [modalVisible, setModalVisible] = useState(false);

    const fetchPlans = async () => {
        try {
            const plansResponse = await apiClient.get("plans/");
            let plansData = plansResponse.data;
    
            const userId = await getUserId();
    
            plansData = plansData.filter(plan => plan.user_id.toString() === userId.toString());
            plansData = plansData.sort((a, b) => b.plan_id - a.plan_id);
    
            setPlans(plansData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            Alert.alert("Error", "ไม่สามารถดึงข้อมูลได้");
        }
    }; 

    useEffect(() => {
        fetchPlans();
    }, []);

    const togglePlanButton = () => {  
        const newValue = !createPlan;
        setCreatePlan(newValue);

        Animated.timing(slideAnim, {
            toValue: newValue ? -50 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const deletePlan = async (planId) => {
        Alert.alert(
            "ยืนยันการลบ",
            "คุณต้องการลบแผนนี้ใช่หรือไม่?",
            [
                {
                    text: "ยกเลิก",
                    style: "cancel"
                },
                {
                    text: "ลบ",
                    onPress: async () => {
                        try {
                            await apiClient.delete(`plans/${planId}/`);
                            setPlans(plans.filter(plan => plan.plan_id !== planId));
                        } catch (error) {
                            console.error("Error deleting plan:", error);
                            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบแผนได้");
                        }
                    },
                    style: "destructive"
                }
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
                <Text style={styles.headerText}>วางแผนท่องเที่ยว</Text>
            </View>
            <Text style={styles.subHeader}>แผนของฉัน</Text>
    
            {plans.length === 0 ? (
                <View style={styles.noPlanContainer}>
                    <Text style={styles.noPlanText}>ยังไม่มีแผนท่องเที่ยว</Text>
                </View>
            ) : (
                <FlatList
                    data={plans}
                    keyExtractor={(item) => item.plan_id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListFooterComponent={<View style={{ height: 20 }} />}
                    renderItem={({ item }) => {
                        const imageUrl = item.places?.[0]?.place_img_url;
                    
                        return (
                            <TouchableOpacity
                                style={styles.planBox}
                                onPress={() => navigation.navigate('PlanDetail', { planId: item.plan_id })}
                            >
                                <ImageBackground 
                                    source={imageUrl ? { uri: imageUrl } : require('../../assets/default-image.jpg')} 
                                    style={styles.imageBackground} 
                                    imageStyle={{ borderRadius: 8 }}
                                >
                                    <View style={styles.overlay}>
                                        <Text style={styles.planTitle}>{item.plan_name}</Text>
                                        <Text style={styles.planDetail}>รายละเอียด</Text>
                                        <TouchableOpacity style={styles.deleteButton} onPress={() => deletePlan(item.plan_id)}>
                                            <Icon name="close" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </ImageBackground>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
    
            {/* ปุ่มเพิ่มแผน */}
            <View style={styles.buttonContainer}>
                {createPlan && (
                    <TouchableOpacity style={[styles.planButton, { transform: [{ translateY: slideAnim }] }]} onPress={() => setModalVisible(true)}>
                        <FontAwesome name="pencil" size={20} color="white"/>
                        <Text style={styles.planText}>สร้างแผน</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addButton} onPress={togglePlanButton}>
                    <Text style={styles.addText}>+</Text>
                </TouchableOpacity>
    
                {/* Modal สำหรับสร้างแผน */}
                <CreatePlanModal
                    visible={modalVisible}
                    setVisible={setModalVisible}
                    setPlans={setPlans}
                    plans={plans}
                    fetchPlans={fetchPlans}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    containerload: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    header: { paddingBottom: 10 },
    headerText: {
      fontSize: 18,
      fontFamily: "NotoSansThai_700Bold",
      marginTop: 30,
    },
    subHeader: { fontSize: 16, fontFamily: "NotoSansThai_400Regular", marginBottom: 15 },
    row: { flex: 1, justifyContent: 'space-between' },
    buttonContainer: { position: "absolute", bottom: 100, right: 20, alignItems: "flex-end" },
    planButton: { backgroundColor: "#28a745", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, flexDirection: "row", alignItems: "center", marginBottom: -40 },
    planText: { color: "white", fontFamily: 'NotoSansThai_700Bold', marginLeft: 5 },
    addButton: { backgroundColor: "#28a745", padding: 5, borderRadius: 50, alignItems: "center", width: 55, height: 55, justifyContent: "center", elevation: 5 },
    addText: { color: "white", fontSize: 30, fontWeight: "bold" },
    imageBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        borderRadius: 8,
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 8,
    },
    planBox: {
        width: '48%',
        height: 140,
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    planTitle: {
        fontSize: 16,
        fontFamily: "NotoSansThai_700Bold",
        color: 'white',
    },
    planDetail: {
        fontSize: 14,
        color: 'white',
        fontFamily: "NotoSansThai_400Regular",
    },
    deleteButton: {
        position: 'absolute',
        top: -70,
        right: 5,
        padding: 2.5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'white',
    },    
    noPlanContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 100,
    },
    noPlanText: {
        fontSize: 16,
        fontFamily: "NotoSansThai_400Regular",
        color: "gray",
    },
});

export default TravelPlansScreen;
