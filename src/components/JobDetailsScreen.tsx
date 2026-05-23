import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import jobService from '../services/jobService';
import authService from '../services/authService';
import ApplyModal from './ApplyModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const JobDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { job, isSaved: initialIsSaved } = route.params || {};

    const [isSaved, setIsSaved] = useState(initialIsSaved || false);
    const [isApplying, setIsApplying] = useState(false);
    const [parsedData, setParsedData] = useState<any>({
        description: '',
        contactMethod: '',
        perks: [],
        requirements: []
    });
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        if (job) {
            // Parse description and perks
            const descParts = job.description?.split('--- Additional Details ---') || [job.description];
            const cleanDesc = descParts[0]?.trim();
            
            let perks: string[] = [];
            let contactMethod = '';
            
            if (descParts.length > 1) {
                const details = descParts[1];
                const perksMatch = details.match(/Perks: (.*)/);
                if (perksMatch) {
                    perks = perksMatch[1].split(',').map(p => p.trim()).filter(p => p && p !== 'None');
                }
                const contactMatch = details.match(/Contact Method: (.*)/);
                if (contactMatch) {
                    contactMethod = contactMatch[1].split('\n')[0].trim();
                }
            }

            // Parse requirements
            const reqs = job.qualifications?.split(',').map((r: string) => r.trim()).filter((r: string) => r) || [];

            setParsedData({
                description: cleanDesc,
                contactMethod,
                perks,
                requirements: reqs
            });
        }
    }, [job]);

    if (!job) return null;

    const handleSave = async () => {
        try {
            setIsSaved(!isSaved);
            await jobService.saveJob(job.id);
        } catch (error) {
            setIsSaved(!isSaved);
            Alert.alert("Error", "Failed to update saved jobs.");
        }
    };

    const handleWhatsApp = () => {
        const phone = job.phone || '';
        const message = `Hello, I'm interested in the "${job.title}" job posted on WakaJob.`;
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert("Error", "WhatsApp is not installed on this device.");
            }
        });
    };

    const handleApply = async (data: { intro_text: string; application_type: 'professional' | 'apprentice' }) => {
        try {
            setIsApplying(true);
            await jobService.applyToJob(job.id, data);
            Alert.alert("Success", "Application sent successfully!");
        } catch (error: any) {
            Alert.alert("Error", error || "Failed to apply.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Image Header Section */}
                <View style={styles.imageHeader}>
                    <Image 
                        source={{ uri: job.imageUrl || job.image_url || 'https://via.placeholder.com/800x400' }} 
                        style={styles.headerImage} 
                    />
                    <View style={styles.imageOverlay} />
                    
                    {/* Header Controls */}
                    <View style={styles.headerControls}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} style={styles.iconCircle}>
                            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#FFD700" : "#FFF"} />
                        </TouchableOpacity>
                    </View>

                    {/* Job Info Overlay */}
                    <View style={styles.overlayContent}>
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: '#4ADE80' }]}>
                                <Text style={styles.badgeText}>{job.job_type?.toUpperCase() || job.type?.toUpperCase() || 'FULL-TIME'}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#A78BFA' }]}>
                                <Text style={styles.badgeText}>{job.category?.toUpperCase() || 'GENERAL'}</Text>
                            </View>
                        </View>
                        <Text style={styles.titleText}>{job.title}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="location" size={16} color="#FFF" opacity={0.8} />
                                <Text style={styles.metaText}>{job.location}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="wallet" size={16} color="#FFF" opacity={0.8} />
                                <Text style={styles.metaText}>{job.salary} / month</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.mainContent}>
                    {/* Job Description Card */}
                    <Text style={styles.sectionHeading}>Job Description</Text>
                    <View style={styles.descCard}>
                        <Text style={styles.descParagraph}>{parsedData.description}</Text>
                        
                        {/* Dynamic Description Bullets if any */}
                        {parsedData.requirements.slice(0, 3).map((req: string, idx: number) => (
                            <View key={idx} style={styles.bulletRow}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.bulletText}>{req}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Requirements Section */}
                    <Text style={styles.sectionHeading}>Requirements</Text>
                    <View style={styles.reqGrid}>
                        {parsedData.requirements.map((req: string, idx: number) => {
                            let icon = "school-outline";
                            let label = "Experience";
                            
                            if (req.toLowerCase().includes('year') || req.toLowerCase().includes('exp')) {
                                icon = "time-outline";
                                label = "Experience";
                            } else if (req.toLowerCase().includes('tool') || req.toLowerCase().includes('brush') || req.toLowerCase().includes('equipment')) {
                                icon = "construct-outline";
                                label = "Equipment";
                            } else if (req.toLowerCase().includes('ref') || req.toLowerCase().includes('vet')) {
                                icon = "shield-checkmark-outline";
                                label = "Vetting";
                            } else {
                                icon = "star-outline";
                                label = "Expertise";
                            }

                            return (
                                <View key={idx} style={styles.reqCard}>
                                    <View style={styles.reqIconWrapper}>
                                        <Ionicons name={icon as any} size={22} color="#1972ca" />
                                    </View>
                                    <View style={styles.reqTextWrapper}>
                                        <Text style={styles.reqLabel}>{label}</Text>
                                        <Text style={styles.reqValue} numberOfLines={2}>{req}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Perks Section */}
                    {parsedData.perks.length > 0 && (
                        <>
                            <Text style={styles.sectionHeading}>Perks</Text>
                            <View style={styles.perksCard}>
                                {parsedData.perks.map((perk: string, idx: number) => (
                                    <View key={idx} style={styles.perkItem}>
                                        <View style={styles.perkIconBg}>
                                            <Ionicons 
                                                name={perk === 'meals' ? 'restaurant' : perk === 'transport' ? 'bus' : 'umbrella'} 
                                                size={18} 
                                                color="#059669" 
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.perkTitle}>
                                                {perk === 'meals' ? 'Daily Meals' : perk === 'transport' ? 'Transport' : perk === 'housing' ? 'Housing' : perk.charAt(0).toUpperCase() + perk.slice(1)}
                                            </Text>
                                            <Text style={styles.perkSub}>{`Provided to all staff members during the project.`}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Application Requirements */}
                    <Text style={styles.sectionHeading}>Application Requirements</Text>
                    <View style={styles.appReqCard}>
                        <View style={styles.appReqRow}>
                            <Text style={styles.appReqLabel}>CV / Resume</Text>
                            <View style={[styles.statusBadge, { backgroundColor: job.requires_cv === 'true' || job.requires_cv === true ? '#059669' : '#94A3B8' }]}>
                                <Text style={styles.statusText}>{job.requires_cv === 'true' || job.requires_cv === true ? 'YES' : 'NO'}</Text>
                            </View>
                        </View>
                        <View style={[styles.appReqRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }]}>
                            <Text style={styles.appReqLabel}>Cover Letter</Text>
                            <View style={[styles.statusBadge, { backgroundColor: job.requires_cover_letter === 'true' || job.requires_cover_letter === true ? '#059669' : '#94A3B8' }]}>
                                <Text style={styles.statusText}>{job.requires_cover_letter === 'true' || job.requires_cover_letter === true ? 'YES' : 'NO'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
                    <View style={styles.btnTextWrapper}>
                        <Text style={styles.btnSubText}>Contact on</Text>
                        <Text style={styles.btnMainText}>WhatsApp</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.applyBtn, isApplying && { opacity: 0.7 }]} 
                    onPress={() => setShowApplyModal(true)}
                    disabled={isApplying}
                >
                    {isApplying ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.applyBtnText}>Apply Now</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ApplyModal 
                visible={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                onApply={handleApply}
                jobTitle={job.title}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    imageHeader: {
        height: 300,
        width: SCREEN_WIDTH,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    headerControls: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContent: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    titleText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    mainContent: {
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 15,
        marginTop: 10,
    },
    descCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    descParagraph: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 15,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    bulletText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    reqGrid: {
        gap: 12,
        marginBottom: 20,
    },
    reqCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
        gap: 15,
    },
    reqIconWrapper: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reqTextWrapper: {
        flex: 1,
    },
    reqLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
    },
    reqValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    perksCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 20,
        padding: 20,
        gap: 20,
        marginBottom: 20,
    },
    perkItem: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'flex-start',
    },
    perkIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    perkTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#065F46',
        marginBottom: 2,
    },
    perkSub: {
        fontSize: 12,
        color: '#059669',
        lineHeight: 18,
    },
    appReqCard: {
        backgroundColor: '#EEF2FF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
    },
    appReqRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    appReqLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3730A3',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '900',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 35,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    whatsappBtn: {
        flex: 1,
        backgroundColor: '#064E3B',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 60,
        borderRadius: 12,
        gap: 10,
    },
    btnTextWrapper: {
        flex: 1,
    },
    btnSubText: {
        fontSize: 11,
        color: '#FFF',
        opacity: 0.8,
    },
    btnMainText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '700',
    },
    applyBtn: {
        flex: 1,
        backgroundColor: '#03045E',
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default JobDetailsScreen;
