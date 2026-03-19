// src/screens/Dashboard/CreateJobScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Switch,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import jobService from '../../services/jobService';
import authService from '../../services/authService';

interface CreateJobScreenProps {
    isVisible: boolean;
    onClose: () => void;
    onPost: (jobData: any) => void;
}

const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ isVisible, onClose, onPost }) => {
    const [loading, setLoading] = useState(false);
    const [jobImages, setJobImages] = useState<string[]>([]);
    const [isApprentice, setIsApprentice] = useState(false);
    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        location: '',
    });

    const handlePickImage = async () => {
        if (jobImages.length >= 8) {
            Alert.alert('Limit Reached', 'You can only upload a maximum of 8 photos.');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need permission to access your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 8 - jobImages.length,
        });

        if (!result.canceled && result.assets.length > 0) {
            const newImages = result.assets.map(asset => asset.uri);
            setJobImages(prev => [...prev, ...newImages].slice(0, 8));
        }
    };

    const handleRemoveImage = (index: number) => {
        setJobImages(prev => prev.filter((_, i) => i !== index));
    };

    const handlePost = async () => {
        if (!jobData.title || !jobData.description || !jobData.location) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            const user = await authService.getUser();
            if (!user || !user.id) {
                Alert.alert('Error', 'User session not found. Please log in again.');
                return;
            }

            let uploadedUrls: string[] = [];
            if (jobImages.length > 0) {
                try {
                    // Upload all images in parallel
                    const uploadPromises = jobImages.map(uri => jobService.uploadImage(uri));
                    uploadedUrls = await Promise.all(uploadPromises);
                } catch (imgError: any) {
                    console.error('Some images failed to upload:', imgError);
                    Alert.alert('Upload partial failure', 'Some images could not be uploaded. Proceed anyway?', [
                        { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                        { text: 'Post Anyway', onPress: () => proceedWithPost(user.id, uploadedUrls) }
                    ]);
                    return;
                }
            }

            await proceedWithPost(user.id, uploadedUrls);
        } catch (error: any) {
            Alert.alert('Post Failed', typeof error === 'string' ? error : 'Could not create job listing.');
        } finally {
            setLoading(false);
        }
    };

    const proceedWithPost = async (employerId: string, imageUrls: string[]) => {
        try {
            const backendData = {
                employer_id: employerId,
                position_vacant: jobData.title,
                description: jobData.description,
                location: jobData.location,
                salary: 'Negotiable',
                category: 'General',
                job_type: 'full-time' as any,
                qualifications: 'None',
                is_apprentice: isApprentice,
                image_url: imageUrls[0] || undefined, // Keep first for backward compatibility
                images: imageUrls, // Store all URLs
            };

            const createdJob = await jobService.createJob(backendData);
            Alert.alert('Success', 'Job posted successfully!');
            onPost(createdJob);
            // Reset form
            setJobData({ title: '', description: '', location: '' });
            setJobImages([]);
            setIsApprentice(false);
            onClose();
        } catch (error: any) {
            Alert.alert('Post Failed', typeof error === 'string' ? error : 'Could not create job listing.');
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.safeArea}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={20} color="#1F2937" />
                        <Text style={styles.headerTitle}>Post a Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Job Title ── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Job Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Senior Frontend Developer"
                            placeholderTextColor="#B0B8C5"
                            value={jobData.title}
                            onChangeText={(text) => setJobData({ ...jobData, title: text })}
                        />
                    </View>

                    {/* ── Job Description ── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Job Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Tell us about the role, requirements, and benefits..."
                            placeholderTextColor="#B0B8C5"
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            value={jobData.description}
                            onChangeText={(text) => setJobData({ ...jobData, description: text })}
                        />
                    </View>

                    {/* ── Job Image ── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Job Images ({jobImages.length}/8)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
                            {jobImages.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.thumbnail} />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => handleRemoveImage(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {jobImages.length < 8 && (
                                <TouchableOpacity
                                    style={[styles.imagePicker, jobImages.length > 0 && styles.miniPicker]}
                                    onPress={handlePickImage}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.imagePickerContent}>
                                        <View style={styles.cameraIconWrapper}>
                                            <Ionicons name="camera-outline" size={jobImages.length > 0 ? 20 : 28} color="#1972ca" />
                                            <View style={styles.plusBadge}>
                                                <Ionicons name="add" size={jobImages.length > 0 ? 8 : 10} color="#FFFFFF" />
                                            </View>
                                        </View>
                                        {jobImages.length === 0 && (
                                            <>
                                                <Text style={styles.uploadTitle}>Upload job photos</Text>
                                                <Text style={styles.uploadSub}>Maximum 8 photos allowed</Text>
                                                <View style={styles.selectFileBtn}>
                                                    <Text style={styles.selectFileBtnText}>Select Files</Text>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    {/* ── Location ── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Location</Text>
                        <View style={styles.locationInputWrapper}>
                            <Ionicons name="location-outline" size={18} color="#B0B8C5" style={styles.locationIcon} />
                            <TextInput
                                style={styles.locationInput}
                                placeholder="City, State or Remote"
                                placeholderTextColor="#B0B8C5"
                                value={jobData.location}
                                onChangeText={(text) => setJobData({ ...jobData, location: text })}
                            />
                        </View>
                    </View>

                    {/* ── Apprentice Toggle ── */}
                    <View style={styles.toggleCard}>
                        <View style={styles.toggleTextBlock}>
                            <Text style={styles.toggleTitle}>Do you want an apprentice?</Text>
                            <Text style={styles.toggleSub}>
                                This will label your job as open to entry-level{'\n'}learners.
                            </Text>
                        </View>
                        <Switch
                            value={isApprentice}
                            onValueChange={setIsApprentice}
                            trackColor={{ false: '#E5E7EB', true: '#1972ca' }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E5E7EB"
                        />
                    </View>

                    {/* ── Post Job Now Button ── */}
                    <TouchableOpacity
                        style={[styles.postBtn, loading && styles.postBtnDisabled]}
                        onPress={handlePost}
                        activeOpacity={0.85}
                        disabled={loading}
                    >
                        <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Post Job Now'}</Text>
                        {!loading && (
                            <Ionicons name="send" size={18} color="#FFFFFF" style={styles.postBtnIcon} />
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1972ca',
    },

    // ── Scroll ──
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },

    // ── Fields ──
    fieldGroup: {
        marginBottom: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937',
    },
    textArea: {
        height: 110,
        paddingTop: 14,
    },

    // ── Image Picker ──
    imagePicker: {
        borderWidth: 1.5,
        borderColor: '#D0DCF5',
        borderStyle: 'dashed',
        borderRadius: 14,
        backgroundColor: '#F7FAFF',
        overflow: 'hidden',
        minHeight: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerContent: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
    },
    cameraIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EBF3FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        position: 'relative',
    },
    plusBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    uploadSub: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    selectFileBtn: {
        borderWidth: 1,
        borderColor: '#1F2937',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 9,
    },
    selectFileBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
    imagePreview: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    imageScroll: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 4,
    },
    imageWrapper: {
        position: 'relative',
        width: 140,
        height: 140,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        zIndex: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    miniPicker: {
        width: 140,
        minHeight: 140,
        height: 140,
        borderWidth: 1.5,
    },

    // ── Location ──
    locationInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    locationIcon: {
        marginRight: 10,
    },
    locationInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        padding: 0,
    },

    // ── Toggle Card ──
    toggleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 14,
        padding: 16,
        marginBottom: 28,
    },
    toggleTextBlock: {
        flex: 1,
        paddingRight: 16,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    toggleSub: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 17,
    },

    // ── Post Button ──
    postBtn: {
        flexDirection: 'row',
        backgroundColor: '#1972ca',
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    postBtnDisabled: {
        opacity: 0.6,
    },
    postBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    postBtnIcon: {
        marginLeft: 4,
    },
});

export default CreateJobScreen;
