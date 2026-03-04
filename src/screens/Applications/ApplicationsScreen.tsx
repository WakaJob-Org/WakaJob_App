// src/screens/Applications/ApplicationsScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import jobService from '../../services/jobService';
import ApplicationsSkeleton from '../../components/ApplicationsSkeleton';

interface ApplicationsScreenProps {
    isVisible: boolean;
    onBack?: () => void;
}

const TABS = ['All', 'Pending', 'Accepted', 'Rejected'];

const MOCK_APPLICATIONS = [
    {
        id: '1',
        title: 'Senior Product Designer',
        company: 'TechFlow Inc.',
        status: 'PENDING',
        date: 'Oct 1st, 2023',
        action: 'View Details',
    },
    {
        id: '2',
        title: 'Frontend Developer',
        company: 'Creative Solutions',
        status: 'ACCEPTED',
        date: 'Sept 28, 2023',
        action: 'Schedule Interview',
    },
    {
        id: '3',
        title: 'UX Researcher',
        company: 'Global Media Group',
        status: 'REJECTED',
        date: 'Aug 24, 2023',
        action: 'FeedBack',
    },
    {
        id: '4',
        title: 'FullStack Engineer',
        company: 'NextGen System',
        status: 'PENDING',
        date: 'Dec 25, 2023',
        action: 'View Details',
    },
];

const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({ isVisible, onBack }) => {
    const [activeTab, setActiveTab] = useState('All');
    const [applications, setApplications] = useState<any[]>(MOCK_APPLICATIONS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchApplications = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            const fetched = await jobService.getUserApplications();
            if (fetched && fetched.length > 0) {
                setApplications(fetched);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        if (isVisible) fetchApplications();
    }, [isVisible]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchApplications(true);
    }, []);

    if (!isVisible) return null;
    if (loading) return <ApplicationsSkeleton />;

    const filteredApplications = applications.filter(app => {
        if (activeTab === 'All') return true;
        return app.status.toLowerCase() === activeTab.toLowerCase();
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACCEPTED':
                return { container: styles.statusAccepted, text: styles.statusTextAccepted };
            case 'REJECTED':
                return { container: styles.statusRejected, text: styles.statusTextRejected };
            default:
                return { container: styles.statusPending, text: styles.statusTextPending };
        }
    };

    const renderApplicationCard = ({ item }: { item: typeof MOCK_APPLICATIONS[0] }) => {
        const statusStyle = getStatusStyles(item.status);

        return (
            <View style={styles.appCard}>
                <View style={styles.cardTop}>
                    <View style={styles.companyLogo}>
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>the design crew</Text>
                        </View>
                    </View>
                    <View style={styles.jobInfo}>
                        <Text style={styles.jobTitle}>{item.title}</Text>
                        <Text style={styles.companyName}>{item.company}</Text>
                    </View>
                    <View style={[styles.statusBadge, statusStyle.container]}>
                        <Text style={[styles.statusTabText, statusStyle.text]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={16} color="#9BA4B1" />
                        <Text style={styles.dateText}>Applied {item.date}</Text>
                    </View>
                    <TouchableOpacity style={styles.actionLink}>
                        <Text style={styles.actionText}>{item.action}</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#1972ca"
                            style={{ marginLeft: 2 }}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                            <Ionicons name="chevron-back" size={28} color="#1972ca" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="search-outline" size={28} color="#1972ca" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.screenTitle}>My Application</Text>
                </View>

                <View style={styles.tabsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsScroll}
                    >
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tabChip,
                                    activeTab === tab && styles.activeTabChip
                                ]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[
                                    styles.tabChipText,
                                    activeTab === tab && styles.activeTabChipText
                                ]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredApplications}
                    renderItem={renderApplicationCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.appList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#1972ca']}
                            tintColor="#1972ca"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color="#CCC" />
                            <Text style={styles.emptyStateText}>No applications found</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F7FB',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconButton: {
        padding: 5,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
    },
    tabsWrapper: {
        marginBottom: 20,
    },
    tabsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    tabChip: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeTabChip: {
        backgroundColor: '#1972ca',
        borderColor: '#1972ca',
    },
    tabChipText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabChipText: {
        color: '#FFFFFF',
    },
    appList: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    appCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    companyLogo: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoPlaceholder: {
        padding: 4,
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    jobInfo: {
        flex: 1,
        paddingTop: 2,
    },
    jobTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1972ca',
        marginBottom: 4,
    },
    companyName: {
        fontSize: 14,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusPending: {
        backgroundColor: '#FEF9C3',
    },
    statusAccepted: {
        backgroundColor: '#DCFCE7',
    },
    statusRejected: {
        backgroundColor: '#FEE2E2',
    },
    statusTabText: {
        fontSize: 11,
        fontWeight: '800',
    },
    statusTextPending: {
        color: '#854D0E',
    },
    statusTextAccepted: {
        color: '#166534',
    },
    statusTextRejected: {
        color: '#991B1B',
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 15,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 13,
        color: '#9BA4B1',
        fontWeight: '500',
    },
    actionLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1972ca'
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyStateText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9BA4B1',
    },
});

export default ApplicationsScreen;
