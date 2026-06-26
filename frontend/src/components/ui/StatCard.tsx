import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii } from '../../constants/theme';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: 'teal' | 'amber' | 'success' | 'pending';
  style?: ViewStyle;
}

const accentMap = {
  teal: { color: Colors.accent.blue, bg: Colors.accent.blueSubtle },
  amber: { color: Colors.warm.amber, bg: Colors.warm.amberSubtle },
  success: { color: Colors.status.success, bg: Colors.status.successSubtle },
  pending: { color: Colors.status.pending, bg: Colors.status.pendingSubtle },
};

export function StatCard({ label, value, unit, accent = 'teal', style }: StatCardProps) {
  const { color, bg } = accentMap[accent];

  return (
    <Card style={[styles.container, style]}>
      <View style={[styles.indicator, { backgroundColor: bg }]}>
        <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {unit && <Text style={[styles.unit, { color }]}>{unit}</Text>}
      </View>
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  indicator: {
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    ...TextStyles.h1,
    lineHeight: 32,
  },
  unit: {
    ...TextStyles.bodySmall,
    fontWeight: '500',
  },
  label: {
    ...TextStyles.label,
    color: Colors.text.secondary,
    letterSpacing: 0.3,
  },
});
