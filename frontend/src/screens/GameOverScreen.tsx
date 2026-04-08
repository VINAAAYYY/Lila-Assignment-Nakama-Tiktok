import React, { useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList }     from "../navigation/RootNavigator";
import useGameStore               from "../store/gameStore";
import useMatchStore              from "../store/matchStore";
import useAuthStore               from "../store/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "GameOver">;

export default function GameOverScreen({ navigation }: Props) {
  const { winner, reason }  = useGameStore();
  const userId              = useAuthStore(s => s.userId);
  const resetGame           = useGameStore(s => s.reset);
  const resetMatch          = useMatchStore(s => s.reset);

  const didWin  = winner === userId;
  const isDraw  = winner === null && reason === "draw";
  const heading = isDraw ? "Draw!" : didWin ? "You won!" : "You lost";
  const emoji   = isDraw ? "🤝" : didWin ? "🏆" : "💀";
  const reasonLabel: Record<string, string> = {
    win:           "",
    draw:          "Board full",
    timeout:       didWin ? "Opponent timed out" : "You ran out of time",
    opponent_left: "Opponent disconnected",
  };

  const handlePlayAgain = () => {
    resetGame();
    resetMatch();
    navigation.replace("Nickname");
  };

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.heading, didWin && s.win, !didWin && !isDraw && s.lose]}>
        {heading}
      </Text>
      {reason && reasonLabel[reason] ? (
        <Text style={s.reason}>{reasonLabel[reason]}</Text>
      ) : null}

      <TouchableOpacity style={s.btn} onPress={handlePlayAgain}>
        <Text style={s.btnText}>Play again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.link} onPress={() => navigation.navigate("Leaderboard")}>
        <Text style={s.linkText}>View leaderboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  emoji:     { fontSize: 72, marginBottom: 16 },
  heading:   { fontSize: 36, fontWeight: "700", color: "#FFF", marginBottom: 8 },
  win:       { color: "#1D9E75" },
  lose:      { color: "#E24B4A" },
  reason:    { color: "#888", fontSize: 14, marginBottom: 40 },
  btn:       { backgroundColor: "#1D9E75", borderRadius: 12, padding: 16, paddingHorizontal: 48, marginBottom: 16 },
  btnText:   { color: "#FFF", fontSize: 16, fontWeight: "600" },
  link:      { padding: 12 },
  linkText:  { color: "#1D9E75", fontSize: 14 },
});