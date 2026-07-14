import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii, UPLOADS_BASE_URL } from '../../src/constants/theme';
import { ConfidenceBadge } from '../../src/components/ui/Badges';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { usePendingItem, useApprovePending, useRejectPending } from '../../src/hooks/useQueries';

export default function PendingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: pending, isLoading } = usePendingItem(id);
  const approveMutation = useApprovePending();
  const rejectMutation = useRejectPending();

  const [approveMode, setApproveMode] = useState<'new' | 'existing' | null>(null);
  const [targetTurtleId, setTargetTurtleId] = useState('');
  const [species, setSpecies] = useState('unknown');
  const [gender, setGender] = useState('unknown');
  const [notes, setNotes] = useState('');

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={Colors.accent.blue} /></View>;
  }
  if (!pending) {
    return <View style={styles.loading}><Text style={{ color: Colors.text.primary }}>Not found.</Text></View>;
  }

  const imageUri = pending.uploadedImage ? `${UPLOADS_BASE_URL}${pending.uploadedImage}` : null;
  const date = new Date(pending.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleApprove = async () => {
    try {
      const data = approveMode === 'existing'
        ? { turtleId: targetTurtleId, species: species as any, gender: gender as any }
        : { species: species as any, gender: gender as any, notes };

      const result = await approveMutation.mutateAsync({ id, data });
      Alert.alert('Approved!', `Resolved to turtle: ${result.resolvedTurtleId}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReject = async () => {
    Alert.alert('Reject', 'Archive this submission?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          await rejectMutation.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Image */}
      {imageUri && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>
      )}

      {/* Info */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Submission Details</Text>
        <InfoRow label="Submitted" value={date} />
        {pending.submittedLocation && <InfoRow label="Location" value={pending.submittedLocation} />}
        {pending.submittedDate && (
          <InfoRow label="Sighting Date" value={new Date(pending.submittedDate).toLocaleDateString()} />
        )}
        {pending.topConfidence > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Top Confidence</Text>
            <ConfidenceBadge score={pending.topConfidence} />
          </View>
        )}
      </Card>

      {/* Suggested Matches */}
      {pending.suggestedMatches.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>ML Suggested Matches</Text>
          {pending.suggestedMatches.map((match, i) => (
            <TouchableOpacity
              key={match.turtleId}
              style={styles.matchItem}
              onPress={() => { setApproveMode('existing'); setTargetTurtleId(match.turtleId); }}
              activeOpacity={0.8}
            >
              <Text style={styles.matchRank}>#{i + 1}</Text>
              {match.profileImage && (
                <Image source={{ uri: `${UPLOADS_BASE_URL}${match.profileImage}` }} style={styles.matchThumb} />
              )}
              <Text style={styles.matchId}>{match.turtleId}</Text>
              <ConfidenceBadge score={match.confidenceScore} size="sm" />
              {targetTurtleId === match.turtleId && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Only show approve panel if status is pending */}
      {pending.status === 'pending' && (
        <>
          {/* Approve Mode Selector */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Resolution Action</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, approveMode === 'new' && styles.modeBtnActive]}
                onPress={() => setApproveMode('new')}
              >
                <Ionicons name="add-circle-outline" size={18} color={approveMode === 'new' ? Colors.accent.blue : Colors.text.muted} />
                <Text style={[styles.modeBtnText, approveMode === 'new' && { color: Colors.accent.blue }]}>New Turtle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, approveMode === 'existing' && styles.modeBtnActive]}
                onPress={() => setApproveMode('existing')}
              >
                <Ionicons name="link-outline" size={18} color={approveMode === 'existing' ? Colors.accent.blue : Colors.text.muted} />
                <Text style={[styles.modeBtnText, approveMode === 'existing' && { color: Colors.accent.blue }]}>Link Existing</Text>
              </TouchableOpacity>
            </View>

            {approveMode === 'existing' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Turtle ID</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. TT-A1B2C3D4"
                  placeholderTextColor={Colors.text.disabled}
                  value={targetTurtleId}
                  onChangeText={setTargetTurtleId}
                />
              </View>
            )}

            {approveMode === 'new' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  placeholder="Optional field notes..."
                  placeholderTextColor={Colors.text.disabled}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            )}
          </Card>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              label="Approve"
              variant="primary"
              size="lg"
              disabled={!approveMode || (approveMode === 'existing' && !targetTurtleId)}
              loading={approveMutation.isPending}
              onPress={handleApprove}
              leftIcon={<Ionicons name="checkmark-circle" size={18} color={Colors.text.inverse} />}
            />
            <Button
              label="Reject Submission"
              variant="danger"
              size="lg"
              loading={rejectMutation.isPending}
              onPress={handleReject}
              leftIcon={<Ionicons name="close-circle" size={18} color={Colors.status.error} />}
            />
          </View>
        </>
      )}

      {/* Resolved State */}
      {pending.status !== 'pending' && (
        <View style={[styles.resolvedBanner, { backgroundColor: pending.status === 'approved' ? Colors.status.successSubtle : Colors.status.errorSubtle }]}>
          <Ionicons
            name={pending.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={pending.status === 'approved' ? Colors.status.success : Colors.status.error}
          />
          <Text style={{ color: pending.status === 'approved' ? Colors.status.success : Colors.status.error, fontWeight: '600' }}>
            {pending.status === 'approved' ? `Approved → ${pending.resolvedTurtleId}` : 'Rejected'}
          </Text>
        </View>
      )}

      <View style={{ height: Spacing['3xl'] }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { gap: Spacing.base, paddingBottom: Spacing['3xl'] },

  imageWrap: { height: 240, backgroundColor: Colors.bg.secondary },
  image: { width: '100%', height: '100%' },

  card: {
    padding: Spacing.base,
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
  },
  cardTitle: { ...TextStyles.h3, color: Colors.text.secondary },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  infoLabel: { ...TextStyles.bodySmall, color: Colors.text.muted },
  infoValue: { ...TextStyles.body, color: Colors.text.primary },

  matchItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  matchRank: { ...TextStyles.labelSmall, color: Colors.text.muted, width: 20 },
  matchThumb: { width: 32, height: 32, borderRadius: Radii.sm },
  matchId: { ...TextStyles.mono, color: Colors.accent.blue, flex: 1 },

  modeRow: { flexDirection: 'row', gap: Spacing.md },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.tertiary,
  },
  modeBtnActive: { borderColor: Colors.accent.blueBorder, backgroundColor: Colors.accent.blueSubtle },
  modeBtnText: { ...TextStyles.label, color: Colors.text.muted },

  field: { gap: Spacing.sm },
  fieldLabel: { ...TextStyles.label, color: Colors.text.muted },
  fieldInput: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...TextStyles.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  fieldInputMulti: { minHeight: 80, textAlignVertical: 'top', paddingVertical: Spacing.md },

  actions: { gap: Spacing.md, marginHorizontal: Spacing.base },

  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
  },
});
