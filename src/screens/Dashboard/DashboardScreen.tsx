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
    ScrollView,
    RefreshControl,
    Image,
    ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence, 
    withDelay, 
    FadeInUp, 
    FadeOutUp,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import jobService, { Job } from '../../services/jobService';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { AppStackParamList, MainTabParamList } from '../../navigation/types';
import ApplyModal from '../../components/ApplyModal';

type DashboardNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Jobs'>,
    StackNavigationProp<AppStackParamList>
>;

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
    imageUrl?: string;
    tags?: string[];
    hasApprentice?: boolean;
    requirements?: string[];
    requires_cv?: boolean;
    requires_cover_letter?: boolean;
}

import DashboardSkeleton from '../../components/DashboardSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    
    useFocusEffect(
        React.useCallback(() => {
            refreshUser();
            fetchJobs(); // Ensure jobs are refreshed when screen is focused
            return () => {};
        }, [])
    );
    const navigation = useNavigation<DashboardNavigationProp>();
    
    // Floating Action Button for Employers with verification check
    const handleFabPress = () => {
        const status = String(user?.verification_status || '').toLowerCase();
        const isVerified = user?.is_verified || status === 'approved' || status === 'verified';

        if (isVerified) {
            navigation.navigate('CreateJob');
        } else if (status === 'pending') {
            navigation.navigate('VerificationPending');
        } else {
            navigation.navigate('EmployerVerification');
        }
    };
    
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [savedJobsList, setSavedJobsList] = useState<string[]>([]);
    const [allJobs, setAllJobs] = useState<JobType[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<JobType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyingJob, setApplyingJob] = useState<JobType | null>(null);
    const [defaultAppType, setDefaultAppType] = useState<'professional' | 'apprentice'>('professional');
    
    // Debounced search and location (500ms delay)
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedLocation, setDebouncedLocation] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setDebouncedLocation(customLocation);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery, customLocation]);

    const BAMENDA_LOCATIONS = [
        'Molyko, Buea',
        'Mile 4, Bamenda',
        'Commercial Avenue',
        'Nkwen, Bamenda',
        'Up Station, Bamenda'
    ];

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

    // Scroll Animation State
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const animatedTipsStyle = useAnimatedStyle(() => {
        const height = interpolate(
            scrollY.value,
            [0, 150],
            [225, 0], // Total height of tips + recommended approx 225
            Extrapolate.CLAMP
        );
        const opacity = interpolate(
            scrollY.value,
            [0, 100],
            [1, 0],
            Extrapolate.CLAMP
        );
        return {
            height,
            opacity,
            overflow: 'hidden',
        };
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                if (user) {
                    setProfile(user);
                }
            } catch (error) {
                console.error('Error loading dashboard profile:', error);
            }
        };
        loadProfile();
    }, [user]);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const displayName = profile?.full_name || user?.full_name || 'User';
    const avatarInitials = getInitials(displayName);

    const fetchJobs = async (isRefreshing = false, showSkeleton = false) => {
        try {
            if (showSkeleton) setLoading(true);
            
            // Prepare Query Params
            const apiParams: any = {};
            if (debouncedSearch.trim()) apiParams.search = debouncedSearch;
            
            const locationToUse = selectedLocation === 'Custom' ? debouncedLocation : selectedLocation;
            if (locationToUse.trim()) apiParams.location = locationToUse;

            const fetchedJobs = await jobService.getJobs(apiParams);
            console.log('Raw fetched jobs from backend:', JSON.stringify(fetchedJobs[0], null, 2)); // Debug log

            const mappedJobs: JobType[] = fetchedJobs.map(job => {
                const category = (job.category || '').toLowerCase();
                const title = job.title || job.position_vacant || job.category || 'Professional Trade';
                // Get job type from available field names
                const jobType = job.job_type || job.type || undefined;
                // Get salary from available field names - backend uses payment_range
                const jobSalary = job.salary || job.payment_range || 'Competitive';
                
                console.log(`Job: ${title}, Type: ${jobType}, Salary: ${jobSalary}, RequireCV: ${job.requires_cv}`); // Debug log
                
                return {
                    id: job.id,
                    title: title,
                    company: job.employer_name || job.users?.full_name || 'Private Employer',
                    location: job.location || 'Not specified',
                    salary: jobSalary,
                    type: jobType,
                    description: job.description,
                    category: job.category,
                    email: job.employer_email || job.users?.email || '',
                    phone: job.employer_phone || job.users?.profiles?.phone_number || '',
                    postedAt: job.created_at,
                    imageUrl: job.image_url || job.job_image,
                    requirements: job.qualifications ? job.qualifications.split(',').map((r: string) => r.trim()).filter((r: string) => r) : [],
                    requires_cv: job.requires_cv,
                    requires_cover_letter: job.requires_cover_letter
                };
            });

            // Filter: Only show jobs that have an uploaded image
            const jobsWithImages = mappedJobs.filter(job => !!job.imageUrl);

            setAllJobs(jobsWithImages);
            setFilteredJobs(jobsWithImages);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            if (!isRefreshing) {
                setAllJobs([]);
                setFilteredJobs([]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // Initial load shows skeleton, subsequent filter updates don't (smoother UX)
        const isInitialLoad = allJobs.length === 0 && !debouncedSearch && !selectedLocation && !debouncedLocation;
        fetchJobs(false, isInitialLoad);
    }, [debouncedSearch, selectedLocation, debouncedLocation]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchJobs(true),
                refreshUser()
            ]);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    }, [debouncedSearch, selectedLocation, customLocation, refreshUser]);

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

    if (loading) return <DashboardSkeleton />;

    const handleSaveJob = async (jobId: string) => {
        try {
            if (savedJobsList.includes(jobId)) {
                // Remove from saved
                setSavedJobsList(prev => prev.filter(id => id !== jobId));
                showToast("Job removed from saved");
                // Call backend to unsave
                try {
                    await jobService.unsaveJob(jobId);
                } catch (error) {
                    console.error('Error removing saved job from backend:', error);
                }
            } else {
                // Add to saved
                setSavedJobsList(prev => [...prev, jobId]);
                showToast("Job saved successfully");
                // Call backend to save
                try {
                    await jobService.saveJob(jobId);
                } catch (error) {
                    console.error('Error saving job to backend:', error);
                    // Revert the local state if backend fails
                    setSavedJobsList(prev => prev.filter(id => id !== jobId));
                    showToast("Failed to save job");
                }
            }
        } catch (error) {
            console.error('Error handling save job:', error);
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

    const renderJobItem = ({ item }: { item: JobType }) => {
        const isExpanded = expandedJobId === item.id;

        return (
            <TouchableOpacity 
                style={styles.jobCard} 
                activeOpacity={0.9} 
                onPress={() => navigation.navigate('JobDetails', { job: item, isSaved: isJobSaved(item.id) })}
            >
                <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.jobImage} />
                    ) : (
                        <View style={[styles.jobImage, styles.placeholderImage]}>
                            <Ionicons name="image-outline" size={40} color="#9BA4B1" />
                        </View>
                    )}
                    
                    {/* Save Button Overlay */}
                    <TouchableOpacity 
                        style={styles.saveBadgeSmall} 
                        onPress={() => handleSaveJob(item.id)}
                        activeOpacity={0.8}
                    >
                        <Ionicons 
                            name={isJobSaved(item.id) ? "bookmark" : "bookmark-outline"} 
                            size={18} 
                            color={isJobSaved(item.id) ? "#1972ca" : "#FFFFFF"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <View style={styles.cardBody}>
                    <Text style={styles.jobTitleText} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.companySubText} numberOfLines={1}>{item.company}</Text>
                    
                    <View style={styles.cardDetailsRow}>
                        <View style={styles.cardDetailItem}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={styles.cardDetailText} numberOfLines={1}>{item.location}</Text>
                        </View>
                        <View style={styles.cardDetailItem}>
                            <Ionicons name="wallet-outline" size={14} color="#64748B" />
                            <Text style={styles.cardDetailText} numberOfLines={1}>{item.salary}</Text>
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.tagRow}>
                        {[item.type, item.category, ...(item.tags || [])].filter(Boolean).map((tag, idx) => (
                            <View key={idx} style={[styles.tag, idx === 0 ? styles.activeTag : null]}>
                                <Text style={[styles.tagText, idx === 0 ? styles.activeTagText : null]}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                        <View style={styles.mainApplyBtn}>
                            <Text style={styles.mainApplyBtnText}>View Details</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.dropdownBtn}
                            onPress={() => setExpandedJobId(isExpanded ? null : item.id)}
                        >
                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color="#1972ca" />
                        </TouchableOpacity>
                    </View>

                    {/* Dropdown Content */}
                    {isExpanded && (
                        <View style={styles.expandedContent}>
                            <TouchableOpacity 
                                style={styles.apprenticeOption}
                                onPress={() => {
                                    setApplyingJob(item);
                                    setDefaultAppType('apprentice');
                                    setShowApplyModal(true);
                                    setExpandedJobId(null);
                                }}
                            >
                                <Ionicons name="school-outline" size={18} color="#1972ca" />
                                <Text style={styles.apprenticeText}>Apply as Apprentice</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <View style={styles.squareLogo}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>WJ</Text>
                        </View>
                        <Text style={styles.greetingText}>Hello, {displayName.split(' ')[0]} !</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconButtonSquare} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications" size={20} color="#1972ca" />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatarMini} onPress={() => navigation.navigate('Profile')}>
                            {profile?.profile_image_url ? (
                                <Image source={{ uri: profile.profile_image_url }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarInner}>
                                    <Text style={styles.avatarCharMini}>{avatarInitials}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.searchContainer, { zIndex: 10 }]}>
                    <View style={styles.searchRow}>
                        <View style={styles.searchInputWrapperFull}>
                            <TextInput
                                style={styles.inputFull}
                                placeholder="Search"
                                placeholderTextColor="#9BA4B1"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Ionicons name="search-outline" size={20} color="#9BA4B1" style={styles.searchIconRight} />
                        </View>
                        <TouchableOpacity 
                            style={styles.filterBtnSquare} 
                            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <Ionicons name="filter" size={20} color="#1972ca" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Inline Filter Dropdown */}
                {showFilterDropdown && (
                    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.filterDropdown}>
                        <View style={styles.filterRow}>
                             <Text style={styles.filterDropdownTitle}>Filter by Location</Text>
                             <TouchableOpacity onPress={() => setShowFilterDropdown(false)}>
                                  <Ionicons name="close" size={20} color="#9BA4B1" />
                             </TouchableOpacity>
                        </View>

                        {/* Location preset chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                            <TouchableOpacity 
                                style={[styles.locationChip, (selectedLocation === '' && !customLocation) && styles.locationChipActive]}
                                onPress={() => { setSelectedLocation(''); setCustomLocation(''); }}
                            >
                                <Text style={[styles.locationChipText, (selectedLocation === '' && !customLocation) && styles.locationChipTextActive]}>All</Text>
                            </TouchableOpacity>
                            {BAMENDA_LOCATIONS.map(loc => (
                                <TouchableOpacity 
                                    key={loc} 
                                    style={[styles.locationChip, selectedLocation === loc && styles.locationChipActive]}
                                    onPress={() => { setSelectedLocation(loc); setCustomLocation(''); }}
                                >
                                    <Text style={[styles.locationChipText, selectedLocation === loc && styles.locationChipTextActive]}>{loc}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Custom Location Search Input */}
                        <View style={styles.customLocSearch}>
                            <Ionicons name="location-outline" size={18} color="#1972ca" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.customLocSearchInput}
                                placeholder="Type a specific neighborhood..."
                                value={customLocation}
                                onChangeText={(text) => {
                                    setCustomLocation(text);
                                    if (text) setSelectedLocation(''); // Clear preset if typing custom
                                }}
                                placeholderTextColor="#9BA4B1"
                            />
                            {customLocation.length > 0 && (
                                <TouchableOpacity onPress={() => setShowFilterDropdown(false)}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}
            </View>

            <Animated.FlatList
                data={filteredJobs}
                renderItem={renderJobItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1972ca']}
                        tintColor="#1972ca"
                        progressViewOffset={0}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.listHeaderInner}>
                        {!showFilterDropdown && (
                            <Animated.View style={animatedTipsStyle}>
                                {/* Tips Section */}
                                <View style={styles.tipsSection}>
                                    <View style={styles.tipsHeader}>
                                        <Text style={styles.tipsTitle}>Tips for you</Text>
                                        <TouchableOpacity onPress={() => {}}>
                                            <Text style={styles.seeAllText}>See all</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity style={styles.tipsCard} activeOpacity={0.9}>
                                        <View style={styles.tipsCardContent}>
                                            <Text style={styles.tipsCardTitle}>How to find a{"\n"}perfect job for you</Text>
                                            <View style={styles.readMoreBtn}>
                                                <Text style={styles.readMoreText}>Read more</Text>
                                            </View>
                                        </View>
                                        <View style={styles.tipsImageContainer}>
                                            <Image 
                                                source={{ uri: 'https://www.pngall.com/wp-content/uploads/2016/04/Black-Man-PNG-HD.png' }} 
                                                style={styles.tipsImage} 
                                            />
                                            <LinearGradient
                                                colors={['transparent', '#4C6FFF']}
                                                start={{ x: 0, y: 0.5 }}
                                                end={{ x: 1, y: 0.5 }}
                                                style={styles.tipsGradient}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}

                        {!showFilterDropdown && !searchQuery && (
                            <View style={styles.recommendedHeaderMini}>
                                <Text style={styles.recommendedTitleMini}>Recommended jobs for you</Text>
                            </View>
                        )}
                        <View style={{ height: 10 }} />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons 
                            name={"search-outline"} 
                            size={60} 
                            color="#CCC" 
                        />
                        <Text style={styles.emptyTitle}>
                            {"No jobs found"}
                        </Text>
                    </View>
                }
            />

            {user?.role === 'employer' && (user?.is_verified || user?.verification_status === 'approved') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleFabPress}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Toast Notification */}
            <Animated.View pointerEvents="none" style={[styles.toastContainer, toastStyle]}>
                <View style={styles.toastContent}>
                    <View style={styles.toastCheck}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </View>
            </Animated.View>

            {applyingJob && (
                <ApplyModal 
                    visible={showApplyModal}
                    onClose={() => setShowApplyModal(false)}
                    initialApplicationType={defaultAppType}
                    onApply={async (data) => {
                        try {
                            await jobService.applyToJob(applyingJob.id, data);
                            showToast("Application sent successfully!");
                        } catch (error: any) {
                            Alert.alert("Error", error || "Failed to apply.");
                        }
                    }}
                    jobTitle={applyingJob.title}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    safeArea: { backgroundColor: '#FFFFFF' },
    header: { paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    squareLogo: { width: 44, height: 44, backgroundColor: '#4C6FFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    greetingText: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconButtonSquare: { width: 44, height: 44, backgroundColor: '#F0F4FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    avatarMini: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#F3F4F6' },
    avatarCharMini: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    notifDot: { position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4D4F' },
    searchContainer: { marginTop: 15 },
    listHeaderInner: { paddingBottom: 10 },
    searchInputWrapperFull: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF', borderRadius: 20, paddingHorizontal: 20, height: 56, borderWidth: 1, borderColor: '#F0F4FF' },
    inputFull: { flex: 1, fontSize: 15, color: '#1F2937' },
    searchIconRight: { marginLeft: 10 },
    filterBtnSquare: { width: 56, height: 56, backgroundColor: '#F0F4FF', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    tipsSection: { marginTop: 25 },
    tipsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    tipsTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    seeAllText: { fontSize: 14, color: '#4C6FFF', fontWeight: '600' },
    tipsCard: { backgroundColor: '#4C6FFF', borderRadius: 24, height: 135, flexDirection: 'row', padding: 18, overflow: 'hidden', position: 'relative' },
    tipsCardContent: { flex: 1, justifyContent: 'center', zIndex: 1 },
    tipsCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', lineHeight: 22, marginBottom: 12 },
    readMoreBtn: { backgroundColor: '#FFB800', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
    readMoreText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    tipsImageContainer: { position: 'absolute', right: -10, bottom: -10, width: 160, height: 150 },
    tipsImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    tipsGradient: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 40 },
    recommendedHeaderMini: { marginTop: 25, marginBottom: 10, paddingHorizontal: 5 },
    recommendedTitleMini: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    logoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: '#1972ca' },
    pinkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E91E63', marginTop: 6, marginLeft: 2 },
    iconButton: { position: 'relative' },
    avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6' },
    avatarImage: { width: '100%', height: '100%' },
    avatarInner: { width: '100%', height: '100%', backgroundColor: '#1972ca', justifyContent: 'center', alignItems: 'center' },
    avatarChar: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 48 },
    input: { fontSize: 15, color: '#1F2937' },
    filterBtn: { width: 48, height: 48, backgroundColor: '#1972ca', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    filterBtnActive: { backgroundColor: '#E91E63' },
    filterDropdown: {
        backgroundColor: '#FFFFFF',
        marginTop: 15,
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    filterDropdownTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    locationScroll: {
        marginBottom: 5,
    },
    locationChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        marginRight: 10,
        height: 36,
    },
    locationChipActive: {
        backgroundColor: '#1972ca',
    },
    locationChipText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    locationChipTextActive: {
        color: '#FFFFFF',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customLocSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 52,
        marginTop: 10,
    },
    customLocSearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    headerWelcome: { marginTop: 10, marginBottom: 5 },
    welcomeSub: { fontSize: 14, color: '#1972ca', fontWeight: '600', marginBottom: 4 },
    welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    welcomeDesc: { fontSize: 13, color: '#6B7280' },
    welcomeHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    quickActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1972ca', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
    actionBtnOutline: { backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: '#1972ca' },
    actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
    actionBtnTextOutline: { color: '#1972ca' },
    jobCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    saveBadgeSmall: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
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
        padding: 16,
    },
    jobTitleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    companySubText: {
        fontSize: 14,
        color: '#9BA4B1',
        marginBottom: 10,
    },
    cardDetailsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 16,
    },
    cardDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    cardDetailText: {
        fontSize: 13,
        color: '#64748B',
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    tag: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    activeTag: {
        backgroundColor: '#EBF4FF',
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTagText: {
        color: '#1972ca',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    mainApplyBtn: {
        flex: 1,
        backgroundColor: '#1972ca',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainApplyBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    dropdownBtn: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    expandedContent: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    apprenticeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
    },
    apprenticeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1972ca',
    },
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
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyTitle: {
        fontSize: 16,
        color: '#9BA4B1',
        fontWeight: '600',
        marginTop: 15,
    },
});

export default DashboardScreen;