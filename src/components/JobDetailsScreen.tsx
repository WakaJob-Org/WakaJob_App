import React, { useState } from 'react';
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
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import jobService from '../services/jobService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const JobDetailsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { job, isSaved: initialIsSaved } = route.params || {};

    const [isSaved, setIsSaved] = useState(initialIsSaved || false);
    const [isApplying, setIsApplying] = useState(false);

    if (!job) return null;

    const handleSave = async () => {
        try {
            setIsSaved(!isSaved); // Optimistic UI
            await jobService.saveJob(job.id);
        } catch (error) {
            setIsSaved(isSaved); // Revert on failure
            Alert.alert("Error", "Failed to save job.");
        }
    };

    const handleApply = async () => {
        try {
            setIsApplying(true);
            await jobService.applyToJob(job.id);
            Alert.alert("Success", "Application sent successfully!");
        } catch (error: any) {
            Alert.alert("Error", error || "Failed to apply for the job.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Job Details</Text>
                    <TouchableOpacity style={styles.bookmarkButton} onPress={handleSave}>
                        <Ionicons 
                            name={isSaved ? "bookmark" : "bookmark-outline"} 
                            size={24} 
                            color={isSaved ? "#1972ca" : "#333"} 
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.companySection}>
                        <View style={styles.logoContainer}>
                            {job.imageUrl || job.image_url ? (
                                <Image 
                                    source={{ uri: job.imageUrl || job.image_url }} 
                                    style={styles.logoImage} 
                                />
                            ) : (
                                <Ionicons name="briefcase" size={40} color="#1972ca" />
                            )}
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

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.applyButton, isApplying && styles.applyButtonDisabled]} 
                        onPress={handleApply}
                        disabled={isApplying}
                    >
                        {isApplying ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.applyButtonText}>Apply Now</Text>
                        )}
                    </TouchableOpacity>
                </View>
        </SafeAreaView>
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
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    bookmarkButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
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
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
