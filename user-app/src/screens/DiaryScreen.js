import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, Animated, ActivityIndicator, Alert} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { getUserId, apiClient } from '../../services/apiClient';
import DiaryForm from '../component/DiaryForm';
import ReportForm from "../component/ReportForm";

const DiaryScreen = ({ navigation }) => {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [createMemo, setCreateMemo] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  const [loading, setLoading] = useState(true);
  const [publicMemos, setPublicMemos] = useState([]);
  const [privateMemos, setPrivateMemos] = useState([]);
  const [selectedTab, setSelectedTab] = useState('public');
  const [expanded, setExpanded] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalVisibleReport, setModalVisibleReport] = useState(false);
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    fetchUserId();
    fetchData();
  }, []);

  const fetchUserId = async () => {
    try {
      const userId = await getUserId();
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

 
  const fetchData = async () => {
    try {
      const userId = await getUserId(); 
      const publicResponse = await apiClient.get('memos/', { params: { type: 'public' } });
      const privateResponse = await apiClient.get('memos/', { params: { type: 'private', user_id: userId } });
      
      const sortedPublic = publicResponse.data.sort((a, b) => b.memo_id - a.memo_id);
      const sortedPrivate = privateResponse.data.sort((a, b) => b.memo_id - a.memo_id);

      setPublicMemos(sortedPublic);
      setPrivateMemos(sortedPrivate);

      const usersResponse = await apiClient.get('users/');
      console.log("Users data:", usersResponse.data); 
      setUsers(usersResponse.data);

      const placesResponse = await apiClient.get('places/');
      setPlaces(placesResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const toggleMemoButton = () => {
      setCreateMemo(createMemo => {
          const newValue = !createMemo;
          Animated.timing(slideAnim, {
          toValue: newValue ? -50 : 0,
          duration: 300,
          useNativeDriver: true,
          }).start();
          return newValue;
      });
  };

  const openReportModalReport = (memoId) => {
    setSelectedMemoId(memoId);
    setModalVisibleReport(true);
  };
  
  const closeReportModalReport = () => {
    setModalVisibleReport(false);
  };

  const openImageModal = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };   

  const confirmDeleteMemo = (memoId) => {
    Alert.alert(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกนี้?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบ",
          onPress: () => handleDeleteMemo(memoId),
          style: "destructive"
        }
      ]
    );
  };

  const handleDeleteMemo = async (memoId) => {
    try {
      await apiClient.delete(`memo/${memoId}/`);
      alert('ลบข้อมูลเรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      console.error('Error deleting memo:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const toggleMemoModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const filteredMemos = selectedTab === 'public' 
    ? publicMemos.filter(memo => memo.memo_detail.toLowerCase().includes(search.toLowerCase()))
    : privateMemos.filter(memo => memo.memo_detail.toLowerCase().includes(search.toLowerCase()));


  if (loading) {
    return (
      <View style={styles.containerload}>
        <ActivityIndicator size="large" color="#22B37A" />
      </View>
    );
  }

  const getUser = userId => users.find(user => user.id === userId) || {};
  const getPlace = placeId => places.find(place => place.place_id === placeId) || {};
  const handleShowMore = (id) => { setExpanded(prev => ({ ...prev, [id]: !prev[id] }));};

  const renderItem = ({ item }) => {
    const user = getUser(item.user_id);
    const place = getPlace(item.place_id);
    const isExpanded = expanded[item.memo_id];
  
    return (
      <View style={styles.memoCard}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.user_img }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{user.user_name}</Text>
            <Text style={styles.location} numberOfLines={2} ellipsizeMode="tail">
              📍 {place.place_name}
            </Text>
          </View>
          {item.user_id === currentUserId ? (
            // ถ้าเป็น Memo ของตัวเอง แสดงปุ่มลบ
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => confirmDeleteMemo(item.memo_id)}
            >
              <FontAwesome name="ellipsis-v" size={20} color="gray" />
            </TouchableOpacity>
          ) : (
            // ถ้าไม่ใช่ Memo ของตัวเอง และอยู่ในแท็บ 'public' แสดงปุ่มรายงาน
            selectedTab === 'public' && (
              <TouchableOpacity 
                style={styles.menuButton} 
                onPress={() => openReportModalReport(item.memo_id)}
              >
                <FontAwesome name="ellipsis-v" size={20} color="gray" />
              </TouchableOpacity>
            )
          )}
        </View>
        {item.images && item.images.length > 0 && (
          <FlatList
            data={item.images}
            horizontal
            keyExtractor={(img, index) => index.toString()}
            renderItem={({ item: image }) => (
              <TouchableOpacity onPress={() => openImageModal(image.memo_img)}>
                <Image source={{ uri: image.memo_img }} style={styles.memoImage} />
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ marginVertical: 10 }}
          />
        )}

        <Text style={styles.memoDetail} numberOfLines={isExpanded ? undefined : 4}>
          {item.memo_detail}
        </Text>

        {item.memo_detail.length > 150 && (
          <TouchableOpacity onPress={() => handleShowMore(item.memo_id)}>
            <Text style={styles.showMoreText}>
              {isExpanded ? " ย่อข้อความ" : " อ่านเพิ่มเติม"} <FontAwesome name={isExpanded ? "chevron-up" : "chevron-down"} size={12}  />  
          </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>บันทึกการเดินทาง</Text>
      </View>
      {/* <TextInput 
        style={styles.searchBar} 
        placeholder="ค้นหา..." 
        value={search} 
        onChangeText={setSearch} 
      /> */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setSelectedTab('public')}>
          <Text style={[styles.tabText, selectedTab === 'public' && styles.activeTab]}>สาธารณะ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('private')}>
          <Text style={[styles.tabText, selectedTab === 'private' && styles.activeTab]}>ส่วนตัว</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredMemos}
        keyExtractor={item => item.memo_id.toString()}
        renderItem={renderItem}
      />

      {filteredMemos.length === 0 && !loading && (
        <View style={{ alignItems: 'center', marginBottom: 270 }}>
          <Text style={{ fontSize: 14, color: 'gray', fontFamily: 'NotoSansThai_400Regular' }}>
            ยังไม่มีบันทึกการเดินทาง
          </Text>
        </View>
      )}
      {/* ปุ่มลอยอยู่ที่มุมขวาล่าง */}
      
      <View style={styles.buttonContainer}>
        {createMemo && (
          <TouchableOpacity style={[styles.planButton, { transform: [{ translateY: slideAnim }] }]} onPress={toggleMemoModal}>
            <FontAwesome name="pencil" size={20} color="white"/>
            <Text style={styles.planText}>เขียนบันทึก</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.addButton} onPress={toggleMemoButton}>
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

      <ReportForm
        isVisible={isModalVisibleReport} 
        onClose={closeReportModalReport} 
        memoId={selectedMemoId} 
      />
      {isModalVisible && <DiaryForm visible={isModalVisible} onClose={toggleMemoModal} onSaveSuccess={fetchData} />}
    </View>
  );
};

const styles = {
  container: { flex: 1, padding: 16, paddingBottom: 100, backgroundColor: "#fff" },
  containerload: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff",},
  header: { paddingTop: 4, paddingBottom: 30 },
  headerText: { fontSize: 18, fontFamily: 'NotoSansThai_700Bold', marginTop: 30 },
  searchBar: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#28a745",
    fontFamily: 'NotoSansThai_400Regular',
  },
  memoCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 1,
    marginBottom: 10,
    marginLeft: 1,
    marginRight: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  userInfo: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontSize: 16, fontFamily: 'NotoSansThai_700Bold', },
  location: { fontSize: 12, color: "gray", flex: 1, maxWidth: 250, fontFamily: 'NotoSansThai_400Regular', },
  memoImage: { width: 100, height: 100, marginRight: 5, marginTop: 5, resizeMode: 'cover' },
  memoDetail: { marginTop: 10, color: "black", fontFamily: 'NotoSansThai_400Regular', },
  buttonContainer: { position: "absolute", bottom: 100, right: 20, alignItems: "flex-end" },
  planButton: { backgroundColor: "#28a745", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, flexDirection: "row", alignItems: "center", marginBottom: -40 },
  planText: { color: "white", fontFamily: 'NotoSansThai_700Bold',  marginLeft: 5 },
  addButton: { backgroundColor: "#28a745", padding: 5, borderRadius: 50, alignItems: "center", width: 55, height: 55, justifyContent: "center", elevation: 5 },
  addText: { color: "white", fontSize: 30, fontWeight: "bold" },
  tabContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  tabText: { fontSize: 16, fontFamily: 'NotoSansThai_400Regular',   color: "gray", marginHorizontal: 30, paddingBottom: 5, },    
  activeTab: { color: "#28a745", borderBottomWidth: 2, borderBottomColor: "#28a745" },
  showMoreText: { color: "#28a745", fontFamily: 'NotoSansThai_400Regular', marginTop: 5, textAlign: "right",},
  menuButton: { position: "absolute", top: -4, right: 5, padding: 5, zIndex: 10,},
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
};

export default DiaryScreen;
