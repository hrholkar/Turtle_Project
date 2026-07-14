import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Shadows } from '../../constants/theme';

interface CardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export function Card({ style, children, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.secondary, // White
    borderRadius: Radii.lg, // 16px
    padding: Spacing.base, // 16px
    borderWidth: 1,
    borderColor: Colors.border.subtle, // Yale Blue 50
    ...Shadows.md,
  },
});
