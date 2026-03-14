import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "@/service/subabase";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [loading, setLoading] = useState(false);

  // ถ้ามี session อยู่แล้ว หรือเมื่อ login สำเร็จ ให้เด้งไปหน้า /run อัตโนมัติ
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        if (session) {
          router.replace("/run");
        }
      } catch {
        // ถ้าเช็ค session พลาด ก็ปล่อยให้ผู้ใช้เห็นหน้า login ตามปกติ
      }
    };

    checkExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session) {
        router.replace("/run");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // IMPORTANT:
      // - Expo Go: ต้องใช้ Expo auth proxy URL (https://auth.expo.io/...) เพราะ redirect URL ของ Expo Go จะเป็น exp://... ซึ่งไม่เหมาะกับ Supabase allow-list
      // - Dev build/Standalone: ใช้ custom scheme กลับเข้าแอปโดยตรง
      const redirectTo =
        Constants.appOwnership === "expo"
          ? AuthSession.getRedirectUrl("login")
          : AuthSession.makeRedirectUri({
              scheme: "rnruntrackerapp",
              path: "login",
              preferLocalhost: false,
            });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        Alert.alert(
          "OAuth Error",
          `${error.message}\n\nredirectTo:\n${redirectTo}\n\nappOwnership: ${Constants.appOwnership}`,
        );
        return;
      }

      if (data?.url) {
        // ถ้ายังเจอ requested path invalid ให้เอาค่า redirectTo ไปใส่ใน Supabase Redirect URLs ให้ตรงเป๊ะ
        // (โดยเฉพาะตอนรันด้วย Expo Go ซึ่ง redirectTo จะเป็น https://auth.expo.io/...)
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        // ถ้า Google login สำเร็จและ redirect กลับมาที่แอปแล้ว
        if (result.type === "success") {
          // สำหรับ PKCE ต้อง exchange code -> session เพื่อให้ Supabase เก็บ session ลง storage
          if (result.url) {
            const { error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(result.url);
            if (exchangeError) {
              Alert.alert(
                "Error",
                `exchangeCodeForSession ล้มเหลว: ${exchangeError.message}`,
              );
              return;
            }
          }

          router.replace("/run");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* ส่วนแสดง Brand / Logo */}
        <View style={styles.brandContainer}>
          <View style={styles.logoPlaceholder}>
            <FontAwesome name="bolt" size={50} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>Run Tracker</Text>
          <Text style={styles.brandSubtitle}>ก้าวไปข้างหน้าในทุกๆ วัน</Text>
        </View>

        {/* ส่วนปุ่มกด Login */}
        <View style={styles.bottomSection}>
          <Text style={styles.welcomeText}>ยินดีต้อนรับ</Text>
          <Text style={styles.instructionText}>
            เข้าสู่ระบบเพื่อบันทึกการวิ่งและติดตามสุขภาพของคุณ
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.googleContent}>
                <FontAwesome
                  name="google"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.googleButtonText}>
                  ดำเนินการต่อด้วย Google
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            การเข้าสู่ระบบแสดงว่าคุณยอมรับข้อตกลงและเงื่อนไข
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  brandContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#0ea5e9",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // Shadow สำหรับ iOS
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    // Elevation สำหรับ Android
    elevation: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  googleButton: {
    backgroundColor: "#0ea5e9", // ใช้สีหลักของแอปเพื่อให้ดูเป็น Action หลัก
    width: "100%",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  googleContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  footerText: {
    marginTop: 25,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
});
