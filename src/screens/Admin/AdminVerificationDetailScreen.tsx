import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/Header';
import adminService, { VerificationSubmission } from '../../services/adminService';

const AdminVerificationDetailScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { user } = route.params as { user: VerificationSubmission };
    
    const [loading, setLoading] = useState(false);
    const [rejectionModal, setRejectionModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = () => {
        Alert.alert(
            "Approve Account?",
            `Are you sure you want to verify ${user.full_name}? They will gain employer access immediately.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "YES, APPROVE", 
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await adminService.approveVerification(user.id);
                            Alert.alert("Success", "Account has been verified.");
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert("Failed", error || "Could not approve verification");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert("Error", "Please provide a reason for the rejection.");
            return;
        }

        setLoading(true);
        try {
            await adminService.rejectVerification(user.id, rejectionReason);
            Alert.alert("Done", "Verification has been rejected.");
            setRejectionModal(false);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Failed", error || "Could not reject verification");
        } finally {
            setLoading(false);
        }
    };

    const renderDocument = (title: string, uri: string) => (
        <View style={styles.docWrapper}>
            <Text style={styles.docTitle}>{title}</Text>
            {uri ? (
                <Image source={{ uri }} style={styles.docImage} resizeMode="cover" />
            ) : (
                <View style={[styles.docImage, styles.errorImage]}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    <Text style={styles.errorText}>No Image Found</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header 
                title="Application Review" 
                showBackButton={true} 
                onBackPress={() => navigation.goBack()}
                showSettings={false} 
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.userInfoSection}>
                    <Text style={styles.sectionTitle}>Employer Profile</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Name: </Text>
                        <Text style={styles.infoValue}>{user.full_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email: </Text>
                        <Text style={styles.infoValue}>{user.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location: </Text>
                        <Text style={styles.infoValue}>{user.company_location || 'Not provided'}</Text>
                    </View>
                    <View style={styles.bioContainer}>
                        <Text style={styles.infoLabel}>Company Bio: </Text>
                        <Text style={styles.bioText}>{user.company_bio || 'No bio provided'}</Text>
                    </View>
                </View>

                <View style={styles.documentsSection}>
                    <Text style={styles.sectionTitle}>Verification Documents</Text>
                    <View style={styles.docsGrid}>
                        {renderDocument("Work Location (Photo)", user.business_photo_url)}
                        {renderDocument("Council Permit (PDF/Image)", user.business_certificate_url)}
                        {renderDocument("ID Document FRONT", user.id_front_url)}
                        {renderDocument("ID Document BACK", user.id_back_url)}
                    </View>
                </View>

                <View style={styles.actionSectionOuter}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.approveBtn, loading && styles.disabledBtn]} 
                        onPress={handleApprove}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={styles.approveBtnText}>Approve Account</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn, loading && styles.disabledBtn]} 
                        onPress={() => setRejectionModal(true)}
                        disabled={loading}
                    >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                        <Text style={styles.rejectBtnText}>Reject Request</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={rejectionModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reason for Rejection</Text>
                        <Text style={styles.modalSubtitle}>The employer will see this message. Be specific about what info is missing.</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. ID Scan is too blurry or Council permit expired..."
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectionModal(false)}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={handleReject} disabled={loading}>
                                <Text style={styles.modalSubmitText}>Submit Rejection</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 15,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    userInfoSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    infoValue: {
        fontSize: 14,
        color: '#1E293B',
    },
    bioContainer: {
        marginTop: 10,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
    },
    bioText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
        marginTop: 5,
    },
    documentsSection: {
        paddingBottom: 20,
    },
    docsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
    },
    docWrapper: {
        width: '50%',
        padding: 5,
    },
    docTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    docImage: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    errorImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 10,
        color: '#9BA4B1',
        marginTop: 5,
    },
    actionSectionOuter: {
        padding: 20,
    },
    actionBtn: {
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    approveBtn: {
        backgroundColor: '#22C55E',
    },
    approveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rejectBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    rejectBtnText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 5,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 15,
        height: 100,
        textAlignVertical: 'top',
        marginTop: 15,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 15,
    },
    modalCancel: {
        padding: 10,
    },
    modalSubmit: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modalSubmitText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default AdminVerificationDetailScreen;
