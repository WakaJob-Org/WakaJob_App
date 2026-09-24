import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import authService from '../../services/authService';
import jobService, { Job } from '../../services/jobService';
import Header from '../../components/Header';

// Turns a created_at timestamp into "2 days ago" / "1 month ago" style text
const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return '';
    const posted = new Date(dateString).getTime();
    if (isNaN(posted)) return '';

    const diffSec = Math.floor((Date.now() - posted) / 1000);
    if (diffSec < 60) return 'Just now';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 5) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;

    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

    const diffYear = Math.floor(diffDay / 365);
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
};

const EmployerDashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applicantsByJob, setApplicantsByJob] = useState<Record<string, any[]>>({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredJobs = jobs.filter(job => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
            job.position_vacant?.toLowerCase().includes(query) ||
            job.location?.toLowerCase().includes(query)
        );
    });

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

            // Fetch each job's applicants in parallel so the "New Applicants" row can render
            const applicantsEntries = await Promise.all(
                myJobs.map(async (job) => {
                    const applicants = await jobService.getJobApplicants(job.id);
                    return [job.id, applicants] as const;
                })
            );
            setApplicantsByJob(Object.fromEntries(applicantsEntries));
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

    // Same mapping DashboardScreen uses to turn a raw backend Job into the
    // shape JobDetailsScreen expects - so tapping an employer's own listing
    // opens the identical detail view a job seeker would see on Dashboard.
    // employer_id (snake_case) is kept alongside employerId because
    // JobDetailsScreen's isJobPoster check reads job.employer_id specifically.
    const mapJobForDetails = (job: Job) => ({
        id: job.id,
        title: (job as any).title || job.position_vacant || job.category || 'Professional Trade',
        company: job.users?.full_name || 'Private Employer',
        location: job.location || 'Not specified',
        salary: job.salary || 'Competitive',
        type: job.job_type || 'Full-time',
        description: job.description,
        category: job.category,
        email: job.users?.email || '',
        phone: job.users?.profiles?.phone_number || '',
        postedAt: job.created_at,
        imageUrl: job.image_url || job.job_image,
        requirements: job.qualifications ? job.qualifications.split(',') : [],
        employerId: job.employer_id,
        employer_id: job.employer_id,
        is_active: (job as any).is_active !== false,
        disabled_reason: (job as any).disabled_reason || (job as any).disable_reason || '',
    });

    const renderJobItem = ({ item }: { item: Job }) => {
        const mapped = mapJobForDetails(item);
        const applicants = applicantsByJob[item.id] || [];
        const isDisabled = (item as any).is_active === false;
        const disabledReason = (item as any).disabled_reason || (item as any).disable_reason || '';

        return (
            <TouchableOpacity
                style={[styles.jobCard, isDisabled && styles.jobCardDisabled]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('JobDetails', { job: mapped })}
            >
                <View style={styles.imageContainer}>
                    {mapped.imageUrl ? (
                        <Image source={{ uri: mapped.imageUrl }} style={[styles.jobImage, isDisabled && styles.jobImageDisabled]} />
                    ) : (
                        <View style={[styles.jobImage, styles.placeholderImage, isDisabled && styles.jobImageDisabled]}>
                            <Ionicons name="image-outline" size={26} color={isDisabled ? '#CBD5E1' : '#9BA4B1'} />
                        </View>
                    )}
                    {isDisabled && (
                        <View style={styles.disabledBadge}>
                            <Ionicons name="ban-outline" size={10} color="#FFF" />
                            <Text style={styles.disabledBadgeText}>Disabled by Admin</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardBody}>
                    {isDisabled && (
                        <View style={styles.disabledReasonBanner}>
                            <Ionicons name="alert-circle" size={13} color="#DC2626" />
                            <Text style={styles.disabledReasonText} numberOfLines={2}>
                                {disabledReason
                                    ? `Disabled: ${disabledReason}`
                                    : 'This post was taken down by an administrator. Tap to review.'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.cardBodyTopRow}>
                        <Text style={[styles.jobTitle, isDisabled && styles.jobTitleDisabled]} numberOfLines={1}>{mapped.title}</Text>
                        <TouchableOpacity onPress={() => handleJobOptions(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="ellipsis-vertical" size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {item.category ? (
                        <Text style={styles.categoryLine} numberOfLines={1}>{item.category}</Text>
                    ) : null}
                    <Text style={styles.postedDate} numberOfLines={1}>Posted {getRelativeTime(item.created_at)}</Text>

                    <View style={styles.applicantsRow}>
                        <View style={[styles.applicantsPill, applicants.length === 0 && styles.applicantsPillEmpty]}>
                            <Ionicons name="people" size={12} color={applicants.length > 0 ? '#1972ca' : '#9CA3AF'} />
                            <Text style={[styles.applicantsPillText, applicants.length === 0 && styles.applicantsPillTextEmpty]}>
                                {applicants.length} New Applicant{applicants.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        {applicants.length > 0 && (
                            <View style={styles.avatarStack}>
                                {applicants.slice(0, 3).map((app, idx) => {
                                    // Verified against the live backend: the applicant's
                                    // account info is nested under `users` on the
                                    // application record (see jobService.getJobApplicants).
                                    const photo = app.users?.profiles?.profile_image_url;
                                    const name = app.users?.full_name || 'A';
                                    return (
                                        <View
                                            key={app.id || app._id || idx}
                                            style={[styles.avatarStackItem, idx > 0 && styles.avatarOverlap]}
                                        >
                                            {photo ? (
                                                <Image source={{ uri: photo }} style={styles.avatarStackImage} />
                                            ) : (
                                                <Text style={styles.avatarStackInitial}>{name.charAt(0).toUpperCase()}</Text>
                                            )}
                                        </View>
                                    );
                                })}
                                {applicants.length > 3 && (
                                    <View style={[styles.avatarStackItem, styles.avatarOverlap, styles.avatarStackMore]}>
                                        <Text style={[styles.avatarStackInitial, styles.avatarStackMoreText]}>
                                            +{applicants.length - 3}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Header
                title="My Listings"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showSettings={false}
                showNotification={false}
                rightElement={
                    <View style={styles.headerSearchWrapper}>
                        <Ionicons name="search-outline" size={16} color="#FFFFFF" />
                        <TextInput
                            style={styles.headerSearchInput}
                            placeholder="Search listings"
                            placeholderTextColor="rgba(255,255,255,0.75)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                }
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1972ca" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={filteredJobs}
                        keyExtractor={(item) => item.id}
                        renderItem={renderJobItem}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            filteredJobs.length > 0 ? (
                                <Text style={styles.sectionTitle}>Recent Postings</Text>
                            ) : null
                        }
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
                                <Text style={styles.emptyTitle}>
                                    {searchQuery ? 'No Matching Listings' : 'No Jobs Posted Yet'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {searchQuery ? 'Try a different search term' : 'Start hiring by posting your first job listing'}
                                </Text>
                                {!searchQuery && (
                                    <TouchableOpacity
                                        style={styles.postButton}
                                        onPress={handlePostJob}
                                    >
                                        <Text style={styles.postButtonText}>Post a Job</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 36,
        width: 160,
        gap: 6,
    },
    headerSearchInput: {
        flex: 1,
        fontSize: 13,
        color: '#FFFFFF',
        padding: 0,
    },
    listContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 14,
    },
    // Compact list row, same pattern as SavedScreen.tsx: small fixed-size
    // thumbnail, center-aligned single-column details, no stretching.
    jobCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    imageContainer: {
        width: 88,
        height: 88,
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 16,
        position: 'relative',
    },
    jobImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        flex: 1,
    },
    cardBodyTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    jobTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
    },
    categoryLine: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 4,
    },
    postedDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    applicantsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 9,
        gap: 6,
    },
    applicantsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 13,
        gap: 4,
    },
    // Neutral/gray variant for zero applicants, so a job with a genuine new
    // applicant (blue) visibly stands out from one with none.
    applicantsPillEmpty: {
        backgroundColor: '#F3F4F6',
    },
    applicantsPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1972ca',
    },
    applicantsPillTextEmpty: {
        color: '#9CA3AF',
    },
    avatarStack: {
        flexDirection: 'row',
        marginLeft: 2,
    },
    avatarStackItem: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarOverlap: {
        marginLeft: -8,
    },
    avatarStackImage: {
        width: '100%',
        height: '100%',
    },
    avatarStackInitial: {
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    avatarStackMore: {
        backgroundColor: '#E5E7EB',
    },
    avatarStackMoreText: {
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
    jobCardDisabled: {
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
        backgroundColor: '#FFFDFD',
    },
    jobImageDisabled: {
        opacity: 0.6,
    },
    disabledBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#DC2626',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
    },
    disabledBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    disabledReasonBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#DC2626',
        paddingHorizontal: 9,
        paddingVertical: 6,
        marginBottom: 6,
    },
    disabledReasonText: {
        fontSize: 11,
        color: '#991B1B',
        fontWeight: '600',
        flex: 1,
        lineHeight: 15,
    },
    jobTitleDisabled: {
        color: '#94A3B8',
    },
});

export default EmployerDashboardScreen;
