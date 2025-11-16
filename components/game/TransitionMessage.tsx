import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { GAME_COLORS } from '@/constants/game';

interface TransitionMessageProps {
  showFail: boolean;
  showFailForward: boolean;
  showDoIt: boolean;
}

export default function TransitionMessage({ showFail, showFailForward, showDoIt }: TransitionMessageProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const failSize = isSmallScreen ? 28 : 36;
  const failForwardSize = isSmallScreen ? 28 : 36;
  const doItSize = isSmallScreen ? 32 : 42;
  
  if (!showFail && !showFailForward && !showDoIt) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showFail && <Text style={[styles.message, styles.fail, { fontSize: failSize }]}>FAIL</Text>}
      {showFailForward && <Text style={[styles.message, styles.failForward, { fontSize: failForwardSize }]}>FAIL FORWARD?</Text>}
      {showDoIt && <Text style={[styles.message, styles.doIt, { fontSize: doItSize }]}>DO IT</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  message: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  fail: {
    color: GAME_COLORS.fail,
  },
  failForward: {
    color: GAME_COLORS.failForward,
  },
  doIt: {
    color: GAME_COLORS.doIt,
  },
});

