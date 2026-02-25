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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

interface ProfileScreenProps {
    isVisible: boolean;
    onBack?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ isVisible, onBack }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState('Passionate UX designer with 5+ years of experience creating user-centered digital experiences. Love crafting intuitive interfaces that solve real problems.');
    const [skills, setSkills] = useState(['UI/UX Design', 'Product Strategy', 'Figma']);
    const [addingSkill, setAddingSkill] = useState(false);
    const [newSkill, setNewSkill] = useState('');

    const handleAddSkill = () => {
        const trimmed = newSkill.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
        }
        setNewSkill('');
        setAddingSkill(false);
    };

    const handleRemoveSkill = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <Header
                title="Edit Profile"
                showSettings={false}
                showBackButton={false}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.editAvatarButton}>
                                <Ionicons name="camera" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>Sarah Anderson</Text>
                        <Text style={styles.userRole}>Senior Product Designer</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>About Me</Text>
                            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                                <Text style={styles.editLink}>{isEditing ? 'Save' : 'Edit'}</Text>
                            </TouchableOpacity>
                        </View>
                        {isEditing ? (
                            <TextInput
                                style={styles.bioInput}
                                multiline
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us about yourself..."
                            />
                        ) : (
                            <Text style={styles.bioText}>{bio}</Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Skills</Text>
                        <View style={styles.skillsContainer}>
                            {skills.map((skill, index) => (
                                <View key={index} style={styles.skillBadge}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveSkill(index)}>
                                        <Ionicons name="close-circle" size={16} color="#1972ca" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {addingSkill ? (
                                <View style={styles.newSkillRow}>
                                    <TextInput
                                        style={styles.newSkillInput}
                                        value={newSkill}
                                        onChangeText={setNewSkill}
                                        placeholder="e.g. React Native"
                                        placeholderTextColor="#aaa"
                                        autoFocus
                                        onSubmitEditing={handleAddSkill}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={handleAddSkill} style={styles.confirmSkillBtn}>
                                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setAddingSkill(false); setNewSkill(''); }} style={styles.cancelSkillBtn}>
                                        <Ionicons name="close" size={18} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.addSkillButton} onPress={() => setAddingSkill(true)}>
                                    <Ionicons name="add" size={20} color="#1972ca" />
                                    <Text style={styles.addSkillText}>Add Skill</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>sarah.anderson@email.com</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>+1 (555) 123-4567</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="globe-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>www.sarahdesigns.com</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#E8F2FB',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1972ca',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    userRole: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    editLink: {
        fontSize: 14,
        color: '#1972ca',
        fontWeight: '600',
    },
    bioText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },
    bioInput: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    skillBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F2FB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    skillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1972ca',
    },
    addSkillButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1972ca',
        borderStyle: 'dashed',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    addSkillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1972ca',
    },
    newSkillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    newSkillInput: {
        borderWidth: 1,
        borderColor: '#1972ca',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
        minWidth: 100,
        backgroundColor: '#FFFFFF',
    },
    confirmSkillBtn: {
        backgroundColor: '#4CAF50',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelSkillBtn: {
        backgroundColor: '#F1F5F9',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#64748B',
    },
    saveButton: {
        backgroundColor: '#1972ca',
        marginHorizontal: 20,
        marginTop: 30,
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        marginHorizontal: 20,
        marginTop: 15,
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;
