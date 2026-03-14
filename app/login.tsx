import { Link, router } from "expo-router";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
// Import Icon จาก Expo
import { FontAwesome } from "@expo/vector-icons";
import { supabase } from "@/service/subabase";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // ใช้ scheme ให้ตรงกับใน app.json
      const redirectTo = makeRedirectUri({
        scheme: "rnruntrackerapp",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );
        if (result.type === "success") {
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Run Tracker</Text>
          <Text style={styles.brandSubtitle}>ก้าวไปข้างหน้าในทุกๆ วัน</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>เข้าสู่ระบบ</Text>

          <TextInput
            style={styles.input}
            placeholder="อีเมล"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="รหัสผ่าน"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#94a3b8"
          />

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>หรือ</Text>
            <View style={styles.line} />
          </View>

          {/* ปุ่ม Google แบบ UI สะอาดตา */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && { backgroundColor: "#f8fafc" },
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#64748b" />
            ) : (
              <View style={styles.googleContent}>
                <FontAwesome
                  name="google"
                  size={20}
                  color="#EA4335"
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  ดำเนินการต่อด้วย Google
                </Text>
              </View>
            )}
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={styles.secondaryText}>ยังไม่มีบัญชี?</Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={styles.linkText}> สมัครสมาชิก</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  brandContainer: { alignItems: "center", marginBottom: 35 },
  brandTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0ea5e9",
    letterSpacing: -1,
  },
  brandSubtitle: { fontSize: 16, color: "#64748b", marginTop: 4 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#0f172a",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  primaryButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  line: { flex: 1, height: 1, backgroundColor: "#f1f5f9" },
  orText: { marginHorizontal: 12, color: "#94a3b8", fontSize: 14 },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  googleContent: { flexDirection: "row", alignItems: "center" },
  googleIcon: { marginRight: 12 },
  googleButtonText: { color: "#334155", fontWeight: "600", fontSize: 16 },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  secondaryText: { color: "#64748b" },
  linkText: { color: "#0ea5e9", fontWeight: "700" },
});
