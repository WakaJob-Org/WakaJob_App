import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface EmployerVerificationScreenProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

const EmployerVerificationScreen: React.FC<EmployerVerificationScreenProps> = ({
    isVisible,
    onClose,
    onSubmit
}) => {
    const insets = useSafeAreaInsets();
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [isApprenticeOpen, setIsApprenticeOpen] = useState<boolean | null>(null);

    const handleFileUpload = (type: string) => {
        Alert.alert("Upload", `File selection for ${type} will be available in the production build.`);
    };

    const handleSubmit = () => {
        if (!bio || !location || isApprenticeOpen === null) {
            Alert.alert("Missing Information", "Please complete all fields before submitting.");
            return;
        }

        Alert.alert(
            "Submitted",
            "Your professional verification details have been received. Our team will review them shortly.",
            [{ text: "OK", onPress: onSubmit }]
        );
    };

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Verification</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    {/* Work Location Image */}
                    <View style={styles.imageUploadSection}>
                        <TouchableOpacity
                            style={styles.mainUploadBox}
                            onPress={() => handleFileUpload("Work Location Image")}
                        >
                            <View style={styles.dashedBox}>
                                <Ionicons name="cloud-upload-outline" size={40} color="#9BA4B1" />
                            </View>
                            <View style={styles.cameraCircle}>
                                <Ionicons name="camera" size={18} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.sectionTitleCenter}>Work Location Image</Text>
                        <Text style={styles.sectionSubtitleCenter}>Upload a photo of your workspace or business location</Text>
                    </View>

                    {/* Council Permit */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Council Permit</Text>
                        <View style={styles.permitBox}>
                            <View style={styles.fileIconBox}>
                                <Ionicons name="document-text" size={24} color="#1972ca" />
                            </View>
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>Upload Permit Document</Text>
                                <Text style={styles.fileHint}>pdf, jpg or png · 5mb</Text>
                            </View>
                            <TouchableOpacity style={styles.selectFileBtn} onPress={() => handleFileUpload("Council Permit")}>
                                <Text style={styles.selectFileText}>Select File</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Professional Bio */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Professional Bio</Text>
                        <TextInput
                            style={styles.bioInput}
                            placeholder="Briefly describe your trade experience and skills..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={bio}
                            onChangeText={setBio}
                        />
                    </View>

                    {/* Government ID */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Government ID Card</Text>
                        <View style={styles.idGrid}>
                            <TouchableOpacity style={styles.idBox} onPress={() => handleFileUpload("ID Front")}>
                                <Ionicons name="cloud-upload-outline" size={24} color="#9BA4B1" />
                                <Text style={styles.idBoxText}>Frontside</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.idBox} onPress={() => handleFileUpload("ID Back")}>
                                <Ionicons name="cloud-upload-outline" size={24} color="#9BA4B1" />
                                <Text style={styles.idBoxText}>Backside</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Service Location */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Service Location</Text>
                        <View style={styles.locationInputWrapper}>
                            <Ionicons name="location-outline" size={20} color="#1972ca" style={styles.locationIcon} />
                            <TextInput
                                style={styles.locationInput}
                                placeholder="street address, city, country"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                        <TouchableOpacity style={styles.autoDetectBtn}>
                            <Ionicons name="location" size={18} color="#1972ca" />
                            <Text style={styles.autoDetectText}>Auto-detect Location</Text>
                        </TouchableOpacity>

                        <View style={styles.mapPlaceholder}>
                            <Text style={styles.mapText}>MAP</Text>
                        </View>
                    </View>

                    {/* Apprentice Toggle */}
                    <View style={styles.apprenticeCard}>
                        <Text style={styles.apprenticeTitle}>Are you looking for a new apprentice?</Text>
                        <Text style={styles.apprenticeDesc}>Indicate if you are open to mentoring new talents</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, isApprenticeOpen === true && styles.toggleBtnActive]}
                                onPress={() => setIsApprenticeOpen(true)}
                            >
                                <Ionicons name="location" size={18} color={isApprenticeOpen === true ? "#FFF" : "#1972ca"} />
                                <Text style={[styles.toggleText, isApprenticeOpen === true && styles.toggleTextActive]}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, isApprenticeOpen === false && styles.toggleBtnActive]}
                                onPress={() => setIsApprenticeOpen(false)}
                            >
                                <Ionicons name="location" size={18} color={isApprenticeOpen === false ? "#FFF" : "#1972ca"} />
                                <Text style={[styles.toggleText, isApprenticeOpen === false && styles.toggleTextActive]}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Submit for Verification</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginRight: 34, // Balancing the back button
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    imageUploadSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    mainUploadBox: {
        width: width * 0.4,
        height: width * 0.3,
        marginBottom: 15,
        position: 'relative',
    },
    dashedBox: {
        width: '100%',
        height: '100%',
        borderWidth: 1.5,
        borderColor: '#E1E8F0',
        borderStyle: 'dashed',
        borderRadius: 15,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraCircle: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1972ca',
        borderWidth: 2,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitleCenter: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubtitleCenter: {
        fontSize: 12,
        color: '#9BA4B1',
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
    },
    permitBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
        padding: 15,
        borderRadius: 15,
    },
    fileIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    fileHint: {
        fontSize: 12,
        color: '#9BA4B1',
    },
    selectFileBtn: {
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    selectFileText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1972ca',
    },
    bioInput: {
        backgroundColor: '#F7F9FC',
        borderRadius: 15,
        padding: 15,
        height: 100,
        fontSize: 14,
        color: '#1F2937',
    },
    idGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    idBox: {
        flex: 1,
        height: 100,
        borderWidth: 1.5,
        borderColor: '#E1E8F0',
        borderStyle: 'dashed',
        borderRadius: 15,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    idBoxText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9BA4B1',
    },
    locationInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1E8F0',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 10,
    },
    locationIcon: {
        marginRight: 10,
    },
    locationInput: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
    },
    autoDetectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EBF4FF',
        height: 50,
        borderRadius: 12,
        gap: 8,
        marginBottom: 15,
    },
    autoDetectText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1972ca',
    },
    mapPlaceholder: {
        width: '100%',
        height: 100,
        backgroundColor: '#C4C4C4',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        letterSpacing: 2,
    },
    apprenticeCard: {
        backgroundColor: '#F7F9FC',
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
    },
    apprenticeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    apprenticeDesc: {
        fontSize: 12,
        color: '#9BA4B1',
        marginBottom: 15,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 15,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        height: 44,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#EBF4FF',
    },
    toggleBtnActive: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1972ca',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#1972ca',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default EmployerVerificationScreen;
