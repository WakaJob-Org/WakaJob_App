import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    TextInput,
    Image,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import jobService from '../../services/jobService';
import ApplicationsSkeleton from '../../components/ApplicationsSkeleton';
import ApplicantProfileScreen, { Applicant } from './ApplicantProfileScreen';
import Header from '../../components/Header';
import { AppStackParamList } from '../../navigation/types';

type JobApplicantsRouteProp = RouteProp<AppStackParamList, 'JobApplicants'>;
type StatusKey = 'NEW' | 'UNDER REVIEW' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED';

const FILTER_TABS = ['All', 'New', 'Reviewing', 'Interview', 'Accepted', 'Rejected'];

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; text: string; borderColor: string }> = {
    'NEW': { label: 'NEW', bg: '#EBF5FF', text: '#2563EB', borderColor: '#BFDBFE' },
    'UNDER REVIEW': { label: 'UNDER REVIEW', bg: '#FFF7ED', text: '#C2410C', borderColor: '#FED7AA' },
    'INTERVIEWING': { label: 'INTERVIEWING', bg: '#F5F3FF', text: '#7C3AED', borderColor: '#DDD6FE' },
    'ACCEPTED': { label: 'ACCEPTED', bg: '#F0FDF4', text: '#16A34A', borderColor: '#BBF7D0' },
    'REJECTED': { label: 'REJECTED', bg: '#FEF2F2', text: '#EF4444', borderColor: '#FECACA' },
};

const AVATAR_COLORS: Record<string, string> = {
    SA: '#9CA3AF', CO: '#6B7280', KM: '#4B5563', EM: '#93C5FD',
};

// Backend shape for a single application record (as returned by
// GET /applications/job/:jobId) hasn't been verified against real
// Field names verified against the live backend with a real logged-in
// session (see jobService.getJobApplicants / getUserProfile comments):
// the applicant's account info comes nested under `users` on the
// application record itself; bio/skills/phone/photo come from a separate
// GET /profiles/:workerId call, merged in afterward in fetchApplicants
// below. There is no `location` field anywhere in either response.
const mapToApplicant = (item: any): Applicant => {
    const account = item.users || {};
    const accountProfile = account.profiles || {};
    const name = account.full_name || 'Applicant';
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Backend status values are lowercase (e.g. "pending")
    const rawStatus = (item.status || 'NEW').toUpperCase().trim();
    const statusMap: Record<string, StatusKey> = {
        'NEW': 'NEW', 'PENDING': 'NEW', 'SUBMITTED': 'NEW',
        'UNDER REVIEW': 'UNDER REVIEW', 'REVIEWING': 'UNDER REVIEW', 'REVIEW': 'UNDER REVIEW',
        'INTERVIEWING': 'INTERVIEWING', 'INTERVIEW': 'INTERVIEWING',
        'ACCEPTED': 'ACCEPTED', 'HIRED': 'ACCEPTED', 'APPROVED': 'ACCEPTED',
        'REJECTED': 'REJECTED', 'DECLINED': 'REJECTED',
    };
    const status: StatusKey = statusMap[rawStatus] ?? 'NEW';

    return {
        id: item.id || item._id || String(Math.random()),
        name,
        role: 'Applicant',
        location: '',
        status,
        photo: accountProfile.profile_image_url || null,
        initials,
        isVerified: false,
        bio: item.cover_letter || '',
        skills: [],
        phone: accountProfile.phone_number || '',
        email: account.email || '',
        workerId: item.worker_id,
    } as Applicant & { workerId?: string };
};

const JobApplicantsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<JobApplicantsRouteProp>();
    const { jobId, jobTitle } = route.params;

    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [profileVisible, setProfileVisible] = useState(false);

    const fetchApplicants = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const fetched = await jobService.getJobApplicants(jobId);
            const mapped = (fetched || []).map(mapToApplicant);

            // The applications endpoint only returns account basics (name,
            // email, phone, photo) - bio/skills live on a separate profile
            // record, fetched in parallel per applicant and merged in.
            const enriched = await Promise.all(
                mapped.map(async (applicant: any) => {
                    if (!applicant.workerId) return applicant;
                    const profile = await jobService.getUserProfile(applicant.workerId);
                    if (!profile) return applicant;
                    return {
                        ...applicant,
                        bio: profile.bio || applicant.bio,
                        skills: Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills : applicant.skills,
                        photo: profile.profile_image_url || applicant.photo,
                        phone: profile.phone_number || applicant.phone,
                        role: profile.skills?.[0] || applicant.role,
                    };
                })
            );

            setApplicants(enriched);
        } catch (error) {
            console.error('Error fetching job applicants:', error);
            setApplicants([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [jobId]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchApplicants(true);
    }, [jobId]);

    const filteredApplicants = applicants.filter((item) => {
        const matchesSearch =
            searchQuery === '' ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab =
            activeTab === 'All' ||
            (activeTab === 'New' && item.status === 'NEW') ||
            (activeTab === 'Reviewing' && item.status === 'UNDER REVIEW') ||
            (activeTab === 'Interview' && item.status === 'INTERVIEWING') ||
            (activeTab === 'Accepted' && item.status === 'ACCEPTED') ||
            (activeTab === 'Rejected' && item.status === 'REJECTED');
        return matchesSearch && matchesTab;
    });

    const updateApplicantStatus = async (applicantId: string, status: 'ACCEPTED' | 'REJECTED' | 'INTERVIEWING' | 'UNDER REVIEW') => {
        try {
            setApplicants(prev => prev.map(app =>
                app.id === applicantId ? { ...app, status } : app
            ));
            await jobService.updateApplicationStatus(applicantId, status);
        } catch (error) {
            console.error('Failed to update status:', error);
            Alert.alert('Error', 'Failed to update application status.');
        }
    };

    const handleViewDetails = (item: Applicant) => {
        setSelectedApplicant(item);
        setProfileVisible(true);
        // Opening an application is the employer "seeing" it - move it out of
        // NEW so the applicant knows it's been looked at. Don't touch it if
        // it's already further along (reviewing again shouldn't reset a
        // decision back from Accepted/Rejected/Interviewing).
        if (item.status === 'NEW') {
            updateApplicantStatus(item.id, 'UNDER REVIEW');
        }
    };

    const renderItem = ({ item }: { item: Applicant }) => {
        const statusConfig = STATUS_CONFIG[(item.status as StatusKey) || 'NEW'];
        const avatarColor = AVATAR_COLORS[item.initials ?? ''] ?? '#9CA3AF';
        const photoUri = item.photo ?? item.avatar ?? null;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handleViewDetails(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.applicantInfo}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                                <Text style={styles.avatarText}>{item.initials || item.name.charAt(0)}</Text>
                            </View>
                        )}
                        <View>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{item.name}</Text>
                                {item.isVerified && (
                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                )}
                            </View>
                            <Text style={styles.role}>{item.role}</Text>
                            {item.location ? (
                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                    <Text style={styles.location}>{item.location}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.borderColor }]}>
                        <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.detailsBtn} onPress={() => handleViewDetails(item)}>
                        <Text style={styles.detailsBtnText}>Review Application</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Header
                title={`${jobTitle} Applicants`}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showSettings={false}
                showNotification={false}
            />

            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search applicants..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            <View style={styles.tabsWrapper}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={FILTER_TABS}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === item && styles.activeTab]}
                            onPress={() => setActiveTab(item)}
                        >
                            <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.tabsContainer}
                />
            </View>

            {loading ? (
                <ApplicationsSkeleton />
            ) : (
                <FlatList
                    data={filteredApplicants}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1972ca']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={60} color="#E5E7EB" />
                            <Text style={styles.emptyTitle}>No applicants found</Text>
                            <Text style={styles.emptySub}>When workers apply, they will appear here.</Text>
                        </View>
                    }
                />
            )}

            <ApplicantProfileScreen
                applicant={selectedApplicant}
                visible={profileVisible}
                onClose={() => setProfileVisible(false)}
                onDecline={() => {
                    if (selectedApplicant) updateApplicantStatus(selectedApplicant.id, 'REJECTED');
                    setProfileVisible(false);
                }}
                onHire={() => {
                    if (selectedApplicant) updateApplicantStatus(selectedApplicant.id, 'ACCEPTED');
                    setProfileVisible(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 46,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    tabsWrapper: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tabsContainer: {
        paddingHorizontal: 15,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    activeTab: {
        backgroundColor: '#1972ca',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    applicantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    role: {
        fontSize: 13,
        color: '#4B5563',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    detailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailsBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default JobApplicantsScreen;
