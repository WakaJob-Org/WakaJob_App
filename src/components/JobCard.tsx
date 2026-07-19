// src/components/JobCard.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface JobType {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    description: string;
    category: string;
    email?: string;
    phone?: string;
    postedAt?: string;
    imageUrl?: string;
    image_url?: string;
    tags?: string[];
    hasApprentice?: boolean;
    requirements?: string[];
    position_vacant?: string;
    requires_cv?: string | boolean;
    qualifications?: string;
    employer_name?: string;
    employer_email?: string;
    employer_phone?: string;
    job_type?: string;
    created_at?: string;
    job_image?: string;
}

interface JobCardProps {
    job: JobType;
    isSaved: boolean;
    onToggleSave: (job: JobType) => void;
    onPress: (job: JobType) => void;
    onApplyRequest?: (job: JobType, type: 'professional' | 'apprentice') => void;
}

const JobCard: React.FC<JobCardProps> = ({
    job,
    isSaved,
    onToggleSave,
    onPress,
    onApplyRequest,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const imageUri = job.imageUrl || job.image_url || job.job_image;

    return (
        <TouchableOpacity
            style={styles.jobCard}
            activeOpacity={0.9}
            onPress={() => onPress(job)}
        >
            {/* Image Banner */}
            <View style={styles.imageContainer}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.jobImage} />
                ) : (
                    <View style={[styles.jobImage, styles.placeholderImage]}>
                        <Ionicons name="image-outline" size={40} color="#9BA4B1" />
                    </View>
                )}

                {/* Save / Bookmark Button Overlay */}
                <TouchableOpacity
                    style={styles.saveBadgeSmall}
                    onPress={() => onToggleSave(job)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isSaved ? '#1972ca' : '#FFFFFF'}
                    />
                </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.cardBody}>
                <Text style={styles.jobTitleText} numberOfLines={1}>
                    {job.title || job.position_vacant || 'Untitled Position'}
                </Text>
                <Text style={styles.companySubText} numberOfLines={1}>
                    {job.company || job.employer_name || 'WakaJob Partner'}
                </Text>

                <View style={styles.cardDetailsRow}>
                    <View style={styles.cardDetailItem}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.cardDetailText} numberOfLines={1}>
                            {job.location || 'Not specified'}
                        </Text>
                    </View>
                    <View style={styles.cardDetailItem}>
                        <Ionicons name="wallet-outline" size={14} color="#64748B" />
                        <Text style={styles.cardDetailText} numberOfLines={1}>
                            {job.salary || 'Competitive'}
                        </Text>
                    </View>
                </View>

                {/* Tags */}
                <View style={styles.tagRow}>
                    {[job.type || job.job_type, job.category, ...(job.tags || [])]
                        .filter(Boolean)
                        .map((tag, idx) => (
                            <View key={idx} style={[styles.tag, idx === 0 ? styles.activeTag : null]}>
                                <Text style={[styles.tagText, idx === 0 ? styles.activeTagText : null]}>
                                    {tag}
                                </Text>
                            </View>
                        ))}
                </View>

                {/* Action Row */}
                <View style={styles.actionRow}>
                    <View style={styles.mainApplyBtn}>
                        <Text style={styles.mainApplyBtnText}>View Details</Text>
                    </View>
                    {onApplyRequest && (
                        <TouchableOpacity
                            style={styles.dropdownBtn}
                            onPress={() => setIsExpanded(!isExpanded)}
                        >
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={22}
                                color="#1972ca"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Apprentice Dropdown */}
                {isExpanded && onApplyRequest && (
                    <View style={styles.expandedContent}>
                        <TouchableOpacity
                            style={styles.apprenticeOption}
                            onPress={() => {
                                setIsExpanded(false);
                                onApplyRequest(job, 'apprentice');
                            }}
                        >
                            <Ionicons name="school-outline" size={18} color="#1972ca" />
                            <Text style={styles.apprenticeText}>Apply as Apprentice</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default JobCard;

const styles = StyleSheet.create({
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
        marginBottom: 10,
    },
    cardDetailsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 16,
    },
    cardDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    cardDetailText: {
        fontSize: 13,
        color: '#64748B',
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
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
});
