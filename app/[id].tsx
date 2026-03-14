import { supabase } from "@/service/subabase";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RunDetail() {
  const { id } = useLocalSearchParams();
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("เช้า");
  const [imageUrl, setImageUrl] = useState("");
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    fetchRun();
  }, []);

  const fetchRun = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert("คำเตือน", "กรุณาเข้าสู่ระบบใหม่");
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("runs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error) throw error;

    setLocation(data.location);
    setDistance(data.distance);
    setTimeOfDay(data.time_of_day);
    setImageUrl(data.image_url);
    setOriginalImageUrl(data.image_url);
  };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("คำเตือน", "ต้องการสิทธิ์เข้าถึงกล้องเพื่อเปลี่ยนรูปภาพ");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
    }
  };

  const handleUpdateRunClick = async () => {
    if (updating) return;
    Alert.alert(
      "แก้ไขรายการจริง",
      "คุณแน่ใจหรือไม่ว่าต้องการแก้ไขรายการวิ่งนี้",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "แก้จริง",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            if (!location || !distance) {
              Alert.alert("คำเตือน", "กรุณาป้อนข้อมูลที่จะแก้ไขให้ครบ");
              setUpdating(false);
              return;
            }
            try {
              let newImageUrl = originalImageUrl;

              if (base64Image) {
                const fileName = `img_${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                  .from("runs_bk")
                  .upload(fileName, decode(base64Image), {
                    contentType: "image/jpeg",
                  });

                if (uploadError) {
                  throw uploadError;
                }

                newImageUrl = supabase.storage
                  .from("runs_bk")
                  .getPublicUrl(fileName).data.publicUrl;

                if (originalImageUrl) {
                  await supabase.storage
                    .from("runs_bk")
                    .remove([originalImageUrl.split("/").pop()!]);
                }
              }

              const { error: updateError } = await supabase
                .from("runs")
                .update([
                  {
                    location: location,
                    distance: distance,
                    time_of_day: timeOfDay,
                    image_url: newImageUrl,
                  },
                ])
                .eq("id", id);

              if (updateError) {
                Alert.alert(
                  "คำเตือน",
                  "พบปัญหาในการบันทึกข้อมูล กรุณาลองใหม่",
                );
                setUpdating(false);
                return;
              }
              Alert.alert("ผลการทำงาน", "แก้ไขรายการวิ่งเรียบร้อย");
              router.back();
            } catch (error: any) {
              Alert.alert(
                "คำเตือน",
                error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่",
              );
              setUpdating(false);
            }
          },
        },
      ],
    );
  };
  const handleDeleteRunClick = async () => {
    Alert.alert("ลบราการวิ่ง", "คุณแน่ใจหรือไม่ว่าต้องการลบรายวิ่งนี้", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบจริง",
        style: "destructive",
        onPress: async () => {
          const { error: tableError } = await supabase
            .from("runs")
            .delete()
            .eq("id", id);

          if (tableError) throw tableError;

          const { error: bucketError } = await supabase.storage
            .from("runs_bk")
            .remove([imageUrl.split("/").pop()!]);

          if (bucketError) throw bucketError;

          Alert.alert("ผลการทำงาน", "ลบรายการวิ่งเรียบร้อยแล้ว");
          router.back();
        },
      },
    ]);
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ส่วนแสดงรูปภาพ */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mainImage, styles.noImage]}>
            <Ionicons name="image-outline" size={60} color="#DDD" />
            <Text style={styles.noImageText}>ยังไม่มีรูปภาพประกอบ</Text>
          </View>
        )}
      </View>

      {/* ฟอร์มแก้ไขข้อมูล */}
      <View style={styles.formCard}>
        <TouchableOpacity
          style={styles.primaryChangePhotoButton}
          onPress={handleChangePhoto}
        >
          <Ionicons name="camera-outline" size={20} color="#FFF" />
          <Text style={styles.primaryChangePhotoText}>เปลี่ยนรูปภาพ</Text>
        </TouchableOpacity>

        <Text style={styles.label}>สถานที่</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>ระยะทาง (กม.)</Text>
        <TextInput
          style={styles.input}
          value={distance.toString()}
          onChangeText={setDistance}
          keyboardType="numeric"
        />

        <Text style={styles.label}>ช่วงเวลา</Text>
        <View style={styles.row}>
          {/* {(['เช้า', 'เย็น'] as const).map((time) => (
<TouchableOpacity
              key={time}
              style={[styles.chip, timeOfDay === time && styles.chipActive]}
              onPress={() => setTimeOfDay(time)}
>
<Text style={[styles.chipText, timeOfDay === time && styles.chipTextActive]}>
                {time}
</Text>
</TouchableOpacity>
          ))} */}
          <TouchableOpacity
            style={[styles.chip, timeOfDay === "เช้า" && styles.chipActive]}
            onPress={() => setTimeOfDay("เช้า")}
          >
            <Text
              style={[
                styles.chipText,
                timeOfDay === "เช้า" && styles.chipTextActive,
              ]}
            >
              เช้า
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, timeOfDay === "เย็น" && styles.chipActive]}
            onPress={() => setTimeOfDay("เย็น")}
          >
            <Text
              style={[
                styles.chipText,
                timeOfDay === "เย็น" && styles.chipTextActive,
              ]}
            >
              เย็น
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.updateButton, updating && styles.buttonDisabled]}
          disabled={updating}
          onPress={handleUpdateRunClick}
        >
          {updating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.updateButtonText}>บันทึกการแก้ไข</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteRunClick}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>ลบรายการนี้</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#EEE",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  primaryChangePhotoButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryChangePhotoText: {
    marginLeft: 8,
    color: "#FFF",
    fontFamily: "Kanit_700Bold",
    fontSize: 14,
  },
  noImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  noImageText: {
    fontFamily: "Kanit_400Regular",
    color: "#AAA",
    marginTop: 10,
  },
  formCard: {
    backgroundColor: "#FFF",
    height: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontFamily: "Kanit_700Bold",
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingVertical: 10,
    fontFamily: "Kanit_400Regular",
    fontSize: 18,
    color: "#007AFF",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  chipActive: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    fontFamily: "Kanit_400Regular",
    color: "#666",
  },
  chipTextActive: {
    color: "#FFF",
  },
  updateButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  updateButtonText: {
    color: "#FFF",
    fontFamily: "Kanit_700Bold",
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontFamily: "Kanit_400Regular",
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
