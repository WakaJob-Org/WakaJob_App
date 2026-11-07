import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './SkeletonLoader';

const BUBBLES: { mine: boolean; width: `${number}%` }[] = [
    { mine: false, width: '55%' },
    { mine: false, width: '40%' },
    { mine: true, width: '60%' },
    { mine: false, width: '45%' },
    { mine: true, width: '35%' },
    { mine: true, width: '50%' },
];

const ChatBubblesSkeleton = () => (
    <View style={styles.container}>
        {BUBBLES.map((bubble, index) => (
            <View key={index} style={[styles.row, bubble.mine ? styles.rowMine : styles.rowTheirs]}>
                <Skeleton width={bubble.width} height={38} borderRadius={16} />
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    container: { padding: 16, gap: 12 },
    row: { flexDirection: 'row' },
    rowMine: { justifyContent: 'flex-end' },
    rowTheirs: { justifyContent: 'flex-start' },
});

export default ChatBubblesSkeleton;
