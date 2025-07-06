import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient, getUserId, removeToken } from "../../services/apiClient";
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from "react-native-dropdown-picker";

const SuggestLocationDialog = ({ visible, onClose }) => {
  const [id, setId] = useState("");
  const [image, setImage] = useState(null);
  const [placeName, setPlaceName] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [openPlaceType, setOpenPlaceType] = useState(false);
  const [placeType, setPlaceType] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [openingDetail, setOpeningDetail] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchPlaceSuggestions = async (input) => {
    if (!input.trim()) {
      setPlaceSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await apiClient.get(`/autocomplete?input=${input}`);
      setPlaceSuggestions(response.data.predictions);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
    }
  };

  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await apiClient.get(
        `/place_details/?place_id=${placeId}`
      );
      const placeDetails = response.data.result;
      setId(placeId);
      setLat(placeDetails.geometry.location.lat);
      setLng(placeDetails.geometry.location.lng);
      setPlaceName(placeDetails.name || "");
      setLocation(placeDetails.formatted_address || "");
      setPhoneNumber(placeDetails.formatted_phone_number || "");
      setWebsite(placeDetails.website || "");
      setOpeningDetail(
        placeDetails.opening_hours
          ? placeDetails.opening_hours.weekday_text.join("\n")
          : ""
      );
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  const handlePlaceSelection = (item) => {
    setPlaceName(item.description);
    setId(item.place_id);
    setShowDropdown(false);
    fetchPlaceDetails(item.place_id);
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "You need to allow camera roll permissions to pick an image."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveNewPlace = async () => {
    if (!placeName || !location || !lat || !lng || !id) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น");
      return;
    }

    const userId = await getUserId();
    if (!userId) {
      Alert.alert("Error", "ไม่สามารถระบุผู้ใช้ได้");
      return;
    }

    let formData = new FormData();
    formData.append("rec_id", id);
    formData.append("rec_place_name", placeName);
    formData.append("rec_location", location);
    formData.append("rec_lat", lat);
    formData.append("rec_lng", lng);
    formData.append("rec_place_type", placeType);
    formData.append("rec_description", description);
    formData.append("rec_phone_number", phoneNumber);
    formData.append("rec_website", website);
    formData.append("rec_openning_detail", openingDetail);
    formData.append("rec_status", "wait");
    formData.append("user_id", userId);

    if (image) {
      let filename = image.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      formData.append("rec_place_img", {
        uri: image,
        name: filename,
        type,
      });
    }

    try {
      const response = await apiClient.post("/placesrecommend/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ เพิ่มสถานที่สำเร็จ:", response.data);
      Alert.alert("สำเร็จ", "เพิ่มสถานที่เรียบร้อย");

      setPlaceName("");
      setLocation("");
      setLat("");
      setLng("");
      setPlaceType("");
      setDescription("");
      setPhoneNumber("");
      setWebsite("");
      setOpeningDetail("");
      setImage(null);
      setId("");
      onClose();
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเพิ่มสถานที่ได้ ");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        
          <ScrollView
            contentContainerStyle={styles.modalContainer}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true} // 👈 เพิ่มตรงนี้
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <Ionicons name="camera-outline" size={50} color="#BDBDBD" />
              )}
              <Text style={styles.imageText}>เพิ่มรูปภาพ</Text>
            </TouchableOpacity>

            {/* Remove input fields for id, lat, and lng */}
            {/* <TextInput style={styles.input} placeholder="ID" value={id} onChangeText={setId} /> */}

            <TextInput
              style={styles.input}
              placeholder="ชื่อสถานที่"
              placeholderTextColor="#999"
              value={placeName}
              onChangeText={(text) => {
                setPlaceName(text);
                fetchPlaceSuggestions(text);
              }}
            />

            {showDropdown && (
              <View
                style={{
                  maxHeight: 200,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 5,
                }}
              >
                <View style={styles.suggestionContainer}>
                  {placeSuggestions.map((item) => {
                    const { main_text, secondary_text } =
                      item.structured_formatting || {};
                    return (
                      <TouchableOpacity
                        key={item.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handlePlaceSelection(item)}
                      >
                        <Text style={{ fontWeight: "bold" }}>{main_text}</Text>
                        {secondary_text ? (
                          <Text style={{ color: "#666" }}>
                            {secondary_text}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="ที่ตั้ง"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
            <View style={{ zIndex: 1000, marginBottom: 10 }}>
              <DropDownPicker
                open={openPlaceType}
                value={placeType}
                items={[
                  { label: "พิพิธภัณฑ์ศิลปะ", value: "พิพิธภัณฑ์ศิลปะ" },
                  {
                    label: "พิพิธภัณฑ์ประวัติศาสตร์",
                    value: "พิพิธภัณฑ์ประวัติศาสตร์",
                  },
                  {
                    label: "พิพิธภัณฑ์วิทยาศาสตร์",
                    value: "พิพิธภัณฑ์วิทยาศาสตร์",
                  },
                  {
                    label: "พิพิธภัณฑ์ธรรมชาติวิทยา",
                    value: "พิพิธภัณฑ์ธรรมชาติวิทยา",
                  },
                  { label: "พิพิธภัณฑ์วัฒนธรรม", value: "พิพิธภัณฑ์วัฒนธรรม" },
                  { label: "พิพิธภัณฑ์สัตว์น้ำ", value: "พิพิธภัณฑ์สัตว์น้ำ" },
                  {
                    label: "ศูนย์การเรียนรู้ท้องถิ่น",
                    value: "ศูนย์การเรียนรู้ท้องถิ่น",
                  },
                  {
                    label: "ศูนย์การเรียนรู้ทางวิชาการ",
                    value: "ศูนย์การเรียนรู้ทางวิชาการ",
                  },
                ]}
                setOpen={setOpenPlaceType}
                setValue={setPlaceType}
                placeholder="เลือกประเภทสถานที่"
                style={styles.inputpicker}
                dropDownContainerStyle={styles.dropdown}
                listItemContainerStyle={styles.listItem}
                listMode="SCROLLVIEW"
              />
            </View>

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholderTextColor="#999"
              placeholder="รายละเอียด"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              placeholderTextColor="#999"
              style={[styles.input, styles.textarea]}
              placeholder="เวลาเปิดทำการ"
              value={openingDetail}
              onChangeText={setOpeningDetail}
              multiline
            />
            <TextInput
              placeholderTextColor="#999"
              style={styles.input}
              placeholder="เบอร์โทรศัพท์"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              placeholderTextColor="#999"
              style={styles.input}
              placeholder="เว็บไซต์"
              value={website}
              onChangeText={setWebsite}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={saveNewPlace}
            >
              <Text style={styles.submitText}>บันทึก</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 80,
  },

  closeButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    alignSelf: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imageText: {
    fontSize: 12,
    color: "#777",
    position: "absolute",
    bottom: 5,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#22B37A",
    borderRadius: 8,
    marginBottom: 10,
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#22B37A",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdownButton: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#22B37A",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#888",
  },
  pickerBorder: {
    borderColor: "#22B37A",
    borderWidth: 1,
    borderRadius: 8,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  suggestionContainer: {
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingVertical: 4,
  },
  inputpicker: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#22B37A",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#FFF",
    zIndex: 1000,
  },
  dropdown: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#22B37A",
    borderRadius: 8,
    backgroundColor: "#FFF",
    maxHeight: 150,
    zIndex: 3000, // เพื่อให้แสดงอยู่เหนือ element อื่น
  },
  listItem: {
    height: 40,
  },
});

export default SuggestLocationDialog;
