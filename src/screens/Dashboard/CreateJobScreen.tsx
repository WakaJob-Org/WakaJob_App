import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import jobService from '../../services/jobService';
import authService from '../../services/authService';

interface CreateJobScreenProps {
    isVisible?: boolean;
    onClose?: () => void;
    onPost?: () => void;
}

const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ isVisible, onClose, onPost }) => {
    const navigation = useNavigation();
    const isModal = isVisible !== undefined;
    
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

    // Custom Requirements (The "Dynamic Cart")
    const [customReqs, setCustomReqs] = useState<string[]>([]);
    const [currentReq, setCurrentReq] = useState('');

    // Requirements Toggles
    const [reqUploadCv, setReqUploadCv] = useState(false);
    const [reqCoverLetter, setReqCoverLetter] = useState(false);

    const [loading, setLoading] = useState(false);

    const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Task-based'];
    const CONTACT_METHODS = ['In-App', 'Phone Call', 'WhatsApp'];

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
            
            // Combine extra details into description for backend compatibility
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
            
            // Combine requirements
            const allQuals = customReqs.join(', ');
            
            formData.append('qualifications', allQuals);
            formData.append('requires_cv', String(reqUploadCv));
            formData.append('requires_cover_letter', String(reqCoverLetter));
            formData.append('employer_id', user.id);
            
            if (jobPhoto) {
                const filename = jobPhoto.split('/').pop() || 'job_photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('job_image', {
                    uri: jobPhoto,
                    name: filename,
                    type,
                } as any);
            }

            await jobService.createJob(formData);
            Alert.alert('Success', 'Your opportunity has been posted successfully!');
            
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
                    <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Opportunity</Text>
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
                                    value={jobTitle}
                                    onChangeText={setJobTitle}
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Category *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Tailoring & Fashion"
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

                        {/* 6. Perks & Benefits */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeading}>Perks & Benefits</Text>
                            <View style={styles.perksGrid}>
                                <TouchableOpacity 
                                    style={[styles.perkCard, perks.meals && styles.perkCardActive]}
                                    onPress={() => togglePerk('meals')}
                                >
                                    <Ionicons name="fast-food-outline" size={24} color={perks.meals ? "#FFF" : "#1972ca"} />
                                    <Text style={[styles.perkLabel, perks.meals && styles.perkLabelActive]}>Meals Provided</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.perkCard, perks.transport && styles.perkCardActive]}
                                    onPress={() => togglePerk('transport')}
                                >
                                    <Ionicons name="bus-outline" size={24} color={perks.transport ? "#FFF" : "#1972ca"} />
                                    <Text style={[styles.perkLabel, perks.transport && styles.perkLabelActive]}>Transport</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.perkCard, perks.tools && styles.perkCardActive]}
                                    onPress={() => togglePerk('tools')}
                                >
                                    <Ionicons name="construct-outline" size={24} color={perks.tools ? "#FFF" : "#1972ca"} />
                                    <Text style={[styles.perkLabel, perks.tools && styles.perkLabelActive]}>Tools Provided</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.perkCard, perks.housing && styles.perkCardActive]}
                                    onPress={() => togglePerk('housing')}
                                >
                                    <Ionicons name="home-outline" size={24} color={perks.housing ? "#FFF" : "#1972ca"} />
                                    <Text style={[styles.perkLabel, perks.housing && styles.perkLabelActive]}>Housing</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 7. Application & Contact */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeading}>How to Apply</Text>
                            {renderChipSelector("Preferred Contact Method", CONTACT_METHODS, contactMethod, setContactMethod)}
                            
                            <View style={styles.switchRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.switchLabel}>Require CV / Resume</Text>
                                    <Text style={styles.switchSub}>Worker must upload their professional profile</Text>
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
                                    <Text style={styles.switchSub}>Worker must explain why they are a fit</Text>
                                </View>
                                <Switch 
                                    value={reqCoverLetter} 
                                    onValueChange={setReqCoverLetter}
                                    trackColor={{ false: '#D1D5DB', true: '#1972ca' }}
                                />
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
                                    <Text style={styles.postButtonText}>Launch Opportunity</Text>
                                    <Ionicons name="paper-plane" size={20} color="#FFF" style={{ marginLeft: 10 }} />
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
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
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
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
    },
    inputWrapper: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
    },
    iconInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    flexInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 10,
        fontSize: 15,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipSelected: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        height: 100,
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
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    switchSub: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    postButton: {
        backgroundColor: '#1972ca',
        borderRadius: 16,
        height: 56,
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
