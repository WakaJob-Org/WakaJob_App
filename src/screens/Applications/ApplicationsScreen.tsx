import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ScrollView,
    TextInput,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import jobService from '../../services/jobService';
import ApplicationsSkeleton from '../../components/ApplicationsSkeleton';
import ApplicantProfileScreen, { Applicant } from './ApplicantProfileScreen';

import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

type StatusKey = 'NEW' | 'UNDER REVIEW' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED';

const FILTER_TABS = ['All', 'New', 'Reviewing', 'Interview', 'Accepted', 'Rejected'];

const MOCK_APPLICANTS: Applicant[] = [
    {
        id: '1',
        name: 'Samuel Adebayo',
        role: 'Master Carpenter',
        location: 'Lagos, Nigeria',
        status: 'NEW',
        photo: null,
        initials: 'SA',
        isVerified: true,
        bio: 'Dedicated and detail-oriented Master Carpenter with over 12 years of experience in residential and commercial construction. Specialized in bespoke cabinetry, structural framing, and intricate wood finishing.',
        skills: ['Custom Cabinetry', 'Roof Framing', 'Wood Finishing', 'Blueprint Reading', 'Team Leadership'],
        startDate: 'Oct 24, 2023',
        jobDuration: '2 Weeks',
        agreedRate: '₦150,000',
    },
    {
        id: '2',
        name: 'Chioma Okafor',
        role: 'Senior Hair Stylist',
        location: 'Abuja, Nigeria',
        status: 'UNDER REVIEW',
        photo: null,
        initials: 'CO',
        isVerified: true,
        skills: ['Braiding', 'Coloring', 'Keratin Treatments', 'Styling'],
        startDate: 'Nov 01, 2023',
        jobDuration: '3 Days/Week',
        agreedRate: '₦80,000',
    },
    {
        id: '3',
        name: 'Kofi Mensah',
        role: 'Professional Barber',
        location: 'Accra, Ghana',
        status: 'INTERVIEWING',
        photo: null,
        initials: 'KM',
        isVerified: false,
        skills: ['Fades', 'Line-ups', 'Beard Grooming', 'Skin Tapers'],
        startDate: 'Oct 30, 2023',
        jobDuration: '1 Month',
        agreedRate: '₦60,000',
    },
    {
        id: '4',
        name: 'Emeka Musa',
        role: 'Apprentice Carpenter',
        location: 'Kano, Nigeria',
        status: 'ACCEPTED',
        photo: null,
        initials: 'EM',
        isVerified: false,
        skills: ['Sanding', 'Assembly', 'Wood Cutting'],
        startDate: 'Oct 20, 2023',
        jobDuration: '6 Months',
        agreedRate: '₦40,000',
    },
];

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; text: string; borderColor: string }> = {
    'NEW': {
        label: 'NEW',
        bg: '#EBF5FF',
        text: '#2563EB',
        borderColor: '#BFDBFE',
    },
    'UNDER REVIEW': {
        label: 'UNDER REVIEW',
        bg: '#FFF7ED',
        text: '#C2410C',
        borderColor: '#FED7AA',
    },
    'INTERVIEWING': {
        label: 'INTERVIEWING',
        bg: '#F5F3FF',
        text: '#7C3AED',
        borderColor: '#DDD6FE',
    },
    'ACCEPTED': {
        label: 'ACCEPTED',
        bg: '#F0FDF4',
        text: '#16A34A',
        borderColor: '#BBF7D0',
    },
    'REJECTED': {
        label: 'REJECTED',
        bg: '#FEF2F2',
        text: '#EF4444',
        borderColor: '#FECACA',
    },
};

const AVATAR_COLORS: Record<string, string> = {
    SA: '#9CA3AF',
    CO: '#6B7280',
    KM: '#4B5563',
    EM: '#93C5FD',
};

interface ApplicationsScreenProps {
    onViewApplicant?: (id: string) => void;
}

const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({ onViewApplicant }) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const isEmployer = user?.role === 'employer';
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [applicants, setApplicants] = useState<Applicant[]>(MOCK_APPLICANTS);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [profileVisible, setProfileVisible] = useState(false);

    const fetchApplications = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const fetched = await jobService.getUserApplications();
            if (fetched && fetched.length > 0) {
                // map fetched data if available
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchApplications();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchApplications(true);
    }, []);

    const insets = useSafeAreaInsets();

    if (loading) return <ApplicationsSkeleton />;

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

    const updateApplicantStatus = async (applicantId: string, status: StatusKey) => {
        try {
            // Update UI optimistically
            setApplicants(prev => prev.map(app => 
                app.id === applicantId ? { ...app, status } : app
            ));
            
            // In a real app, you would call the backend here:
            // await jobService.updateApplicationStatus(applicantId, status);
        } catch (error) {
            console.error('Failed to update status:', error);
            // Optionally revert the state if the API fails
        }
    };

    const handleViewDetails = (item: Applicant) => {
        // If parent provides navigation handler, use it; otherwise open internal modal
        if (onViewApplicant) {
            onViewApplicant(item.id);
        } else {
            setSelectedApplicant(item);
            setProfileVisible(true);
        }
    };

    const renderApplicantCard = ({ item }: { item: Applicant }) => {
        const statusCfg = STATUS_CONFIG[item.status as StatusKey] ?? STATUS_CONFIG['NEW'];

        return (
            <View style={styles.card}>
                {/* Top row: photo, name, role, badge */}
                <View style={styles.cardTop}>
                    {/* Avatar */}
                    {item.photo ? (
                        <Image source={{ uri: item.photo }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: AVATAR_COLORS[item.initials ?? ''] ?? '#9CA3AF' }]}>
                            <Text style={styles.avatarInitials}>{item.initials ?? item.name.charAt(0)}</Text>
                        </View>
                    )}

                    {/* Name & Role */}
                    <View style={styles.nameBlock}>
                        <Text style={styles.applicantName}>{item.name}</Text>
                        <Text style={styles.applicantRole}>{item.role}</Text>
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.borderColor }]}>
                        <Text style={[styles.statusText, { color: statusCfg.text }]}>
                            {statusCfg.label}
                        </Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Bottom row: location + View Details */}
                <View style={styles.cardBottom}>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => handleViewDetails(item)}>
                        <Text style={styles.viewDetails}>View Details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color="#1972ca" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEmployer ? 'Job Applications' : 'My Applications'}
                    </Text>
                    <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
                        <Ionicons name="notifications-outline" size={24} color="#1F2937" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Search Bar ── */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={isEmployer ? "Search by name or job title" : "Search your applications"}
                    placeholderTextColor="#B0B8C5"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* ── Filter Tabs ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScroll}
                style={styles.tabsContainer}
            >
                {FILTER_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabChip, activeTab === tab && styles.activeTabChip]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabChipText, activeTab === tab && styles.activeTabChipText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* ── Content List ── */}
            <FlatList
                data={filteredApplicants}
                renderItem={renderApplicantCard}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1972ca']}
                        tintColor="#1972ca"
                    />
                }
                ListHeaderComponent={
                    <Text style={styles.sectionTitle}>
                        {isEmployer ? 'Recent Applicants' : 'Recent Applications'}
                    </Text>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
                        <Text style={styles.emptyStateText}>
                            {isEmployer ? 'No applicants found' : 'No applications found'}
                        </Text>
                    </View>
                }
            />

            {/* Applicant Profile Modal (Only relevant for Employer) */}
            {isEmployer && (
                <ApplicantProfileScreen
                    applicant={selectedApplicant}
                    visible={profileVisible}
                    onClose={() => setProfileVisible(false)}
                    onDecline={() => {
                        if (selectedApplicant) updateApplicantStatus(selectedApplicant.id, 'REJECTED');
                        setProfileVisible(false);
                    }}
                    onHire={(details) => {
                        if (selectedApplicant) updateApplicantStatus(selectedApplicant.id, 'ACCEPTED');
                        setProfileVisible(false);
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFB',
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
    },
    headerIconBtn: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        textAlign: 'center',
    },

    // ── Search ──
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        marginHorizontal: 18,
        marginTop: 14,
        marginBottom: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        padding: 0,
    },

    // ── Tabs ──
    tabsContainer: {
        marginBottom: 10,
    },
    tabsScroll: {
        paddingHorizontal: 18,
        gap: 10,
        paddingBottom: 2,
    },
    tabChip: {
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeTabChip: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    tabChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabChipText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // ── List ──
    listContent: {
        paddingHorizontal: 18,
        paddingBottom: 100,
        paddingTop: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 14,
        marginTop: 4,
    },

    // ── Applicant Card ──
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 12,
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    nameBlock: {
        flex: 1,
    },
    applicantName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 3,
    },
    applicantRole: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },

    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    locationText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    viewDetails: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1972ca',
    },

    // ── Empty State ──
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyStateText: {
        marginTop: 14,
        fontSize: 15,
        color: '#9CA3AF',
    },
});

export default ApplicationsScreen;
