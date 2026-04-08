import React, { useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList }     from "../navigation/RootNavigator";
import leaderboardService         from "../services/leaderboardService";
import useLeaderboardStore        from "../store/leaderboardStore";
import useAuthStore               from "../store/authStore";
import { LeaderboardEntry }       from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Leaderboard">;

export default function LeaderboardScreen({ navigation }: Props) {
  const { entries, myWins, myRank, loading, setData, setLoading } = useLeaderboardStore();
  const userId = useAuthStore(s => s.userId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [board, stats] = await Promise.all([
          leaderboardService.getTopPlayers(),
          leaderboardService.getMyStats(),
        ]);
        setData(board, stats.wins, stats.rank);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isMe = item.userId === userId;
    return (
      <View style={[s.row, isMe && s.rowMe]}>
        <Text style={[s.rank, index < 3 && s.rankTop]}>#{item.rank}</Text>
        <Text style={[s.name, isMe && s.nameMe]} numberOfLines={1}>{item.username}</Text>
        <Text style={s.wins}>{item.wins}W</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Leaderboard</Text>
        <View style={{ width: 60 }} />
      </View>

      {myRank !== null && (
        <View style={s.myStats}>
          <Text style={s.myStatsText}>Your rank: #{myRank}  ·  {myWins} wins</Text>
        </View>
      )}

      {loading
        ? <ActivityIndicator size="large" color="#1D9E75" style={{ marginTop: 32 }} />
        : (
          <FlatList
            data={entries}
            keyExtractor={item => item.userId}
            renderItem={renderRow}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )
      }
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  back:      { width: 60 },
  backText:  { color: "#1D9E75", fontSize: 14 },
  title:     { color: "#FFF", fontSize: 20, fontWeight: "700" },
  myStats:   { backgroundColor: "#1A1A1A", margin: 16, borderRadius: 12, padding: 14, alignItems: "center" },
  myStatsText: { color: "#1D9E75", fontSize: 14, fontWeight: "600" },
  row:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: "#1A1A1A" },
  rowMe:     { backgroundColor: "#0F2E24", borderRadius: 8 },
  rank:      { color: "#888", width: 40, fontSize: 14 },
  rankTop:   { color: "#1D9E75" },
  name:      { flex: 1, color: "#FFF", fontSize: 15 },
  nameMe:    { color: "#1D9E75", fontWeight: "600" },
  wins:      { color: "#888", fontSize: 14, width: 40, textAlign: "right" },
});