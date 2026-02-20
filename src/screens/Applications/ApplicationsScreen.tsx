import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

interface ApplicationsScreenProps {
    isVisible: boolean;
    onBack?: () => void;
}

const TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

const MOCK_APPLICATIONS = [
    {
        id: '1',
        title: 'Software Engineer',
        company: 'TechCorp Solutions',
        status: 'Accepted',
        date: 'Oct 12, 2023',
    },
    {
        id: '2',
        title: 'Product Designer',
        company: 'Creative Hub',
        status: 'Pending',
        date: 'Oct 15, 2023',
    },
];

const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({ isVisible, onBack }) => {
    const [activeTab, setActiveTab] = useState('All');

    if (!isVisible) return null;

    const filteredApplications = MOCK_APPLICATIONS.filter(app =>
        activeTab === 'All' || app.status === activeTab
    );

    const renderApplicationCard = ({ item }: { item: typeof MOCK_APPLICATIONS[0] }) => (
        <View style={styles.appCard}>
            <View style={styles.appIconContainer}>
                <Ionicons name="briefcase" size={24} color="#1972ca" />
            </View>
            <View style={styles.appDetails}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.companyName}>{item.company}</Text>
                <Text style={styles.appDate}>Applied on {item.date}</Text>
            </View>
            <View style={[
                styles.statusBadge,
                item.status === 'Accepted' ? styles.statusAccepted :
                    item.status === 'Rejected' ? styles.statusRejected : styles.statusPending
            ]}>
                <Text style={[
                    styles.statusText,
                    item.status === 'Accepted' ? styles.statusTextAccepted :
                        item.status === 'Rejected' ? styles.statusTextRejected : styles.statusTextPending
                ]}>{item.status}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header
                title="My Application"
                showBackButton={false}
                showSettings={false}
            />

            <View style={styles.content}>
                <View style={styles.tabContainer}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tab,
                                activeTab === tab ? styles.activeTab : null
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab ? styles.activeTabText : null
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={filteredApplications}
                    renderItem={renderApplicationCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.appList}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color="#CCC" />
                            <Text style={styles.emptyStateText}>No applications found</Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#1972ca',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    appList: {
        paddingBottom: 100,
    },
    appCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    appIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f1f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    appDetails: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    companyName: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    appDate: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusPending: {
        backgroundColor: '#FFF9E6',
    },
    statusAccepted: {
        backgroundColor: '#F0F9F0',
    },
    statusRejected: {
        backgroundColor: '#FFF5F5',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    statusTextPending: {
        color: '#FFB800',
    },
    statusTextAccepted: {
        color: '#4CAF50',
    },
    statusTextRejected: {
        color: '#FF3B30',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
});

export default ApplicationsScreen;
