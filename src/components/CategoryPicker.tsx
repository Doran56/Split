import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Category } from '../types/budget';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  return (
    <View style={styles.row}>
      {categories.map((category) => {
        const isSelected = category.id === selectedId;
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={[
              styles.chip,
              { borderColor: category.color },
              isSelected && { backgroundColor: category.color },
            ]}
          >
            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{category.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
});
