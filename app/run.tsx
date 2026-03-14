import { supabase } from "@/service/supabase";
import { RunsType } from "@/types/runstype";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const runing = require("@/assets/images/runlogo.png");

export default function Run() {
  const [runs, setRuns] = useState<RunsType[]>([]);
  const { uid } = useLocalSearchParams();
  const fetchRuns = async () => {
    const { data, error } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", uid);

    if (error) {
      Alert.alert("คำเตือน", "ไม่สามารถดึงข้อมูลรายการวิ่งได้ กรุณาลองใหม่");
      return;
    }
    setRuns(data as RunsType[]);
  };
  useFocusEffect(
    useCallback(() => {
      fetchRuns();
    }, []),
  );

  const handleAddRunClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      router.push({
        pathname: "/add",
        params: { uid: user.id },
      });
    }
  };
  const renderItem = ({ item }: { item: RunsType }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        <View style={styles.distanceBadge}>
          <Text style={styles.locationText}>{item.location}</Text>
          <Text style={styles.dateText}>
            {(() => {
              const date = new Date(item.run_date);
              const buddhistYear = "พ.ศ. " + (date.getFullYear() + 543);
              return (
                new Intl.DateTimeFormat("th-TH", {
                  month: "long",
                  day: "numeric",
                }).format(date) +
                " " +
                buddhistYear
              );
            })()}
          </Text>
        </View>
        <Text style={styles.distanceText}>{item.distance} km</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image source={runing} style={styles.imglogo} />
      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      <TouchableOpacity style={styles.floatingBtn} onPress={handleAddRunClick}>
        <Ionicons name="add" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },

  distanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    // Shadow สำหรับ iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Elevation สำหรับ Android
    elevation: 3,
  },

  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10,
  },

  distanceText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 14,
    color: "#007AFF",
  },
  dateText: {
    fontFamily: "Kanit_400Regular",
    fontSize: 14,
    color: "#888",
  },
  locationText: {
    fontFamily: "Kanit_700Bold",
    fontSize: 18,
    color: "#333",
    marginBottom: 4,
  },
  imgShow: {
    width: 50,
    height: 50,
  },
  cardItem: {
    flex: 1,
    flexDirection: "row",
    margin: 5,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  imglogo: {
    width: 120,
    height: 120,
    marginTop: 50,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  floatingBtn: {
    padding: 10,
    backgroundColor: "#1889da",
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 60,
    right: 40,
    elevation: 5,
  },
});
