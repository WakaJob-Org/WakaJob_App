import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    ActivityIndicator,
    RefreshControl,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';
import jobService, { Job } from '../../services/jobService';
import CreateJobScreen from './CreateJobScreen';

const { width } = Dimensions.get('window');

interface EmployerDashboardScreenProps {
    isVisible: boolean;
    onLogout: () => void;
    onProfilePress: () => void;
    onNotificationPress: () => void;
}

const EmployerDashboardScreen: React.FC<EmployerDashboardScreenProps> = ({
    isVisible,
    onLogout,
    onProfilePress,
    onNotificationPress,
}) => {
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<any>(null);
    const [myJobs, setMyJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPostJob, setShowPostJob] = useState(false);

    const loadData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const user = await authService.getUser();
            if (user) {
                setProfile(user);
                // In a real app, we'd fetch only jobs by this employer
                // For now, we'll fetch all and filter if possible, or just show all as "Posted by you" for demo
                const allJobs = await jobService.getJobs();
                setMyJobs(allJobs);
            }
        } catch (error) {
            console.error('Error loading employer dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isVisible) loadData();
    }, [isVisible]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    if (!isVisible) return null;

    const renderJobItem = ({ item }: { item: Job }) => (
        <View style={styles.jobCard}>
            <View style={styles.cardHeader}>
                <View style={styles.jobIconBox}>
                    <Ionicons name="briefcase" size={24} color="#1972ca" />
                </View>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{item.position_vacant}</Text>
                    <Text style={styles.jobCategory}>{item.category} • {item.job_type}</Text>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#9BA4B1" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.cardStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Applicants</Text>
                </View>
                <View style={[styles.statItem, styles.statBorder]}>
                    <Text style={styles.statValue}>{item.salary}</Text>
                    <Text style={styles.statLabel}>Wage</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>Active</Text>
                    <Text style={styles.statLabel}>Status</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.welcomeText}>Employer Dashboard</Text>
                        <Text style={styles.nameText}>{profile?.full_name || 'Business Partner'}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress}>
                            <Ionicons name="notifications-outline" size={24} color="#1972ca" />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatar} onPress={onProfilePress}>
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarChar}>
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'B'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1972ca" />
                </View>
            ) : (
                <FlatList
                    data={myJobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1972ca" />
                    }
                    ListHeaderComponent={
                        <>
                            {/* Overview Cards */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                                <View style={[styles.summaryCard, { backgroundColor: '#1972ca' }]}>
                                    <Ionicons name="people" size={24} color="#FFF" />
                                    <Text style={styles.summaryValue}>24</Text>
                                    <Text style={styles.summaryLabel}>Total Applicants</Text>
                                </View>
                                <View style={[styles.summaryCard, { backgroundColor: '#EBF4FF' }]}>
                                    <Ionicons name="list" size={24} color="#1972ca" />
                                    <Text style={[styles.summaryValue, { color: '#1972ca' }]}>{myJobs.length}</Text>
                                    <Text style={[styles.summaryLabel, { color: '#6B7280' }]}>Active Jobs</Text>
                                </View>
                                <View style={[styles.summaryCard, { backgroundColor: '#FDF2F2' }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#DC2626" />
                                    <Text style={[styles.summaryValue, { color: '#DC2626' }]}>8</Text>
                                    <Text style={[styles.summaryLabel, { color: '#6B7280' }]}>Hired Workers</Text>
                                </View>
                            </ScrollView>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Your Job Listings</Text>
                                <TouchableOpacity onPress={() => setShowPostJob(true)}>
                                    <Text style={styles.seeAll}>See All</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>No Jobs Posted Yet</Text>
                            <Text style={styles.emptyDesc}>Start recruiting by posting your first job listing</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowPostJob(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
                <Text style={styles.fabText}>Post Job</Text>
            </TouchableOpacity>

            <CreateJobScreen
                isVisible={showPostJob}
                onClose={() => setShowPostJob(false)}
                onPost={() => loadData(true)}
            />
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
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    nameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notifDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#1972ca',
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarChar: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    statsScroll: {
        paddingVertical: 20,
        gap: 15,
    },
    summaryCard: {
        width: 140,
        padding: 20,
        borderRadius: 24,
        justifyContent: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 10,
    },
    summaryLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    seeAll: {
        fontSize: 14,
        color: '#1972ca',
        fontWeight: '600',
    },
    jobCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    jobIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    jobInfo: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    jobCategory: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    editBtn: {
        padding: 4,
    },
    cardStats: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 15,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#F3F4F6',
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 11,
        color: '#9BA4B1',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 15,
    },
    emptyDesc: {
        fontSize: 14,
        color: '#9BA4B1',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: '80%',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#1972ca',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 30,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default EmployerDashboardScreen;
