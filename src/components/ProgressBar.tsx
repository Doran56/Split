import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface ProgressBarProps {
  ratio: number; // spent / allocated, can exceed 1
}

function colorForRatio(ratio: number): string {
  if (ratio > 1) return colors.burnRate.over;
  if (ratio >= 0.7) return colors.burnRate.warning;
  return colors.burnRate.safe;
}

export function ProgressBar({ ratio }: ProgressBarProps) {
  const safeRatio = Number.isFinite(ratio) ? ratio : 1;
  const widthPct = Math.min(Math.max(safeRatio, 0), 1) * 100;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${widthPct}%`, backgroundColor: colorForRatio(safeRatio) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
