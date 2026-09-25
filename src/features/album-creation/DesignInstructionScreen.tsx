import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button, KeyboardSafeScreen } from '@shared/components';
import {
  albumService,
  defaultDisenoInstruccion,
  getErrorMessage,
  toEstiloDefault,
  type StyleDesign,
} from '@core/api';

interface DesignInstructionScreenProps {
  story?: string;
  style?: string;
  initialText?: string;
  initialDesign?: number;
  onBack: () => void;
  onContinue: (instruccion: string, designCode: number) => void;
}

function photosPerPageLabel(capacity: number): string {
  const count = Math.max(1, Math.floor(capacity) || 1);
  return count === 1 ? '1 foto por página' : `${count} fotos por página`;
}

export function DesignInstructionScreen({
  story,
  style,
  initialText,
  initialDesign,
  onBack,
  onContinue,
}: DesignInstructionScreenProps) {
  const preset = (initialText ?? '').trim() || defaultDisenoInstruccion(story, style);
  const [text, setText] = useState(preset);
  const [designs, setDesigns] = useState<StyleDesign[]>([]);
  const [selectedCode, setSelectedCode] = useState<number | null>(initialDesign ?? null);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [designsError, setDesignsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDesigns() {
      setLoadingDesigns(true);
      setDesignsError(null);
      try {
        const estilo = toEstiloDefault(story ?? '', style ?? 'sutil');
        const definition = await albumService.getStyleDefinitions(estilo);
        if (cancelled) return;
        const options = definition.designs ?? [];
        setDesigns(options);
        const preferred =
          options.find(design => design.code === initialDesign)?.code ??
          options.find(design => design.code === definition.default_design)?.code ??
          options[0]?.code ??
          initialDesign ??
          1;
        setSelectedCode(preferred);
      } catch (error) {
        if (cancelled) return;
        setDesigns([]);
        setSelectedCode(initialDesign ?? 1);
        setDesignsError(
          getErrorMessage(error, 'No se pudieron cargar las fotos por página'),
        );
      } finally {
        if (!cancelled) setLoadingDesigns(false);
      }
    }

    void loadDesigns();
    return () => {
      cancelled = true;
    };
  }, [story, style, initialDesign]);

  const selected = designs.find(design => design.code === selectedCode);
  const continueTitle = selected
    ? `Continuar con ${photosPerPageLabel(selected.capacity)}`
    : 'Usar este diseño';

  return (
    <KeyboardSafeScreen>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
        <Text style={styles.backText}>Atrás</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Ajusta el diseño</Text>
      <Text style={styles.subtitle}>
        Elige cuántas fotos van en cada página. Luego puedes cambiar el fondo o la
        composición. Se aplica al subir las fotos.
      </Text>

      <Text style={styles.label}>Fotos por página</Text>
      {loadingDesigns ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.text.primary} />
          <Text style={styles.loadingText}>Cargando opciones del estilo</Text>
        </View>
      ) : null}
      {designsError ? <Text style={styles.errorText}>{designsError}</Text> : null}
      <View style={styles.options}>
        {designs.map(design => {
          const active = design.code === selectedCode;
          return (
            <TouchableOpacity
              key={design.code}
              style={[styles.option, active && styles.optionSelected]}
              onPress={() => setSelectedCode(design.code)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${design.label}. ${photosPerPageLabel(design.capacity)}`}>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && styles.optionLabelSelected]}>
                  {photosPerPageLabel(design.capacity)}
                </Text>
                <Text style={styles.optionDescription}>{design.label}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioSelected]}>
                {active ? <View style={styles.radioInner} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Instrucción</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        placeholder="Describe el diseño y el fondo"
        placeholderTextColor={colors.text.tertiary}
        style={styles.input}
      />

      <View style={styles.actions}>
        <Button
          title={continueTitle}
          onPress={() => onContinue(text.trim(), selectedCode ?? 1)}
          disabled={!text.trim() || loadingDesigns || selectedCode == null}
          icon="arrow-right"
          fullWidth
        />
      </View>
    </KeyboardSafeScreen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing['2xl'],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  options: {
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.text.primary,
  },
  optionText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  optionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionLabelSelected: {
    fontWeight: typography.weights.bold,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.text.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text.primary,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  actions: {
    marginTop: spacing['2xl'],
  },
});
