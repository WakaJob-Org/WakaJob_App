import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

interface CreateJobScreenProps {
    isVisible: boolean;
    onClose: () => void;
    onPost: (jobData: any) => void;
}

const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ isVisible, onClose, onPost }) => {
    const [jobData, setJobData] = useState({
        title: '',
        company: '',
        location: '',
        salary: '',
        category: 'Technology',
        type: 'Full-time',
        description: '',
        email: '',
        phone: '',
    });

    const handlePost = () => {
        onPost(jobData);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <Header
                    title="Post a Job"
                    showBackButton={true}
                    onBack={onClose}
                    showSettings={false}
                />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Job Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Senior Developer"
                                value={jobData.title}
                                onChangeText={(text) => setJobData({ ...jobData, title: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Company Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. TechCorp"
                                value={jobData.company}
                                onChangeText={(text) => setJobData({ ...jobData, company: text })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Location</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Lagos, NG"
                                    value={jobData.location}
                                    onChangeText={(text) => setJobData({ ...jobData, location: text })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Salary Range</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. $2k - $4k"
                                    value={jobData.salary}
                                    onChangeText={(text) => setJobData({ ...jobData, salary: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Job Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Tell us about the role..."
                                multiline
                                numberOfLines={5}
                                value={jobData.description}
                                onChangeText={(text) => setJobData({ ...jobData, description: text })}
                            />
                        </View>

                        <View style={styles.sectionDivider} />

                        <Text style={styles.sectionTitle}>Contact Info</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email for Applications</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="jobs@company.com"
                                keyboardType="email-address"
                                value={jobData.email}
                                onChangeText={(text) => setJobData({ ...jobData, email: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+234 ..."
                                keyboardType="phone-pad"
                                value={jobData.phone}
                                onChangeText={(text) => setJobData({ ...jobData, phone: text })}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.postButton} onPress={handlePost}>
                        <Text style={styles.postButtonText}>Post Job Listing</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
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
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 15,
        fontSize: 14,
        color: '#333',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    postButton: {
        backgroundColor: '#1972ca',
        marginHorizontal: 20,
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
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreateJobScreen;
