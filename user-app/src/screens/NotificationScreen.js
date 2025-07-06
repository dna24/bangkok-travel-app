import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { apiClient, getUserId } from "../../services/apiClient";
import { FontAwesome } from "@expo/vector-icons";
import moment from "moment";


const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchNotifications = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      const response = await apiClient.get("/notifications/");
      const userNotis = response.data
        .filter((n) => n.user === userId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ); 
      setNotifications(userNotis);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.is_read);
      const updatePromises = unread.map((noti) =>
        apiClient.patch(`/notifications/${noti.id}/`, { is_read: true })
      );
      await Promise.all(updatePromises); 
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleBackPress = async () => {
    await markAllAsRead();
    navigation.goBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        !item.is_read && styles.unreadCard, 
      ]}
    >
      <View style={styles.iconWrapper}>
        <FontAwesome
          name={
            item.notification_type === "review_approved"
              ? "check-circle"
              : "flag"
          }
          size={24}
          color="#22B37A"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{moment(item.created_at).fromNow()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
      return (
          <View style={styles.containerload}>
              <ActivityIndicator size="large" color="#22B37A" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <FontAwesome name="chevron-left" size={16} color="#22B37A" />
        </TouchableOpacity>
        <Text style={styles.headerText}>การแจ้งเตือน</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>ไม่มีการแจ้งเตือน</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  headerText: {
    fontSize: 20,
    fontFamily: "NotoSansThai_700Bold",
  },
  containerload: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
    fontFamily: "NotoSansThai_400Regular",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  unreadCard: {
    backgroundColor: "#E6F4F1",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  iconWrapper: { marginRight: 10 },
  content: { flex: 1 },
  message: {
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    fontFamily: "NotoSansThai_300Light",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#22B37A",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginRight: 15,
  },
  headerRow: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
});

export default NotificationScreen;
