import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../styles/theme';

export default function ScreenHeader({
  title,
  left,
  right,
  backgroundColor = Colors.primary,
  style,
  titleStyle,
  leftStyle,
  rightStyle,
  paddingHorizontal = Spacing.lg,
  paddingVertical = Spacing.md,
  leftWidth = 36,
  rightWidth = leftWidth,
  expandSides = false,
}) {
  const sideStyle = expandSides ? styles.expandedSide : null;

  return (
    <View style={[styles.container, { backgroundColor, paddingHorizontal, paddingVertical }, style]}>
      <View style={[sideStyle || { width: leftWidth }, styles.leftSide, leftStyle]}>{left}</View>
      {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
      <View style={[sideStyle || { width: rightWidth }, styles.rightSide, rightStyle]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedSide: {
    flex: 1,
  },
  leftSide: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: Typography.h3,
    fontWeight: '700',
  },
});
