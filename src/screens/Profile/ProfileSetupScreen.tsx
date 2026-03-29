// src/screens/Profile/ProfileSetupScreen.tsx
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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import authService from '../../services/authService';

import { useNavigation } from '@react-navigation/native';

const ProfileSetupScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [bio, setBio] = useState('');
    const [skillCategory, setSkillCategory] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const user = await authService.getUser();
                if (user) {
                    setUserId(user.id || user._id || null);
                    setUsername(user.full_name || '');
                    setEmail(user.email || '');
                }
            } catch (error) {
                console.error('Error fetching user for setup:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDob(selectedDate);
        }
    };

    const validateCameroonPhone = (number: string) => {
        // Cameroon numbers usually have 9 digits (excluding +237)
        // They typically start with 6 or 2
        const reg = /^(6|2)\d{8}$/;
        return reg.test(number);
    };

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('Required', 'Please enter your phone number');
            return;
        }
        if (!validateCameroonPhone(phone)) {
            Alert.alert('Invalid Number', 'Please enter a valid 9-digit Cameroon phone number (starts with 6 or 2)');
            return;
        }
        if (!dob) {
            Alert.alert('Required', 'Please select your date of birth');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                full_name: username,
                phone_number: `+237${phone}`,
                date_of_birth: dob.toISOString().split('T')[0],
                bio: bio,
                skills: skills,
            };

            await authService.updateProfile(userId || 'me', payload);
            navigation.navigate('App');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const addSkill = () => {
        if (skillCategory.trim() && !skills.includes(skillCategory.trim())) {
            setSkills([...skills, skillCategory.trim()]);
            setSkillCategory('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1972ca" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Complete Your Profile</Text>
                <Text style={styles.headerSubtitle}>Almost there! Let's get to know you.</Text>
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
                    <View style={styles.formContainer}>
                        {/* Name (Username box) */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#9BA4B1" style={styles.leftIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Your Name"
                                    placeholderTextColor="#9BA4B1"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={[styles.inputWrapper, styles.disabledInput]}>
                                <Ionicons name="mail-outline" size={20} color="#9BA4B1" style={styles.leftIcon} />
                                <TextInput
                                    style={[styles.input, { color: '#9BA4B1' }]}
                                    value={email}
                                    editable={false}
                                />
                            </View>
                        </View>

                        {/* Phone Number (Cameroon) */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Phone Number</Text>
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
                            <Text style={styles.helperText}>Only Cameroon numbers are accepted</Text>
                        </View>

                        {/* Date of Birth with Calendar picker */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <TouchableOpacity
                                style={styles.inputWrapper}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#9BA4B1" style={styles.leftIcon} />
                                <View style={styles.dateDisplay}>
                                    <Text style={[styles.dateText, !dob && { color: '#9BA4B1' }]}>
                                        {dob ? dob.toLocaleDateString() : 'Select your birthday'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9BA4B1" style={styles.rightIcon} />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dob || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        {/* Bio (Optional) */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Bio (Optional)</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Tell us a bit about yourself..."
                                    placeholderTextColor="#9BA4B1"
                                />
                            </View>
                        </View>

                        {/* Skills (Optional) */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Skills (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={skillCategory}
                                    onChangeText={setSkillCategory}
                                    placeholder="Add a skill"
                                    placeholderTextColor="#9BA4B1"
                                    onSubmitEditing={addSkill}
                                />
                                <TouchableOpacity style={styles.addSkillIcon} onPress={addSkill}>
                                    <Ionicons name="add-circle" size={24} color="#1972ca" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.skillsList}>
                                {skills.map(skill => (
                                    <View key={skill} style={styles.skillTag}>
                                        <Text style={styles.skillTagText}>{skill}</Text>
                                        <TouchableOpacity onPress={() => removeSkill(skill)}>
                                            <Ionicons name="close-circle" size={16} color="#1972ca" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.nextButton, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>Go to Dashboard</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    header: {
        backgroundColor: '#1972ca',
        paddingHorizontal: 24,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    formContainer: {
        paddingHorizontal: 24,
        paddingTop: 30,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        height: 56,
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 10,
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    leftIcon: {
        marginRight: 0,
    },
    rightIcon: {
        marginLeft: 10,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        paddingRight: 10,
        marginRight: 5,
        height: '60%',
    },
    flagEmoji: {
        fontSize: 20,
        marginRight: 5,
    },
    countryCodeText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 5,
        fontStyle: 'italic',
    },
    dateDisplay: {
        flex: 1,
        marginLeft: 10,
    },
    dateText: {
        fontSize: 16,
        color: '#1F2937',
    },
    textAreaWrapper: {
        height: 100,
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        marginLeft: 0,
    },
    addSkillIcon: {
        padding: 5,
    },
    skillsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    skillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    skillTagText: {
        fontSize: 12,
        color: '#1972ca',
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#1972ca',
        marginHorizontal: 24,
        marginTop: 20,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ProfileSetupScreen;
