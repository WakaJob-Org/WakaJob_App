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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import jobService from '../../services/jobService';
import authService from '../../services/authService';
import Header from '../../components/Header';

import { useNavigation } from '@react-navigation/native';

const CreateJobScreen: React.FC = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [jobImages, setJobImages] = useState<string[]>([]);
    const [questions, setQuestions] = useState<string[]>(['']);
    const [isApprentice, setIsApprentice] = useState(false);
    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        location: '',
        salary: '',
        category: 'General',
        type: 'Full-time',
    });

    const handlePickImage = async () => {
        if (jobImages.length >= 7) {
            Alert.alert('Limit Reached', 'You can only upload a maximum of 7 photos.');
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
            selectionLimit: 7 - jobImages.length,
        });

        if (!result.canceled && result.assets.length > 0) {
            const newImages = result.assets.map(asset => asset.uri);
            setJobImages(prev => [...prev, ...newImages].slice(0, 7));
        }
    };

    const handleAddQuestion = () => {
        if (questions.length >= 5) {
            Alert.alert('Limit reached', 'You can only add up to 5 screening questions.');
            return;
        }
        setQuestions([...questions, '']);
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleUpdateQuestion = (text: string, index: number) => {
        const newQuestions = [...questions];
        newQuestions[index] = text;
        setQuestions(newQuestions);
    };

    const handlePost = async () => {
        if (!jobData.title || !jobData.description || !jobData.location || !jobData.salary || !jobData.category) {
            Alert.alert('Error', 'Please fill in all required fields (Job Name, Description, Location, Salary, Category).');
            return;
        }

        if (jobImages.length === 0) {
            Alert.alert('Image Required', 'Please add at least one image to your job post.');
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
                    const uploadPromises = jobImages.map(uri => jobService.uploadImage(uri));
                    uploadedUrls = await Promise.all(uploadPromises);
                } catch (imgError: any) {
                    console.error('Some images failed to upload:', imgError);
                    Alert.alert('Upload Error', 'Failed to upload job images. Please try again.');
                    setLoading(false);
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
            // Filter out empty questions
            const validQuestions = questions.filter(q => q.trim().length > 0);

            const backendData = {
                employer_id: employerId,
                position_vacant: jobData.title,
                description: jobData.description,
                location: jobData.location,
                salary: jobData.salary,
                category: jobData.category,
                job_type: (jobData.type.toLowerCase() === 'full-time' ? 'full-time' : 
                          jobData.type.toLowerCase() === 'part-time' ? 'part-time' : 'contract') as any,
                qualifications: 'None',
                is_apprentice: isApprentice,
                image_url: imageUrls[0] || undefined,
                images: imageUrls,
                screening_questions: validQuestions,
            };

            await jobService.createJob(backendData);
            Alert.alert('Success', 'Job posted successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Post Failed', typeof error === 'string' ? error : 'Could not create job listing.');
        }
    };

    const CATEGORIES = ['Construction', 'Salon', 'Mechanics', 'Tailoring', 'Farming', 'Healthcare', 'Education', 'Other'];

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header
                title="Post a Job"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
                        {/* ── Job Name ── */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Job Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Senior Carpenter"
                                placeholderTextColor="#B0B8C5"
                                value={jobData.title}
                                onChangeText={(text) => setJobData({ ...jobData, title: text })}
                            />
                        </View>

                        {/* ── Category ── */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity 
                                        key={cat}
                                        style={[styles.categoryChip, jobData.category === cat && styles.categoryChipActive]}
                                        onPress={() => setJobData({ ...jobData, category: cat })}
                                    >
                                        <Text style={[styles.categoryText, jobData.category === cat && styles.categoryTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* ── Job Description ── */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Job Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the job, requirements, and responsibilities..."
                                placeholderTextColor="#B0B8C5"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                value={jobData.description}
                                onChangeText={(text) => setJobData({ ...jobData, description: text })}
                            />
                        </View>

                        {/* ── Job Images ── */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Job Images ({jobImages.length}/7)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
                                {jobImages.map((uri, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <Image source={{ uri }} style={styles.thumbnail} />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => setJobImages(jobImages.filter((_, i) => i !== index))}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {jobImages.length < 7 && (
                                    <TouchableOpacity
                                        style={[styles.imagePicker, jobImages.length > 0 && styles.miniPicker]}
                                        onPress={handlePickImage}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.imagePickerContent}>
                                            <Ionicons name="camera-outline" size={jobImages.length > 0 ? 20 : 28} color="#1972ca" />
                                            {jobImages.length === 0 && <Text style={styles.uploadSub}>Max 7 photos</Text>}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>

                        {/* ── Location & Salary ── */}
                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Location</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Douala"
                                    placeholderTextColor="#B0B8C5"
                                    value={jobData.location}
                                    onChangeText={(text) => setJobData({ ...jobData, location: text })}
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Salary Range (FCFA)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 50k - 100k"
                                    placeholderTextColor="#B0B8C5"
                                    value={jobData.salary}
                                    onChangeText={(text) => setJobData({ ...jobData, salary: text })}
                                />
                            </View>
                        </View>

                        {/* ── Question Section ── */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.label}>Screening Questions</Text>
                                <TouchableOpacity onPress={handleAddQuestion}>
                                    <Text style={styles.addQuestText}>+ Add Question</Text>
                                </TouchableOpacity>
                            </View>
                            {questions.map((q, index) => (
                                <View key={index} style={styles.questionWrapper}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder={`Question ${index + 1}`}
                                        value={q}
                                        onChangeText={(text) => handleUpdateQuestion(text, index)}
                                    />
                                    <TouchableOpacity onPress={() => handleRemoveQuestion(index)} style={styles.removeQuestBtn}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* ── Apprentice Toggle ── */}
                        <View style={styles.toggleCard}>
                            <View style={styles.toggleTextBlock}>
                                <Text style={styles.toggleTitle}>Open for Apprentices?</Text>
                                <Text style={styles.toggleSub}>Labels this job for entry-level learners.</Text>
                            </View>
                            <Switch
                                value={isApprentice}
                                onValueChange={setIsApprentice}
                                trackColor={{ false: '#E5E7EB', true: '#1972ca' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.postBtn, loading && styles.postBtnDisabled]}
                            onPress={handlePost}
                            disabled={loading}
                        >
                            <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Post Job Now'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    form: {
        flex: 1,
    },
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    categoryChipActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    categoryText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    imageScroll: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 4,
    },
    imageWrapper: {
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: 12,
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
        top: 2,
        right: 2,
        zIndex: 10,
    },
    imagePicker: {
        width: 100,
        height: 100,
        borderWidth: 1.5,
        borderColor: '#D0DCF5',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#F7FAFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniPicker: {
        width: 100,
        height: 100,
    },
    imagePickerContent: {
        alignItems: 'center',
    },
    uploadSub: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
    },
    questionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    removeQuestBtn: {
        padding: 8,
    },
    addQuestText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1972ca',
    },
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
    },
    postBtn: {
        backgroundColor: '#1972ca',
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 20,
    },
    postBtnDisabled: {
        opacity: 0.6,
    },
    postBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default CreateJobScreen;
