import { supabase } from "@/service/subabase";
import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function Add() {
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("เช้า");
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const router = useRouter();
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ขออนุญาตเข้าถึงกล้องเพื่อถ่ายภาพหน่อยนะครับ");
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
    }
  };

  const handleSaveToSupabase = async () => {
    if (!location || !distance || !image) {
      Alert.alert("คำเตือน", "กรุณาป้อนข้อมูลให้ครบ และเลือกรูปภาพ");
      return;
    }

    // ดึง user ปัจจุบันเพื่อผูกข้อมูลวิ่งกับเจ้าของ
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert("คำเตือน", "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    let image_url = null;
    const fileName = `img_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("runs_bk")
      .upload(fileName, decode(base64Image!), { contentType: "image/jpeg" });

    if (uploadError) throw uploadError;

    image_url = await supabase.storage.from("runs_bk").getPublicUrl(fileName)
      .data.publicUrl;

    const { error: insertError } = await supabase.from("runs").insert({
      location: location,
      distance: distance,
      time_of_day: timeOfDay,
      run_date: new Date().toISOString().split("T")[0],
      image_url: image_url,
      user_id: user.id,
    });

    if (insertError) {
      Alert.alert("คำเตือน", "พบปํญหาในการบันทึกข้อมูล กรุณาลองใหม่");
      return;
    }

    Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียนร้อย");
    router.back();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.titleShow}>สถานที่วิ่ง</Text>
        <TextInput
          placeholder="เช่น สวนลุมพินี"
          style={styles.inputValue}
          value={location}
          onChangeText={setLocation}
        />
        <Text style={styles.titleShow}>ระยะทาง (กิโลเมตร)</Text>
        <TextInput
          placeholder="เช่น 5.2"
          style={styles.inputValue}
          value={distance}
          onChangeText={setDistance}
        />

        <Text style={styles.titleShow}>ช่วงเวลา</Text>
        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setTimeOfDay("เช้า")}
            style={[
              styles.todBtn,
              { backgroundColor: timeOfDay === "เช้า" ? "#1889da" : "#e6e6e6" },
            ]}
          >
            <Text style={{ fontFamily: "Kanit_400Regular", color: "#fff" }}>
              เช้า
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeOfDay("เย็น")}
            style={[
              styles.todBtn,
              { backgroundColor: timeOfDay === "เย็น" ? "#1889da" : "#e6e6e6" },
            ]}
          >
            <Text style={{ fontFamily: "Kanit_400Regular", color: "#fff" }}>
              เย็น
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.titleShow}>รูปภาพสถานที่</Text>
        <TouchableOpacity style={styles.takePhotoBtn} onPress={handleTakePhoto}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: "100%", height: 200 }}
            />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Ionicons name="camera" size={30} color="#d3d3d3" />
              <Text
                style={{ fontFamily: "Kanit_400Regular", color: "#b6b6b6" }}
              >
                กดเพื่อถ่ายภาพ
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToSupabase}>
          <Text style={{ fontFamily: "Kanit_700Bold", color: "#fff" }}>
            บันทึกข้อมูล
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  todBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  saveBtn: {
    padding: 15,
    backgroundColor: "#1889da",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  takePhotoBtn: {
    width: "100%",
    height: 200,
    backgroundColor: "#e6e6e6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  titleShow: {
    fontFamily: "Kanit_700Bold",
    marginBottom: 10,
  },
  inputValue: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontFamily: "Kanit_400Regular",
    backgroundColor: "#EFEFEF",
  },
});
