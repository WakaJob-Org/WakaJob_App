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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import jobService, { Job } from '../../services/jobService';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { AppStackParamList, MainTabParamList } from '../../navigation/types';

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
    localImage?: keyof typeof JOB_IMAGES;
    tags?: string[];
    hasApprentice?: boolean;
    requirements?: string[];
}

const JOB_IMAGES = {
    carpentry: require('../../../assets/images/jobs/carpentry.png'),
    welding: require('../../../assets/images/jobs/welding.png'),
    masonry: require('../../../assets/images/jobs/masonry.png'),
    tailoring: require('../../../assets/images/jobs/tailoring.png'),
    mechanic: require('../../../assets/images/jobs/mechanic.png'),
    salon: require('../../../assets/images/jobs/salon.png'),
    farming: require('../../../assets/images/jobs/farming.png'),
};

const MOCK_JOBS: JobType[] = [
    {
        id: 'mock-1',
        title: 'Senior Hair Stylist',
        company: 'Glamour Beauty Salon',
        location: 'Akwa, Douala',
        salary: '15,000 - 30,000 FCFA',
        type: 'Full-time',
        description: "Professional braiding, weaving, and modern hair treatments in a high-end environment.",
        category: 'Salon',
        email: 'glamour@wakajob.com',
        phone: '+237 600 000 777',
        postedAt: new Date().toISOString(),
        localImage: 'salon',
        tags: ['Full-time', 'Commission', 'Premium'],
        hasApprentice: true,
    },
    {
        id: 'mock-2',
        title: 'Modern Farm Manager',
        company: 'Green Fields Agri',
        location: 'Santa, NW Region',
        salary: '45,000 - 80,000 FCFA',
        type: 'Permanent',
        description: "Overseeing sustainable crop production and managing a team of community farmers.",
        category: 'Farming',
        email: 'green@wakajob.com',
        phone: '+237 600 000 888',
        postedAt: new Date().toISOString(),
        localImage: 'farming',
        tags: ['Management', 'Outdoor', 'Housing provided'],
        hasApprentice: false,
    },
    {
        id: 'mock-3',
        title: 'Custom Furniture Maker',
        company: 'Nkwen Craft Studio',
        location: 'mile 6 nkwen, Bamenda',
        salary: '25,000 - 45,000 FCFA',
        type: 'Full-time',
        description: "Expert furniture making and custom carpentry for residential projects.",
        category: 'Carpentry',
        email: 'carpentry@wakajob.com',
        phone: '+237 600 000 001',
        postedAt: new Date().toISOString(),
        localImage: 'carpentry',
        tags: ['Full-time', 'Mon-fri', 'work-in'],
        hasApprentice: true,
    },
    {
        id: 'mock-4',
        title: 'Metal Gate Specialist',
        company: 'Elite Iron Works',
        location: 'Bamenda Central',
        salary: '30,000 - 55,000 FCFA',
        type: 'Contract',
        description: "Specialized in gate construction and decorative structural steel.",
        category: 'Welding',
        email: 'welding@wakajob.com',
        phone: '+237 600 000 002',
        postedAt: new Date().toISOString(),
        localImage: 'welding',
        tags: ['Expert', 'Safety-first', 'Insured'],
        hasApprentice: true,
    },
    {
        id: 'mock-5',
        title: 'Fashion Tailor',
        company: 'Threads of Bamenda',
        location: 'Commercial Avenue',
        salary: '20,000 - 35,000 FCFA',
        type: 'Full-time',
        description: "Creating premium traditional and modern attire with a focus on finish.",
        category: 'Tailoring',
        email: 'fashion@wakajob.com',
        phone: '+237 600 000 004',
        postedAt: new Date().toISOString(),
        localImage: 'tailoring',
        tags: ['Creative', 'Indoor', 'Apprentice ok'],
        hasApprentice: true,
    },
    {
        id: 'mock-6',
        title: 'Expert Mechanic',
        company: 'Metro Auto Care',
        location: 'Bonaberi, Douala',
        salary: '35,000 - 60,000 FCFA',
        type: 'Full-time',
        description: "Engine diagnostics and general mechanical repairs for luxury cars.",
        category: 'Mechanics',
        email: 'garage@wakajob.com',
        phone: '+237 600 000 005',
        postedAt: new Date().toISOString(),
        localImage: 'mechanic',
        tags: ['Full-time', 'Morning', 'Tools provided'],
        hasApprentice: true,
    },
    {
        id: 'mock-7',
        title: 'Construction Mason',
        company: 'Royal Construction',
        location: 'Bastos, Yaoundé',
        salary: '40,000 - 75,000 FCFA',
        type: 'Full-time',
        description: "High-end bricklaying and architectural concrete work.",
        category: 'Construction',
        email: 'build@wakajob.com',
        phone: '+237 600 000 111',
        postedAt: new Date().toISOString(),
        localImage: 'masonry',
        tags: ['Skilled', 'Hard-work', 'Health-plan'],
        hasApprentice: false,
    },
    {
        id: 'mock-8',
        title: 'Bridal Gown Specialist',
        company: 'Victoria Fashion',
        location: 'Molyko, Buea',
        salary: '30,000 - 50,000 FCFA',
        type: 'Full-time',
        description: "High-end bridal and formal wear design and production.",
        category: 'Tailoring',
        email: 'victoria@wakajob.com',
        phone: '+237 600 000 222',
        postedAt: new Date().toISOString(),
        localImage: 'tailoring',
        tags: ['Premium', 'High-end', 'Details'],
        hasApprentice: true,
    }
];

import DashboardSkeleton from '../../components/DashboardSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigation = useNavigation<DashboardNavigationProp>();
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
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [customLocation, setCustomLocation] = useState('');
    
    // Debounced search query (500ms delay)
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

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

    const fetchJobs = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            
            // Prepare Query Params
            const apiParams: any = {};
            if (debouncedSearch.trim()) apiParams.search = debouncedSearch;
            
            const locationToUse = selectedLocation === 'Custom' ? customLocation : selectedLocation;
            if (locationToUse.trim()) apiParams.location = locationToUse;

            const fetchedJobs = await jobService.getJobs(apiParams);

            const mappedJobs: JobType[] = fetchedJobs.map(job => {
                const category = (job.category || '').toLowerCase();
                const title = job.position_vacant || job.category || 'Professional Trade';
                
                let localImage: keyof typeof JOB_IMAGES | undefined;

                if (category.includes('carpent')) localImage = 'carpentry';
                else if (category.includes('weld')) localImage = 'welding';
                else if (category.includes('mason') || category.includes('construct')) localImage = 'masonry';
                else if (category.includes('fashion') || category.includes('tailor')) localImage = 'tailoring';
                else if (category.includes('mechanic')) localImage = 'mechanic';
                else if (category.includes('salon') || category.includes('hair') || category.includes('beauty')) localImage = 'salon';
                else if (category.includes('farm') || category.includes('agri')) localImage = 'farming';
                else {
                    // Custom hash for string id to ensure stable variety even for unknown categories
                    const fallbacks: (keyof typeof JOB_IMAGES)[] = ['carpentry', 'welding', 'masonry', 'tailoring', 'mechanic', 'salon', 'farming'];
                    const hash = job.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    localImage = fallbacks[hash % fallbacks.length];
                }

                return {
                    id: job.id,
                    title: title,
                    company: `${job.category || 'General'} Services Ltd`,
                    location: job.location || 'Cameroon',
                    salary: job.salary || 'Competitive',
                    type: job.job_type || 'Full-time',
                    description: job.description,
                    category: job.category,
                    email: 'support@wakajob.com',
                    phone: 'N/A',
                    postedAt: job.created_at,
                    localImage: localImage,
                    requirements: job.qualifications ? job.qualifications.split(',') : []
                };
            });

            const finalJobs = mappedJobs.length > 0 ? [...mappedJobs, ...MOCK_JOBS] : MOCK_JOBS;
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
    }, [debouncedSearch, selectedLocation, customLocation]);

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

    const renderJobItem = ({ item }: { item: JobType }) => {
        const isExpanded = expandedJobId === item.id;

        return (
            <View style={styles.jobCard}>
                <View style={styles.imageContainer}>
                    {item.localImage ? (
                        <Image source={JOB_IMAGES[item.localImage]} style={styles.jobImage} />
                    ) : item.imageUrl ? (
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
                    <Text style={styles.locationText} numberOfLines={1}>Location: {item.location}</Text>

                    {/* Tags */}
                    <View style={styles.tagRow}>
                        {(item.tags || [item.type, 'Mon-fri', 'work-in']).map((tag, idx) => (
                            <View key={idx} style={[styles.tag, idx === 0 ? styles.activeTag : null]}>
                                <Text style={[styles.tagText, idx === 0 ? styles.activeTagText : null]}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.mainApplyBtn} onPress={() => handleJobPress(item)}>
                            <Text style={styles.mainApplyBtnText}>Apply Now</Text>
                        </TouchableOpacity>
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
                                    Alert.alert("Apprenticeship", "You are applying as an apprentice for this position.");
                                    setExpandedJobId(null);
                                }}
                            >
                                <Ionicons name="school-outline" size={18} color="#1972ca" />
                                <Text style={styles.apprenticeText}>Apply as Apprentice</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.logoRow}>
                        <Text style={styles.logoText}>WakaJob</Text>
                        <View style={styles.pinkDot} />
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications-outline" size={24} color="#1972ca" />
                            <View style={styles.notifDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
                            {profile?.profile_image_url ? (
                                <Image source={{ uri: profile.profile_image_url }} style={styles.avatarImage} />
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
                    <View style={styles.welcomeHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.welcomeTitle}>Available Jobs</Text>
                            <Text style={styles.welcomeDesc}>Based on your location and preferences</Text>
                        </View>
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateJob')}>
                                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.actionBtnText}>Post Job</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => navigation.navigate('Applications')}>
                                <Ionicons name="people" size={20} color="#1972ca" />
                                <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>Apps</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
                    <TouchableOpacity 
                        style={[styles.filterBtn, (selectedLocation || customLocation) ? styles.filterBtnActive : null]} 
                        onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                        <Ionicons name="options-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
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

            <Modal visible={!!showDetails} animationType="slide" transparent={true}>
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

            {/* Floating Action Button for Employers */}
            {user?.role === 'employer' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateJob')}
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
        marginBottom: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#9BA4B1',
        marginBottom: 16,
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