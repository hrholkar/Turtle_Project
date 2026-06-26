import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii, UPLOADS_BASE_URL } from '../../src/constants/theme';
import { ConfidenceBadge } from '../../src/components/ui/Badges';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { usePendingVerifications, useApprovePending, useRejectPending } from '../../src/hooks/useQueries';
import type { PendingVerification, PendingStatus } from '../../src/types';

const STATUS_TABS: Array<{ key: PendingStatus | 'all'; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function PendingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PendingStatus>('pending');

  const { data, isLoading, refetch } = usePendingVerifications(activeTab);
  const approveMutation = useApprovePending();
  const rejectMutation = useRejectPending();

  const handleQuickApprove = (item: PendingVerification) => {
    Alert.alert(
      'Approve as New Turtle?',
      'This will create a new turtle profile from this sighting.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveMutation.mutateAsync({ id: item._id, data: { species: 'unknown', gender: 'unknown' } });
              Alert.alert('Approved', 'New turtle profile created successfully.');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleReject = (id: string) => {
    Alert.alert('Reject Sighting?', 'This submission will be archived.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectMutation.mutateAsync(id);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      {/* ── Status Tabs ──────────────────────────────────── */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as PendingStatus)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent.blue} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => (
            <PendingCard
              item={item}
              onViewDetails={() => router.push(`/pending/${item._id}`)}
              onApprove={() => handleQuickApprove(item)}
              onReject={() => handleReject(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color={Colors.text.disabled} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending' ? 'No pending submissions' : `No ${activeTab} records`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                  ? 'All submissions have been reviewed'
                  : 'Records will appear here after review'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function PendingCard({
  item,
  onViewDetails,
  onApprove,
  onReject,
}: {
  item: PendingVerification;
  onViewDetails: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const imageUri = item.uploadedImage ? `${UPLOADS_BASE_URL}${item.uploadedImage}` : null;
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const statusColors: Record<PendingStatus, string> = {
    pending: Colors.status.warning,
    approved: Colors.status.success,
    rejected: Colors.status.error,
  };

  return (
    <Card style={cardStyles.container}>
      <TouchableOpacity style={cardStyles.topRow} onPress={onViewDetails} activeOpacity={0.8}>
        {/* Thumbnail */}
        <View style={cardStyles.thumb}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={cardStyles.thumbImg} resizeMode="cover" />
          ) : (
            <Ionicons name="camera-outline" size={22} color={Colors.text.disabled} />
          )}
        </View>

        {/* Info */}
        <View style={cardStyles.info}>
          <View style={cardStyles.infoHeader}>
            <Text style={cardStyles.date}>{date}</Text>
            <View style={[cardStyles.statusBadge, { backgroundColor: `${statusColors[item.status]}18` }]}>
              <Text style={[cardStyles.statusText, { color: statusColors[item.status] }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {item.topConfidence > 0 && (
            <ConfidenceBadge score={item.topConfidence} size="sm" />
          )}

          {item.suggestedMatches.length > 0 && (
            <Text style={cardStyles.matches}>
              {item.suggestedMatches.length} possible match{item.suggestedMatches.length !== 1 ? 'es' : ''}
            </Text>
          )}

          {item.submittedLocation && (
            <View style={cardStyles.locationRow}>
              <Ionicons name="location-outline" size={11} color={Colors.text.muted} />
              <Text style={cardStyles.location} numberOfLines={1}>{item.submittedLocation}</Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
      </TouchableOpacity>

      {/* Actions — only for pending */}
      {item.status === 'pending' && (
        <View style={cardStyles.actions}>
          <Button
            label="Approve"
            variant="ghost"
            size="sm"
            style={{ flex: 1 }}
            onPress={onApprove}
            leftIcon={<Ionicons name="checkmark" size={14} color={Colors.accent.blue} />}
          />
          <Button
            label="Reject"
            variant="danger"
            size="sm"
            style={{ flex: 1 }}
            onPress={onReject}
            leftIcon={<Ionicons name="close" size={14} color={Colors.status.error} />}
          />
        </View>
      )}
    </Card>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: Colors.bg.tertiary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 4 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { ...TextStyles.label, color: Colors.text.primary, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  matches: { ...TextStyles.labelSmall, color: Colors.text.muted },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { ...TextStyles.labelSmall, color: Colors.text.muted, flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent.blue,
  },
  tabText: { ...TextStyles.label, color: Colors.text.muted },
  tabTextActive: { color: Colors.accent.blue, fontWeight: '600' },
  list: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  empty: { alignItems: 'center', paddingTop: Spacing['4xl'], gap: Spacing.md },
  emptyTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  emptySubtitle: { ...TextStyles.bodySmall, color: Colors.text.muted, textAlign: 'center', maxWidth: 260 },
});
