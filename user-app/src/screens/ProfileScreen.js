import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import { apiClient, getUserId, removeToken } from "../../services/apiClient";
import { Ionicons } from "@expo/vector-icons";
import EditProfileDialog from "../component/EditProfileDialog";
import SuggestLocationDialog from "../component/SuggestLocationDialog";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const id = await getUserId();
          setUserId(id);
          if (id) {
            const userResponse = await apiClient.get(`users/${id}/`);
            setUser(userResponse.data);
          }
          const res = await apiClient.get("/notifications/");
          const userNotis = res.data.filter((n) => n.user === id);
          const unread = userNotis.filter((n) => !n.is_read);
          setUnreadCount(unread.length);
        } catch (e) {
          console.error("Error loading data:", e);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [])
  );
  
  const handleLogout = async () => {
    console.log("กดแล้วนะจ่ะ");
    Alert.alert("ยืนยันการออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ตกลง",
        onPress: async () => {
          try {
            await removeToken();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถออกจากระบบได้");
          }
        },
      },
    ]);
  };
  const handleDeleteAccount = async () => {
    Alert.alert("ยืนยันการลบบัญชี", "คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของคุณ?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ตกลง",
        onPress: async () => {
          try {
            const response = await apiClient.delete(`users/${userId}/`); 
            if (response.status === 200) {
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
              Alert.alert("บัญชีถูกลบแล้ว", "บัญชีของคุณถูกลบเรียบร้อยแล้ว");
              await removeToken();
            }
          } catch (error) {
            console.error("Error deleting account:", error);
            Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบบัญชีของคุณได้");
          }
        },
      },
    ]);
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
      {/* Header */}
      <ImageBackground
        source={require("../../assets/profile_top.png")}
        style={styles.header}
        resizeMode="cover"
      >
        <Text style={styles.headerText}>บัญชีผู้ใช้</Text>
      </ImageBackground>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: user?.user_img || "https://via.placeholder.com/50" }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.user_name}</Text>
          <Text style={styles.profileEmail}>{user.user_email}</Text>
        </View>
        <TouchableOpacity onPress={() => setEditModalVisible(true)}>
          <Icon name="create-outline" size={30} color="#000" />
        </TouchableOpacity>

        {/* Dialog แก้ไขโปรไฟล์ */}
        <EditProfileDialog
          isVisible={isEditModalVisible}
          onClose={() => setEditModalVisible(false)}
          user={user}
          onUpdate={(updatedUser) => setUser(updatedUser)}
        />
      </View>

      {/* Settings List */}
      <View style={styles.settingsList}>
        <SettingItem
          icon="notifications-outline"
          text="การแจ้งเตือน"
          onPress={() => navigation.navigate("NotificationScreen")}
          badgeCount={unreadCount}
        />
        {/* <SettingItem icon="lock-closed-outline" text="ความปลอดภัย" /> */}
        <SettingItem
          icon="home-outline"
          text="แนะนำสถานที่"
          onPress={() => setDialogVisible(true)}
        />
        <SettingItem
          icon="log-out-outline"
          text="ออกจากระบบ"
          onPress={handleLogout}
        />
        <SettingItem
          icon="trash-outline"
          text="ลบบัญชี"
          isDeleteAccount
          onPress={handleDeleteAccount}
        />
      </View>
      {/* Dialog */}
      <SuggestLocationDialog
        visible={isDialogVisible}
        onClose={() => setDialogVisible(false)}
      />

      {/* Footer */}
      <Text style={styles.footer}>App version: 1.0</Text>
    </View>
  );
};

const SettingItem = ({
  icon,
  text,
  isDeleteAccount = false,
  onPress,
  badgeCount,
}) => {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingContent}>
        <Icon name={icon} size={24} color={isDeleteAccount ? "red" : "#555"} />
        <Text
          style={[
            styles.settingText,
            { color: isDeleteAccount ? "red" : "#000" },
          ]}
        >
          {text}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
        <Icon name="chevron-forward-outline" size={20} color="#888" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  containerload: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    height: 150,
    paddingVertical: 60,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "flex-start",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  headerText: {
    paddingLeft: 5,
    fontSize: 20,
    color: "#fff",
    textAlign: "left",
    fontFamily: "NotoSansThai_700Bold",
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "NotoSansThai_700Bold",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    fontFamily: "NotoSansThai_400Regular",
  },
  settingsList: {
    marginTop: 20,
  },
  settingItem: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    marginLeft: 16,
    fontSize: 16,
    fontFamily: "NotoSansThai_400Regular",
  },
  footer: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 12,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "red",
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
