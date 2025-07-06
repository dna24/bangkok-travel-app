import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { apiClient } from "../../services/apiClient";

const SelectPlaceModal = ({ visible, setVisible, setPlanPlaces, planPlaces = [] }) => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const response = await apiClient.get("places/");
                setPlaces(response.data);
            } catch (error) {
                Alert.alert("Error", "ไม่สามารถโหลดสถานที่ได้");
            } finally {
                setLoading(false);
            }
        };
        fetchPlaces();
    }, []);

    const addPlaceToPlan = (placeId, placeName) => {
        if (planPlaces.some(place => place.place_id === placeId)) {
            return;
        }

        setPlanPlaces(prevPlaces => [...prevPlaces, { place_id: placeId, place_name: placeName }]);
        setVisible(false);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={{ 
                flex: 1, 
                justifyContent: "center", 
                alignItems: "center", 
                backgroundColor: "rgba(0,0,0,0.5)"
            }}>
                <View style={{ 
                    backgroundColor: "white", 
                    padding: 20, 
                    borderRadius: 10,
                    width: "90%",
                    maxHeight: 500,
                    position: "relative"
                }}>
                    <TouchableOpacity 
                        onPress={() => setVisible(false)} 
                        style={{
                            position: "absolute",
                            top: 15,
                            right: 10,
                            padding: 5
                        }}
                    >
                        <Icon name="close" size={20} color="gray" />
                    </TouchableOpacity>

                    <Text style={{ 
                        fontSize: 20, 
                        fontFamily: "NotoSansThai_700Bold", 
                        marginBottom: 10, 
                        textAlign: "center" 
                    }}>
                        เลือกสถานที่
                    </Text>

                    {/* รายการสถานที่ */}
                    {loading ? <ActivityIndicator size="large" color="#007bff" /> : (
                        <FlatList
                            data={places}
                            keyExtractor={(item, index) => `${item.place_id}-${index}`}
                            contentContainerStyle={{ paddingBottom: 20 }} // ป้องกันไม่ให้รายการสุดท้ายโดนบัง
                            renderItem={({ item }) => {
                                const isSelected = planPlaces.some(place => place.place_id === item.place_id);
                                return (
                                    <TouchableOpacity 
                                        onPress={() => addPlaceToPlan(item.place_id, item.place_name)}
                                        style={{ 
                                            padding: 10, 
                                            borderBottomWidth: 1, 
                                            borderBottomColor: "#ddd",
                                            backgroundColor: isSelected ? "#C9ECDE" : "white" 
                                        }}
                                        disabled={isSelected}
                                    >
                                        <Text style={{ 
                                            fontSize: 16, 
                                            fontFamily: "NotoSansThai_400Regular", 
                                            color: isSelected ? "gray" : "black" 
                                        }}>
                                            {item.place_name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default SelectPlaceModal;
