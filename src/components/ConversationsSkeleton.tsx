import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './SkeletonLoader';

const ConversationRowSkeleton = () => (
    <View style={styles.row}>
        <Skeleton width={52} height={52} borderRadius={26} />
        <View style={styles.rowContent}>
            <View style={styles.topLine}>
                <Skeleton width="45%" height={14} />
                <Skeleton width={40} height={11} />
            </View>
            <Skeleton width="30%" height={16} borderRadius={6} style={styles.jobTag} />
            <Skeleton width="70%" height={12} style={styles.preview} />
        </View>
    </View>
);

const ConversationsSkeleton = () => (
    <View style={styles.container}>
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
    </View>
);

const styles = StyleSheet.create({
    container: { paddingTop: 8 },
    row: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    rowContent: { flex: 1, justifyContent: 'center', gap: 8 },
    topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    jobTag: { marginTop: 0 },
    preview: { marginTop: 0 },
});

export default ConversationsSkeleton;
