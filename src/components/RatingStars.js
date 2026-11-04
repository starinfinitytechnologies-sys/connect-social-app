import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

function getIconName(rating, index) {
  if (rating >= index + 0.75) return 'star';
  if (rating >= index + 0.25) return 'star-half';
  return 'star-outline';
}

export default function RatingStars({
  rating = 0,
  reviewCount,
  size = 13,
  showValue = true,
  color = COLORS.gold,
  textStyle,
}) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Rated ${rating} out of 5${reviewCount ? ` from ${reviewCount} reviews` : ''}`}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <Ionicons
          key={index}
          name={getIconName(rating, index)}
          size={size}
          color={color}
          style={styles.star}
        />
      ))}
      {showValue ? (
        <Text style={[styles.value, { fontSize: size }, textStyle]}>
          {rating.toFixed(1)}
          {reviewCount ? (
            <Text style={styles.count}> ({reviewCount})</Text>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 1,
  },
  value: {
    color: COLORS.text,
    fontWeight: '800',
    marginLeft: 5,
  },
  count: {
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
});
