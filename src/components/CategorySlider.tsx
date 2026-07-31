import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface CategorySliderProps {
  label: string;
  color: string;
  value: number;
  onValueChange: (value: number) => void;
  amountLabel?: string;
}

export function CategorySlider({ label, color, value, onValueChange, amountLabel }: CategorySliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.valueColumn}>
          <Text style={styles.value}>{Math.round(value)}%</Text>
          {amountLabel ? <Text style={styles.amount}>{amountLabel}</Text> : null}
        </View>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={colors.border}
        thumbTintColor={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  valueColumn: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  amount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
