import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import Icon from "react-native-vector-icons/AntDesign";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient, getUserId } from '../../services/apiClient';
import SelectPlaceModal from './SelectPlaceModal';

const CreatePlanModal = ({ visible, setVisible, setPlans, plans, fetchPlans }) => {
    const [planName, setPlanName] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [datePicker, setDatePicker] = useState({ show: false, type: null });
    const [showSelectPlaceModal, setShowSelectPlaceModal] = useState(false);
    const [planPlaces, setPlanPlaces] = useState([]);

    const createPlan = async () => {
        if (!planName.trim()) {
            Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อแผน");
            return;
        }
        if (planPlaces.length < 2) {
            Alert.alert("แจ้งเตือน", "กรุณาเลือกสถานที่อย่างน้อย 2 แห่ง");
            return;
        }
        if (startDate > endDate) {
            Alert.alert('แจ้งเตือน', 'วันเริ่มต้นต้องไม่มากกว่าวันสิ้นสุด');
            return;
        }

        try {
            const accessToken = await AsyncStorage.getItem("access_token");
            if (!accessToken) {
                Alert.alert("Error", "กรุณาเข้าสู่ระบบ");
                return;
            }

            const userId = await getUserId();
            const response = await apiClient.post("create_plan/", {
                plan_name: planName,
                startdate: startDate.toISOString().split('T')[0],
                enddate: endDate.toISOString().split('T')[0],
                user_id: userId,
                place_ids: planPlaces.map(place => place.place_id)
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            fetchPlans();
            setPlans([...plans, response.data]);
            handleCancel();
        } catch (error) {
            console.error("Error creating plan:", error);
            Alert.alert("Error", "ไม่สามารถสร้างแผนได้");
        }
    };

    const removePlaceFromPlan = (placeId) => {
        setPlanPlaces(prevPlaces => prevPlaces.filter(place => place.place_id !== placeId));
    };
    
    const handleCancel = () => {
        setPlanName("");
        setStartDate(new Date());
        setEndDate(new Date());
        setPlanPlaces([]);
        setVisible(false);
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleCancel}>
            <View style={styles.overlay}>
                <View style={styles.modalView}>
                    <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                        <Icon name="arrowleft" size={24} color="#22B37A" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>สร้างแผน</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="ชื่อแผน"
                        value={planName}
                        onChangeText={setPlanName}
                    />

                    <View style={styles.dateContainer}>
                        {["start", "end"].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setDatePicker({ show: true, type })}
                                style={styles.dateButton}
                            >
                                <Text style={styles.dateLabel}>{type === "start" ? "วันเริ่มต้น" : "วันสิ้นสุด"}</Text>
                                <Text style={styles.dateText}>
                                    {type === 'start' ? startDate.toLocaleDateString() : endDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {datePicker.show && (
                        <DateTimePicker
                            value={datePicker.type === "start" ? startDate : endDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setDatePicker({ show: false, type: null });
                                if (selectedDate) {
                                    datePicker.type === "start" ? setStartDate(selectedDate) : setEndDate(selectedDate);
                                }
                            }}
                        />
                    )}

                    <TouchableOpacity style={styles.selectPlaceButton} onPress={() => setShowSelectPlaceModal(true)}>
                        <View style={styles.selectPlaceButtonContent}>
                            <Text style={styles.buttonText}>เลือกสถานที่</Text>
                            <Icon name="plus" size={20} color="#28a745" />
                        </View>
                    </TouchableOpacity>

                    <View style={[styles.selectedPlacesContainer, { maxHeight: 250 }]}>
                        <Text style={styles.selectedPlacesTitle}>สถานที่ที่เลือก:</Text>

                        {planPlaces.length === 0 ? (
                            <Text style={styles.noPlacesText}>ยังไม่มีสถานที่</Text>
                        ) : (
                            <FlatList
                                data={planPlaces}
                                keyExtractor={(item) => item.place_id.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.placeItem}>
                                        <Text style={{ width: '90%', fontFamily: "NotoSansThai_400Regular", }} numberOfLines={1} ellipsizeMode="tail">
                                            {item.place_name}
                                        </Text>
                                        <TouchableOpacity onPress={() => removePlaceFromPlan(item.place_id)} style={{ flex: 2, alignItems: 'flex-end' }}>
                                            <Icon name="close" size={18} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={createPlan}>
                        <Text style={styles.buttonTextSave}>วางแผน</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <SelectPlaceModal 
                visible={showSelectPlaceModal} 
                setVisible={setShowSelectPlaceModal} 
                setPlanPlaces={setPlanPlaces}  
                planPlaces={planPlaces}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
    modalView: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.25, elevation: 5 , alignItems: "center"},
    backButton: { position: "absolute", top: 10, left: 10, padding: 10 },
    modalTitle: { fontSize: 20, marginBottom: 20, fontFamily: "NotoSansThai_700Bold", },
    input: { fontSize: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 20, width: "100%", fontFamily: "NotoSansThai_400Regular", },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
    dateButton: { flex: 1, marginHorizontal: 0.5, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 },
    dateLabel: { fontSize: 16, fontFamily: "NotoSansThai_700Bold", textAlign: 'center' },
    dateText: { fontSize: 16, textAlign: 'center' },
    selectPlaceButton: { borderWidth: 1, borderColor: '#28a745', padding: 10, borderRadius: 5, marginBottom: 10, width: "100%" },
    selectPlaceButtonContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectedPlacesContainer: { marginTop: 0, textAlign: 'left', width: '100%' },
    selectedPlacesTitle: { fontSize: 16, fontFamily: "NotoSansThai_700Bold",},
    noPlacesText: { color: "#888", fontFamily: "NotoSansThai_400Regular", textAlign: 'center' },
    saveButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, width: "100%", marginTop: 20 },
    buttonText: { color: '#28a745', fontSize: 16, textAlign: "center", fontFamily: "NotoSansThai_700Bold", },
    buttonTextSave: { color: 'white', fontSize: 16, textAlign: "center", fontFamily: "NotoSansThai_700Bold", },
    placeItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 10, 
        borderBottomWidth: 1, 
        borderBottomColor: "#ddd",
        backgroundColor: "#f9f9f9",
        borderRadius: 5,
        marginVertical: 5
    },    
});

export default CreatePlanModal;
