import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Skeleton from './SkeletonLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DashboardSkeleton = () => {
    const insets = useSafeAreaInsets();

    const renderJobCardSkeleton = () => (
        <View style={styles.jobCard}>
            <View style={styles.cardHeader}>
                <Skeleton width={48} height={48} borderRadius={12} style={styles.marginRight} />
                <View style={styles.flex1}>
                    <Skeleton width="60%" height={18} style={styles.marginBottomSmall} />
                    <Skeleton width="40%" height={14} />
                </View>
                <Skeleton width={22} height={22} borderRadius={4} />
            </View>

            <Skeleton width="100%" height={14} style={styles.marginBottomSmall} />
            <Skeleton width="100%" height={14} style={styles.marginBottom} />

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Skeleton width="80%" height={12} />
                </View>
                <View style={styles.infoItem}>
                    <Skeleton width="80%" height={12} />
                </View>
                <View style={styles.infoItem}>
                    <Skeleton width="80%" height={12} />
                </View>
                <View style={styles.infoItem}>
                    <Skeleton width="80%" height={12} />
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Skeleton width="48%" height={48} borderRadius={12} />
                <Skeleton width="48%" height={48} borderRadius={12} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Skeleton */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <Skeleton width={120} height={30} borderRadius={15} />
                    <View style={styles.headerActions}>
                        <Skeleton width={30} height={30} borderRadius={15} style={styles.marginRightSmall} />
                        <Skeleton width={40} height={40} borderRadius={20} />
                    </View>
                </View>
                <View style={styles.searchRow}>
                    <Skeleton width="80%" height={48} borderRadius={12} />
                    <Skeleton width={48} height={48} borderRadius={12} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Welcome section */}
                <View style={styles.welcome}>
                    <Skeleton width="30%" height={16} style={styles.marginBottomSmall} />
                    <Skeleton width="50%" height={28} style={styles.marginBottomSmall} />
                    <Skeleton width="70%" height={16} />
                </View>

                {/* Simulated Job Cards */}
                {renderJobCardSkeleton()}
                {renderJobCardSkeleton()}
                {renderJobCardSkeleton()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    welcome: {
        paddingTop: 20,
        paddingBottom: 15,
    },
    jobCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        rowGap: 12,
    },
    infoItem: {
        width: '50%',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    flex1: {
        flex: 1,
    },
    marginRight: {
        marginRight: 12,
    },
    marginRightSmall: {
        marginRight: 10,
    },
    marginBottom: {
        marginBottom: 15,
    },
    marginBottomSmall: {
        marginBottom: 8,
    },
});

export default DashboardSkeleton;
