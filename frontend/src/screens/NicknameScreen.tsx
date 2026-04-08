import React, { useState }              from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import * as Device                      from "expo-device";
import { NativeStackScreenProps }       from "@react-navigation/native-stack";
import { RootStackParamList }           from "../navigation/RootNavigator";
import nakamaService                    from "../services/nakamaService";
import socketService                    from "../services/socketService";
import useAuthStore                     from "../store/authStore";
import { GameMode }                     from "../constants";

type Props = NativeStackScreenProps<RootStackParamList, "Nickname">;

export default function NicknameScreen({ navigation }: Props) {
  const [nickname, setNickname] = useState("");
  const [loading,  setLoading]  = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);

  const handleContinue = async (mode: GameMode) => {
    const name = nickname.trim();
    if (name.length < 3) {
      Alert.alert("Too short", "Nickname must be at least 3 characters.");
      return;
    }
    setLoading(true);
    try {
      // Nakama requires deviceId to be 10-128 characters. 
      // Device.deviceName might be short (e.g. "iPhone").
      const rawId = Device.osBuildId || Device.deviceName || "unknown-device";
      // const deviceId = rawId.length >= 10 ? rawId : `${rawId}-${Math.random().toString(36).slice(2, 7)}`;
      const deviceId =  "device-" + Math.random().toString(36).slice(2) + Date.now();
      console.log("DEVICE ID:", deviceId);
      
      const session = await nakamaService.authenticateWithDevice(deviceId, name);
      setAuth(session.user_id!, name, deviceId);
      await socketService.connect();
      navigation.replace("Matchmaking", { mode });
    } catch (e) {
      Alert.alert("Connection failed", "Could not reach the server. Check your config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Tic-Tac-Toe</Text>
      <Text style={s.subtitle}>Enter your nickname</Text>

      <TextInput
        style={s.input}
        placeholder="Nickname"
        placeholderTextColor="#888"
        value={nickname}
        onChangeText={setNickname}
        maxLength={20}
        autoFocus
        returnKeyType="done"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1D9E75" style={{ marginTop: 24 }} />
      ) : (
        <>
          <TouchableOpacity style={s.btn} onPress={() => handleContinue(GameMode.Classic)}>
            <Text style={s.btnText}>Classic match</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnTimed]} onPress={() => handleContinue(GameMode.Timed)}>
            <Text style={s.btnText}>Timed match  (30s/turn)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.link} onPress={() => navigation.navigate("Leaderboard")}>
            <Text style={s.linkText}>View leaderboard</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", justifyContent: "center", paddingHorizontal: 32 },
  title:     { fontSize: 36, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  subtitle:  { fontSize: 16, color: "#888", textAlign: "center", marginBottom: 40 },
  input:     {
    backgroundColor: "#1A1A1A", borderRadius: 12, padding: 16,
    fontSize: 18, color: "#FFF", borderWidth: 1, borderColor: "#333", marginBottom: 24,
  },
  btn:       {
    backgroundColor: "#1D9E75", borderRadius: 12, padding: 16,
    alignItems: "center", marginBottom: 12,
  },
  btnTimed:  { backgroundColor: "#5DCAA5" },
  btnText:   { color: "#FFF", fontSize: 16, fontWeight: "600" },
  link:      { alignItems: "center", marginTop: 16 },
  linkText:  { color: "#1D9E75", fontSize: 14 },
});