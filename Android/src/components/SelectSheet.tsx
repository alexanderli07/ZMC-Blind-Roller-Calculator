// Full-screen searchable picker, replacing the native dropdown. Twenty-eight
// fabrics needed search, room for each entry's specs, and per-item delete.
// Dismiss with the close button, the Android back button, or a swipe down on
// the header.

import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import DragSheet from './DragSheet';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, ICON_GLYPH, MIN_TOUCH, radius, space } from '../theme/tokens';

export interface SheetItem {
  name: string;
  detail: string;
  custom: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  items: SheetItem[];
  selected: string;
  onSelect: (name: string) => void;
  onAdd: () => void;
  onRemove: (name: string) => void;
  onClose: () => void;
  testID?: string;
  // The matching "add item" modal is nested inside this sheet's own modal;
  // Android will not reliably stack two sibling modals.
  children?: ReactNode;
}

export default function SelectSheet({
  visible,
  title,
  searchPlaceholder,
  items,
  selected,
  onSelect,
  onAdd,
  onRemove,
  onClose,
  testID,
  children,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) || item.detail.toLowerCase().includes(needle)
    );
  }, [items, query]);

  const confirmRemove = (item: SheetItem) => {
    Alert.alert('Remove item', `Remove “${item.name}” from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.name) },
    ]);
  };

  return (
    <DragSheet
      visible={visible}
      onClose={onClose}
      testID={testID}
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
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Add ${title.toLowerCase()}`}
            style={styles.addButton}
            onPress={onAdd}
          >
            <Text style={styles.addLabel}>Add</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          autoCorrect={false}
          autoCapitalize="none"
          testID={testID ? `${testID}-search` : undefined}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.name}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{`Nothing matches “${query.trim()}”.`}</Text>
        }
        renderItem={({ item }) => {
          const isSelected = item.name === selected;
          return (
            <View style={styles.itemRow}>
              <TouchableOpacity
                accessibilityRole="radio"
                accessibilityLabel={item.name}
                accessibilityState={{ selected: isSelected }}
                style={styles.itemMain}
                onPress={() => onSelect(item.name)}
              >
                <View style={styles.itemText}>
                  <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                </View>
                {item.custom && <Text style={styles.tag}>Custom</Text>}
                <Text style={styles.check}>{isSelected ? '✓' : ''}</Text>
              </TouchableOpacity>
              {item.custom && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                  style={styles.removeButton}
                  onPress={() => confirmRemove(item)}
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
      {children}
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
  addButton: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.primary,
  },
  searchWrapper: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  search: {
    minHeight: MIN_TOUCH,
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: font.body,
  },
  list: {
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  itemMain: {
    flex: 1,
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  itemText: {
    flex: 1,
    paddingRight: space.sm,
  },
  itemName: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  itemNameSelected: {
    color: colors.primary,
  },
  itemDetail: {
    marginTop: 1,
    fontSize: font.caption,
    color: colors.textSubtle,
  },
  tag: {
    marginRight: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textMuted,
    overflow: 'hidden',
  },
  check: {
    minWidth: 18,
    fontSize: font.title,
    fontWeight: '700',
    textAlign: 'right',
    color: colors.primary,
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
  empty: {
    paddingVertical: space.xl,
    textAlign: 'center',
    fontSize: font.label,
    color: colors.textSubtle,
  },
});
