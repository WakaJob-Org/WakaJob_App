import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Image,
    Alert,
    Linking,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Applicant {
    id: string;
    name: string;
    role: string;
    location: string;
    status?: string;
    photo?: string | null;
    avatar?: string | null;   // alias used by App.tsx mock data
    initials?: string;
    bio?: string;
    skills?: string[];
    isVerified?: boolean;
    isOnline?: boolean;
    phone?: string;
    email?: string;
    startDate?: string;
    jobDuration?: string;
    agreedRate?: string;
    experience?: { id: string; company: string; role: string; period: string; description: string }[];
    portfolio?: { id: string; image: string }[];
}

interface HireDetails {
    startDate: string;
    duration: string;
    rate: string;
}

interface ApplicantProfileScreenProps {
    applicant: Applicant | null;
    isVisible?: boolean;   // used when rendered as a plain screen by App.tsx
    visible?: boolean;     // used when rendered as Modal by ApplicationsScreen
    onBack?: () => void;
    onClose?: () => void;
    onMessage?: () => void;
    onCall?: () => void;
    onShortlist?: () => void;
    onHire?: (details: HireDetails) => void;
}

const AVATAR_COLORS: Record<string, string> = {
    SA: '#9CA3AF',
    CO: '#6B7280',
    KM: '#4B5563',
    EM: '#93C5FD',
};

const BIO_TABS = ['Bio', 'Experience', 'Portfolio'];

/* ─────────────────────────────
   Hire Professional Bottom Sheet
───────────────────────────────*/
const HireSheet = ({
    applicant,
    visible,
    onClose,
    onConfirm,
    startDate,
    duration,
    rate,
}: {
    applicant: Applicant;
    visible: boolean;
    onClose: () => void;
    onConfirm: (details: { startDate: string; duration: string; rate: string }) => void;
    startDate: string;
    duration: string;
    rate: string;
}) => {
    const photoUri = applicant.avatar ?? applicant.photo ?? null;
    const avatarColor = AVATAR_COLORS[applicant.initials ?? ''] ?? '#9CA3AF';

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={hireStyles.overlay}>
                <View style={hireStyles.sheet}>
                    {/* Handle */}
                    <View style={hireStyles.handle} />

                    {/* Title */}
                    <Text style={hireStyles.sheetTitle}>HIRE PROFESSIONAL</Text>

                    {/* Profile photo */}
                    <View style={hireStyles.avatarWrapper}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={hireStyles.avatar} />
                        ) : (
                            <View style={[hireStyles.avatar, { backgroundColor: avatarColor }]}>
                                <Text style={hireStyles.avatarInitials}>{applicant.initials ?? applicant.name.charAt(0)}</Text>
                            </View>
                        )}
                        <View style={hireStyles.onlineDot} />
                    </View>

                    <Text style={hireStyles.hiresName}>{applicant.name}</Text>
                    <Text style={hireStyles.hiresRole}>{applicant.role}</Text>

                    {/* Detail rows */}
                    <View style={hireStyles.detailCard}>
                        <View style={hireStyles.detailRow}>
                            <View style={hireStyles.detailLeft}>
                                <Ionicons name="calendar-outline" size={18} color="#1972ca" />
                                <Text style={hireStyles.detailLabel}>Proposed Start Date</Text>
                            </View>
                            <Text style={hireStyles.detailValue}>{startDate}</Text>
                        </View>
                        <View style={hireStyles.detailDivider} />

                        <View style={hireStyles.detailRow}>
                            <View style={hireStyles.detailLeft}>
                                <Ionicons name="time-outline" size={18} color="#1972ca" />
                                <Text style={hireStyles.detailLabel}>Job Duration</Text>
                            </View>
                            <Text style={hireStyles.detailValue}>{duration}</Text>
                        </View>
                        <View style={hireStyles.detailDivider} />

                        <View style={hireStyles.detailRow}>
                            <View style={hireStyles.detailLeft}>
                                <Ionicons name="wallet-outline" size={18} color="#1972ca" />
                                <Text style={hireStyles.detailLabel}>Agreed Rate</Text>
                            </View>
                            <View style={hireStyles.rateBlock}>
                                <Text style={hireStyles.rateValue}>{rate}</Text>
                                <Text style={hireStyles.rateSub}>TOTAL PROJECT FEE</Text>
                            </View>
                        </View>
                    </View>

                    {/* Confirm button */}
                    <TouchableOpacity style={hireStyles.confirmBtn} onPress={() => onConfirm({ startDate, duration, rate })} activeOpacity={0.86}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={hireStyles.confirmBtnText}>Confirm and Hire</Text>
                    </TouchableOpacity>

                    {/* Cancel button */}
                    <TouchableOpacity style={hireStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                        <Text style={hireStyles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    {/* Terms */}
                    <Text style={hireStyles.terms}>
                        By clicking Confirm and Hire, you agree to Wakajob's Terms of Service and authorize the escrow of the agreed rate.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

/* ─────────────────────────────
   Main Applicant Profile Screen
───────────────────────────────*/
const ApplicantProfileScreen: React.FC<ApplicantProfileScreenProps> = ({
    applicant,
    isVisible,
    visible,
    onBack,
    onClose,
    onMessage,
    onCall,
    onShortlist,
    onHire,
}) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('Bio');
    const [hireSheetVisible, setHireSheetVisible] = useState(false);

    // Support both prop naming conventions
    const isOpen = isVisible ?? visible ?? false;
    const handleClose = onBack ?? onClose ?? (() => {});

    if (!applicant) return null;
    if (!isOpen) return null;

    const photoUri = applicant.avatar ?? applicant.photo ?? null;
    const avatarColor = AVATAR_COLORS[applicant.initials ?? ''] ?? '#9CA3AF';
    const displayInitials = applicant.initials ?? applicant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const bio = applicant.bio ?? 'Dedicated and detail-oriented professional with extensive experience in their field. Specialized in delivering high-quality work on schedule and within budget.';
    const skills = applicant.skills ?? ['Professional', 'Experienced', 'Reliable', 'Skilled'];
    const hireDetails = {
        startDate: applicant.startDate ?? 'Oct 24, 2023',
        duration: applicant.jobDuration ?? '2 Weeks',
        rate: applicant.agreedRate ?? '₦150,000',
    };

    const handleCall = () => {
        if (onCall) { onCall(); return; }
        const phone = applicant.phone ?? '+234 800 000 0000';
        Linking.openURL(`tel:${phone}`);
    };

    const handleMessage = () => {
        if (onMessage) { onMessage(); return; }
        Alert.alert('Message', `Messaging ${applicant.name} is coming soon!`);
    };

    const handleShortlist = () => {
        if (onShortlist) { onShortlist(); return; }
        Alert.alert('Shortlisted', `${applicant.name} has been added to your shortlist.`);
    };

    const handleConfirmHire = (details: { startDate: string; duration: string; rate: string }) => {
        setHireSheetVisible(false);
        if (onHire) {
            onHire(details);
        } else {
            Alert.alert('Success!', `${applicant.name} has been hired. A confirmation has been sent.`);
        }
    };

    const renderBioTab = () => (
        <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Professional Summary</Text>
            <Text style={styles.bioText}>{bio}</Text>

            <Text style={styles.sectionHeading}>Key Skills</Text>
            <View style={styles.skillsRow}>
                {skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.sectionHeading}>Location</Text>
            <View style={styles.mapPlaceholder}>
                <View style={styles.mapGrid}>
                    <View style={[styles.mapLine, { top: '40%', width: '100%' }]} />
                    <View style={[styles.mapLine, { top: '60%', width: '100%' }]} />
                    <View style={[styles.mapLineV, { left: '30%', height: '100%' }]} />
                    <View style={[styles.mapLineV, { left: '60%', height: '100%' }]} />
                    <View style={styles.mapPinContainer}>
                        <Ionicons name="location" size={32} color="#1972ca" />
                        <View style={styles.mapPinDot} />
                    </View>
                </View>
            </View>
            <Text style={styles.locationSub}>Available for projects within 50km of {applicant.location}.</Text>
        </View>
    );

    const renderExperienceTab = () => {
        const expList = applicant.experience ?? [
            { id: '1', company: 'BuildRight Construction Ltd', role: 'Senior Professional', period: 'Jan 2018 – Present • 5 yrs', description: 'Led a team on large-scale commercial builds. Responsible for quality assurance.' },
            { id: '2', company: 'HomeStyle Interiors', role: 'Professional', period: 'Mar 2012 – Dec 2017 • 6 yrs', description: 'Specialized in bespoke work for high-end residential properties.' },
        ];
        return (
            <View style={styles.tabContent}>
                {expList.map((exp) => (
                    <View key={exp.id} style={styles.experienceItem}>
                        <View style={styles.expDot} />
                        <View style={styles.expDetails}>
                            <Text style={styles.expTitle}>{exp.role}</Text>
                            <Text style={styles.expCompany}>{exp.company}</Text>
                            <Text style={styles.expDate}>{exp.period}</Text>
                            <Text style={styles.expDesc}>{exp.description}</Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderPortfolioTab = () => {
        const portList = applicant.portfolio ?? [{ id: '1', image: '' }, { id: '2', image: '' }, { id: '3', image: '' }, { id: '4', image: '' }];
        return (
            <View style={styles.tabContent}>
                <View style={styles.portfolioGrid}>
                    {portList.map((item) => (
                        <View key={item.id} style={styles.portfolioCard}>
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.portfolioImg as any} />
                            ) : (
                                <View style={styles.portfolioImg}>
                                    <Ionicons name="image-outline" size={32} color="#93C5FD" />
                                </View>
                            )}
                            <Text style={styles.portfolioLabel}>Project {item.id}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Modal visible={isOpen} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                {/* ── Header ── */}
                <View style={[styles.header, { paddingTop: insets.top > 0 ? 6 : 16 }]}>
                    <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={22} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Applicant Profile</Text>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="ellipsis-vertical" size={22} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* ── Avatar ── */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
                            ) : (
                                <View style={[styles.profilePhoto, styles.avatarFallback, { backgroundColor: avatarColor }]}>
                                    <Text style={styles.avatarBigInitials}>{displayInitials}</Text>
                                </View>
                            )}
                            <View style={styles.onlineBadge} />
                        </View>

                        <Text style={styles.profileName}>{applicant.name}</Text>
                        <Text style={styles.profileRole}>{applicant.role}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.profileLocation}>{applicant.location}</Text>
                        </View>
                    </View>

                    {/* ── Action Buttons ── */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} activeOpacity={0.8}>
                            <Ionicons name="chatbubble-outline" size={16} color="#1972ca" />
                            <Text style={styles.messageBtnText}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
                            <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.callBtnText}>Call</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Verified Badge ── */}
                    {(applicant.isVerified !== false) && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                            <Text style={styles.verifiedText}>VERIFIED PROFESSIONAL</Text>
                        </View>
                    )}

                    {/* ── Tab Bar ── */}
                    <View style={styles.tabBar}>
                        {BIO_TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Tab Content ── */}
                    {activeTab === 'Bio' && renderBioTab()}
                    {activeTab === 'Experience' && renderExperienceTab()}
                    {activeTab === 'Portfolio' && renderPortfolioTab()}
                </ScrollView>

                {/* ── Bottom Actions ── */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
                    <TouchableOpacity style={styles.shortlistBtn} activeOpacity={0.8} onPress={handleShortlist}>
                        <Text style={styles.shortlistBtnText}>Shortlist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hireBtn} activeOpacity={0.85} onPress={() => setHireSheetVisible(true)}>
                        <Text style={styles.hireBtnText}>Hire Now</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* ── Hire Sheet ── */}
            <HireSheet
                applicant={applicant}
                visible={hireSheetVisible}
                onClose={() => setHireSheetVisible(false)}
                onConfirm={handleConfirmHire}
                startDate={hireDetails.startDate}
                duration={hireDetails.duration}
                rate={hireDetails.rate}
            />
        </Modal>
    );
};

/* ── Hire Sheet Styles ── */
const hireStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 30,
        alignItems: 'center',
    },
    handle: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#D1D5DB',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1972ca',
        letterSpacing: 1.5,
        marginBottom: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 14,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    hiresName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    hiresRole: {
        fontSize: 14,
        color: '#1972ca',
        marginBottom: 24,
    },
    detailCard: {
        width: '100%',
        backgroundColor: '#F8FAFD',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 6,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: '#374151',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    rateBlock: {
        alignItems: 'flex-end',
    },
    rateValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    rateSub: {
        fontSize: 9,
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginTop: 1,
    },
    confirmBtn: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: '#1972ca',
        borderRadius: 16,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelBtn: {
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        marginBottom: 14,
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    terms: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 10,
    },
});

/* ── Main Screen Styles ── */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    headerBtn: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    scroll: {
        paddingBottom: 100,
    },

    // Avatar section
    avatarSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 14,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBigInitials: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '700',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#22C55E',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 15,
        color: '#1972ca',
        fontWeight: '600',
        marginBottom: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    profileLocation: {
        fontSize: 13,
        color: '#9CA3AF',
    },

    // Action buttons
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 30,
        marginBottom: 16,
    },
    messageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 46,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1972ca',
        backgroundColor: '#F0F7FF',
    },
    messageBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1972ca',
    },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#1972ca',
    },
    callBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Verified badge
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        alignSelf: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    verifiedText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#16A34A',
        letterSpacing: 1,
    },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {
        borderBottomColor: '#1972ca',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#9CA3AF',
    },
    activeTabText: {
        color: '#1972ca',
        fontWeight: '700',
    },

    // Tab content
    tabContent: {
        paddingHorizontal: 20,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 10,
        marginTop: 4,
    },
    bioText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 22,
    },

    // Skills
    skillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    skillChip: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        backgroundColor: '#FFFFFF',
    },
    skillChipText: {
        fontSize: 13,
        color: '#374151',
    },

    // Map
    mapPlaceholder: {
        height: 160,
        borderRadius: 14,
        backgroundColor: '#E8F4D9',
        overflow: 'hidden',
        marginBottom: 8,
    },
    mapGrid: {
        flex: 1,
        position: 'relative',
    },
    mapLine: {
        position: 'absolute',
        height: 1.5,
        backgroundColor: '#FFFFFF',
        opacity: 0.6,
    },
    mapLineV: {
        position: 'absolute',
        width: 1.5,
        backgroundColor: '#FFFFFF',
        opacity: 0.6,
    },
    mapPinContainer: {
        position: 'absolute',
        top: '30%',
        left: '45%',
        alignItems: 'center',
    },
    mapPinDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1972ca',
        marginTop: -4,
    },
    locationSub: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 20,
    },

    // Experience tab
    experienceItem: {
        flexDirection: 'row',
        marginBottom: 22,
    },
    expDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1972ca',
        marginTop: 4,
        marginRight: 14,
    },
    expDetails: {
        flex: 1,
    },
    expTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    expCompany: {
        fontSize: 13,
        color: '#1972ca',
        marginBottom: 2,
    },
    expDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 6,
    },
    expDesc: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20,
    },

    // Portfolio tab
    portfolioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    portfolioCard: {
        width: '47%',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    portfolioImg: {
        height: 110,
        backgroundColor: '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portfolioLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        padding: 10,
        backgroundColor: '#FFFFFF',
    },

    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    shortlistBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shortlistBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1972ca',
    },
    hireBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    hireBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default ApplicantProfileScreen;
