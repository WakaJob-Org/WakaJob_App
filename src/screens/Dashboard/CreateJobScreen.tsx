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
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import jobService from '../../services/jobService';
import authService from '../../services/authService';

const CreateJobScreen: React.FC = () => {
    const navigation = useNavigation();
    
    // Form State
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    // Checkbox State
    const [reqPaymentRate, setReqPaymentRate] = useState(false);
    const [reqScreening, setReqScreening] = useState(false);
    const [reqUploadCv, setReqUploadCv] = useState(false);
    const [reqWorkerId, setReqWorkerId] = useState(false);
    const [reqWorkerName, setReqWorkerName] = useState(false);

    const [loading, setLoading] = useState(false);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'We need permission to access your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setCompanyLogo(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!companyName || !jobTitle || !location || !description) {
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

            let uploadedUrl = '';
            if (companyLogo) {
                try {
                    uploadedUrl = await jobService.uploadImage(companyLogo);
                } catch (imgError: any) {
                    console.error('Image upload failed:', imgError);
                    Alert.alert('Upload Error', 'Failed to upload logo.');
                    setLoading(false);
                    return;
                }
            }

            const backendData = {
                employer_id: user.id,
                position_vacant: jobTitle,
                description: description,
                location: location,
                job_type: 'full-time' as const, // default
                image_url: uploadedUrl || undefined,
            };

            await jobService.createJob(backendData);
            Alert.alert('Success', 'Opportunity created successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', typeof error === 'string' ? error : 'Could not create opportunity.');
        } finally {
            setLoading(false);
        }
    };

    const CheckboxRow = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
        <TouchableOpacity style={styles.checkboxContainer} onPress={onToggle} activeOpacity={0.7}>
            <Ionicons 
                name={value ? "checkbox" : "square-outline"} 
                size={22} 
                color={value ? "#1972ca" : "#D1D5DB"} 
                style={styles.checkboxIcon}
            />
            <Text style={styles.checkboxLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1972ca" />
                    <Text style={styles.headerTitle}>Employer Details</Text>
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>WJ</Text>
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>Create Opportunity</Text>
                        <Text style={styles.subTitle}>Define your company profile and job requirements.</Text>
                    </View>

                    {/* Company Logo Card */}
                    <View style={styles.card}>
                        <Text style={styles.centerLabel}>
                            Company Logo <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <View style={styles.uploadContainerWrapper}>
                            <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} activeOpacity={0.8}>
                                {companyLogo ? (
                                    <Image source={{ uri: companyLogo }} style={styles.uploadedImage} />
                                ) : (
                                    <>
                                        <Ionicons name="camera-outline" size={24} color="#B0C4DE" />
                                        <Text style={styles.uploadText}>UPLOAD LOGO</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.uploadHint}>SVG, PNG or JPG.</Text>
                    </View>

                    {/* Form Fields Card */}
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Company Name <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Meridian Global Tech"
                                placeholderTextColor="#9CA3AF"
                                value={companyName}
                                onChangeText={setCompanyName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Job Title <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Senior Project Manager"
                                placeholderTextColor="#9CA3AF"
                                value={jobTitle}
                                onChangeText={setJobTitle}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Location <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <View style={styles.inputWithIcon}>
                                <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="City, Country"
                                    placeholderTextColor="#9CA3AF"
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Job Description <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the role and responsibilities..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Optional Requirements Card */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Optional Requirements</Text>
                        
                        <CheckboxRow 
                            label="Payment Rate" 
                            value={reqPaymentRate} 
                            onToggle={() => setReqPaymentRate(!reqPaymentRate)} 
                        />
                        <CheckboxRow 
                            label="Screening Questions" 
                            value={reqScreening} 
                            onToggle={() => setReqScreening(!reqScreening)} 
                        />
                        <CheckboxRow 
                            label="Upload CV" 
                            value={reqUploadCv} 
                            onToggle={() => setReqUploadCv(!reqUploadCv)} 
                        />
                        <CheckboxRow 
                            label="Worker ID" 
                            value={reqWorkerId} 
                            onToggle={() => setReqWorkerId(!reqWorkerId)} 
                        />
                        <CheckboxRow 
                            label="Worker Name" 
                            value={reqWorkerName} 
                            onToggle={() => setReqWorkerName(!reqWorkerName)} 
                        />
                    </View>

                    {/* Footer Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.saveButton, loading && { opacity: 0.7 }]} 
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
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
        backgroundColor: '#F3F6F9', // light gray background from image
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F3F6F9',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1972ca',
        marginLeft: 8,
    },
    logoContainer: {
        width: 28,
        height: 28,
        backgroundColor: '#EBF4FF',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: '#1972ca',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    titleSection: {
        marginTop: 10,
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    subTitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    centerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    requiredStar: {
        color: '#EF4444',
    },
    uploadContainerWrapper: {
        alignItems: 'center',
        marginBottom: 8,
    },
    uploadBox: {
        width: 80,
        height: 80,
        backgroundColor: '#F4F7FA',
        borderWidth: 1.5,
        borderColor: '#D2DBE8',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#B0C4DE',
        marginTop: 4,
    },
    uploadHint: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
    },
    inputIcon: {
        marginRight: 8,
    },
    inputField: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1F2937',
    },
    textArea: {
        height: 100,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    checkboxIcon: {
        marginRight: 10,
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#374151',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    cancelButton: {
        marginRight: 20,
        paddingVertical: 10,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
    },
    saveButton: {
        backgroundColor: '#1972ca',
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 8,
    },
    saveText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default CreateJobScreen;
