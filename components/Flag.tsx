import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { FLAG_CODE } from '../constants/flagCodes';
import { T } from '../constants/theme';

interface Props {
  team: string;
  size?: number;
}

export function Flag({ team, size = 34 }: Props) {
  const code = FLAG_CODE[team];
  const r = size / 2;

  if (!code) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: r }]} />
    );
  }

  return (
    <Image
      source={{ uri: `https://flagcdn.com/w160/${code}.png` }}
      style={{ width: size, height: size, borderRadius: r, backgroundColor: T.color.line }}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: T.color.line,
    borderWidth: 1,
    borderColor: T.color.line,
  },
});
