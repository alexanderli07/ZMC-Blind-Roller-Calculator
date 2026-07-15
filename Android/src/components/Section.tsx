// A captioned group of rows on a single card surface.

import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors, useTheme } from '../theme/theme';
import { font, radius, space } from '../theme/tokens';

interface Props {
  title?: string | null;
  footnote?: string | null;
  padded?: boolean;
  children: ReactNode;
}

export default function Section({ title, footnote, padded = false, children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.card, padded && styles.cardPadded]}>{children}</View>
      {footnote && <Text style={styles.footnote}>{footnote}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: space.md,
  },
  title: {
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
  cardPadded: {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  footnote: {
    marginTop: space.xs,
    marginLeft: space.xs,
    fontSize: font.caption,
    color: colors.textSubtle,
  },
});
