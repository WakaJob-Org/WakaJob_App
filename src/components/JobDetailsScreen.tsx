import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Dimensions,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import jobService from '../services/jobService';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import ApplyModal from './ApplyModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const JobDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { user, isAuthenticated } = useAuth();
    const { job, isSaved: initialIsSaved } = route.params || {};

    const [isSaved, setIsSaved] = useState(initialIsSaved || false);
    const [isApplying, setIsApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isJobPoster, setIsJobPoster] = useState(false);
    const [parsedData, setParsedData] = useState<{
        description: string;
        contactMethod: string;
        perks: string[];
        requirements: string[];
    }>({ description: '', contactMethod: '', perks: [], requirements: [] });

    // Auto open apply modal if redirected back after auth creation
    useEffect(() => {
        if (route.params?.autoOpenApply && isAuthenticated) {
            // Clear parameter so it doesn't pop up again
            navigation.setParams({ autoOpenApply: undefined });
            setShowApplyModal(true);
        }
    }, [route.params?.autoOpenApply, isAuthenticated]);

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
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please sign up or log in to save jobs.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign Up", onPress: () => navigation.navigate('Signup', { redirectJob: job }) },
                    { text: "Log In", onPress: () => navigation.navigate('Login', { redirectJob: job }) }
                ]
            );
            return;
        }
        try {
            setIsSaved(!isSaved); // Optimistic UI
            await jobService.saveJob(job.id);
        } catch (error) {
            setIsSaved(!isSaved);
            Alert.alert("Error", "Failed to update saved jobs.");
        }
    };

    const handleApplyPress = () => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please sign up or log in to apply for jobs.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Sign Up", 
                        onPress: () => navigation.navigate('Signup', { redirectJob: job }) 
                    },
                    { 
                        text: "Log In", 
                        onPress: () => navigation.navigate('Login', { redirectJob: job }) 
                    }
                ]
            );
            return;
        }
        if (user?.id === job.employer_id) {
            Alert.alert("Action Not Allowed", "You cannot apply for a job that you posted.");
            return;
        }
        setShowApplyModal(true);
    };

    const handleApply = async (data: { application_type: 'professional' | 'apprentice' }) => {
        try {
            setIsApplying(true);
            await jobService.applyToJob(job.id, data);
            Alert.alert("Success", "Application sent successfully!");
        } catch (error: any) {
            Alert.alert("Error", error || "Failed to apply for the job.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <View style={styles.container}>
                <StatusBar style="light" />
                <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Job Details</Text>
                    <TouchableOpacity style={styles.bookmarkButton} onPress={handleSave}>
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={22}
                            color={isSaved ? "#FBBF24" : "#FFFFFF"}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {(job.imageUrl || job.image_url) ? (
                        <View style={styles.bannerContainer}>
                            <Image
                                source={{ uri: job.imageUrl || job.image_url }}
                                style={styles.bannerImage}
                            />
                            <View style={styles.bannerOverlay} />
                            <View style={styles.bannerInfoContainer}>
                                <Text style={styles.bannerTitleText}>{job.title}</Text>
                                <Text style={styles.bannerCompanyText}>{job.company}</Text>
                                <View style={styles.bannerTagsContainer}>
                                    <View style={[styles.tag, styles.bannerTagOrange]}>
                                        <Text style={styles.bannerTagText}>{job.type}</Text>
                                    </View>
                                    <View style={[styles.tag, styles.bannerTagGreen]}>
                                        <Text style={styles.bannerTagText}>{job.category}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {!(job.imageUrl || job.image_url) && (
                        <View style={styles.companySection}>
                            <View style={styles.logoContainer}>
                                <Ionicons name="briefcase" size={40} color="#1972ca" />
                            </View>
                            <Text style={styles.jobTitleText}>{job.title}</Text>
                            <Text style={styles.companyNameText}>{job.company}</Text>

                            <View style={styles.tagsContainer}>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{job.type}</Text>
                                </View>
                                <View style={[styles.tag, { backgroundColor: '#E8F2FB' }]}>
                                    <Text style={[styles.tagText, { color: '#1972ca' }]}>{job.category}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={20} color="#666" />
                            <View>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue}>{job.location}</Text>
                            </View>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="wallet-outline" size={20} color="#666" />
                            <View>
                                <Text style={styles.detailLabel}>Salary</Text>
                                <Text style={styles.detailValue}>{job.salary}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{job.description}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <View style={styles.contactCard}>
                            <View style={styles.contactRow}>
                                <Ionicons name="mail-outline" size={18} color="#1972ca" />
                                <Text style={styles.contactValue}>{job.email}</Text>
                            </View>
                            <View style={styles.contactRow}>
                                <Ionicons name="call-outline" size={18} color="#1972ca" />
                                <Text style={styles.contactValue}>{job.phone}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { paddingBottom: 40 + insets.bottom }]}>
                <TouchableOpacity
                    style={[styles.applyButton, { flex: 1 }, (isApplying || isJobPoster) && styles.applyButtonDisabled]}
                    onPress={handleApplyPress}
                    disabled={isApplying || isJobPoster}
                >
                    {isJobPoster ? (
                        <Text style={styles.applyButtonText}>Cannot Apply - Your Job</Text>
                    ) : isApplying ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.applyButtonText}>Apply Now</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ApplyModal 
                visible={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                onApply={handleApply}
                jobTitle={job.title || job.position_vacant || 'Position'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        backgroundColor: '#1972ca',
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    bookmarkButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    companySection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#f1f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    bannerContainer: {
        width: '100%',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: 220,
        resizeMode: 'cover',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    bannerInfoContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    bannerTitleText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'left',
    },
    bannerCompanyText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginTop: 4,
        marginBottom: 10,
    },
    bannerTagsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    bannerTagOrange: {
        backgroundColor: '#F97316',
    },
    bannerTagGreen: {
        backgroundColor: '#16A34A',
    },
    bannerTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    jobTitleText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    companyNameText: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        marginBottom: 15,
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    tag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    detailsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 25,
        gap: 15,
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 16,
        gap: 12,
    },
    detailLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#334155',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 24,
    },
    contactCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        padding: 15,
        gap: 15,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    contactValue: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    applyButton: {
        backgroundColor: '#1972ca',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    applyButtonDisabled: {
        opacity: 0.7,
    },
});

export default JobDetailsScreen;
