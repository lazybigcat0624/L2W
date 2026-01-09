import { Image } from 'expo-image';
import React, { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameContext } from '../../contexts/GameContext';
import { usePartAGridSize } from '../../hooks/usePartAGridSize';
import { useResponsive } from '../../hooks/useResponsive';
import { gameStyles } from '../../styles/styles';

export default function GameHeader() {
  const insets = useSafeAreaInsets();
  const { title, subtitle } = useResponsive();
  const game = useGameContext();
  const initialGridSize = usePartAGridSize();
  const partAGridWidth = game.partAGridWidth || initialGridSize;
  const [textHeight, setTextHeight] = useState<number | null>(null);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setTextHeight(height);
  };

  return (
    <View style={[gameStyles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* Container matching PartAGrid's width constraints */}
      <View style={{ 
        width: '100%', 
        paddingHorizontal: 20, // Match gameArea padding
        alignItems: 'center' // Center content like gameArea
      }}>
        <View style={{ 
          position: 'relative', 
          minWidth: partAGridWidth, 
          maxWidth: 500, 
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10
        }}>
          {textHeight !== null && (
            <Image
              source={require('../../assets/images/logo.png')}
              style={{
                position: 'absolute',
                left: 0, // Align to left edge of constrained container
                height: textHeight,
                width: textHeight, // Keep aspect ratio square
              }}
              contentFit="contain"
            />
          )}
          <View 
            style={{ alignItems: 'center' }}
            onLayout={handleTextLayout}
          >
            <Text style={[gameStyles.title, { fontSize: title }]}>L2W</Text>
            <Text style={[gameStyles.subtitle, { fontSize: subtitle }]}>Learn to Win</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

