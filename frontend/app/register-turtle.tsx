import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, SpeciesLabels } from '../src/constants/colors';
import { TextStyles } from '../src/constants/typography';
import { Spacing, Radii, UPLOADS_BASE_URL } from '../src/constants/theme';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { turtleService } from '../src/services/index';

export default function RegisterTurtleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meta: string; imageUrl: string; newIdentity: string }>();

  let meta: any = {};
  try { meta = JSON.parse(params.meta || '{}'); } catch {}

  const [species, setSpecies] = useState('unknown');
  const [gender, setGender] = useState('unknown');
  const [location, setLocation] = useState(meta.location || '');
  const [notes, setNotes] = useState(meta.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await turtleService.create({
        species,
        gender,
        birthLocation: location,
        firstSightingDate: meta.sightingDate || new Date().toISOString(),
        notes,
        imageUrl: params.imageUrl!,
      });
      Alert.alert('Success', `New turtle ${result.turtleId} registered successfully!`, [
        { text: 'OK', onPress: () => router.push(`/turtle/${result.turtleId}`) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register turtle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="add-circle" size={32} color={Colors.accent.blue} />
          <View>
            <Text style={styles.title}>Register New Turtle</Text>
            {params.newIdentity && (
              <Text style={styles.subtitle}>ID will be generated automatically</Text>
            )}
          </View>
        </View>

        {params.imageUrl && (
          <Image source={{ uri: `${UPLOADS_BASE_URL}${params.imageUrl}` }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Species</Text>
          <View style={styles.optionsRow}>
            {Object.keys(SpeciesLabels).map(s => (
              <Button
                key={s}
                label={SpeciesLabels[s as keyof typeof SpeciesLabels]}
                variant={species === s ? 'primary' : 'secondary'}
                onPress={() => setSpecies(s)}
                style={styles.optionBtn}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsRow}>
            {['unknown', 'male', 'female'].map(g => (
              <Button
                key={g}
                label={g.charAt(0).toUpperCase() + g.slice(1)}
                variant={gender === g ? 'primary' : 'secondary'}
                onPress={() => setGender(g)}
                style={styles.optionBtn}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="E.g., North Beach"
            placeholderTextColor={Colors.text.disabled}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="Distinctive features, behavior..."
            placeholderTextColor={Colors.text.disabled}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button label="Register Turtle" variant="primary" size="lg" onPress={handleSubmit} loading={isSubmitting} />
        <Button label="Cancel" variant="ghost" size="lg" onPress={() => router.back()} disabled={isSubmitting} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.base },
  card: { padding: Spacing.base, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { ...TextStyles.h2, color: Colors.text.primary },
  subtitle: { ...TextStyles.bodySmall, color: Colors.text.muted },
  image: { width: '100%', height: 200, borderRadius: Radii.lg },
  formGroup: { gap: Spacing.sm },
  label: { ...TextStyles.label, color: Colors.text.secondary },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionBtn: { flexShrink: 1 },
  input: {
    ...TextStyles.body,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.md,
    padding: Spacing.md,
    color: Colors.text.primary,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  actions: { gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing['3xl'] },
});
