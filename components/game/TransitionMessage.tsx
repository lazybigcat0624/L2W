import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { gameStyles } from '../../styles/styles';

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
    <View style={gameStyles.transitionContainer}>
      {showFail && <Text style={[gameStyles.message, gameStyles.fail, { fontSize: failSize }]}>FAIL</Text>}
      {showFailForward && (
        <Text style={[gameStyles.message, gameStyles.failForward, { fontSize: failForwardSize }]}>
          FAIL FORWARD?
        </Text>
      )}
      {showDoIt && <Text style={[gameStyles.message, gameStyles.doIt, { fontSize: doItSize }]}>DO IT</Text>}
    </View>
  );
}

