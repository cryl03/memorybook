import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type LayoutChangeEvent,
  type StyleProp,
} from 'react-native';
import {
  Canvas,
  ColorMatrix,
  Image as SkiaImage,
  useImage,
} from '@shopify/react-native-skia';
import type { FilterType } from '../types';

const IDENTITY = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

export const FILTER_MATRICES: Record<FilterType, number[]> = {
  none: IDENTITY,
  bw: [
    0.299, 0.587, 0.114, 0, 0,
    0.299, 0.587, 0.114, 0, 0,
    0.299, 0.587, 0.114, 0, 0,
    0, 0, 0, 1, 0,
  ],
  warm: [
    1.18, 0.08, 0, 0, 0.02,
    0.04, 1.04, 0, 0, 0,
    0, 0, 0.82, 0, 0,
    0, 0, 0, 1, 0,
  ],
  cool: [
    0.88, 0, 0.04, 0, 0,
    0, 1.02, 0.06, 0, 0,
    0.06, 0.08, 1.2, 0, 0,
    0, 0, 0, 1, 0,
  ],
  vintage: [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0,
  ],
  bright: [
    1.22, 0, 0, 0, 0.06,
    0, 1.22, 0, 0, 0.06,
    0, 0, 1.18, 0, 0.04,
    0, 0, 0, 1, 0,
  ],
};

interface FilteredImageProps {
  uri: string;
  filter?: FilterType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}

export function FilteredImage({
  uri,
  filter = 'none',
  style,
  resizeMode = 'cover',
}: FilteredImageProps) {
  const image = useImage(uri);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const matrix = FILTER_MATRICES[filter] ?? IDENTITY;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  if (filter === 'none' || !image || size.width <= 0 || size.height <= 0) {
    return (
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onLayout={filter === 'none' ? undefined : onLayout}
      />
    );
  }

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      <Canvas style={StyleSheet.absoluteFill}>
        <SkiaImage
          image={image}
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fit={resizeMode}>
          <ColorMatrix matrix={matrix} />
        </SkiaImage>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
