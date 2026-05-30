// src/screens/Profile/ProfileScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import authService from '../../services/authService';
import ProfileSkeleton from '../../components/ProfileSkeleton';
import * as ImageManipulator from 'expo-image-manipulator';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen: React.FC = () => {
    const { logout, refreshUser } = useAuth();
    const navigation = useNavigation<any>();
    const [username, setUsername] = useState('');
    const [dob, setDob] = useState('March 15, 1992');
    const [bio, setBio] = useState('Passionate UX designer with 5+ years of experience');
    const [skillCategory, setSkillCategory] = useState('UX/UI Design');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('+1 (555) 123-4567');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dobDate, setDobDate] = useState<Date>(new Date());
    const [role, setRole] = useState<string>('worker');
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    ScreenCapture.usePreventScreenCapture();

    useFocusEffect(
        React.useCallback(() => {
            const fetchProfile = async (isManualRefresh = false) => {
                // If we've already loaded once and this isn't a manual pull-to-refresh, skip the fetch
                if (hasLoadedOnce && !isManualRefresh) {
                    setLoading(false);
                    return;
                }

                try {
                    if (isManualRefresh) {
                        setRefreshing(true);
                    } else {
                        setLoading(true);
                    }
                    
                    // Force a fresh fetch of user data including verification status
                    await refreshUser();
                    const user = await authService.getUser(); // This returns the refreshed data
                    
                    if (user) {
                        setUserId(user.id || user._id || null);
                        setUsername(user.full_name || user.username || '');
                        setEmail(user.email || '');
                        setProfilePhoto(user.profile_image_url || null);
                        if (user.bio) setBio(user.bio);
                        if (user.phone_number) setPhone(user.phone_number.replace('+237', ''));
                        if (user.date_of_birth) {
                            setDob(user.date_of_birth);
                            try {
                                setDobDate(new Date(user.date_of_birth));
                            } catch (e) { }
                        }
                        if (user.skills && Array.isArray(user.skills)) {
                            setSkills(user.skills.map((s: any) => ({ id: Math.random().toString(), name: s })));
                        }
                        setRole(user.role || 'worker');
                        
                        // Robust verification check: handle both boolean and status string
                        const status = String(user.verification_status || '').toLowerCase();
                        const verified = user.is_verified || status === 'approved';
                        
                        setIsVerified(verified);
                        setVerificationStatus(status || (verified ? 'approved' : null));
                        
                        // Check rejection_reason directly (consolidated field)
                        const reason = user.rejection_reason || user.reason_reject || user.reasons_reject || user.rejection_message || user.reason || user.notes || null;
                        setRejectionReason(reason);

                        // Mark as loaded so we don't fetch automatically again
                        setHasLoadedOnce(true);
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            };

            fetchProfile();
            return () => {}; // Cleanup
        }, [userId, hasLoadedOnce])
    );

    // Manual refresh handler for Pull-to-Refresh
    const onRefresh = React.useCallback(async () => {
        // We pass true to indicate this is a manual refresh that should ignore the hasLoadedOnce flag
        const refreshProfile = async () => {
            try {
                setRefreshing(true);
                await refreshUser();
                const user = await authService.getUser();
                if (user) {
                    setUsername(user.full_name || user.username || '');
                    setEmail(user.email || '');
                    setProfilePhoto(user.profile_image_url || null);
                    if (user.bio) setBio(user.bio);
                    if (user.phone_number) setPhone(user.phone_number.replace('+237', ''));
                    if (user.date_of_birth) setDob(user.date_of_birth);
                    if (user.skills && Array.isArray(user.skills)) {
                        setSkills(user.skills.map((s: any) => ({ id: Math.random().toString(), name: s })));
                    }
                    setRole(user.role || 'worker');
                    const status = String(user.verification_status || '').toLowerCase();
                    const verified = user.is_verified || status === 'approved';
                    setIsVerified(verified);
                    setVerificationStatus(status || (verified ? 'approved' : null));
                    const reason = user.rejection_reason || user.reason_reject || user.reasons_reject || user.rejection_message || user.reason || user.notes || null;
                    setRejectionReason(reason);
                }
            } catch (error) {
                console.error('Manual refresh error:', error);
            } finally {
                setRefreshing(false);
            }
        };
        refreshProfile();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);

            // Determine if we are sending a local file or just JSON
            const isLocalFile = profilePhoto && (profilePhoto.startsWith('file://') || profilePhoto.startsWith('content://'));

            let payload: any;

            if (isLocalFile) {
                // Use FormData for robust file upload
                const formData = new FormData();
                formData.append('full_name', username);
                formData.append('bio', bio);
                formData.append('phone_number', phone.startsWith('+237') ? phone : `+237${phone}`);
                formData.append('date_of_birth', dob);

                // Many backends prefer arrays as JSON strings in FormData
                formData.append('skills', JSON.stringify(skills.map(s => s.name)));

                if (profilePhoto) {
                    const uri = profilePhoto;
                    const filename = uri.split('/').pop() || 'profile.jpg';
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;

                    const fileObj = {
                        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                        name: filename,
                        type,
                    };

                    // Try 'profile_image' first, as suggested by your logs
                    formData.append('profile_image', fileObj as any);
                }
                payload = formData;
            } else {
                // Standard JSON payload for text-only updates
                payload = {
                    full_name: username,
                    bio: bio,
                    phone_number: phone.startsWith('+237') ? phone : `+237${phone}`,
                    date_of_birth: dob,
                    skills: skills.map(s => s.name),
                    ...(profilePhoto && !profilePhoto.startsWith('http') && { profile_image_url: profilePhoto })
                };
            }

            console.log('--- SAVING PROFILE ---', isLocalFile ? 'FORM DATA' : 'JSON');
            
            let finalPayload = payload;

            if (isLocalFile && profilePhoto) {
                // Resize and compress even profile pictures - prevents large payload issues on some devices
                try {
                    const manipResult = await ImageManipulator.manipulateAsync(
                        profilePhoto,
                        [{ resize: { width: 700 } }], // Optimized to 700px for unstable mobile connections
                        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    
                    const uri = manipResult.uri;
                    
                    // Robust FormData reconstruction
                    const formData = new FormData();
                    formData.append('full_name', username);
                    formData.append('bio', bio);
                    formData.append('phone_number', phone.startsWith('+237') ? phone : `+237${phone}`);
                    formData.append('date_of_birth', dob);
                    formData.append('skills', JSON.stringify(skills.map(s => s.name)));
                    
                    formData.append('profile_image', {
                        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                        name: 'profile_update.jpg', // Standardized filename for high compatibility
                        type: 'image/jpeg', // ImageManipulator outputs JPEG
                    } as any);
                    
                    finalPayload = formData;
                } catch (manipError) {
                    console.warn('Image manipulation failed for profile, using original:', manipError);
                }
            }

            await authService.updateProfile(userId || 'me', finalPayload);

            // Refresh the global user context so other screens (like Home) update immediately
            await refreshUser();

            // Immediate navigation without popup for smoother UX
            setIsEditing(false);
        } catch (error: any) {
            console.error('Save profile error:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const insets = useSafeAreaInsets();
    const avatarInitials = getInitials(username);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need camera roll permissions to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0].uri) {
            setProfilePhoto(result.assets[0].uri);
            
            // If we are in view mode, trigger an immediate save for a better UX
            if (!isEditing) {
                // We use setTimeout to allow the state to update before handleSave runs
                setTimeout(() => {
                    handleSave();
                }, 100);
            }
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDobDate(selectedDate);
            setDob(selectedDate.toISOString().split('T')[0]);
        }
    };

    if (loading) return <ProfileSkeleton />;

    if (!isEditing) {
        return (
            <View style={styles.container}>
                {/* View Mode Header */}
                <View style={[styles.viewHeader, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.viewHeaderTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.viewScrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1972ca']}
                            tintColor={'#1972ca'}
                        />
                    }
                >
                    {/* Top Card */}
                    <View style={styles.profileCard}>
                        <TouchableOpacity 
                            style={styles.profileAvatarWrapper} 
                            onPress={pickImage}
                            activeOpacity={0.8}
                        >
                             {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={styles.viewAvatar} />
                            ) : (
                                <View style={[styles.viewAvatar, styles.avatarInitialsContainer]}>
                                    <Text style={styles.avatarInitialsText}>{avatarInitials}</Text>
                                </View>
                            )}
                            <View style={styles.viewCameraBadge}>
                                <Ionicons name="camera" size={14} color="#FFFFFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.viewName}>{username || 'Unknown User'}</Text>
                        <Text style={styles.viewRole}>{email || 'No email provided'}</Text>
                        {isVerified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                                <Text style={styles.verifiedBadgeText}>Verified Account</Text>
                            </View>
                        )}
                        <View style={styles.actionButtonsContainer}>
                            {isVerified ? (
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.actionButtonPrimary, { width: '75%', height: 48, flex: 0 }]}
                                    onPress={() => navigation.navigate('CreateJob')}
                                >
                                    <Ionicons name="add-circle" size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Post a Job</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.actionButtonUnverified, { flex: 1, height: 50 }]} 
                                    onPress={() => {
                                        if (String(verificationStatus).toLowerCase() === 'pending') {
                                            navigation.navigate('VerificationPending');
                                        } else if (String(verificationStatus).toLowerCase() === 'rejected') {
                                            navigation.navigate('VerificationFailed', { reason: rejectionReason });
                                        } else {
                                            navigation.navigate('EmployerVerification');
                                        }
                                    }}
                                >
                                    <Ionicons name="shield-outline" size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Verify Account</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* List Items */}
                    <View style={styles.listContainer}>
                        {!isVerified && (
                            <TouchableOpacity style={styles.listItem} onPress={() => {
                                    if (String(verificationStatus).toLowerCase() === 'pending') {
                                        navigation.navigate('VerificationPending');
                                    } else if (String(verificationStatus).toLowerCase() === 'rejected') {
                                        navigation.navigate('VerificationFailed', { reason: rejectionReason });
                                    } else {
                                        navigation.navigate('EmployerVerification');
                                    }
                                }}>
                                <View style={styles.listLeft}>
                                    <Ionicons name="checkmark-circle-outline" size={24} color="#1972ca" />
                                    <View>
                                        <Text style={styles.listItemText}>Verification</Text>
                                        {verificationStatus && (
                                            <Text style={[
                                                styles.listStatusText,
                                                String(verificationStatus).toLowerCase() === 'pending' ? { color: '#F97316' } :
                                                String(verificationStatus).toLowerCase() === 'rejected' ? { color: '#EF4444' } :
                                                { color: '#64748B' }
                                            ]}>
                                                {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.listPlusBadge}>
                                    <Ionicons name="add" size={16} color="#1972ca" />
                                </View>
                            </TouchableOpacity>
                        )}

                        {isVerified && (
                            <TouchableOpacity style={[styles.listItem, { backgroundColor: '#DCFCE7' }]} onPress={() => navigation.navigate('EmployerDashboard')}>
                                <View style={styles.listLeft}>
                                    <Ionicons name="stats-chart-outline" size={24} color="#22C55E" />
                                    <Text style={[styles.listItemText, { color: '#166534' }]}>Employer Page</Text>
                                </View>
                                <View style={[styles.listPlusBadge, { backgroundColor: '#BBF7D0' }]}>
                                    <Ionicons name="chevron-forward" size={16} color="#22C55E" />
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Settings')}>
                            <View style={styles.listLeft}>
                                <Ionicons name="settings-outline" size={24} color="#1972ca" />
                                <Text style={styles.listItemText}>Settings</Text>
                            </View>
                            <View style={styles.listPlusBadge}>
                                <Ionicons name="chevron-forward" size={16} color="#1972ca" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.listItem} onPress={() => setIsEditing(true)}>
                            <View style={styles.listLeft}>
                                <Ionicons name="briefcase-outline" size={24} color="#1972ca" />
                                <Text style={styles.listItemText}>My work details</Text>
                            </View>
                            <View style={styles.listPlusBadge}>
                                <Ionicons name="chevron-forward" size={16} color="#1972ca" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.viewLogoutBtn}
                        onPress={() => {
                            Alert.alert(
                                'Logout',
                                'Are you sure you want to log out?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', style: 'destructive', onPress: logout }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.viewLogoutText}>Logout</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.headerIconButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving}>
                        <Text style={[styles.headerSaveText, saving && { opacity: 0.5 }]}>
                            {saving ? '...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1972ca']} // Android
                            tintColor={'#1972ca'} // iOS
                        />
                    }
                >


                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        {/* Username */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter username"
                                    placeholderTextColor="#9BA4B1"
                                />
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <TextInput
                                    style={styles.input}
                                    value={dob}
                                    editable={false}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9BA4B1"
                                />
                                <Ionicons name="calendar-outline" size={20} color="#9BA4B1" style={styles.fieldIcon} />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dobDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        {/* Short Bio */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Short Bio</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={250}
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor="#9BA4B1"
                                />
                            </View>
                            <Text style={styles.charCount}>{bio.length}/250 characters</Text>
                        </View>

                        {/* Skill Category */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Skill Category</Text>
                            <View style={[styles.inputWrapper, { marginBottom: 10 }]}>
                                <TextInput
                                    style={styles.input}
                                    value={skillCategory}
                                    onChangeText={setSkillCategory}
                                    placeholder="e.g. UX/UI Design"
                                    placeholderTextColor="#9BA4B1"
                                />
                                <Ionicons name="chevron-down" size={20} color="#9BA4B1" style={styles.fieldIcon} />
                            </View>

                            {/* Dynamic Skills List */}
                            <View style={styles.skillsList}>
                                {skills.map(skill => (
                                    <View key={skill.id} style={styles.skillTag}>
                                        <Text style={styles.skillTagText}>{skill.name}</Text>
                                        <TouchableOpacity onPress={() => setSkills(prev => prev.filter(s => s.id !== skill.id))}>
                                            <Ionicons name="close-circle" size={16} color="#1972ca" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.addSkillBtn}
                                onPress={() => {
                                    if (skillCategory.trim()) {
                                        setSkills(prev => [...prev, { id: Math.random().toString(), name: skillCategory }]);
                                        setSkillCategory('');
                                    }
                                }}
                            >
                                <Ionicons name="add" size={18} color="#1972ca" />
                                <Text style={styles.addSkillText}>Add Skill</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Contact Information */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Contact Information</Text>
                            <View style={[styles.inputWrapper, styles.disabledInput, { marginBottom: 12 }]}>
                                <Ionicons name="mail-outline" size={20} color="#9BA4B1" style={styles.leftIcon} />
                                <TextInput
                                    style={[styles.input, { color: '#9BA4B1' }]}
                                    value={email}
                                    editable={false}
                                    placeholder="Email address"
                                    placeholderTextColor="#9BA4B1"
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <View style={styles.countryCodeContainer}>
                                    <Text style={styles.flagEmoji}>🇨🇲</Text>
                                    <Text style={styles.countryCodeText}>+237</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="6xx xxx xxx"
                                    placeholderTextColor="#9BA4B1"
                                    keyboardType="phone-pad"
                                    maxLength={9}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <View style={{ paddingVertical: 40, paddingHorizontal: 20 }}>
                        <TouchableOpacity
                            style={[styles.saveChangesBtn, saving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={styles.saveChangesText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#1972ca',
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerIconButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSaveText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 120, // Pad for bottom navigation bar
        paddingTop: 30,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#F3F4F6',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#1972ca',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    changePictureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    changePictureText: {
        fontSize: 14,
        color: '#1972ca',
        fontWeight: '700',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        paddingHorizontal: 15,
        height: 48,
        fontSize: 15,
        color: '#1F2937',
    },
    textAreaWrapper: {
        height: 110,
        alignItems: 'flex-start',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    fieldIcon: {
        marginRight: 15,
    },
    leftIcon: {
        marginLeft: 15,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        paddingRight: 10,
        marginLeft: 10,
        marginRight: 5,
        height: '60%',
    },
    flagEmoji: {
        fontSize: 18,
        marginRight: 4,
    },
    countryCodeText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    charCount: {
        fontSize: 12,
        color: '#9BA4B1',
        textAlign: 'right',
        marginTop: 6,
    },
    addSkillBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addSkillText: {
        fontSize: 12,
        color: '#1972ca',
        fontWeight: '600',
        marginLeft: 4,
    },
    saveChangesBtn: {
        backgroundColor: '#1972ca',
        marginHorizontal: 20,
        marginTop: 10,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    saveChangesText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF3B30',
        backgroundColor: '#FFF9F9',
        gap: 8,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    avatarInitialsContainer: {
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialsText: {
        color: '#FFFFFF',
        fontSize: 54,
        fontWeight: 'bold',
    },
    skillsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    skillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    skillTagText: {
        fontSize: 12,
        color: '#1972ca',
        fontWeight: '600',
    },
    employerSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 20,
    },
    employerControls: {
        flexDirection: 'row',
        gap: 12,
    },
    employerDashboardBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1972ca',
        height: 50,
        borderRadius: 12,
        gap: 8,
    },
    employerBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    postJobShortBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0F2FE',
        height: 50,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#1972ca',
    },
    postJobShortText: {
        color: '#1972ca',
        fontSize: 15,
        fontWeight: '700',
    },
    sectionDivider: {
        height: 8,
        backgroundColor: '#F3F4F6',
        marginVertical: 10,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        gap: 10,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F97316',
        flex: 1,
    },
    applicationSectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#4B5563',
        marginBottom: 10,
        marginTop: 5,
    },
    activeApplicationBanner: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 15,
        padding: 16,
        marginTop: 0,
    },
    applicationIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    applicationTitleText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    applicationStatusText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    verificationShortcut: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 15,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    verificationShortcutTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    verificationShortcutStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 1,
    },
    statusBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusBadgeVerified: { backgroundColor: '#22C55E' },
    statusBadgePending: { backgroundColor: '#F97316' },
    statusBadgeRejected: { backgroundColor: '#EF4444' },
    statusBadgeNotStarted: { backgroundColor: '#64748B' },
    
    // --- New View Mode Styles ---
    viewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    viewHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    viewScrollContent: {
        paddingBottom: 120,
        paddingHorizontal: 20,
        paddingTop: 45, // Space for overlapping avatar
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 25,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    profileAvatarWrapper: {
        marginTop: -40,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        borderRadius: 55,
        backgroundColor: '#FFFFFF',
        marginBottom: 15,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        position: 'relative', // Added position relative
    },
    viewCameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1972ca',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    viewAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
    },
    viewName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    viewRole: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 10, // Reduced from 25 to accommodate the badge
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 25,
    },
    verifiedBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#22C55E',
    },
    listStatusText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 10,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
        paddingHorizontal: 10,
        marginTop: 5,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    actionButtonVerified: { backgroundColor: '#22C55E' },
    actionButtonPending: { backgroundColor: '#F97316' },
    actionButtonRejected: { backgroundColor: '#EF4444' },
    actionButtonUnverified: { backgroundColor: '#64748B' },
    actionButtonPrimary: { backgroundColor: '#1972ca' },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    actionButtonPostJob: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#E0F2FE',
        borderWidth: 1,
        borderColor: '#1972ca',
        gap: 6,
    },
    actionButtonPostJobText: {
        color: '#1972ca',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listContainer: {
        gap: 12,
        marginBottom: 30,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 16,
    },
    listLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    listItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    listPlusBadge: {
        backgroundColor: '#E0F2FE',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewLogoutBtn: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    viewLogoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
