import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Skeleton from './SkeletonLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ApplicationsSkeleton = () => {
    const insets = useSafeAreaInsets();

    const renderAppCardSkeleton = () => (
        <View style={styles.appCard}>
            <View style={styles.cardTop}>
                <Skeleton width={52} height={52} borderRadius={12} style={styles.marginRight} />
                <View style={styles.flex1}>
                    <Skeleton width="70%" height={18} style={styles.marginBottomSmall} />
                    <Skeleton width="40%" height={14} />
                </View>
                <Skeleton width={80} height={24} borderRadius={12} />
            </View>

            <View style={styles.cardBottom}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="30%" height={14} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>
                <Skeleton width="60%" height={34} style={styles.marginTop} />
            </View>

            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    <Skeleton width={80} height={40} borderRadius={12} />
                    <Skeleton width={100} height={40} borderRadius={12} />
                    <Skeleton width={90} height={40} borderRadius={12} />
                    <Skeleton width={80} height={40} borderRadius={12} />
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.appList} showsVerticalScrollIndicator={false}>
                {renderAppCardSkeleton()}
                {renderAppCardSkeleton()}
                {renderAppCardSkeleton()}
                {renderAppCardSkeleton()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F7FB',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    marginTop: {
        marginTop: 10,
    },
    tabsWrapper: {
        marginBottom: 20,
    },
    tabsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    appList: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    appCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 15,
    },
    flex1: {
        flex: 1,
    },
    marginRight: {
        marginRight: 12,
    },
    marginBottomSmall: {
        marginBottom: 8,
    },
});

export default ApplicationsSkeleton;
