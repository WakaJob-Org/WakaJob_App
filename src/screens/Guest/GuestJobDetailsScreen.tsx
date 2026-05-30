import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/types';

type GuestJobDetailsNav = StackNavigationProp<AuthStackParamList, 'GuestJobDetails'>;
type GuestJobDetailsRoute = RouteProp<AuthStackParamList, 'GuestJobDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const toBool = (val: any): boolean => val === true || val === 'true' || val === 1;

const GuestJobDetailsScreen: React.FC = () => {
    const navigation = useNavigation<GuestJobDetailsNav>();
    const route = useRoute<GuestJobDetailsRoute>();
    const { job } = route.params;
    const insets = useSafeAreaInsets();

    const goToSignup = () => navigation.navigate('Signup');

    const title = job.title || job.position_vacant || 'Untitled Position';
    const company = job.company || job.company_name || 'Company';
    const location = job.location || '';
    const salary = job.salary || '';
    const jobType = job.job_type || job.type || '';
    const description = job.description || '';
    const requiresCv = toBool(job.requires_cv);
    const requiresCoverLetter = toBool(job.requires_cover_letter);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Image Header */}
                <View style={styles.imageHeader}>
                    <Image
                        source={{ uri: job.imageUrl || job.image_url || 'https://via.placeholder.com/800x400/1972ca/ffffff?text=WakaJob' }}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(9,30,66,0.85)']}
                        style={styles.imageOverlay}
                    />

                    {/* Controls */}
                    <View style={[styles.headerControls, { top: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={goToSignup} style={styles.iconCircle}>
                            <Ionicons name="bookmark-outline" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Job Info on image */}
                    <View style={styles.overlayContent}>
                        <View style={styles.badgeRow}>
                            {jobType ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{jobType}</Text>
                                </View>
                            ) : null}
                        </View>
                        <Text style={styles.jobTitle}>{title}</Text>
                        <Text style={styles.companyName}>{company}</Text>
                        {location ? (
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.locationText}>{location}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* ── LOCKED BANNER ── */}
                <View style={styles.lockedBanner}>
                    <View style={styles.lockedBannerLeft}>
                        <View style={styles.lockIconWrap}>
                            <Ionicons name="lock-closed" size={22} color="#1972ca" />
                        </View>
                        <View>
                            <Text style={styles.lockedBannerTitle}>Sign in to Apply</Text>
                            <Text style={styles.lockedBannerSub}>Join WakaJob — it's free</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={goToSignup} style={styles.signUpBadge}>
                        <Text style={styles.signUpBadgeText}>Sign up</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        {salary ? (
                            <View style={styles.statCard}>
                                <Ionicons name="cash-outline" size={20} color="#1972ca" />
                                <Text style={styles.statLabel}>Salary</Text>
                                <Text style={styles.statValue}>{salary}</Text>
                            </View>
                        ) : null}
                        {jobType ? (
                            <View style={styles.statCard}>
                                <Ionicons name="time-outline" size={20} color="#1972ca" />
                                <Text style={styles.statLabel}>Job Type</Text>
                                <Text style={styles.statValue}>{jobType}</Text>
                            </View>
                        ) : null}
                        {location ? (
                            <View style={styles.statCard}>
                                <Ionicons name="location-outline" size={20} color="#1972ca" />
                                <Text style={styles.statLabel}>Location</Text>
                                <Text style={styles.statValue} numberOfLines={1}>{location}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Requirements tags */}
                    {(requiresCv || requiresCoverLetter) && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Requirements</Text>
                            <View style={styles.reqRow}>
                                {requiresCv && (
                                    <View style={styles.reqTag}>
                                        <Ionicons name="document-text-outline" size={14} color="#1972ca" />
                                        <Text style={styles.reqTagText}>CV / Resume</Text>
                                    </View>
                                )}
                                {requiresCoverLetter && (
                                    <View style={styles.reqTag}>
                                        <Ionicons name="mail-outline" size={14} color="#1972ca" />
                                        <Text style={styles.reqTagText}>Cover Letter</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Description */}
                    {description ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About This Role</Text>
                            <Text style={styles.descriptionText}>{description}</Text>
                        </View>
                    ) : null}

                    {/* Skills */}
                    {job.skills_required && job.skills_required.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Skills Required</Text>
                            <View style={styles.skillsWrap}>
                                {job.skills_required.map((skill: string, i: number) => (
                                    <View key={i} style={styles.skillPill}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Apply CTA — full-width, prominent */}
            <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 10 }]}>
                <TouchableOpacity style={styles.applyBtn} onPress={goToSignup} activeOpacity={0.88}>
                    <LinearGradient
                        colors={['#1972ca', '#0d4f8e']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.applyBtnGradient}
                    >
                        <Ionicons name="person-add-outline" size={22} color="#FFF" />
                        <View>
                            <Text style={styles.applyBtnTitle}>Create Account to Apply</Text>
                            <Text style={styles.applyBtnSub}>Free — takes 30 seconds</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.alreadyAccountBtn}>
                    <Text style={styles.alreadyAccountText}>Already have an account? <Text style={{ color: '#1972ca', fontWeight: '700' }}>Log In</Text></Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 160 },
    imageHeader: { height: 280, position: 'relative' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    headerControls: {
        position: 'absolute',
        left: 16, right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center', alignItems: 'center',
    },
    overlayContent: {
        position: 'absolute', bottom: 20, left: 20, right: 20,
    },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    badge: {
        backgroundColor: '#4ADE80', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 4,
    },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#064E3B' },
    jobTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    companyName: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    lockedBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#EFF6FF',
        marginHorizontal: 16, marginTop: 16,
        borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: '#BFDBFE',
    },
    lockedBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    lockIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center', alignItems: 'center',
    },
    lockedBannerTitle: { fontSize: 15, fontWeight: '700', color: '#1E3A5F' },
    lockedBannerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    signUpBadge: {
        backgroundColor: '#1972ca', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 7,
    },
    signUpBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    mainContent: { paddingHorizontal: 16, paddingTop: 20 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: {
        flex: 1, backgroundColor: '#FFF',
        borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
        borderWidth: 1, borderColor: '#E2E8F0',
        elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
    },
    statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
    statValue: { fontSize: 12, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    reqRow: { flexDirection: 'row', gap: 10 },
    reqTag: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#EFF6FF', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 7,
        borderWidth: 1, borderColor: '#BFDBFE',
    },
    reqTagText: { fontSize: 13, color: '#1972ca', fontWeight: '600' },
    descriptionText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillPill: {
        backgroundColor: '#F1F5F9', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 6,
    },
    skillText: { fontSize: 13, color: '#334155', fontWeight: '500' },
    stickyFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
        paddingHorizontal: 16, paddingTop: 12,
        elevation: 12, shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10,
    },
    applyBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
    applyBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        height: 60, paddingHorizontal: 20,
    },
    applyBtnTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
    applyBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    alreadyAccountBtn: { alignItems: 'center', paddingVertical: 4 },
    alreadyAccountText: { fontSize: 13, color: '#64748B' },
});

export default GuestJobDetailsScreen;
