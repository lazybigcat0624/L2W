import React from 'react';
import { StyleSheet, View } from 'react-native';
import L2WGame from '@/components/game/L2WGame';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <L2WGame />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

