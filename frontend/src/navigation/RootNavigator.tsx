import React                      from "react";
import { NavigationContainer }    from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NicknameScreen     from "../screens/NicknameScreen";
import MatchmakingScreen  from "../screens/MatchmakingScreen";
import GameScreen         from "../screens/GameScreen";
import GameOverScreen     from "../screens/GameOverScreen";
import LeaderboardScreen  from "../screens/LeaderboardScreen";

export type RootStackParamList = {
  Nickname:    undefined;
  Matchmaking: { mode: "classic" | "timed" };
  Game:        undefined;
  GameOver:    undefined;
  Leaderboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Nickname"
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="Nickname"     component={NicknameScreen} />
        <Stack.Screen name="Matchmaking"  component={MatchmakingScreen} />
        <Stack.Screen name="Game"         component={GameScreen} />
        <Stack.Screen name="GameOver"     component={GameOverScreen} />
        <Stack.Screen name="Leaderboard"  component={LeaderboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}