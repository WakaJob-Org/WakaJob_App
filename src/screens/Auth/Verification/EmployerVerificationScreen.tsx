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
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    Modal,
} from 'react-native';
import { jwtDecode } from 'jwt-decode';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Defensive import for MapView
let MapView: any = null;
let Marker: any = null;
try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
} catch (e) {
    console.warn('react-native-maps not found, using placeholder');
}

import authService from '../../../services/authService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

import { useNavigation, NavigationProp } from '@react-navigation/native';

const EmployerVerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [isApprenticeOpen, setIsApprenticeOpen] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const cameraRef = React.useRef<any>(null);

    // File states
    const [workLocationPic, setWorkLocationPic] = useState<string | null>(null);
    const [permitDoc, setPermitDoc] = useState<string | null>(null);
    const [idFrontPic, setIdFrontPic] = useState<string | null>(null);
    const [idBackPic, setIdBackPic] = useState<string | null>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: 4.0511, // Douala default
        longitude: 9.7679,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [detecting, setDetecting] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraTarget, setCameraTarget] = useState<string | null>(null);

    // Validation State
    const [errors, setErrors] = useState<any>({});
    const [touched, setTouched] = useState<any>({});

    const validateField = (name: string, value: any) => {
        let error = '';
        switch (name) {
            case 'bio':
                if (!value.trim()) error = 'Professional bio is required';
                else if (value.trim().split(/\s+/).length > 50) error = 'Bio must be under 50 words';
                break;
            case 'location':
                if (!value.trim()) error = 'Service location is required';
                break;
            case 'workLocationPic':
                if (!value) error = 'Photo of work location is required';
                break;
            case 'idFrontPic':
                if (!value) error = 'Front of ID card is required';
                break;
            case 'idBackPic':
                if (!value) error = 'Back of ID card is required';
                break;
            case 'permitDoc':
                if (!value) error = 'Council permit document is required';
                break;
            case 'isApprenticeOpen':
                if (value === null) error = 'Mentorship preference is required';
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    const handleFieldChange = (name: string, value: any) => {
        switch (name) {
            case 'bio': setBio(value); break;
            case 'location': setLocation(value); break;
            case 'isApprenticeOpen': setIsApprenticeOpen(value); break;
        }
        if (touched[name]) validateField(name, value);
    };

    const handleBlur = (name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const value = name === 'bio' ? bio : name === 'location' ? location : null;
        validateField(name, value);
    };

    const isFormValid = () => {
        const requiredFields = ['bio', 'location', 'isApprenticeOpen', 'workLocationPic', 'idFrontPic', 'idBackPic', 'permitDoc'];
        const currentErrors = {
            bio: validateField('bio', bio),
            location: validateField('location', location),
            isApprenticeOpen: validateField('isApprenticeOpen', isApprenticeOpen),
            workLocationPic: validateField('workLocationPic', workLocationPic),
            idFrontPic: validateField('idFrontPic', idFrontPic),
            idBackPic: validateField('idBackPic', idBackPic),
            permitDoc: validateField('permitDoc', permitDoc),
        };
        return Object.values(currentErrors).every(err => !err);
    };

    const handleAutoDetect = async () => {
        try {
            setDetecting(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions in your settings.');
                return;
            }

            const currentLoc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentLoc.coords;

            // Reverse geocode to get address
            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const formattedAddr = `${addr.streetNumber || ''} ${addr.street || ''}, ${addr.city || addr.subregion || ''}, ${addr.country || ''}`;
                setLocation(formattedAddr.trim().replace(/^,/, '').trim());
            }

            setMapRegion({
                ...mapRegion,
                latitude,
                longitude,
            });
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Could not detect your location automatically.');
        } finally {
            setDetecting(false);
        }
    };

    const pickImage = async (type: string) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need camera roll permissions to upload verification documents.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.6,
        });

        if (!result.canceled && result.assets[0].uri) {
            const uri = result.assets[0].uri;
            switch (type) {
                case 'Work Location Image': setWorkLocationPic(uri); break;
                case 'Council Permit': setPermitDoc(uri); break;
                case 'ID Front': setIdFrontPic(uri); break;
                case 'ID Back': setIdBackPic(uri); break;
            }
        }
    };

    const pickDocument = async (type: string) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets[0].uri) {
                const uri = result.assets[0].uri;
                switch(type) {
                    case 'Work Location Image': setWorkLocationPic(uri); break;
                    case 'Council Permit': setPermitDoc(uri); break;
                    case 'ID Front': setIdFrontPic(uri); break;
                    case 'ID Back': setIdBackPic(uri); break;
                }
            }
        } catch (error) {
            console.error('Document pick error:', error);
        }
    };

    const openCamera = async (target: string) => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert("Permission Required", "Camera access is required to take verification photos.");
                return;
            }
        }
        setCameraTarget(target);
        setIsCameraOpen(true);
    };

    const handleCameraCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    skipProcessing: true // Speed up capture
                });
                
                if (photo.uri) {
                    const uri = photo.uri;
                    switch (cameraTarget) {
                        case 'Work Location Image': setWorkLocationPic(uri); break;
                        case 'ID Front': setIdFrontPic(uri); break;
                        case 'ID Back': setIdBackPic(uri); break;
                    }
                    setIsCameraOpen(false);
                    validateField(cameraTarget!, uri);
                }
            } catch (error) {
                console.error("Capture error:", error);
                Alert.alert("Error", "Failed to capture photo.");
            }
        }
    };

    const handleFileUpload = (type: string) => {
        // Enforce camera for ID and Work Location
        if (type === 'Work Location Image' || type === 'ID Front' || type === 'ID Back') {
            openCamera(type);
        } else if (type === 'Council Permit') {
            // Permit can still be uploaded from gallery or documents
            Alert.alert(
                "Upload Council Permit",
                "Choose how you would like to upload your permit document",
                [
                    { text: "Take Photo", onPress: () => openCamera(type) },
                    { text: "Choose from Gallery", onPress: () => pickImage(type) },
                    { text: "Select Document / PDF", onPress: () => pickDocument(type) },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            Alert.alert("Form Invalid", "Please fill all required fields correctly.");
            return;
        }

        setLoading(true);
        try {
            // First ensure server is awake (prevents timeout on cold start)
            await authService.wakeUp();
            
            console.log('--- PREPARING DOCUMENTS (RESIZING) ---');
            
            // Helper to resize image and prepare for upload
            const processImage = async (uri: string) => {
                try {
                    const result = await ImageManipulator.manipulateAsync(
                        uri,
                        [{ resize: { width: 1200 } }], // Standard size for clear documents
                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    return result.uri;
                } catch (e) {
                    console.warn('Image manipulation failed, using original:', e);
                    return uri;
                }
            };

            const businessPhoto = await processImage(workLocationPic);
            const frontPhoto = await processImage(idFrontPic);
            const backPhoto = idBackPic ? await processImage(idBackPic) : null;
            const permit = permitDoc ? await processImage(permitDoc) : null;

            console.log('--- SUBMITTING TO BACKEND ---');

            // Prepare FormData for the backend
            const formData = new FormData();
            formData.append('company_bio', bio);
            formData.append('company_location', location);
            formData.append('is_apprentice_open', String(isApprenticeOpen));

            // Inject the ID field specifically if we can get it
            const currentToken = await SecureStore.getItemAsync('auth_token');
            if (currentToken) {
                try {
                    const decoded: any = jwtDecode(currentToken);
                    const userId = decoded.sub || decoded.id;
                    if (userId) formData.append('id', userId);
                } catch (e) {}
            }

            const appendFile = (uri: string, fieldName: string) => {
                const filename = uri.split('/').pop() || `${fieldName}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const ext = match ? match[1].toLowerCase() : 'jpg';
                
                // Correctly identify MIME type
                let type = '';
                if (ext === 'pdf') {
                    type = 'application/pdf';
                } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                    type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                } else {
                    type = 'application/octet-stream';
                }
                
                formData.append(fieldName, {
                    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                    name: filename,
                    type,
                } as any);
            };

            appendFile(businessPhoto, 'business_photo');
            appendFile(frontPhoto, 'id_front');
            if (backPhoto) appendFile(backPhoto, 'id_back');
            if (permit) appendFile(permit, 'business_certificate');

            await authService.verifyEmployer(formData);
            
            // Persist locally for immediate UI feedback
            await SecureStore.setItemAsync('employer_verification_submitted', 'true');

            Alert.alert(
                "Verification Submitted",
                "Your details have been saved successfully. Our team will review your professional status shortly.",
                [{ text: "OK", onPress: () => navigation.navigate('VerificationPending') }]
            );
        } catch (error: any) {
            console.error('Submission Failed:', error);
            const errorMessage = error.message || String(error);
            
            // Stay on the form so the user can fix errors or retry
            Alert.alert(
                "Submission Failed", 
                `The server returned an error: ${errorMessage}\n\nPlease check your internet or try again later.`,
                [{ text: "Try Again" }]
            );
        } finally {
            setLoading(false);
            console.log('--- FORM SUBMISSION COMPLETED ---');
        }
    };

    return (
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Verification</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    
                    {/* Work Location Image */}
                    <View style={styles.imageUploadSection}>
                        <TouchableOpacity
                            style={[
                                styles.mainUploadBox,
                                touched.workLocationPic && errors.workLocationPic ? styles.errorBorder : 
                                workLocationPic ? styles.successBorder : null
                            ]}
                            onPress={() => handleFileUpload("Work Location Image")}
                        >
                            <View style={styles.dashedBox}>
                                {workLocationPic ? (
                                    <View style={{ flex: 1, position: 'relative' }}>
                                        <Image source={{ uri: workLocationPic }} style={styles.uploadedImage} />
                                        <View style={styles.checkmarkBadge}>
                                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                        </View>
                                    </View>
                                ) : (
                                    <Ionicons name="cloud-upload" size={32} color="#9BA4B1" />
                                )}
                            </View>
                            <View style={[styles.cameraCircle, touched.workLocationPic && errors.workLocationPic && { backgroundColor: '#EF4444' }]}>
                                <Ionicons name="camera" size={18} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.sectionTitleCenter}>Work Location Image</Text>
                        <Text style={styles.sectionSubtitleCenter}>Upload a photo of your workspace or business location</Text>
                        {touched.workLocationPic && errors.workLocationPic && (
                            <Text style={styles.errorTextCenter}>{errors.workLocationPic}</Text>
                        )}
                    </View>

                    {/* Council Permit */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Council Permit</Text>
                        <View style={[
                            styles.permitBox,
                            touched.permitDoc && errors.permitDoc ? styles.errorBorder : 
                            permitDoc ? styles.successBorder : null
                        ]}>
                            <View style={[styles.fileIconBox, { backgroundColor: '#F0F7FF' }]}>
                                <Ionicons name="document-text" size={24} color="#1972ca" />
                            </View>
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>
                                    {permitDoc ? permitDoc.split('/').pop() : "Upload Permit Document"}
                                </Text>
                                <Text style={styles.fileHint}>pdf, jpg or png · 5mb</Text>
                            </View>
                            <TouchableOpacity style={styles.selectFileBtn} onPress={() => handleFileUpload("Council Permit")}>
                                <Text style={styles.selectFileText}>{permitDoc ? "Change" : "Select File"}</Text>
                            </TouchableOpacity>
                        </View>
                        {touched.permitDoc && errors.permitDoc && <Text style={styles.errorText}>{errors.permitDoc}</Text>}
                    </View>

                    {/* Professional Bio */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Professional Bio</Text>
                        <TextInput
                            style={[
                                styles.bioInput,
                                touched.bio && errors.bio ? styles.errorBorder : 
                                bio && !errors.bio ? styles.successBorder : null
                            ]}
                            placeholder="Briefly describe your trade experience and skills..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={bio}
                            onChangeText={(text) => handleFieldChange('bio', text)}
                            onBlur={() => handleBlur('bio')}
                        />
                        <View style={styles.bioFooter}>
                            {touched.bio && errors.bio && <Text style={styles.errorTextSmall}>{errors.bio}</Text>}
                            <Text style={[
                                styles.wordCount, 
                                bio.trim().split(/\s+/).length > 50 && { color: '#EF4444' }
                            ]}>
                                {bio.trim() === '' ? 0 : bio.trim().split(/\s+/).length}/50 words
                            </Text>
                        </View>
                    </View>

                    {/* Government ID */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Government ID Card</Text>
                        <View style={styles.idGrid}>
                            <TouchableOpacity 
                                style={[
                                    styles.idBox,
                                    touched.idFrontPic && errors.idFrontPic ? styles.errorBorder : 
                                    idFrontPic ? styles.successBorder : null
                                ]} 
                                onPress={() => handleFileUpload("ID Front")}
                            >
                                {idFrontPic ? (
                                    <View style={{ flex: 1, width: '100%', position: 'relative' }}>
                                        <Image source={{ uri: idFrontPic }} style={styles.uploadedImage} />
                                        <View style={styles.checkmarkBadgeMini}>
                                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={24} color="#9BA4B1" />
                                        <Text style={styles.idBoxText}>Frontside</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.idBox,
                                    touched.idBackPic && errors.idBackPic ? styles.errorBorder : 
                                    idBackPic ? styles.successBorder : null
                                ]} 
                                onPress={() => handleFileUpload("ID Back")}
                            >
                                {idBackPic ? (
                                    <View style={{ flex: 1, width: '100%', position: 'relative' }}>
                                        <Image source={{ uri: idBackPic }} style={styles.uploadedImage} />
                                        <View style={styles.checkmarkBadgeMini}>
                                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={24} color="#9BA4B1" />
                                        <Text style={styles.idBoxText}>Backside</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        {(touched.idFrontPic && errors.idFrontPic) || (touched.idBackPic && errors.idBackPic) ? (
                            <Text style={styles.errorText}>{errors.idFrontPic || errors.idBackPic}</Text>
                        ) : null}
                    </View>

                    {/* Service Location */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Service Location</Text>
                        <View style={[
                            styles.locationInputWrapper,
                            touched.location && errors.location ? styles.errorBorder : 
                            location && !errors.location ? styles.successBorder : null
                        ]}>
                            <Ionicons name="location" size={20} color="#1972ca" style={styles.locationIcon} />
                            <TextInput
                                style={styles.locationInput}
                                placeholder="street address, city, country"
                                value={location}
                                onChangeText={(text) => handleFieldChange('location', text)}
                                onBlur={() => handleBlur('location')}
                                placeholderTextColor="#9BA4B1"
                            />
                            {location && !errors.location && (
                                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                            )}
                        </View>
                        {touched.location && errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
                        
                        <TouchableOpacity 
                            style={styles.autoDetectBtn} 
                            onPress={handleAutoDetect}
                            disabled={detecting}
                        >
                            <Ionicons name="locate" size={20} color="#1972ca" />
                            <Text style={styles.autoDetectText}>
                                {detecting ? "Locating..." : "Auto-detect Location"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.mapContainer}>
                            {MapView ? (
                                <MapView
                                    style={styles.map}
                                    region={mapRegion}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
                                </MapView>
                            ) : (
                                <View style={[styles.map, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="map-outline" size={40} color="#9BA4B1" />
                                    <Text style={{ color: '#9BA4B1', fontSize: 12, marginTop: 8 }}>Map Preview Unavailable</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Apprentice Toggle */}
                    <View style={styles.apprenticeCard}>
                        <Text style={styles.apprenticeTitle}>Are you looking for a new apprentice?</Text>
                        <Text style={styles.apprenticeDesc}>Indicate if you are open to mentoring new talents</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={styles.checkboxWrapper}
                                onPress={() => handleFieldChange('isApprenticeOpen', true)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, isApprenticeOpen === true && styles.checkboxSelected]}>
                                    <Ionicons name="checkmark" size={18} color={isApprenticeOpen === true ? "#FFF" : "#1972ca"} />
                                    <View style={styles.checkboxLabelContainer}>
                                        <Text style={[styles.checkboxLabel, isApprenticeOpen === true && styles.checkboxLabelSelected]}>Yes</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.checkboxWrapper}
                                onPress={() => handleFieldChange('isApprenticeOpen', false)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, isApprenticeOpen === false && styles.checkboxSelected]}>
                                    <Ionicons name="close" size={18} color={isApprenticeOpen === false ? "#FFF" : "#1972ca"} />
                                    <View style={styles.checkboxLabelContainer}>
                                        <Text style={[styles.checkboxLabel, isApprenticeOpen === false && styles.checkboxLabelSelected]}>No</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        {touched.isApprenticeOpen && errors.isApprenticeOpen && (
                            <Text style={[styles.errorText, { marginTop: 10 }]}>{errors.isApprenticeOpen}</Text>
                        )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton, 
                            (loading || !isFormValid()) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={loading || !isFormValid()}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitButtonText}>Submit for Verification</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Forced Camera Modal */}
            <Modal visible={isCameraOpen} animationType="slide" transparent={false}>
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        ref={cameraRef}
                    >
                        <View style={styles.cameraOverlay}>
                            <TouchableOpacity 
                                style={styles.closeCamera} 
                                onPress={() => setIsCameraOpen(false)}
                            >
                                <Ionicons name="close" size={30} color="#FFF" />
                            </TouchableOpacity>
                            
                            <View style={styles.cameraGuide}>
                                <Text style={styles.guideText}>Center your {cameraTarget} within the frame</Text>
                                <View style={styles.cameraFrame} />
                            </View>

                            <View style={styles.cameraControls}>
                                <TouchableOpacity 
                                    style={styles.captureButton} 
                                    onPress={handleCameraCapture}
                                >
                                    <View style={styles.captureButtonInner} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </CameraView>
                </View>
            </Modal>
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
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
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
    mapContainer: {
        width: '100%',
        height: 150,
        backgroundColor: '#F1F5F9',
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 5,
    },
    mapImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    apprenticeCard: {
        backgroundColor: '#F7F9FC',
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        marginTop: 20,
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
    checkboxWrapper: {
        flex: 1,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8F0',
        paddingHorizontal: 15,
    },
    checkboxSelected: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    checkboxLabelContainer: {
        flex: 1,
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    checkboxLabelSelected: {
        color: '#FFFFFF',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    submitButton: {
        backgroundColor: '#1972ca',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9BA4B1',
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    wordCount: {
        fontSize: 11,
        color: '#9BA4B1',
        textAlign: 'right',
        fontWeight: '600',
    },
    // New Styles
    errorBorder: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
    },
    successBorder: {
        borderColor: '#22C55E',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 5,
    },
    errorTextSmall: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '500',
    },
    errorTextCenter: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 5,
        textAlign: 'center',
    },
    bioFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    checkmarkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 2,
    },
    checkmarkBadgeMini: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 1,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    closeCamera: {
        alignSelf: 'flex-start',
        padding: 10,
    },
    cameraGuide: {
        alignItems: 'center',
    },
    guideText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    cameraFrame: {
        width: width * 0.8,
        height: width * 0.6,
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 20,
        borderStyle: 'dashed',
    },
    cameraControls: {
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#FFF',
    },
});

export default EmployerVerificationScreen;
