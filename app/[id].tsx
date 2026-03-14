import { supabase } from "@/service/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
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
  const [updating, setUpdating] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [newBase64, setNewBase64] = useState<string | null>(null);
  useEffect(() => {
    fetchRun();
  }, []);

  const fetchRun = async () => {
    const { data, error } = await supabase
      .from("runs")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    setLocation(data.location);
    setDistance(data.distance);
    setTimeOfDay(data.time_of_day);
    setImageUrl(data.image_url);
  };
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
      setNewBase64(result.assets[0].base64 || null);
    }
  };

  const handleUpdateRunClick = async () => {
    Alert.alert("แก้ไขรายการ", "คุณแน่ใจหรือไม่ว่าต้องการแก้ไขข้อมูลนี้", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ตกลง",
        onPress: async () => {
          try {
            setUpdating(true);
            let finalImageUrl = imageUrl;

            // ถ้ามีการเลือกรูปใหม่
            if (newBase64) {
              const fileName = `img_${Date.now()}.jpg`;

              // 1. อัปโหลดรูปใหม่
              const { error: uploadError } = await supabase.storage
                .from("runs_bk")
                .upload(fileName, decode(newBase64), {
                  contentType: "image/jpeg",
                });

              if (uploadError) throw uploadError;

              // 2. ดึง URL ใหม่
              const { data: urlData } = supabase.storage
                .from("runs_bk")
                .getPublicUrl(fileName);

              // 3. ลบรูปเก่าออกจาก Storage เพื่อไม่ให้เปลืองพื้นที่
              if (imageUrl) {
                const oldFileName = imageUrl.split("/").pop();
                if (oldFileName) {
                  await supabase.storage.from("runs_bk").remove([oldFileName]);
                }
              }

              finalImageUrl = urlData.publicUrl;
            }

            // อัปเดตข้อมูลลง Database
            const { error: updateError } = await supabase
              .from("runs")
              .update({
                location,
                distance,
                time_of_day: timeOfDay,
                image_url: finalImageUrl,
              })
              .eq("id", id);

            if (updateError) throw updateError;

            Alert.alert("สำเร็จ", "แก้ไขข้อมูลเรียบร้อย");
            router.back();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
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
        {newImage || imageUrl ? (
          <Image
            source={{ uri: newImage || imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mainImage, styles.noImage]}>
            <Ionicons name="image-outline" size={60} color="#DDD" />
          </View>
        )}

        {/* ปุ่มแก้ไขรูปภาพ (ดินสอ) */}
        <TouchableOpacity style={styles.editImageBtn} onPress={handlePickImage}>
          <Ionicons name="pencil" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ฟอร์มแก้ไขข้อมูล */}
      <View style={styles.formCard}>
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
    height: 250,
    backgroundColor: "#EEE",
    position: "relative",
  },
  editImageBtn: {
    position: "absolute",
    right: 15,
    top: 15,
    backgroundColor: "rgba(0, 122, 255, 0.8)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mainImage: {
    width: "100%",
    height: "100%",
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
