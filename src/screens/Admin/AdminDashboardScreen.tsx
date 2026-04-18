import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import adminService, { VerificationSubmission } from '../../services/adminService';
import Header from '../../components/Header';

const AdminDashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [pendingUsers, setPendingUsers] = useState<VerificationSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPendingData = async () => {
        try {
            const data = await adminService.getPendingVerifications();
            setPendingUsers(data);
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingData();
    };

    const renderUserItem = ({ item }: { item: VerificationSubmission }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('AdminVerificationDetail', { user: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                        {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.full_name || 'Anonymous User'}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PENDING</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.footerDate}>
                        {new Date(item.submitted_at || Date.now()).toLocaleDateString()}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9BA4B1" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header 
                title="Review Center" 
                showBackButton={true} 
                onBackPress={() => navigation.goBack()}
                showSettings={false} 
            />
            
            <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={styles.statNumber}>{pendingUsers.length}</Text>
                    <Text style={styles.statLabel}>Pending Reviews</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={styles.statNumber}>-</Text>
                    <Text style={styles.statLabel}>Approved Today</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1972ca" />
                    <Text style={styles.loadingText}>Fetching applications...</Text>
                </View>
            ) : (
                <FlatList
                    data={pendingUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1972ca" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-done-circle" size={80} color="#E2E8F0" />
                            <Text style={styles.emptyText}>All caught up!</Text>
                            <Text style={styles.emptySubText}>There are no pending verification requests at the moment.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 12,
    },
    statBox: {
        flex: 1,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#1972ca',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    userEmail: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D97706',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerDate: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 15,
    },
    emptySubText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});

export default AdminDashboardScreen;
