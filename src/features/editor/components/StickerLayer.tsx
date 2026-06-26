import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@core/theme';
import { Sticker } from '../types';

interface StickerLayerProps {
  stickers: Sticker[];
  onRemoveSticker: (stickerId: string) => void;
  editable: boolean;
}

export function StickerLayer({ stickers, onRemoveSticker, editable }: StickerLayerProps) {
  if (stickers.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents={editable ? 'auto' : 'none'}>
      {stickers.map(sticker => (
        <TouchableOpacity
          key={sticker.id}
          style={[
            styles.sticker,
            {
              left: sticker.x,
              top: sticker.y,
              transform: [
                { scale: sticker.scale },
                { rotate: `${sticker.rotation}deg` },
              ],
            },
          ]}
          onLongPress={() => onRemoveSticker(sticker.id)}
          activeOpacity={0.8}
          accessibilityLabel={`Decoración ${sticker.label}. Mantén presionado para eliminar.`}
          accessibilityRole="button">
          <View style={styles.decorationDot} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  sticker: {
    position: 'absolute',
    padding: 4,
  },
  decorationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.warm.medium,
  },
});
