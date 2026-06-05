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
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const JobDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { job, isSaved: initialIsSaved } = route.params || {};

    const [isSaved, setIsSaved] = useState(initialIsSaved || false);
    const [isApplying, setIsApplying] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isJobPoster, setIsJobPoster] = useState(false);
    const [parsedData, setParsedData] = useState<any>({
        description: '',
        contactMethod: '',
        perks: [],
        requirements: []
    });
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        const getUserId = async () => {
            try {
                const user = await authService.getUser();
                if (user && user.id) {
                    setCurrentUserId(user.id);
                    // Check if current user is the job poster
                    if (job?.employer_id === user.id) {
                        setIsJobPoster(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        getUserId();
    }, [job?.employer_id]);

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
                    perks = perksMatch[1].split(',').map((p: string) => p.trim()).filter((p: string) => p && p !== 'None');
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

    const handleApplyPress = () => {
        if (user?.id === job.employer_id) {
            Alert.alert("Action Not Allowed", "You cannot apply for a job that you posted.");
            return;
        }
        setShowApplyModal(true);
    };

    const handleApply = async (data: { intro_text: string; application_type: 'professional' | 'apprentice' }) => {
        if (isJobPoster) {
            Alert.alert(
                "Cannot Apply",
                "You cannot apply for this job because you posted it. You are the job poster."
            );
            return;
        }
        
        try {
            setIsApplying(true);
            await jobService.applyToJob(job.id, data);
            setShowApplyModal(false);
            Alert.alert("Success", "Your application has been sent successfully!");
        } catch (error: any) {
            let errorMessage = typeof error === 'string' ? error : (error?.message || "Failed to apply.");
            
            // Format raw backend errors to be user-friendly
            if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already')) {
                errorMessage = "You have already submitted an application for this position.";
            } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
                errorMessage = "Please check your internet connection and try again.";
            } else if (errorMessage.includes('HTTP')) {
                errorMessage = "We couldn't process your application at this time. Please try again later.";
            }
            
            Alert.alert("Application Notice", errorMessage);
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
                            {(job.job_type || job.type) && (
                                <View style={[styles.badge, { backgroundColor: '#4ADE80' }]}>
                                    <Text style={styles.badgeText}>{job.job_type?.toUpperCase() || job.type?.toUpperCase()}</Text>
                                </View>
                            )}
                            {job.category && (
                                <View style={[styles.badge, { backgroundColor: '#A78BFA' }]}>
                                    <Text style={styles.badgeText}>{job.category?.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.titleText}>{job.title}</Text>
                        <View style={styles.metaRow}>
                            {job.location && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="location" size={16} color="#FFF" opacity={0.8} />
                                    <Text style={styles.metaText}>{job.location}</Text>
                                </View>
                            )}
                            {job.salary && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="wallet" size={16} color="#FFF" opacity={0.8} />
                                    <Text style={styles.metaText}>{job.salary}</Text>
                                </View>
                            )}
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
                    {(job.requires_cv === 'true' || job.requires_cv === true || job.requires_cover_letter === 'true' || job.requires_cover_letter === true) && (
                        <>
                            <Text style={styles.sectionHeading}>Application Requirements</Text>
                            <View style={styles.appReqCard}>
                                {(job.requires_cv === 'true' || job.requires_cv === true) && (
                                    <View style={styles.appReqRow}>
                                        <Text style={styles.appReqLabel}>CV / Resume</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: '#059669' }]}>
                                            <Text style={styles.statusText}>REQUIRED</Text>
                                        </View>
                                    </View>
                                )}
                                {(job.requires_cover_letter === 'true' || job.requires_cover_letter === true) && (
                                    <View style={[styles.appReqRow, { borderTopWidth: job.requires_cv === 'true' || job.requires_cv === true ? 1 : 0, borderTopColor: '#E2E8F0', paddingTop: (job.requires_cv === 'true' || job.requires_cv === true) ? 12 : 0 }]}>
                                        <Text style={styles.appReqLabel}>Cover Letter</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: '#059669' }]}>
                                            <Text style={styles.statusText}>REQUIRED</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                    {!(job.requires_cv === 'true' || job.requires_cv === true) && !(job.requires_cover_letter === 'true' || job.requires_cover_letter === true) && (
                        <>
                            <Text style={styles.sectionHeading}>Application Requirements</Text>
                            <View style={styles.appReqCard}>
                                <Text style={styles.appReqLabel}>No specific requirements for this job</Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.applyBtn, { flex: 1 }, isApplying && { opacity: 0.7 }, isJobPoster && { opacity: 0.5 }]} 
                    onPress={() => setShowApplyModal(true)}
                    disabled={isApplying || isJobPoster}
                >
                    {isJobPoster ? (
                        <Text style={styles.applyBtnText}>Cannot Apply - Your Job</Text>
                    ) : isApplying ? (
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
                jobTitle={job.title || job.position_vacant || 'Position'}
                requiresCv={job.requires_cv === 'true' || job.requires_cv === true}
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
    applyBtn: {
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
