import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/AntDesign";
import { apiClient, getUserId, removeToken } from '../../services/apiClient';
import * as ImagePicker from 'expo-image-picker';

const EditProfileDialog = ({ isVisible, onClose, user, onUpdate }) => {
  const [userName, setUserName] = useState(user?.user_name || "");
  const [userEmail, setUserEmail] = useState(user?.user_email || "");
  const [profileImage, setProfileImage] = useState(
    user?.user_img || "https://via.placeholder.com/50"
  );

  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const pickImage = async () => {
    // ขอสิทธิ์เข้าถึงแกลเลอรี
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to grant permission to access the media library.");
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        Alert.alert("Error", "ไม่สามารถระบุผู้ใช้ได้");
        return;
      }

      const formData = new FormData();
      formData.append("user_name", userName);
      formData.append("user_email", userEmail);

      if (profileImage && profileImage !== user?.user_img) {
        formData.append("user_img", {
          uri: profileImage,
          type: "image/jpeg",
          name: "profile.jpg",
        });
      }

      const response = await apiClient.patch(`/users/${userId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("สำเร็จ", "อัปเดตโปรไฟล์เรียบร้อยแล้ว");
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error("Update profile error:", error.response?.data || error);
      Alert.alert("Error", "ไม่สามารถอัปเดตโปรไฟล์ได้");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || newPassword !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
  
    try {
      const userId = await getUserId(); 
      if (!userId) {
        Alert.alert("Error", "ไม่สามารถระบุผู้ใช้ได้");
        return;
      }
  
      await apiClient.patch(`/users/${userId}/change-password/`, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
  
      Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อย", [
        {
          text: "ตกลง",
          onPress: () => {
            setIsChangePasswordVisible(false); 
            setNewPassword("");
            setConfirmPassword("");
          },
        },
      ]);
    } catch (error) {
      console.error("Change password error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    }
  };
  

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Icon name="arrowleft" size={24} color="#22B37A" />
        </TouchableOpacity>

        <Text style={styles.title}>แก้ไขโปรไฟล์</Text>

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        </TouchableOpacity>

        <Text style={styles.label}>ชื่อผู้ใช้</Text>
        <TextInput
          placeholder="ชื่อผู้ใช้"
          value={userName}
          onChangeText={setUserName}
          style={styles.input}
        />

        <Text style={styles.label}>อีเมล</Text>
        <TextInput
          placeholder="อีเมล"
          value={userEmail}
          onChangeText={setUserEmail}
          style={styles.input}
          keyboardType="email-address"
        />

        <TouchableOpacity onPress={handleSave} style={styles.button}>
          <Text style={styles.buttonText}>บันทึก</Text>
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => setIsChangePasswordVisible(true)}
  style={[
    styles.button,
    {
      marginTop: 10,
      backgroundColor: "transparent", 
      borderWidth: 1, 
      borderColor: "#FF4C4C", 
    },
  ]}
>
  <Text style={[styles.buttonText, { color: "#FF4C4C" }]}>เปลี่ยนรหัสผ่าน</Text>
</TouchableOpacity>


        {/* Change Password Dialog */}
        <Modal
          isVisible={isChangePasswordVisible}
          onBackdropPress={() => setIsChangePasswordVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.title}>เปลี่ยนรหัสผ่าน</Text>
            <TextInput
              placeholder="รหัสผ่านใหม่"
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
            />

            <TouchableOpacity
              onPress={handleChangePassword}
              style={[
                styles.button,
                {
                  backgroundColor:
                    newPassword &&
                    confirmPassword &&
                    newPassword === confirmPassword
                      ? "#28a745"
                      : "#ccc",
                  opacity:
                    newPassword &&
                    confirmPassword &&
                    newPassword === confirmPassword
                      ? 1
                      : 0.5,
                },
              ]}
              disabled={
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
            >
              <Text style={styles.buttonText}>ยืนยันการเปลี่ยนรหัส</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 30,
    fontFamily: "NotoSansThai_700Bold",
  },
  label: {
    width: "100%",
    textAlign: "left",
    marginBottom: 10,
    fontWeight: "bold",
    fontFamily: "NotoSansThai_400Regular",
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 10,
  },
  imagePicker: {
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#22B37A",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "NotoSansThai_700Bold",
  },
});

export default EditProfileDialog;
