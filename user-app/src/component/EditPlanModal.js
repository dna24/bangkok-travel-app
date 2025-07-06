import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import Icon from "react-native-vector-icons/AntDesign";
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, getUserId } from '../../services/apiClient';
import SelectPlaceEdit from './SelectPlaceEdit';

const EditPlanModal = ({ show, handleClose, plan, handleSave }) => {
    const [planName, setPlanName] = useState(plan.name);
    const [startDate, setStartDate] = useState(new Date(plan.startdate));
    const [endDate, setEndDate] = useState(new Date(plan.enddate));
    const [datePicker, setDatePicker] = useState({ show: false, type: null });
    const [showSelectPlaceModal, setShowSelectPlaceModal] = useState(false);
    const [planPlaces, setPlanPlaces] = useState(plan.places || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setPlanName(plan.name || '');
            setStartDate(plan.startdate ? new Date(plan.startdate) : new Date());
            setEndDate(plan.enddate ? new Date(plan.enddate) : new Date());
            setPlanPlaces(plan.places?.map(place => ({
                place_id: place.place_id,
                placeDetails: place.placeDetails || { place_name: place.place_name }
            })) || []);            
        }
    }, [show, plan]);     

    const saveChanges = async () => {
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

        setLoading(true);
        const accessToken = await AsyncStorage.getItem("access_token");
            if (!accessToken) {
                Alert.alert("Error", "กรุณาเข้าสู่ระบบ");
                return;
            }

        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];
        const updatedPlan = {
            plan_name: planName,
            startdate: formattedStartDate,
            enddate: formattedEndDate,
            place_ids: planPlaces.map(place => place.place_id)
        };
    
        try {
            const response = await apiClient.put(`update_plan/${plan.id}/`, updatedPlan, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                }
            });            
            console.log("✅ อัปเดตสำเร็จ:", response.data);
    
            Alert.alert('สำเร็จ', 'บันทึกแผนการเดินทางเรียบร้อยแล้ว');
            handleSave();
        } catch (error) {
            console.error('🚨 Error updating plan:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้');
        } finally {
            setLoading(false);
        }
    };

    const removePlaceFromPlan = (placeId) => {
        setPlanPlaces(prevPlaces => prevPlaces.filter(place => place.place_id !== placeId));
    };

    return (
        <Modal animationType="slide" transparent={true} visible={show} onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.modalView}>
                    <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                        <Icon name="arrowleft" size={24} color="#22B37A" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>แก้ไขแผน</Text>
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
                            value={datePicker.type === 'start' ? startDate : endDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setDatePicker({ show: false, type: null });
                                if (selectedDate) {
                                    datePicker.type === 'start' ? setStartDate(selectedDate) : setEndDate(selectedDate);
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
                                            {item.placeDetails.place_name}
                                        </Text>
                                        <TouchableOpacity onPress={() => removePlaceFromPlan(item.place_id)}>
                                            <Icon name="close" size={18} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveButton, loading && { opacity: 0.5 }]} 
                        onPress={saveChanges} 
                        disabled={loading}
                    >
                        <Text style={styles.buttonTextSave}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <SelectPlaceEdit
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
    modalView: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10, alignItems: "center" },
    backButton: { position: "absolute", top: 10, left: 10, padding: 10 },
    modalTitle: { fontSize: 20, marginBottom: 20, fontFamily: "NotoSansThai_700Bold", },
    input: { fontSize: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 20, width: "100%", fontFamily: "NotoSansThai_400Regular", },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
    dateButton: { flex: 1, marginHorizontal: 5, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 },
    dateLabel: { fontSize: 16, fontFamily: "NotoSansThai_700Bold", textAlign: 'center' },
    dateText: { fontSize: 16, textAlign: 'center' },
    selectPlaceButton: { borderWidth: 1, borderColor: '#28a745', padding: 10, borderRadius: 5, marginBottom: 10, width: "100%" },
    saveButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, width: "100%", marginTop: 20 },
    buttonText: { color: '#28a745', fontSize: 16, textAlign: "center", fontFamily: "NotoSansThai_700Bold", },
    buttonTextSave: { color: 'white', fontSize: 16, textAlign: "center", fontFamily: "NotoSansThai_700Bold", },
    selectPlaceButtonContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectedPlacesContainer: { marginTop: 10, width: '100%' },
    selectedPlacesTitle: { fontSize: 16, fontFamily: "NotoSansThai_700Bold",},
    noPlacesText: { color: "#888", fontFamily: "NotoSansThai_400Regular", textAlign: 'center' },
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

export default EditPlanModal;
