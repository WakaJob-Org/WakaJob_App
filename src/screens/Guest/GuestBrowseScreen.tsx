import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Image,
    StatusBar,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import jobService, { Job } from '../../services/jobService';
import { AuthStackParamList } from '../../navigation/types';

type GuestBrowseNav = StackNavigationProp<AuthStackParamList, 'GuestBrowse'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
    technology: '#1972ca',
    design: '#9333EA',
    finance: '#16A34A',
    marketing: '#EA580C',
    construction: '#D97706',
    health: '#DC2626',
    default: '#64748B',
};

const getCategoryColor = (cat = '') =>
    CATEGORY_COLORS[cat.toLowerCase()] ?? CATEGORY_COLORS.default;

const GuestBrowseScreen: React.FC = () => {
    const navigation = useNavigation<GuestBrowseNav>();
    const insets = useSafeAreaInsets();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchJobs = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const data = await jobService.getJobs();
            setJobs(data || []);
        } catch (e) {
            console.error('Guest fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchJobs(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchJobs(true);
    }, []);

    const goToSignup = () => navigation.navigate('Signup');

    const renderJobCard = ({ item, index }: { item: Job; index: number }) => {
        const title = item.title || item.position_vacant || 'Untitled Position';
        const company = item.company || item.company_name || 'Company';
        const location = item.location || '';
        const salary = item.salary || '';
        const jobType = item.job_type || item.type || '';
        const color = getCategoryColor(item.category);

        return (
            <TouchableOpacity
                style={styles.jobCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GuestJobDetails', { job: item })}
            >
                {/* Top accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: color }]} />

                <View style={styles.cardBody}>
                    {/* Header row */}
                    <View style={styles.cardTopRow}>
                        <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}>
                            <Ionicons name="briefcase" size={22} color={color} />
                        </View>
                        <View style={styles.cardMeta}>
                            <Text style={styles.jobTitle} numberOfLines={1}>{title}</Text>
                            <Text style={styles.companyName} numberOfLines={1}>{company}</Text>
                        </View>
                        <Ionicons name="lock-closed-outline" size={18} color="#CBD5E1" />
                    </View>

                    {/* Tags row */}
                    <View style={styles.tagsRow}>
                        {location ? (
                            <View style={styles.tag}>
                                <Ionicons name="location-outline" size={12} color="#64748B" />
                                <Text style={styles.tagText}>{location}</Text>
                            </View>
                        ) : null}
                        {jobType ? (
                            <View style={[styles.tag, { backgroundColor: `${color}12` }]}>
                                <Text style={[styles.tagText, { color }]}>{jobType}</Text>
                            </View>
                        ) : null}
                        {salary ? (
                            <View style={[styles.tag, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="cash-outline" size={12} color="#16A34A" />
                                <Text style={[styles.tagText, { color: '#16A34A' }]}>{salary}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* CTA hint */}
                    <View style={styles.cardFooter}>
                        <Text style={styles.viewLabel}>Tap to view details</Text>
                        <Ionicons name="chevron-forward" size={16} color="#1972ca" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={['#1972ca', '#0d4f8e']}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>wakajob</Text>
                    <Text style={styles.headerSub}>Browse available jobs</Text>
                </View>
                <TouchableOpacity onPress={goToSignup} style={styles.loginBtn}>
                    <Text style={styles.loginBtnText}>Sign in</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* Guest Banner */}
            <TouchableOpacity style={styles.guestBanner} onPress={goToSignup} activeOpacity={0.85}>
                <Ionicons name="information-circle" size={18} color="#1972ca" />
                <Text style={styles.guestBannerText}>
                    Create a free account to apply, save jobs & more
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#1972ca" />
            </TouchableOpacity>

            {/* Jobs List */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#1972ca" />
                    <Text style={styles.loadingText}>Finding jobs for you...</Text>
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id}
                    renderItem={renderJobCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1972ca']} tintColor="#1972ca" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Ionicons name="briefcase-outline" size={64} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>No jobs yet</Text>
                            <Text style={styles.emptySub}>Check back soon for new listings</Text>
                        </View>
                    }
                />
            )}

            {/* Sticky bottom CTA */}
            <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                <LinearGradient
                    colors={['#1972ca', '#0d4f8e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.stickyBtn}
                >
                    <TouchableOpacity style={styles.stickyBtnInner} onPress={goToSignup} activeOpacity={0.85}>
                        <Ionicons name="person-add-outline" size={20} color="#FFF" />
                        <Text style={styles.stickyBtnText}>Create Free Account to Apply</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: { padding: 6, marginRight: 4 },
    headerCenter: { flex: 1 },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 1,
    },
    loginBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    loginBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    guestBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 4,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    guestBannerText: { flex: 1, fontSize: 13, color: '#1d4ed8', fontWeight: '500' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: '#64748B' },
    listContent: { padding: 16, paddingBottom: 120 },
    jobCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 14,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },
    cardAccent: { height: 4 },
    cardBody: { padding: 16 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    cardMeta: { flex: 1 },
    jobTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    companyName: { fontSize: 13, color: '#64748B' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F1F5F9', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    tagText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    cardFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10,
    },
    viewLabel: { fontSize: 13, color: '#1972ca', fontWeight: '600' },
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
    emptySub: { fontSize: 14, color: '#9CA3AF' },
    stickyFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
        paddingHorizontal: 16, paddingTop: 12,
        elevation: 10, shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08, shadowRadius: 10,
    },
    stickyBtn: { borderRadius: 16, overflow: 'hidden' },
    stickyBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 54, gap: 10,
    },
    stickyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default GuestBrowseScreen;
