import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.text.inverse : Colors.accent.blue}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[
            styles.label,
            styles[`label_${variant}`],
            styles[`labelSize_${size}`],
            labelStyle,
          ]}>
            {label}
          </Text>
          {rightIcon}
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
    gap: Spacing.sm,
    borderRadius: Radii.lg, // 16px radius
  },
  // Variants
  primary: {
    backgroundColor: Colors.accent.blue,
  },
  secondary: {
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1,
    borderColor: Colors.border.accent,
  },
  ghost: {
    backgroundColor: Colors.accent.blueSubtle,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  danger: {
    backgroundColor: Colors.status.errorSubtle,
    borderWidth: 1,
    borderColor: `${Colors.status.error}40`,
  },
  disabled: {
    opacity: 0.45,
  },
  // Sizes (all matching standard height concepts)
  size_sm: { height: 40, paddingHorizontal: Spacing.md },
  size_md: { height: 50, paddingHorizontal: Spacing.lg },
  size_lg: { height: 56, paddingHorizontal: Spacing.xl },
  // Labels
  label: { ...TextStyles.h3, fontWeight: '600' },
  label_primary: { color: Colors.text.inverse },
  label_secondary: { color: Colors.accent.blue },
  label_ghost: { color: Colors.accent.blueDark },
  label_danger: { color: Colors.status.error },
  labelSize_sm: { fontSize: 14 },
  labelSize_md: { fontSize: 16 },
  labelSize_lg: { fontSize: 18 },
});
