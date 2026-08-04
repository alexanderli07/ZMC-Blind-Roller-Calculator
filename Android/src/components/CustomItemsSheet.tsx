// Everything the user has added, grouped by category, with one delete per row.
// This replaces the old all-or-nothing "remove all" button.

import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import DragSheet from './DragSheet';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, ICON_GLYPH, MIN_TOUCH, radius, space } from '../theme/tokens';

export interface CustomGroup {
  key: string;
  title: string;
  items: string[];
}

interface Props {
  visible: boolean;
  groups: CustomGroup[];
  onRemove: (groupKey: string, name: string) => void;
  onClose: () => void;
}

export default function CustomItemsSheet({ visible, groups, onRemove, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  const confirmRemove = (groupKey: string, name: string) => {
    Alert.alert('Remove item', `Remove “${name}” from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(groupKey, name) },
    ]);
  };

  return (
    <DragSheet
      visible={visible}
      onClose={onClose}
      testID="custom-items-sheet"
      header={
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.iconButton}
            onPress={onClose}
          >
            <Text style={styles.icon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Custom items</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {total === 0 && (
          <Text style={styles.empty}>
            Nothing added yet. Anything you add from a picker shows up here.
          </Text>
        )}
        {groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.card}>
                {group.items.map((name, index) => (
                  <View
                    key={name}
                    style={[styles.row, index < group.items.length - 1 && styles.divider]}
                  >
                    <Text style={styles.name} numberOfLines={1}>
                      {name}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${name}`}
                      style={styles.removeButton}
                      onPress={() => confirmRemove(group.key, name)}
                    >
                      <Text style={styles.removeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
      </ScrollView>
    </DragSheet>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: ICON_GLYPH,
    fontWeight: '700',
    color: colors.textMuted,
  },
  title: {
    flex: 1,
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    padding: space.md,
  },
  empty: {
    paddingVertical: space.xl,
    textAlign: 'center',
    fontSize: font.label,
    color: colors.textSubtle,
  },
  group: {
    marginBottom: space.md,
  },
  groupTitle: {
    marginBottom: space.xs,
    marginLeft: space.xs,
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  name: {
    flex: 1,
    fontSize: font.label,
    fontWeight: '500',
    color: colors.text,
  },
  removeButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: font.body,
    color: colors.danger,
  },
});
