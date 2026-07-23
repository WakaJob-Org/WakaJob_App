import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import jobService from '../../services/jobService';
import authService from '../../services/authService';

interface CreateJobScreenProps {
    isVisible?: boolean;
    onClose?: () => void;
    onPost?: () => void;
}

const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ isVisible, onClose, onPost }) => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const isModal = isVisible !== undefined;
    
    // Check if we are editing an existing job
    const jobToEdit = route.params?.jobToEdit;
    const isEditing = !!jobToEdit;
    
    // Form State
    const [jobPhoto, setJobPhoto] = useState<string | null>(null);
    const [jobTitle, setJobTitle] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [salary, setSalary] = useState('');
    const [jobType, setJobType] = useState('Full-time');

    // Custom Requirements (The "Dynamic Cart")
    const [customReqs, setCustomReqs] = useState<string[]>([]);
    const [currentReq, setCurrentReq] = useState('');

    const [loading, setLoading] = useState(false);

    const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Task-based'];

    useEffect(() => {
        if (jobToEdit) {
            setJobTitle(jobToEdit.position_vacant || jobToEdit.title || '');
            setCategory(jobToEdit.category || '');
            setLocation(jobToEdit.location || '');
            setSalary(jobToEdit.salary || '');
            
            const mappedJobType = jobToEdit.job_type === 'full-time' ? 'Full-time' 
                : jobToEdit.job_type === 'part-time' ? 'Part-time'
                : jobToEdit.job_type === 'contract' ? 'Contract'
                : jobToEdit.job_type === 'task-based' ? 'Task-based'
                : jobToEdit.job_type || 'Full-time';
            setJobType(mappedJobType);
            
            setJobPhoto(jobToEdit.image_url || jobToEdit.job_image || null);
            
            if (jobToEdit.qualifications) {
                setCustomReqs(jobToEdit.qualifications.split(',').map((q: string) => q.trim()).filter((q: string) => q));
            }
            
            if (jobToEdit.description) {
                // Strip off any "--- Additional Details ---" suffix from older job
                // posts so it doesn't show up in the description field when editing.
                const parts = jobToEdit.description.split('--- Additional Details ---');
                setDescription(parts[0].trim());
            }
        }
    }, [jobToEdit]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need permission to access your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setJobPhoto(result.assets[0].uri);
        }
    };

    const addCustomRequirement = () => {
        if (currentReq.trim()) {
            setCustomReqs([...customReqs, currentReq.trim()]);
            setCurrentReq('');
        }
    };

    const removeRequirement = (index: number) => {
        setCustomReqs(customReqs.filter((_, i) => i !== index));
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handlePostJob = async () => {
        if (!jobTitle || !location || !description || !category || !jobPhoto) {
            Alert.alert('Missing Information', 'Please fill in all required fields and upload a photo of the job site.');
            return;
        }

        setLoading(true);
        try {
            const user = await authService.getUser();
            if (!user || !user.id) {
                Alert.alert('Error', 'User session not found. Please log in again.');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('title', jobTitle);
            formData.append('description', description.trim());
            formData.append('location', location);
            formData.append('category', category);
            formData.append('salary', salary || 'Competitive');
            formData.append('job_type', jobType);
            
            // Combine requirements
            const allQuals = customReqs.join(', ');
            
            formData.append('qualifications', allQuals);
            formData.append('employer_id', user.id);
            
            if (jobPhoto && !jobPhoto.startsWith('http')) {
                const filename = jobPhoto.split('/').pop() || 'job_photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('job_image', {
                    uri: jobPhoto,
                    name: filename,
                    type,
                } as any);
            } else if (jobPhoto && isEditing) {
                // Keep existing image URL if not changed
                formData.append('image_url', jobPhoto);
            }

            if (isEditing) {
                await jobService.updateJob(jobToEdit.id, formData as any);
                Alert.alert('Success', 'Your opportunity has been updated successfully!');
            } else {
                await jobService.createJob(formData);
                Alert.alert('Success', 'Your opportunity has been posted successfully!');
            }
            
            if (onPost) onPost();
            handleClose();
        } catch (error: any) {
            Alert.alert('Posting Failed', typeof error === 'string' ? error : 'Could not post job at this time.');
        } finally {
            setLoading(false);
        }
    };

    const renderChipSelector = (label: string, options: string[], selectedValue: string, onSelect: (val: string) => void) => (
        <View style={styles.formSection}>
            <Text style={styles.sectionHeading}>{label}</Text>
            <View style={styles.chipContainer}>
                {options.map((option) => (
                    <TouchableOpacity 
                        key={option}
                        style={[styles.chip, selectedValue === option && styles.chipSelected]}
                        onPress={() => onSelect(option)}
                    >
                        <Text style={[styles.chipText, selectedValue === option && styles.chipTextSelected]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const content = (
        <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="arrow-back" size={24} color="#1972ca" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Opportunity' : 'Create Opportunity'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* 1. Job Photo & Basic Info */}
                    <View style={styles.imageSection}>
                        <TouchableOpacity style={styles.imagePlaceholder} onPress={handlePickImage} activeOpacity={0.9}>
                            {jobPhoto ? (
                                <Image source={{ uri: jobPhoto }} style={styles.heroImage} />
                            ) : (
                                <View style={styles.placeholderContent}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="camera" size={32} color="#1972ca" />
                                    </View>
                                    <Text style={styles.placeholderText}>Add Job Site Photo *</Text>
                                    <Text style={styles.placeholderSubtext}>Show workers where they will be working</Text>
                                </View>
                            )}
                            {jobPhoto && (
                                <TouchableOpacity style={styles.editImageBadge} onPress={handlePickImage}>
                                    <Ionicons name="pencil" size={16} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContent}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeading}>Basic Identity</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Job Title *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Expert Tailor for Bridal Shop"
                                    placeholderTextColor="#9CA3AF"
                                    value={jobTitle}
                                    onChangeText={setJobTitle}
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Category *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Tailoring & Fashion"
                                    placeholderTextColor="#9CA3AF"
                                    value={category}
                                    onChangeText={setCategory}
                                />
                            </View>
                        </View>

                        {/* 2. Logistics & Pay */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeading}>Logistics & Payment</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Precise Location *</Text>
                                <View style={styles.iconInput}>
                                    <Ionicons name="location-outline" size={20} color="#1972ca" />
                                    <TextInput
                                        style={styles.flexInput}
                                        placeholder="e.g. Molyko, Opposite University"
                                        placeholderTextColor="#9CA3AF"
                                        value={location}
                                        onChangeText={setLocation}
                                    />
                                </View>
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Salary Range</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 50k - 70k"
                                    placeholderTextColor="#9CA3AF"
                                    value={salary}
                                    onChangeText={setSalary}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* 3. Job Type */}
                        {renderChipSelector("Employment Type", JOB_TYPES, jobType, setJobType)}

                        {/* 4. Description */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeading}>Detailed Description</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Tell workers about the daily tasks, environment, and what makes this opportunity unique..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        {/* 5. Custom Requirements (The Cart) */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeading}>Custom Requirements</Text>
                            <Text style={styles.subLabel}>Add specific needs (e.g. 'Must have own tools')</Text>
                            <View style={styles.addReqRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Add a requirement..."
                                    placeholderTextColor="#9CA3AF"
                                    value={currentReq}
                                    onChangeText={setCurrentReq}
                                />
                                <TouchableOpacity style={styles.addBtn} onPress={addCustomRequirement}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.reqList}>
                                {customReqs.map((req, index) => (
                                    <View key={index} style={styles.reqItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.reqItemText}>{req}</Text>
                                        <TouchableOpacity onPress={() => removeRequirement(index)}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Post Button */}
                        <TouchableOpacity 
                            style={[styles.postButton, loading && styles.postButtonDisabled]} 
                            onPress={handlePostJob}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.postButtonText}>{isEditing ? 'Save Changes' : 'Launch Opportunity'}</Text>
                                    <Ionicons name={isEditing ? "save-outline" : "paper-plane"} size={20} color="#FFF" style={{ marginLeft: 10 }} />
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <Text style={styles.disclaimer}>
                            By launching, you confirm this information is accurate and agree to WakaJob's professional standards.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );

    if (isModal) {
        return (
            <Modal visible={isVisible} animationType="slide" transparent={false}>
                <SafeAreaView style={styles.container}>
                    {content}
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {content}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 5,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        width: '100%',
        height: 200,
        backgroundColor: '#F3F6FF',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContent: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    placeholderText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    placeholderSubtext: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    editImageBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: '#1972ca',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    formContent: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
    },
    formSection: {
        marginBottom: 25,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 15,
    },
    inputWrapper: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#F3F7FC',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#111827',
    },
    iconInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F7FC',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    flexInput: {
        flex: 1,
        paddingVertical: 14,
        marginLeft: 10,
        fontSize: 15,
        color: '#111827',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F7FC',
    },
    chipSelected: {
        backgroundColor: '#1972ca',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    textArea: {
        backgroundColor: '#F3F7FC',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#111827',
        height: 110,
    },
    addReqRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    addBtn: {
        backgroundColor: '#1972ca',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reqList: {
        marginTop: 15,
    },
    reqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F7FC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    reqItemText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#374151',
    },
    postButton: {
        backgroundColor: '#1972ca',
        borderRadius: 30,
        height: 58,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 4,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    postButtonDisabled: {
        opacity: 0.7,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    disclaimer: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 16,
    }
});

export default CreateJobScreen;
