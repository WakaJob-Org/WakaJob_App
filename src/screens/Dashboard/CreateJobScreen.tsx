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
    Modal,
    Switch
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
    const [contactMethod, setContactMethod] = useState('In-App');

    // Perks State
    const [perks, setPerks] = useState({
        meals: false,
        transport: false,
        tools: false,
        housing: false
    });

    // Custom Requirements
    const [customReqs, setCustomReqs] = useState<string[]>([]);
    const [currentReq, setCurrentReq] = useState('');

    // Requirements Toggles
    const [reqUploadCv, setReqUploadCv] = useState(false);
    const [reqCoverLetter, setReqCoverLetter] = useState(false);

    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const STEPS = [
        { id: 1, title: 'Job Details' },
        { id: 2, title: 'Skills & Qualifications' }
    ];

    const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Task-based'];
    const CONTACT_METHODS = ['In-App', 'Phone Call', 'WhatsApp'];

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
                const parts = jobToEdit.description.split('--- Additional Details ---');
                setDescription(parts[0].trim());
                if (parts.length > 1) {
                    const details = parts[1];
                    if (details.includes('Contact Method: Phone Call')) setContactMethod('Phone Call');
                    else if (details.includes('Contact Method: WhatsApp')) setContactMethod('WhatsApp');
                    
                    setPerks({
                        meals: details.includes('meals'),
                        transport: details.includes('transport'),
                        tools: details.includes('tools'),
                        housing: details.includes('housing'),
                    });
                } else {
                    setDescription(jobToEdit.description);
                }
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

    const togglePerk = (key: keyof typeof perks) => {
        setPerks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleClose = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else if (onClose) {
            onClose();
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        } else {
            handlePostJob();
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
            
            const fullDescription = `
${description}

--- Additional Details ---
Contact Method: ${contactMethod}
Perks: ${Object.entries(perks).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}
            `.trim();

            formData.append('description', fullDescription);
            formData.append('location', location);
            formData.append('category', category);
            formData.append('salary', salary || 'Competitive');
            formData.append('job_type', jobType);
            
            const allQuals = customReqs.join(', ');
            formData.append('qualifications', allQuals);
            formData.append('requires_cv', String(reqUploadCv));
            formData.append('requires_cover_letter', String(reqCoverLetter));
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
            if (onClose) onClose();
            else if (navigation.canGoBack()) navigation.goBack();
        } catch (error: any) {
            Alert.alert('Posting Failed', typeof error === 'string' ? error : 'Could not post job at this time.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Job Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Professional Plumber"
                                placeholderTextColor="#9BA4B1"
                                value={jobTitle}
                                onChangeText={setJobTitle}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Category</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Construction"
                                placeholderTextColor="#9BA4B1"
                                value={category}
                                onChangeText={setCategory}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Describe the job duties and expectations..."
                                placeholderTextColor="#9BA4B1"
                                multiline
                                numberOfLines={5}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Location</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter specific location or neighborhood"
                                placeholderTextColor="#9BA4B1"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Job Type</Text>
                            <View style={styles.chipRow}>
                                {JOB_TYPES.map(type => (
                                    <TouchableOpacity 
                                        key={type} 
                                        style={[styles.chip, jobType === type && styles.chipActive]}
                                        onPress={() => setJobType(type)}
                                    >
                                        <Text style={[styles.chipText, jobType === type && styles.chipTextActive]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Preferred Contact Method</Text>
                            <View style={styles.chipRow}>
                                {CONTACT_METHODS.map(method => (
                                    <TouchableOpacity 
                                        key={method} 
                                        style={[styles.chip, contactMethod === method && styles.chipActive]}
                                        onPress={() => setContactMethod(method)}
                                    >
                                        <Text style={[styles.chipText, contactMethod === method && styles.chipTextActive]}>{method}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Perks & Benefits</Text>
                            <View style={styles.perksGrid}>
                                {(Object.keys(perks) as Array<keyof typeof perks>).map((key) => (
                                    <TouchableOpacity 
                                        key={key}
                                        style={[styles.perkCard, perks[key] && styles.perkCardActive]}
                                        onPress={() => togglePerk(key)}
                                    >
                                        <Ionicons 
                                            name={key === 'meals' ? 'fast-food-outline' : key === 'transport' ? 'bus-outline' : key === 'tools' ? 'construct-outline' : 'home-outline'} 
                                            size={24} 
                                            color={perks[key] ? "#FFF" : "#1972ca"} 
                                        />
                                        <Text style={[styles.perkLabel, perks[key] && styles.perkLabelActive]}>
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Site Photo (Shows on Job Card)</Text>
                            <TouchableOpacity style={styles.photoUpload} onPress={handlePickImage}>
                                {jobPhoto ? (
                                    <Image source={{ uri: jobPhoto }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Ionicons name="camera-outline" size={40} color="#9BA4B1" />
                                        <Text style={styles.photoText}>Upload Job Site Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Requirements</Text>
                            <View style={styles.addReqRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Add a requirement..."
                                    placeholderTextColor="#9BA4B1"
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

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Salary Range (FCFA)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 50,000 - 70,000"
                                placeholderTextColor="#9BA4B1"
                                value={salary}
                                onChangeText={setSalary}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>Require CV / Resume</Text>
                            </View>
                            <Switch 
                                value={reqUploadCv} 
                                onValueChange={setReqUploadCv}
                                trackColor={{ false: '#D1D5DB', true: '#1972ca' }}
                            />
                        </View>
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>Require Cover Letter</Text>
                            </View>
                            <Switch 
                                value={reqCoverLetter} 
                                onValueChange={setReqCoverLetter}
                                trackColor={{ false: '#D1D5DB', true: '#1972ca' }}
                            />
                        </View>

                        <Text style={styles.disclaimer}>
                            By launching, you confirm this information is accurate and agree to WakaJob's professional standards.
                        </Text>
                    </View>
                );
            default:
                return null;
        }
    };


    const ProgressBar = () => (
        <View style={styles.progressWrapper}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.progressScrollContent}
            >
                <View style={styles.progressBarContent}>
                    <View style={styles.stepLabels}>
                        {STEPS.map(step => (
                            <View key={step.id} style={styles.stepLabelItem}>
                                <Text 
                                    style={[styles.stepLabelText, currentStep === step.id && styles.stepLabelActive]}
                                    numberOfLines={1}
                                >
                                    {step.title}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.progressTrack}>
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <View style={[styles.dot, currentStep >= step.id && styles.dotActive]} />
                                {index < STEPS.length - 1 && (
                                    <View style={[styles.line, currentStep > step.id && styles.lineActive]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    const renderMainContent = () => (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
                    <Ionicons name={currentStep > 1 ? "arrow-back" : "close"} size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Job' : 'Create Job'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <ProgressBar />
                {renderStepContent()}
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
                    onPress={handleNext}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.nextButtonText}>{currentStep === 2 ? (isEditing ? 'Save Changes' : 'Post Job') : 'Next'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    if (isModal) {
        return (
            <Modal visible={isVisible} animationType="slide" transparent={false}>
                <SafeAreaView style={styles.container}>
                    {renderMainContent()}
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderMainContent()}
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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    progressWrapper: {
        paddingVertical: 20,
        backgroundColor: '#FFF',
    },
    progressScrollContent: {
        paddingHorizontal: 20,
    },
    progressBarContent: {
        minWidth: 400, // Reduced from 600 as there are only 2 steps now
    },
    stepLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stepLabelItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    stepLabelText: {
        fontSize: 15, // Larger font size
        color: '#9BA4B1',
        textAlign: 'center',
        fontWeight: '600',
    },
    stepLabelActive: {
        color: '#1972ca',
        fontWeight: '800',
    },
    progressTrack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    dotActive: {
        borderColor: '#1972ca',
        backgroundColor: '#1972ca',
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 0,
    },
    lineActive: {
        backgroundColor: '#1972ca',
    },
    stepContainer: {
        paddingHorizontal: 20,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        color: '#000',
    },
    textArea: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        height: 120,
        textAlignVertical: 'top',
        color: '#000',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    dropdownInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    chipText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#FFFFFF',
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
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reqItemText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#374151',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    perksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    perkCard: {
        width: '48%',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    perkCardActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    perkLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1972ca',
        marginTop: 8,
    },
    perkLabelActive: {
        color: '#FFF',
    },
    photoUpload: {
        height: 180,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoText: {
        marginTop: 10,
        fontSize: 14,
        color: '#9BA4B1',
        fontWeight: '600',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFF',
    },
    nextButton: {
        backgroundColor: '#1972ca',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonDisabled: {
        opacity: 0.7,
    },
    nextButtonText: {
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
        paddingHorizontal: 20,
    }
});

export default CreateJobScreen;
