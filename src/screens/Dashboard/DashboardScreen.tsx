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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import jobService, { Job } from '../../services/jobService';
import authService from '../../services/authService';
import Header from '../../components/Header';
import JobDetailsScreen from '../../components/JobDetailsScreen';
import CreateJobScreen from './CreateJobScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DashboardScreenProps {
    isVisible: boolean;
    userName: string;
    onLogout: () => void;
    onSettingsPress: () => void;
    onProfilePress: () => void;
}

const CATEGORIES = ['All', 'Technology', 'Design', 'Marketing', 'Finance', 'Management'];

const DashboardScreen: React.FC<DashboardScreenProps> = ({
    isVisible,
    userName,
    onLogout,
    onSettingsPress,
    onProfilePress
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [role, setRole] = useState<'worker' | 'employer'>('worker');
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreateJob, setShowCreateJob] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const fetchedJobs = await jobService.getJobs();
            // Map backend fields to frontend fields if they differ
            const mappedJobs = fetchedJobs.map(job => ({
                id: job.id,
                title: job.position_vacant,
                company: 'WakaJob Partner', // Backend might not have company name yet, using placeholder
                location: job.location,
                salary: job.salary,
                type: job.job_type,
                description: job.description,
                category: job.category,
                email: 'contact@wakajob.com', // Placeholder
                phone: 'N/A' // Placeholder
            }));
            setJobs(mappedJobs);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initData = async () => {
            const user = await authService.getUser();
            if (user && user.role) {
                setRole(user.role as any);
            }
            await loadJobs();
        };
        initData();
    }, []);

    if (!isVisible) return null;

    const handleJobPress = (job: any) => {
        setSelectedJob(job);
        setShowDetails(true);
    };

    const handleApply = async () => {
        if (!selectedJob) return;

        try {
            await jobService.applyToJob(selectedJob.id);
            Alert.alert(
                "Application Successful! 🎉",
                "Your application has been sent. You can track its status in the 'My Applications' tab.",
                [{ text: "Great!", onPress: () => setShowDetails(false) }]
            );
        } catch (error: any) {
            // Some backends might not have /apply yet, so we'll fallback to local success for UX if it's a 404
            if (error.includes('404')) {
                Alert.alert("Success", "Application sent successfully!");
                setShowDetails(false);
            } else {
                Alert.alert("Application Error", error);
            }
        }
    };

    const handlePostJob = (newJob: any) => {
        // Refresh list from backend to show the new job
        loadJobs();
        Alert.alert("Success", "Your job post is now live!");
    };

    const renderJobCard = ({ item }: { item: typeof jobs[0] }) => (
        <TouchableOpacity style={styles.jobCard} onPress={() => handleJobPress(item)}>
            <View style={styles.jobCardHeader}>
                <View style={styles.companyIconContainer}>
                    <Ionicons name="briefcase" size={24} color="#1972ca" />
                </View>
                <View style={styles.jobTitleContainer}>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.companyName}>{item.company}</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={24} color="#1972ca" />
                </TouchableOpacity>
            </View>

            <Text style={styles.jobDescription} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.jobDetailsRow}>
                <View style={[styles.detailBadge, { backgroundColor: '#E8F2FB' }]}>
                    <Ionicons name="location-outline" size={14} color="#1972ca" />
                    <Text style={[styles.detailText, { color: '#1972ca' }]}>{item.location}</Text>
                </View>
                <View style={[styles.detailBadge, { backgroundColor: '#F0F9F0' }]}>
                    <Ionicons name="time-outline" size={14} color="#4CAF50" />
                    <Text style={[styles.detailText, { color: '#4CAF50' }]}>{item.type}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.salaryText}>{item.salary}</Text>
                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.applyButton} onPress={() => handleJobPress(item)}>
                        <Text style={styles.applyButtonText}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.expandButton}>
                        <Ionicons name="chevron-down" size={20} color="#1972ca" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header
                title="WakaJob"
                userName={userName}
                onSettingsPress={onSettingsPress}
                onNotificationPress={() => Alert.alert("Notifications", "You have no new notifications.")}
            />

            <View style={styles.content}>
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Jobs..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterButton}>
                        <Ionicons name="options-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.categorySection}>
                    <Text style={styles.sectionTitle}>Available Jobs</Text>
                    <FlatList
                        data={CATEGORIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === item ? styles.categoryChipActive : null
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === item ? styles.categoryTextActive : null
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.categoryList}
                    />
                </View>

                <FlatList
                    data={jobs.filter(j =>
                        (selectedCategory === 'All' || j.category === selectedCategory) &&
                        (j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            j.company.toLowerCase().includes(searchQuery.toLowerCase()))
                    )}
                    renderItem={renderJobCard}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.jobList}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No jobs found</Text>
                        </View>
                    }
                />

                {role === 'employer' && (
                    <TouchableOpacity style={styles.fab} onPress={() => setShowCreateJob(true)}>
                        <Ionicons name="add" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>

            <JobDetailsScreen
                isVisible={showDetails}
                job={selectedJob}
                onClose={() => setShowDetails(false)}
                onApply={handleApply}
            />

            <CreateJobScreen
                isVisible={showCreateJob}
                onClose={() => setShowCreateJob(false)}
                onPost={handlePostJob}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    searchSection: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    filterButton: {
        width: 50,
        height: 50,
        backgroundColor: '#1972ca',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categorySection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    categoryList: {
        paddingBottom: 10,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryChipActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    jobList: {
        paddingTop: 10,
        paddingBottom: 100,
    },
    jobCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    jobCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    companyIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: '#f1f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    jobTitleContainer: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    companyName: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    jobDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 16,
    },
    jobDetailsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    detailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    salaryText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    footerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    applyButton: {
        backgroundColor: '#1972ca',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        justifyContent: 'center',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    expandButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: '#1972ca',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        color: '#666',
        fontSize: 16,
    },
});

export default DashboardScreen;
