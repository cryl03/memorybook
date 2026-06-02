import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { icons } from '@core/assets/icons';
import { colors } from '@core/theme';
import { typography } from '@core/theme';
import { borderRadius, spacing } from '@core/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof icons;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'right',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const iconColor =
    variant === 'primary' ? colors.button.primaryText : colors.button.secondaryText;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Image
              source={icons[icon]}
              style={[styles.iconLeft, { width: 18, height: 18, tintColor: iconColor }]}
              resizeMode="contain"
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Image
              source={icons[icon]}
              style={[styles.iconRight, { width: 18, height: 18, tintColor: iconColor }]}
              resizeMode="contain"
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.button.primary,
  },
  secondary: {
    backgroundColor: colors.button.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    height: 52,
  },
  disabled: {
    backgroundColor: colors.button.disabled,
  },
  text: {
    fontWeight: typography.weights.semibold,
  },
  text_primary: {
    color: colors.button.primaryText,
  },
  text_secondary: {
    color: colors.button.secondaryText,
  },
  text_outline: {
    color: colors.text.primary,
  },
  text_ghost: {
    color: colors.text.primary,
  },
  textSize_sm: {
    fontSize: typography.sizes.sm,
  },
  textSize_md: {
    fontSize: typography.sizes.md,
  },
  textSize_lg: {
    fontSize: typography.sizes.lg,
  },
  textDisabled: {
    color: colors.button.disabledText,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
