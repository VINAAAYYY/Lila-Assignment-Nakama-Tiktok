import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList }     from "../navigation/RootNavigator";
import matchService               from "../services/matchService";
import useGameStore               from "../store/gameStore";
import useMatchStore              from "../store/matchStore";
import useAuthStore               from "../store/authStore";
import { PlayerMark }             from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

export default function GameScreen({ navigation }: Props) {
  const { board, marks, myMark, turn, isOver, mode, turnDeadline } = useGameStore();
  const matchId      = useMatchStore(s => s.matchId);
  const userId       = useAuthStore(s => s.userId);
  const opponentName = useMatchStore(s => s.opponentName);
  const username     = useAuthStore(s => s.username);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Robust turn check: Server might send either userId or "X"/"O" as the turn
  const isMyTurn = turn === userId || (myMark && turn === myMark);

  // Navigate to GameOver when server says game ended
  useEffect(() => {
    if (isOver) navigation.replace("GameOver");
  }, [isOver]);

  // Countdown timer for timed mode
  useEffect(() => {
    if (mode !== "timed" || turnDeadline === 0) return;
    const tick = setInterval(() => {
      const secs = Math.max(0, turnDeadline - Math.floor(Date.now() / 1000));
      setTimeLeft(secs);
    }, 500);
    return () => clearInterval(tick);
  }, [turnDeadline, mode]);

  const handleCellPress = useCallback(async (index: number) => {
    if (!isMyTurn || board[index] !== "" || !matchId) return;
    await matchService.sendMove(matchId, index);
  }, [isMyTurn, board, matchId]);

  const renderCell = (index: number) => {
    const mark  = board[index];
    const empty = mark === "";
    return (
      <TouchableOpacity
        key={index}
        style={[s.cell, !empty && s.cellFilled]}
        onPress={() => handleCellPress(index)}
        disabled={!isMyTurn || !empty}
        activeOpacity={0.7}
      >
        <Text style={[s.cellText, mark === "X" ? s.xColor : s.oColor]}>
          {mark}
        </Text>
      </TouchableOpacity>
    );
  };

  const statusText = isMyTurn
    ? "Your turn"
    : "Opponent's turn";

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        {myMark ? (
          <View style={s.markBadge}>
            <Text style={s.markLabel}>{username || "You"}</Text>
            <Text style={[s.markValue, myMark === "X" ? s.xColor : s.oColor]}>
              {myMark}
            </Text>
          </View>
        ) : (
          <View style={s.markBadge}>
            <Text style={s.markLabel}>{username || "You"}</Text>
            <Text style={s.markValue}>...</Text>
          </View>
        )}

        <View style={s.vsContainer}>
          <Text style={s.vsText}>VS</Text>
        </View>

        {myMark ? (
          <View style={s.markBadge}>
            <Text style={s.markLabel}>{opponentName || "Opponent"}</Text>
            <Text style={[s.markValue, myMark === "X" ? s.oColor : s.xColor]}>
              {myMark === "X" ? "O" : "X"}
            </Text>
          </View>
        ) : (
          <View style={s.markBadge}>
            <Text style={s.markLabel}>{opponentName || "Opponent"}</Text>
            <Text style={s.markValue}>...</Text>
          </View>
        )}
        {mode === "timed" && (
          <View style={[s.timer, timeLeft <= 5 && s.timerUrgent]}>
            <Text style={s.timerText}>{timeLeft}s</Text>
          </View>
        )}
      </View>

      <Text style={[s.status, isMyTurn && s.statusActive]}>
        {!myMark 
          ? "Joining match..." 
          : isMyTurn 
            ? "Your turn" 
            : `Waiting for ${opponentName || "opponent"}...`}
      </Text>

      <View style={s.board}>
        {Array.from({ length: 9 }, (_, i) => renderCell(i))}
      </View>
    </SafeAreaView>
  );
}

const CELL_SIZE = 100;

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" },
  header:       { flexDirection: "row", justifyContent: "space-between", width: 320, marginBottom: 24 },
  markBadge:    { alignItems: "center" },
  markLabel:    { color: "#888", fontSize: 12 },
  markValue:    { fontSize: 24, fontWeight: "700" },
  vsContainer:  { justifyContent: "center", alignItems: "center" },
  vsText:       { color: "#333", fontSize: 14, fontWeight: "800" },
  xColor:       { color: "#1D9E75" },
  oColor:       { color: "#5DCAA5" },
  timer:        { backgroundColor: "#1A1A1A", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, justifyContent: "center" },
  timerUrgent:  { backgroundColor: "#4A1B0C" },
  timerText:    { color: "#FFF", fontSize: 20, fontWeight: "700" },
  status:       { color: "#666", fontSize: 16, marginBottom: 32 },
  statusActive: { color: "#1D9E75" },
  board:        { flexDirection: "row", flexWrap: "wrap", width: CELL_SIZE * 3 + 8, gap: 4 },
  cell:         {
    width: CELL_SIZE, height: CELL_SIZE,
    backgroundColor: "#1A1A1A", borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  cellFilled:   { backgroundColor: "#111" },
  cellText:     { fontSize: 40, fontWeight: "700" },
});