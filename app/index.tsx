import { supabase } from "@/service/subabase";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

const runing = require("@/assets/images/runlogo.png");

export default function Index() {
  useEffect(() => {
    let isMounted = true;

    // ตั้งให้รอ 3 วิก่อนจะไปหน้า login (กรณีที่ยังไม่มี session)
    // const loginTimer = setTimeout(() => {
    //   if (isMounted) {
    //     router.replace("/login");
    //   }
    // }, 3000);

    const checkSessionAndRedirect = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        // ถ้ามี session แล้วให้ไปหน้า run เลย และยกเลิก timer ที่จะไป login
        if (session) {
          // clearTimeout(loginTimer);
          router.replace("/run");
        }
        // ถ้าไม่มี session ก็ปล่อยให้ timer พาไปหน้า login หลังจาก 3 วิ
      } catch {
        // ถ้าเช็ค session พลาด ก็ปล่อยให้ timer ทำงานต่อไป
      }
    };

    checkSessionAndRedirect();

    return () => {
      isMounted = false;
      // clearTimeout(loginTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Image source={runing} style={styles.imglogo} />
      <Text style={styles.appname}>Run Tracker</Text>
      <Text style={styles.appthainame}>วิ่งเพื่อสุขภาพ</Text>
      <ActivityIndicator size={"large"} color={"#1889da"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  imglogo: { width: 200, height: 200 },
  appname: { fontFamily: "Kanit_700Bold", fontSize: 24, marginTop: 20 },
  appthainame: {
    fontFamily: "Kanit_700Bold",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
});
