// src/screens/Saved/SavedScreen.tsx
import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import jobService from '../../services/jobService';
import { useAuth } from '../../context/AuthContext';

interface SavedJob {
    id: string;
    title?: string;
    position_vacant?: string;
    company?: string;
    location?: string;
    salary?: string;
    type?: string;
    job_type?: string;
    category?: string;
    description?: string;
    email?: string;
    phone?: string;
    imageUrl?: string;
    postedAt?: string;
    employerId?: string;
    created_at?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
    technology: { bg: '#EFF6FF', icon: '#1972ca' },
    design: { bg: '#FDF4FF', icon: '#9333EA' },
    finance: { bg: '#F0FDF4', icon: '#16A34A' },
    marketing: { bg: '#FFF7ED', icon: '#EA580C' },
    default: { bg: '#F1F5F9', icon: '#64748B' },
};

const getCategoryStyle = (category = '') => {
    return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.default;
};

const SavedScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { user, isAuthenticated } = useAuth();
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSaved = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const data = await jobService.getSavedJobs(user?.id);
            
            const mapped: SavedJob[] = (data || []).map((item: any) => {
                const job = item.job || item;
                return {
                    id: job.id || job._id || item.id || item._id,
                    title: job.title || job.position_vacant || 'Untitled Position',
                    position_vacant: job.position_vacant || job.title || 'Untitled Position',
                    company: job.users?.full_name || job.company || job.company_name || 'WakaJob Partner',
                    location: job.location || 'Remote',
                    salary: job.salary || job.payment_rate || '',
                    type: job.type || job.job_type || 'Full-time',
                    job_type: job.job_type || job.type || 'Full-time',
                    category: job.category || 'default',
                    description: job.description || '',
                    email: job.email || job.users?.email || '',
                    phone: job.phone || job.users?.profiles?.phone_number || '',
                    imageUrl: job.imageUrl || job.image_url || job.job_image,
                    postedAt: job.postedAt || job.created_at || item.created_at || '',
                    employerId: job.employerId || job.employer_id,
                    created_at: job.created_at || item.created_at || '',
                };
            });
            setSavedJobs(mapped);
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
            setSavedJobs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh whenever the tab comes into focus
    useFocusEffect(
        useCallback(() => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }
            fetchSaved();
        }, [isAuthenticated])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSaved(true);
    }, []);

    const handleRemove = (jobId: string) => {
        Alert.alert('Remove Job', 'Remove this job from saved?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
                    try {
                        await jobService.unsaveJob(jobId, user?.id);
                    } catch (error) {
                        console.error('Error unsaving job:', error);
                        fetchSaved();
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: SavedJob }) => {
        const title = item.title || item.position_vacant || 'Untitled Position';
        const jobType = item.type || item.job_type || 'Full-time';
        const { bg, icon } = getCategoryStyle(item.category);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {
                    navigation.navigate('JobDetails', {
                        job: {
                            id: item.id,
                            title,
                            company: item.company,
                            location: item.location,
                            salary: item.salary,
                            type: jobType,
                            category: item.category,
                            description: item.description,
                            email: item.email,
                            phone: item.phone,
                            imageUrl: item.imageUrl,
                            postedAt: item.postedAt,
                            employerId: item.employerId,
                        },
                        isSaved: true
                    });
                }}
            >
                <View style={styles.cardLeft}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
                    ) : (
                        <View style={[styles.iconBox, { backgroundColor: bg }]}>
                            <Ionicons
                                name={
                                    (item.category?.toLowerCase() ?? '') === 'technology'
                                        ? 'code-working'
                                        : 'briefcase'
                                }
                                size={22}
                                color={icon}
                            />
                        </View>
                    )}
                    <View style={styles.cardInfo}>
                        <Text style={styles.jobTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.company} numberOfLines={1}>
                            {item.company ?? 'WakaJob Partner'}
                        </Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="location-outline" size={12} color="#9BA4B1" />
                                <Text style={styles.metaText} numberOfLines={1}>
                                    {item.location ?? 'Remote'}
                                </Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={12} color="#9BA4B1" />
                                <Text style={styles.metaText}>{jobType}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemove(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="bookmark" size={22} color="#1972ca" />
                    </TouchableOpacity>
                    {item.salary ? (
                        <Text style={styles.salary}>{item.salary}</Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.unauthenticatedContainer}>
                <View style={styles.unauthenticatedContent}>
                    <View style={styles.unauthenticatedIconWrap}>
                        <Ionicons name="bookmark-outline" size={64} color="#1972ca" />
                    </View>
                    <Text style={styles.unauthenticatedTitle}>Saved Jobs</Text>
                    <Text style={styles.unauthenticatedDesc}>
                        Sign in to save jobs, keep track of opportunities, and view them later from any device.
                    </Text>
                    <TouchableOpacity
                        style={styles.authButtonPrimary}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.authButtonTextPrimary}>Create Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.authButtonSecondary}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.authButtonTextSecondary}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Saved Jobs</Text>
                <Text style={styles.headerSub}>
                    {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved
                </Text>
            </View>

            {loading ? (
                // Skeleton placeholders
                <View style={styles.skeletonWrap}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={styles.skeletonCard}>
                            <View style={styles.skeletonIcon} />
                            <View style={styles.skeletonLines}>
                                <View style={styles.skeletonLine1} />
                                <View style={styles.skeletonLine2} />
                                <View style={styles.skeletonLine3} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={savedJobs}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1972ca']}
                            tintColor="#1972ca"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="bookmark-outline" size={48} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>No saved jobs yet</Text>
                            <Text style={styles.emptyDesc}>
                                Tap the bookmark icon on any job to{'\n'}save it here for later.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    headerSub: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
    },
    cardLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#F1F5F9',
    },
    cardInfo: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    company: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        color: '#9BA4B1',
        fontWeight: '500',
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 8,
        marginLeft: 8,
    },
    removeBtn: {
        padding: 4,
    },
    salary: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1972ca',
        textAlign: 'right',
    },
    // Empty state
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
    },
    // Skeleton
    skeletonWrap: {
        padding: 20,
        gap: 12,
    },
    skeletonCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    skeletonIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        marginRight: 12,
    },
    skeletonLines: {
        flex: 1,
        gap: 8,
    },
    skeletonLine1: {
        height: 14,
        width: '70%',
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
    },
    skeletonLine2: {
        height: 11,
        width: '50%',
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
    },
    skeletonLine3: {
        height: 10,
        width: '40%',
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
    },
    unauthenticatedContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    unauthenticatedContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    unauthenticatedIconWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    unauthenticatedTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    unauthenticatedDesc: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    authButtonPrimary: {
        backgroundColor: '#1972ca',
        width: '100%',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    authButtonTextPrimary: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    authButtonSecondary: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    authButtonTextSecondary: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default SavedScreen;
