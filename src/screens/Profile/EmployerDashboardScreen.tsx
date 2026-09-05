import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import authService from '../../services/authService';
import jobService, { Job } from '../../services/jobService';
import Header from '../../components/Header';

const EmployerDashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [activeTab, setActiveTab] = useState<'listings' | 'applicants'>('listings');
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchEmployerData();
            return () => {};
        }, [])
    );

    const handlePostJob = () => {
        navigation.navigate('CreateJob');
    };

    const fetchEmployerData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const user = await authService.getUser();
            if (!user) return;

            // In a real app, we'd fetch jobs posted by THIS employer
            // For now, we filter existing jobs or show an empty state
            const allJobs = await jobService.getJobs();
            const myJobs = allJobs.filter(j => j.employer_id === user.id);
            setJobs(myJobs);
        } catch (error) {
            console.error('Error fetching employer data:', error);
        } finally {
            if (!isRefreshing) setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchEmployerData(true);
        setRefreshing(false);
    }, []);

    const handleJobOptions = (job: Job) => {
        Alert.alert(
            'Manage Job',
            `What would you like to do with "${job.position_vacant}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => navigation.navigate('CreateJob', { jobToEdit: job }) },
                { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteJob(job) }
            ]
        );
    };

    const confirmDeleteJob = (job: Job) => {
        Alert.alert(
            'Delete Job',
            `Are you sure you want to delete "${job.position_vacant}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id) }
            ]
        );
    };

    const deleteJob = async (jobId: string) => {
        try {
            setLoading(true);
            await jobService.deleteJob(jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            Alert.alert('Success', 'Job deleted successfully.');
        } catch (error: any) {
            Alert.alert('Error', error || 'Failed to delete job.');
        } finally {
            setLoading(false);
        }
    };

    const renderJobItem = ({ item }: { item: Job }) => (
        <TouchableOpacity 
            style={styles.jobCard} 
            onPress={() => navigation.navigate('JobApplicants', { jobId: item.id, jobTitle: item.position_vacant })}
        >
            <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{item.position_vacant}</Text>
                <Text style={styles.jobLocation}>{item.location}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="people-outline" size={16} color="#6B7280" />
                        <Text style={styles.statText}>0 Applicants</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.statText}>{item.job_type}</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleJobOptions(item)}>
                <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header 
                title="Employer Dashboard" 
                showBackButton={true} 
                onBackPress={() => navigation.goBack()}
            />

            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'listings' && styles.activeTab]}
                    onPress={() => setActiveTab('listings')}
                >
                    <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>My Listings</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'applicants' && styles.activeTab]}
                    onPress={() => setActiveTab('applicants')}
                >
                    <Text style={[styles.tabText, activeTab === 'applicants' && styles.activeTabText]}>Applicants</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1972ca" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {activeTab === 'listings' ? (
                        <FlatList
                            data={jobs}
                            keyExtractor={(item) => item.id}
                            renderItem={renderJobItem}
                            contentContainerStyle={styles.listContent}
                            refreshControl={
                                <RefreshControl 
                                    refreshing={refreshing} 
                                    onRefresh={onRefresh} 
                                    colors={['#1972ca']} 
                                    tintColor={'#1972ca'} 
                                />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="briefcase-outline" size={60} color="#E5E7EB" />
                                    </View>
                                    <Text style={styles.emptyTitle}>No Jobs Posted Yet</Text>
                                    <Text style={styles.emptySubtitle}>Start hiring by posting your first job listing</Text>
                                    <TouchableOpacity 
                                        style={styles.postButton}
                                        onPress={handlePostJob}
                                    >
                                        <Text style={styles.postButtonText}>Post a Job</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="people-outline" size={60} color="#E5E7EB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Applicants Yet</Text>
                            <Text style={styles.emptySubtitle}>When workers apply to your jobs, they'll appear here</Text>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        paddingVertical: 15,
        marginRight: 25,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#1972ca',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#1972ca',
    },
    listContent: {
        padding: 20,
    },
    jobCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    jobInfo: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    jobLocation: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 15,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#6B7280',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    postButton: {
        backgroundColor: '#1972ca',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default EmployerDashboardScreen;
