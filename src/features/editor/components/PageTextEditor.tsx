import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { PageText } from '../types';

interface PageTextEditorProps {
  text: PageText;
  onChangeText: (text: PageText) => void;
}

type Alignment = 'left' | 'center' | 'right';

export function PageTextEditor({ text, onChangeText }: PageTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleAlignmentChange = (alignment: Alignment) => {
    onChangeText({ ...text, alignment });
  };

  const handleContentChange = (content: string) => {
    onChangeText({ ...text, content });
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(10, Math.min(24, text.fontSize + delta));
    onChangeText({ ...text, fontSize: newSize });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Texto de la página</Text>

      {/* Text Input */}
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        <TextInput
          style={[styles.textInput, { textAlign: text.alignment, fontSize: text.fontSize }]}
          value={text.content}
          onChangeText={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Escribe algo para esta página..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          maxLength={200}
          accessibilityLabel="Texto de la página"
        />
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Alignment */}
        <View style={styles.toolGroup}>
          {(['left', 'center', 'right'] as Alignment[]).map(align => (
            <TouchableOpacity
              key={align}
              style={[
                styles.toolButton,
                text.alignment === align && styles.toolButtonActive,
              ]}
              onPress={() => handleAlignmentChange(align)}
              accessibilityLabel={`Alinear ${align === 'left' ? 'izquierda' : align === 'center' ? 'centro' : 'derecha'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: text.alignment === align }}>
              <AlignIcon align={align} active={text.alignment === align} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Font size */}
        <View style={styles.toolGroup}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => handleFontSizeChange(-1)}
            accessibilityLabel="Reducir tamaño de fuente"
            accessibilityRole="button">
            <Text style={styles.toolIcon}>A-</Text>
          </TouchableOpacity>
          <Text style={styles.fontSize}>{text.fontSize}</Text>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => handleFontSizeChange(1)}
            accessibilityLabel="Aumentar tamaño de fuente"
            accessibilityRole="button">
            <Text style={styles.toolIcon}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick chips */}
      <View style={styles.chips}>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleContentChange(text.content + ' ' + new Date().toLocaleDateString('es-MX'))}
          accessibilityLabel="Insertar fecha"
          accessibilityRole="button">
          <Text style={styles.chipText}>Fecha</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleContentChange(text.content + ' ')}
          accessibilityLabel="Insertar ubicación"
          accessibilityRole="button">
          <Text style={styles.chipText}>Ubicación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AlignIcon({ align, active }: { align: Alignment; active: boolean }) {
  const color = active ? colors.text.inverse : colors.text.secondary;
  const lineWidths = align === 'left'
    ? [14, 10, 12]
    : align === 'center'
      ? [10, 14, 10]
      : [10, 12, 14];

  return (
    <View style={alignStyles.container}>
      {lineWidths.map((w, i) => (
        <View
          key={i}
          style={[
            alignStyles.line,
            {
              width: w,
              backgroundColor: color,
              alignSelf: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
            },
          ]}
        />
      ))}
    </View>
  );
}

const alignStyles = StyleSheet.create({
  container: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
  },
  line: {
    height: 2,
    borderRadius: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: colors.blue.medium,
  },
  textInput: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    minHeight: 50,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toolButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  toolButtonActive: {
    backgroundColor: colors.text.primary,
  },
  toolIcon: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  fontSize: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
    marginHorizontal: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.peach,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
});
