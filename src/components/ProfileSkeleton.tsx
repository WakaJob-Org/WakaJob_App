import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Skeleton from './SkeletonLoader';

const ProfileSkeleton = () => {
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {/* Header Skeleton */}
            <View style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <Skeleton width={34} height={34} borderRadius={17} />
                        <Skeleton width={120} height={20} borderRadius={10} />
                        <Skeleton width={40} height={20} borderRadius={5} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <Skeleton width={110} height={110} borderRadius={55} style={styles.avatar} />
                    <Skeleton width={150} height={16} borderRadius={8} style={styles.marginTop} />
                </View>

                {/* Form Fields Skeletons */}
                <View style={styles.formContainer}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={styles.fieldGroup}>
                            <Skeleton width={100} height={14} style={styles.marginBottomSmall} />
                            <Skeleton width="100%" height={48} borderRadius={12} />
                        </View>
                    ))}
                </View>

                <Skeleton width="90%" height={52} borderRadius={12} style={styles.saveBtn} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#1972ca',
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    scrollContent: {
        paddingTop: 30,
        paddingBottom: 100,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        marginBottom: 12,
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    saveBtn: {
        alignSelf: 'center',
        marginTop: 10,
    },
    marginTop: {
        marginTop: 10,
    },
    marginBottomSmall: {
        marginBottom: 8,
    },
});

export default ProfileSkeleton;
