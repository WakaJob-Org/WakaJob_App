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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import * as ImagePicker from 'expo-image-picker';
import authService from '../../services/authService';
import ProfileSkeleton from '../../components/ProfileSkeleton';

interface ProfileScreenProps {
    isVisible: boolean;
    onBack?: () => void;
    onLogout?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ isVisible, onBack, onLogout }) => {
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

    ScreenCapture.usePreventScreenCapture();

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const user = await authService.getUser();
                if (user) {
                    setUserId(user.id || user._id || null);
                    setUsername(user.full_name || user.username || '');
                    setEmail(user.email || '');
                    setProfilePhoto(user.profile_photo || null);
                    if (user.bio) setBio(user.bio);
                    if (user.phone) setPhone(user.phone);
                    if (user.skills && Array.isArray(user.skills)) {
                        setSkills(user.skills.map((s: any) => ({ id: Math.random().toString(), name: s })));
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setTimeout(() => setLoading(false), 800);
            }
        };

        if (isVisible) fetchProfile();
    }, [isVisible]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const updateData = {
                full_name: username,
                bio: bio,
                phone: phone,
                skills: skills.map(s => s.name),
            };

            await authService.updateProfile(userId || 'me', updateData);
            Alert.alert('Success', 'Profile updated successfully');
            if (onBack) onBack();
        } catch (error: any) {
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
            Alert.alert('Permission mapping', 'We need camera roll permissions to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfilePhoto(result.assets[0].uri);
        }
    };

    if (!isVisible) return null;
    if (loading) return <ProfileSkeleton />;

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={onBack} style={styles.headerIconButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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
                >
                    {/* Profile Picture Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            {profilePhoto ? (
                                <Image
                                    source={{ uri: profilePhoto }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[styles.avatar, styles.avatarInitialsContainer]}>
                                    <Text style={styles.avatarInitialsText}>{avatarInitials}</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.cameraBadge} onPress={pickImage}>
                                <Ionicons name="camera" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={pickImage}>
                            <Text style={styles.changePictureText}>Change Profile Picture</Text>
                        </TouchableOpacity>
                    </View>

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

                        {/* Date of Birth */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={dob}
                                    onChangeText={setDob}
                                    placeholder="MM/DD/YYYY"
                                    placeholderTextColor="#9BA4B1"
                                />
                                <Ionicons name="calendar-outline" size={20} color="#9BA4B1" style={styles.fieldIcon} />
                            </View>
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
                            <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
                                <Ionicons name="mail-outline" size={20} color="#9BA4B1" style={styles.leftIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Email address"
                                    placeholderTextColor="#9BA4B1"
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#9BA4B1" style={styles.leftIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Phone number"
                                    placeholderTextColor="#9BA4B1"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Bottom Button */}
                    <TouchableOpacity
                        style={[styles.saveChangesBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={styles.saveChangesText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>

                    {onLogout && (
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            onPress={() => {
                                Alert.alert(
                                    'Logout',
                                    'Are you sure you want to log out?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Logout', style: 'destructive', onPress: onLogout }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    )}
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
        marginBottom: 12,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#F3F4F6',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        backgroundColor: '#1972ca',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    changePictureText: {
        fontSize: 14,
        color: '#1972ca',
        fontWeight: '600',
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
        fontSize: 42,
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
});

export default ProfileScreen;
