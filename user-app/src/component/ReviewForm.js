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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getUserId, apiClient } from "../../services/apiClient";

const ReviewForm = ({ visible, onClose, placeId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageUris, setImageUris] = useState([]);
  const [slideAnim] = useState(new Animated.Value(500));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const submitReview = async () => {
    if (rating === 0) {
      alert("กรุณาให้คะแนนก่อนส่งรีวิว");
      return;
    }

    if (!comment.trim()) {
      alert("กรุณาเขียนความคิดเห็น");
      return;
    }

    const formData = new FormData();
    const userId = await getUserId();
    if (!userId) {
      alert("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    console.log("📩 ข้อมูลที่กำลังส่ง:");
    console.log({
      review_rate: rating,
      review_detail: comment,
      user_id: userId,
      place_id: placeId,
      image_uri: imageUris,
    });

    formData.append("review_rate", String(rating));
    formData.append("review_detail", String(comment));
    formData.append("user_id", userId);
    formData.append("place_id", placeId);

    if (imageUris.length > 0) {
      imageUris.forEach((uri, index) => {
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
    
        formData.append("images", {
          uri,
          name: filename,
          type,
        });
      });
      console.log("รูปที่แนบไป:", imageUris);
    } else {
      console.log("ไม่มีรูปถูกเลือก");
    }    

    try {
      const response = await apiClient.post("submit_review/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        alert("รีวิวของคุณถูกส่งเรียบร้อยแล้ว");
        console.log("รีวิวถูกบันทึกสำเร็จ:", response.data);
        onClose();
      } else {
        console.log("เกิดข้อผิดพลาดในการส่งรีวิว:", response.data);
        alert("ส่งรีวิวไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error Response:", error.response?.data || error.message);
      alert("เกิดข้อผิดพลาดในการส่งรีวิว กรุณาลองใหม่");
    }
  };

  const handleRating = (selectedRating) => {
    setRating(selectedRating);
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
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImageUris((prevUris) => [...prevUris, ...selectedUris]);
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
              <Text style={styles.title}>เขียนรีวิว</Text>

              {/* Upload Image Placeholder */}
              <TouchableOpacity onPress={pickImage} style={styles.imageUpload}>
                {imageUris.length > 0 ? (
                  <View style={styles.previewContainer}>
                    {imageUris.slice(0, 4).map((uri, index) => (
                      <Image key={index} source={{ uri }} style={styles.previewImage} />
                    ))}
                    {imageUris.length > 4 && (
                      <View style={styles.moreOverlay}>
                        <Text style={styles.moreText}>+{imageUris.length - 4}</Text>
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

              {/* Star Rating */}
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(star)}
                  >
                    <FontAwesome
                      name="star"
                      size={30}
                      color={star <= rating ? "#28a745" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment Box */}
              <View style={styles.commentBoxContainer}>
                <TextInput
                  style={styles.commentBox}
                  placeholder="ความคิดเห็น"
                  placeholderTextColor="#999"
                  multiline
                  value={comment}
                  onChangeText={setComment}
                  maxLength={255}
                />
                <Text style={styles.charCount}>{comment.length} / 255</Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={submitReview}
              >
                <Text style={styles.saveText}>บันทึก</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
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
  saveButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontFamily: "NotoSansThai_700Bold" },
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
  commentBoxContainer: { marginBottom: 10 },
  charCount: {
    textAlign: "right",
    color: "#555",
    fontFamily: "NotoSansThai_400Regular",
  },
});

export default ReviewForm;
