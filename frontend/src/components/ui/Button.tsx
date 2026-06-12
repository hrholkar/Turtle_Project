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
  style?: ViewStyle;
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
          color={variant === 'primary' ? Colors.text.inverse : Colors.accent.teal}
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
    borderRadius: Radii.lg,
  },
  // Variants
  primary: {
    backgroundColor: Colors.accent.teal,
  },
  secondary: {
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  ghost: {
    backgroundColor: Colors.accent.tealSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
  },
  danger: {
    backgroundColor: Colors.status.errorSubtle,
    borderWidth: 1,
    borderColor: `${Colors.status.error}40`,
  },
  disabled: {
    opacity: 0.45,
  },
  // Sizes
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm - 2 },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base },
  // Labels
  label: { fontWeight: '600' },
  label_primary: { color: Colors.text.inverse },
  label_secondary: { color: Colors.text.primary },
  label_ghost: { color: Colors.accent.teal },
  label_danger: { color: Colors.status.error },
  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 17 },
});
