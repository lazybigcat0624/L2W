import { gameStyles } from "@/styles/styles";
import { Text, View } from "react-native";
import { useResponsive } from "../../hooks/useResponsive";

interface GameInfoProps {
  level: number;
  score: number;
  timer?: {
    formattedTime: string;
    timeRemaining: number;
  };
  showTimer?: boolean;
}

/**
 * Displays level and score information
 * Optionally displays timer for Part B
 */
export default function GameInfo({ level, score, timer, showTimer }: GameInfoProps) {
  const { info, letter } = useResponsive();

  return (
    <View style={gameStyles.infoContainer}>
      <Text style={[gameStyles.level, { fontSize: info, width: '33.33%' }]}>Level: {level}</Text>
      {showTimer && timer && (
        <Text style={[gameStyles.score, { fontSize: info, color: timer.timeRemaining < 60 ? '#FF6B6B' : '#FFFFFF' }]}>
          Time: {timer.formattedTime}
        </Text>
      )}
      <Text style={[gameStyles.score, { fontSize: info, width: '33.33%', textAlign: 'right' }]}>Score: {score}</Text>
    </View>
  );
}