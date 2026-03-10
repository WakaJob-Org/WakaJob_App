// src/screens/Dashboard/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Dimensions,
    FlatList,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import jobService, { Job } from '../../services/jobService';
import authService from '../../services/authService';
import DashboardSkeleton from '../../components/DashboardSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DashboardScreenProps {
    isVisible: boolean;
    userName: string;
    userProfile?: any;
    onLogout: () => void;
    onSettingsPress: () => void;
    onProfilePress: () => void;
    onNotificationPress: () => void;
}

interface JobType {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    description: string;
    category: string;
    email: string;
    phone: string;
    postedAt: string;
    requirements?: string[];
}

const MOCK_JOBS: JobType[] = [
    {
        id: '1',
        title: 'Software Engineer',
        company: 'TechCorp Solutions',
        location: 'Lagos, Nigeria',
        salary: '$2,000 - $4,000',
        type: 'Full-time',
        description: "We're looking for a talented software engineer to join our growing team. Experience with React, React Native and Node.js is required.",
        category: 'Technology',
        email: 'jobs@techcorp.com',
        phone: '+234 800 123 4567',
        postedAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'UI/UX Designer',
        company: 'Creative Hub Agency',
        location: 'Abuja, Nigeria',
        salary: '$1,500 - $3,000',
        type: 'Full-time',
        description: "Join our creative team to design exceptional user experiences. Portfolio required. Proficiency in Figma and Adobe XD.",
        category: 'Design',
        email: 'hr@creativehub.ng',
        phone: '+234 800 987 6543',
        postedAt: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'Data Analyst',
        company: 'FinTech Innovations',
        location: 'Lagos, Nigeria',
        salary: '$1,800 - $3,500',
        type: 'Full-time',
        description: "Analyze financial data and provide insights. Strong SQL, Python, and data visualization skills are essential.",
        category: 'Finance',
        email: 'careers@fintech.ng',
        phone: '+234 800 456 7890',
        postedAt: new Date().toISOString(),
    }
];

const DashboardScreen: React.FC<DashboardScreenProps> = ({
    isVisible,
    userName,
    onLogout,
    onSettingsPress,
    onProfilePress,
    onNotificationPress
}) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJob, setSelectedJob] = useState<JobType | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [savedJobsList, setSavedJobsList] = useState<string[]>([]);
    const [allJobs, setAllJobs] = useState<JobType[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<JobType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Toast Animation State
    const toastTranslateY = useSharedValue(200);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (message: string) => {
        setToastMessage(message);
        toastTranslateY.value = withSequence(
            withTiming(0, { duration: 300 }),
            withDelay(1200, withTiming(200, { duration: 300 }))
        );
    };

    const toastStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: toastTranslateY.value }],
    }));

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userData = await authService.getUser();
                if (userData) {
                    setProfile(userData);
                }
            } catch (error) {
                console.error('Error loading dashboard profile:', error);
            }
        };
        if (isVisible) loadProfile();
    }, [isVisible]);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const displayName = profile?.full_name || userName;
    const avatarInitials = getInitials(displayName);

    const fetchJobs = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const fetchedJobs = await jobService.getJobs();

            const mappedJobs: JobType[] = fetchedJobs.map(job => ({
                id: job.id,
                title: job.position_vacant,
                company: 'WakaJob Partner',
                location: job.location,
                salary: job.salary,
                type: job.job_type,
                description: job.description,
                category: job.category,
                email: 'support@wakajob.com',
                phone: 'N/A',
                postedAt: job.created_at,
                requirements: job.qualifications ? job.qualifications.split(',') : []
            }));

            const finalJobs = mappedJobs.length > 0 ? mappedJobs : MOCK_JOBS;
            setAllJobs(finalJobs);
            setFilteredJobs(finalJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            if (!isRefreshing) {
                setAllJobs(MOCK_JOBS);
                setFilteredJobs(MOCK_JOBS);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchJobs(true);
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = allJobs.filter(job =>
                job.title.toLowerCase().includes(query) ||
                job.company.toLowerCase().includes(query) ||
                job.description.toLowerCase().includes(query)
            );
            setFilteredJobs(filtered);
        } else {
            setFilteredJobs(allJobs);
        }
    }, [searchQuery, allJobs]);

    if (!isVisible) return null;
    if (loading) return <DashboardSkeleton />;

    const handleJobPress = (job: JobType) => {
        setSelectedJob(job);
        setShowDetails(true);
    };

    const handleApply = () => {
        Alert.alert("Success", "Application sent successfully!");
        setShowDetails(false);
    };

    const handleSaveJob = async (jobId: string) => {
        try {
            if (savedJobsList.includes(jobId)) {
                setSavedJobsList(prev => prev.filter(id => id !== jobId));
                showToast("Job removed from saved");
            } else {
                setSavedJobsList(prev => [...prev, jobId]);
                showToast("Job saved successfully");
                await jobService.saveJob(jobId);
            }
        } catch (error) {
            console.error('Error saving job:', error);
        }
    };

    const isJobSaved = (jobId: string) => savedJobsList.includes(jobId);

    const getCompanyColor = (initial: string) => {
        const colors = ['#E0F2FE', '#FEE2E2', '#F0FDF4', '#FEF3C7', '#F3E8FF'];
        const charCode = initial.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const getIconColor = (initial: string) => {
        const colors = ['#0284C7', '#DC2626', '#16A34A', '#D97706', '#9333EA'];
        const charCode = initial.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const renderJobItem = ({ item }: { item: JobType }) => (
        <View style={styles.jobCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.companyIcon, { backgroundColor: getCompanyColor(item.company.charAt(0)) }]}>
                    <Ionicons
                        name={item.category.toLowerCase() === 'technology' ? 'code-working' : 'briefcase'}
                        size={24}
                        color={getIconColor(item.company.charAt(0))}
                    />
                </View>
                <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.companyName}>{item.company}</Text>
                </View>
                <TouchableOpacity onPress={() => handleSaveJob(item.id)}>
                    <Ionicons
                        name={isJobSaved(item.id) ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={isJobSaved(item.id) ? "#1972ca" : "#9BA4B1"}
                    />
                </TouchableOpacity>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Ionicons name="location" size={16} color="#4B5563" />
                    <Text style={styles.infoText}>{item.location}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="time" size={16} color="#4B5563" />
                    <Text style={styles.infoText}>{item.type}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="mail" size={16} color="#4B5563" />
                    <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="call" size={16} color="#4B5563" />
                    <Text style={styles.infoText}>{item.phone}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.applyButton} onPress={() => handleJobPress(item)}>
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.apprenticeButton} onPress={() => handleJobPress(item)}>
                    <Text style={styles.apprenticeButtonText}>Apprentice</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.logoRow}>
                        <Text style={styles.logoText}>WakaJob</Text>
                        <View style={styles.pinkDot} />
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
                            <Ionicons name="notifications-outline" size={24} color="#1972ca" />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatar} onPress={onProfilePress}>
                            {profile?.profile_photo ? (
                                <Image source={{ uri: profile.profile_photo }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarInner}>
                                    <Text style={styles.avatarChar}>{avatarInitials}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Welcome Message - Before Search Bar */}
                <View style={styles.headerWelcome}>
                    <Text style={styles.welcomeSub}>Welcome, {displayName}</Text>
                    <Text style={styles.welcomeTitle}>Available Jobs</Text>
                    <Text style={styles.welcomeDesc}>Based on your location and preferences</Text>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search-outline" size={20} color="#9BA4B1" />
                        <TextInput
                            style={[styles.input, { flex: 1, marginLeft: 10 }]}
                            placeholder="Search jobs..."
                            placeholderTextColor="#9BA4B1"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Ionicons name="options-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredJobs}
                renderItem={renderJobItem}
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
                ListHeaderComponent={<View style={{ height: 10 }} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="search-outline" size={60} color="#CCC" />
                        <Text style={styles.emptyTitle}>No jobs found</Text>
                    </View>
                }
            />

            <Modal visible={showDetails} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <SafeAreaView style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Job Details</Text>
                            <View style={{ width: 40 }} />
                        </SafeAreaView>

                        <ScrollView style={styles.modalBody}>
                            {selectedJob && (
                                <>
                                    <View style={styles.modalHeaderInfo}>
                                        <View style={[styles.modalIcon, { backgroundColor: getCompanyColor(selectedJob.company.charAt(0)) }]}>
                                            <Text style={styles.modalIconText}>{selectedJob.company.charAt(0)}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.modalJobTitle}>{selectedJob.title}</Text>
                                            <Text style={styles.modalCompany}>{selectedJob.company}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.modalSpecBox}>
                                        <Text style={styles.modalSpecText}><Ionicons name="location" size={14} /> {selectedJob.location}</Text>
                                        <Text style={styles.modalSpecText}><Ionicons name="time" size={14} /> {selectedJob.type}</Text>
                                        <Text style={styles.modalSpecText}><Ionicons name="cash" size={14} /> {selectedJob.salary}</Text>
                                    </View>

                                    <Text style={styles.sectionTitle}>Description</Text>
                                    <Text style={styles.sectionContent}>{selectedJob.description}</Text>

                                    <Text style={styles.sectionTitle}>Contact</Text>
                                    <Text style={styles.sectionContent}>{selectedJob.email}</Text>
                                    <Text style={styles.sectionContent}>{selectedJob.phone}</Text>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalApplyBtn} onPress={handleApply}>
                                <Text style={styles.modalApplyBtnText}>Apply Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Toast Notification */}
            <Animated.View pointerEvents="none" style={[styles.toastContainer, toastStyle]}>
                <View style={styles.toastContent}>
                    <View style={styles.toastCheck}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    safeArea: { backgroundColor: '#FFFFFF' },
    header: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    logoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: '#1972ca' },
    pinkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E91E63', marginTop: 6, marginLeft: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconButton: { position: 'relative' },
    notifDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D4F', borderWidth: 2, borderColor: '#FFFFFF' },
    avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6' },
    avatarImage: { width: '100%', height: '100%' },
    avatarInner: { width: '100%', height: '100%', backgroundColor: '#1972ca', justifyContent: 'center', alignItems: 'center' },
    avatarChar: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 15 },
    searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 48 },
    input: { fontSize: 15, color: '#1F2937' },
    filterBtn: { width: 48, height: 48, backgroundColor: '#1972ca', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    headerWelcome: { marginTop: 10, marginBottom: 5 },
    welcomeSub: { fontSize: 14, color: '#1972ca', fontWeight: '600', marginBottom: 4 },
    welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    welcomeDesc: { fontSize: 13, color: '#6B7280' },
    jobCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    companyIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    jobInfo: { flex: 1 },
    jobTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    companyName: { fontSize: 14, color: '#6B7280' },
    description: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 20 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, rowGap: 12 },
    infoItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 12, color: '#4B5563', flex: 1 },
    cardFooter: { flexDirection: 'row', gap: 12 },
    applyButton: { flex: 1, backgroundColor: '#1972ca', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    apprenticeButton: { flex: 1, backgroundColor: 'transparent', height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#1972ca', justifyContent: 'center', alignItems: 'center' },
    apprenticeButtonText: { color: '#1972ca', fontSize: 16, fontWeight: 'bold' },
    empty: { alignItems: 'center', marginTop: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { flex: 1, backgroundColor: '#FFFFFF', marginTop: 50, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    modalBody: { flex: 1, padding: 20 },
    modalHeaderInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    modalIcon: { width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    modalIconText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    modalJobTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    modalCompany: { fontSize: 14, color: '#666' },
    modalSpecBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 15, backgroundColor: '#F8F9FA', borderRadius: 15, marginBottom: 20 },
    modalSpecText: { fontSize: 13, color: '#333' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
    sectionContent: { fontSize: 14, color: '#666', lineHeight: 22 },
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    modalApplyBtn: { backgroundColor: '#1972ca', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    modalApplyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    toastContainer: {
        position: 'absolute',
        bottom: 120,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        gap: 12,
    },
    toastCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DashboardScreen;