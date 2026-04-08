import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import matchService from "../services/matchService";
import useMatchStore from "../store/matchStore";
import useGameStore from "../store/gameStore";

type Props = NativeStackScreenProps<RootStackParamList, "Matchmaking">;

export default function MatchmakingScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const [dots, setDots] = useState(".");
  const ticket = useMatchStore(s => s.matchmakerTicket);
  const matchId = useMatchStore(s => s.matchId);
  const setTicket = useMatchStore(s => s.setTicket);
  const isOver = useGameStore(s => s.isOver);
  const dotsRef = useRef<ReturnType<typeof setInterval>>();

  // Navigate to Game once matchId is set by SocketService
  useEffect(() => {
    if (matchId) navigation.replace("Game");
  }, [matchId]);

  // Navigate to GameOver if game ends before we got there (edge case)
  useEffect(() => {
    if (isOver) navigation.replace("GameOver");
  }, [isOver]);

  // Animated dots
  useEffect(() => {
    dotsRef.current = setInterval(() =>
      setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(dotsRef.current);
  }, []);

  useEffect(() => {
    let active = true;
    let ticketId = "";

    matchService.joinMatchmaker(mode as any).then((t) => {
      if (!active) {
        // Component unmounted before we got the ticket ID, 
        // cancel it immediately on the server.
        matchService.cancelMatchmaker(t.ticket).catch(() => { });
        return;
      }
      ticketId = t.ticket;
      setTicket(ticketId);
    });

    return () => {
      active = false;
      if (ticketId) {
        matchService.cancelMatchmaker(ticketId).catch(() => { });
      }
    };
  }, [mode]);

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.title}>Finding a player{dots}</Text>
      <Text style={s.sub}>Mode: {mode === "timed" ? "Timed (30s/turn)" : "Classic"}</Text>
      <ActivityIndicator size="large" color="#1D9E75" style={{ marginTop: 32 }} />
      <TouchableOpacity style={s.cancel} onPress={() => navigation.replace("Nickname")}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, color: "#FFF", fontWeight: "600" },
  sub: { color: "#888", marginTop: 8, fontSize: 14 },
  cancel: { marginTop: 48, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#333", paddingHorizontal: 32 },
  cancelText: { color: "#888", fontSize: 14 },
});