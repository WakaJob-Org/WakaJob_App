import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ApplyModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (data: { intro_text: string; application_type: 'professional' | 'apprentice'; cv_file?: { uri: string; name: string; size: number } }) => Promise<void>;
    jobTitle: string;
    initialApplicationType?: 'professional' | 'apprentice';
    requiresCv?: boolean;
}

const ApplyModal: React.FC<ApplyModalProps> = ({ 
    visible, 
    onClose, 
    onApply, 
    jobTitle, 
    initialApplicationType = 'professional',
    requiresCv = false
}) => {
    const [introText, setIntroText] = useState('');
    const [appType, setAppType] = useState<'professional' | 'apprentice'>(initialApplicationType);
    const [loading, setLoading] = useState(false);
    const [cvFile, setCvFile] = useState<{ uri: string; name: string; size: number } | null>(null);

    React.useEffect(() => {
        if (visible) {
            setAppType(initialApplicationType);
            setIntroText('');
            setCvFile(null);
        }
    }, [visible, initialApplicationType]);

    const pickCvDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf', 
                    'application/msword', 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setCvFile({
                    uri: asset.uri,
                    name: asset.name,
                    size: asset.size || 0,
                });
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const clearCvFile = () => {
        setCvFile(null);
    };

    const handleSubmit = async () => {
        if (requiresCv && !cvFile) {
            Alert.alert("CV Required", "This position requires a CV/Resume. Please upload a document to proceed.");
            return;
        }
        
        setLoading(true);
        try {
            await onApply({ 
                intro_text: introText, 
                application_type: appType, 
                cv_file: cvFile || undefined 
            });
            setIntroText('');
            setCvFile(null);
            onClose();
        } catch (error) {
            // Error handling is managed by the parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalBg}
            >
                <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />
                
                <Animated.View 
                    entering={FadeInUp.springify()} 
                    style={styles.modalContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Apply for Position</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.jobName} numberOfLines={1}>{jobTitle}</Text>
                        
                        <Text style={styles.label}>Application Type</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity 
                                style={[styles.toggleBtn, appType === 'professional' && styles.toggleBtnActive]}
                                onPress={() => setAppType('professional')}
                            >
                                <Ionicons 
                                    name="hammer-outline" 
                                    size={20} 
                                    color={appType === 'professional' ? '#FFF' : '#64748B'} 
                                />
                                <Text style={[styles.toggleText, appType === 'professional' && styles.toggleTextActive]}>Professional</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.toggleBtn, appType === 'apprentice' && styles.toggleBtnActive]}
                                onPress={() => setAppType('apprentice')}
                            >
                                <Ionicons 
                                    name="school-outline" 
                                    size={20} 
                                    color={appType === 'apprentice' ? '#FFF' : '#64748B'} 
                                />
                                <Text style={[styles.toggleText, appType === 'apprentice' && styles.toggleTextActive]}>Apprentice</Text>
                            </TouchableOpacity>
                        </View>

                        {/* CV/Resume Upload Section */}
                        {requiresCv && (
                            <View style={styles.uploadSection}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Upload CV/Resume</Text>
                                    <Text style={styles.requiredStar}>*</Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.uploadCard, cvFile && styles.uploadCardActive]}
                                    onPress={pickCvDocument}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.uploadIconCircle, cvFile && styles.uploadIconCircleActive]}>
                                        <Ionicons 
                                            name={cvFile ? "document-text" : "cloud-upload-outline"} 
                                            size={24} 
                                            color={cvFile ? "#10B981" : "#1972ca"} 
                                        />
                                    </View>
                                    <View style={styles.uploadTextContainer}>
                                        <Text style={[styles.uploadText, cvFile && styles.uploadTextActive]} numberOfLines={1}>
                                            {cvFile ? cvFile.name : "Select your CV / Resume"}
                                        </Text>
                                        <Text style={styles.uploadSubtext}>
                                            {cvFile ? `${(cvFile.size / 1024 / 1024).toFixed(2)} MB • Tap to change` : "Supported formats: PDF, DOC, DOCX"}
                                        </Text>
                                    </View>
                                    {cvFile && (
                                        <TouchableOpacity 
                                            style={styles.clearBtn} 
                                            onPress={clearCvFile}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.label}>Quick Note (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. I have 5 years experience in Bamenda..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            maxLength={150}
                            value={introText}
                            onChangeText={setIntroText}
                        />
                        <Text style={styles.charCount}>{introText.length}/150</Text>

                        <TouchableOpacity 
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.submitBtnText}>Submit Application</Text>
                                    <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBg: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    modalContent: {
        width: SCREEN_WIDTH * 0.9,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        padding: 20,
    },
    jobName: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        fontWeight: '500',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 10,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    toggleBtnActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    // Upload Styles
    uploadSection: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requiredStar: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    uploadCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
        borderRadius: 12,
        padding: 12,
    },
    uploadCardActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
        borderStyle: 'solid',
    },
    uploadIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    uploadIconCircleActive: {
        backgroundColor: '#D1FAE5',
    },
    uploadTextContainer: {
        flex: 1,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    uploadTextActive: {
        color: '#065F46',
    },
    uploadSubtext: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    clearBtn: {
        padding: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 15,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#1E293B',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 5,
        marginBottom: 20,
    },
    submitBtn: {
        backgroundColor: '#1972ca',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ApplyModal;
