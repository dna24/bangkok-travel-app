import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from "@expo/vector-icons";
import { apiClient, getUserId } from '../../services/apiClient';
import CustomPicker from './CustomPicker';

const ReportForm = ({ isVisible, onClose, memoId }) => {
  const [reportDetail, setReportDetail] = useState('');
  const [reportType, setReportType] = useState('เนื้อหาที่ไม่เหมาะสม'); // ค่าเริ่มต้น

  const handleReport = async () => {
    if (!reportDetail.trim()) {
      alert('กรุณากรอกรายละเอียดการรายงาน');
      return;
    }

    try {
      const userId = await getUserId();
      const reportData = {
        report_detail: reportDetail,
        report_type: reportType,
        memo_id: memoId,
        user_id: userId
      };

      await apiClient.post('reports/', reportData);
      alert('รายงานบันทึกเรียบร้อยแล้ว');
      setReportDetail('');
      setReportType('เนื้อหาที่ไม่เหมาะสม');
      onClose();
    } catch (error) {
      console.error("Error reporting memo:", error);
      alert('เกิดข้อผิดพลาดในการรายงาน');
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalContainer}
    >
        <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color="#4CAF50" />
                <Text style={styles.modalTitle}>รายงานบันทึก</Text>
            </TouchableOpacity>
        
            <Text style={styles.label}>ประเภทการรายงาน:</Text>
            <CustomPicker selectedValue={reportType} onValueChange={setReportType} />

            <TextInput
            style={styles.input}
            placeholder="กรอกรายละเอียดการรายงาน"
            placeholderTextColor="#999"
            value={reportDetail}
            onChangeText={setReportDetail}
            multiline
            />

            <View style={styles.modalActions}>
            <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleReport}
            >
                <Text style={styles.submitButtonText}>ส่งรายงาน</Text>
            </TouchableOpacity>
            </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansThai_700Bold',
    marginLeft: 10,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'NotoSansThai_400Regular',
  },
  pickerContainer: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    fontFamily: 'NotoSansThai_400Regular',
  },
  picker: {
    height: 50,
    width: '100%',
    fontFamily: 'NotoSansThai_400Regular',
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginTop: 5,
    marginBottom: 20,
    fontFamily: 'NotoSansThai_400Regular',
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 110,
    borderRadius: 5,
    fontFamily: 'NotoSansThai_400Regular',
  },
  submitButtonText: {
    color: "white",
    fontFamily: 'NotoSansThai_400Regular',
  },
});

export default ReportForm;
