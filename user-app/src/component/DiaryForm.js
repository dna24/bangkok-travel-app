import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Platform,
  Image,
  Switch,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId, apiClient } from "../../services/apiClient";
import SelectPlace from "../component/SelectPlace";

const DiaryForm = ({ visible, onClose, onSaveSuccess }) => {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [slideAnim] = useState(new Animated.Value(500));
  const [isPlaceModalVisible, setIsPlaceModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handlePlaceSelect = (placeId, placeName) => {
    setPlaceId(placeId);
    setLocation(placeName);
    setIsPlaceModalVisible(false);
  };

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("ต้องการอนุญาตเข้าถึงคลังรูปภาพ!");
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selected = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selected]);
    }
  };

  const submitMemo = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      if (!accessToken) {
        console.error("ไม่มี accessToken!");
        alert("กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const userId = await getUserId();
      if (!userId || !placeId) {
        alert("กรุณาเลือกสถานที่");
        return;
      }

      if (!comment.trim()) {
        alert("กรุณาเขียนความคิดเห็น");
        return;
      }

      const formData = new FormData();

      if (images.length > 0) {
        images.forEach((uri, index) => {
          const filename = uri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
      
          formData.append("images", {
            uri,
            name: filename,
            type,
          });
        });
        console.log("📷 ส่งรูปภาพสำเร็จ:", images);
      } else {
        formData.append("images", "");
        console.log("🚫 ไม่มีรูปถูกเลือก");
      }      

      formData.append("memo_detail", comment);
      formData.append("memo_type", isPublic ? "public" : "private");
      formData.append("user_id", userId);
      formData.append("place_id", placeId);

      console.log("📌 ส่งข้อมูลไปที่ API:", formData);
      console.log("📌 FormData ที่ถูกสร้าง:", [...formData]);

      const response = await apiClient.post("/submit_memo/", formData, {
        headers: {
          "Content-Type": `multipart/form-data`,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("✅ Memo saved:", response.data);
      alert("บันทึกการเดินทางสำเร็จ!");
      onClose();
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error("❌ Error saving memo:", error.response?.data || error);
      alert(
        "เกิดข้อผิดพลาด: " + (error.response?.data?.error || error.message)
      );
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <FontAwesome name="times" size={24} color="#555" />
              </TouchableOpacity>

              <Text style={styles.title}>บันทึกการเดินทาง</Text>

              {/* Upload Image */}
              <TouchableOpacity onPress={pickImage} style={styles.imageUpload}>
                {images.length > 0 ? (
                  <View style={styles.previewContainer}>
                    {images.slice(0, 4).map((uri, index) => (
                      <Image key={`${uri}-${index}`} source={{ uri }} style={styles.previewImage}/>
                    ))}
                    {images.length > 4 && (
                      <View style={styles.moreOverlay}>
                        <Text style={styles.moreText}>+{images.length - 4}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <>
                    <FontAwesome name="camera" size={40} color="#ccc" />
                    <Text style={styles.uploadText}>เพิ่มรูปภาพ</Text>
                  </>
                )}
              </TouchableOpacity>

               {/* แสดง SelectPlace Modal */}
               <TouchableOpacity onPress={() => setIsPlaceModalVisible(true)}>
                <TextInput
                  placeholderTextColor="#999"
                  style={styles.input}
                  placeholder="สถานที่"
                  value={location}
                  editable={false}
                />
              </TouchableOpacity>

              {/* Comment Input */}
              <View style={styles.commentBoxContainer}>
                <TextInput
                  placeholderTextColor="#999"
                  style={styles.commentBox}
                  placeholder="ความคิดเห็น"
                  multiline
                  value={comment}
                  onChangeText={setComment}
                  maxLength={255}
                />
                <Text style={styles.charCount}>{comment.length} / 255</Text>
              </View>

              {/* Public Switch */}
              <View style={styles.switchContainer}>
                <Text style={{ fontFamily: "NotoSansThai_400Regular" }}>
                  สาธารณะ
                </Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: "#ccc", true: "#28a745" }}
                  thumbColor={isPublic ? "#28a745" : "#f4f3f4"}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={submitMemo}>
                <Text style={styles.saveText}>บันทึก</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <SelectPlace
        visible={isPlaceModalVisible}
        setVisible={setIsPlaceModalVisible}
        onPlaceSelect={handlePlaceSelect}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: { alignSelf: "flex-end" },
  title: {
    fontSize: 18,
    fontFamily: "NotoSansThai_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  imageUpload: {
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadText: {
    marginTop: 10,
    color: "#aaa",
    fontFamily: "NotoSansThai_400Regular",
  },
  previewImage: { width: 130, height: 130, borderRadius: 10, marginBottom: 10 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#28a745",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontFamily: "NotoSansThai_400Regular",
  },
  commentBox: {
    height: 100,
    borderWidth: 1,
    borderColor: "#28a745",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    fontFamily: "NotoSansThai_400Regular",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontFamily: "NotoSansThai_700Bold" },
  commentBoxContainer: { marginBottom: 10 },
  charCount: {
    textAlign: "right",
    color: "#555",
    fontFamily: "NotoSansThai_400Regular",
  },
  previewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    flexShrink: 1,
    alignItems: "center",
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  moreOverlay: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DiaryForm;
