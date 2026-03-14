import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
const runing = require("@/assets/images/runlogo.png");

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);
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
