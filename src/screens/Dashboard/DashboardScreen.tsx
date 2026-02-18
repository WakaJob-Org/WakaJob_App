import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import jobService, { Job } from '../../services/jobService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
    isVisible: boolean;
    onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ isVisible, onLogout }) => {
    if (!isVisible) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>wakajob</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLogout} style={styles.profileThumbnail}>
                        <Ionicons name="person-circle-outline" size={36} color="#1972ca" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Search & Filter Section */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={20} color="#666" />
                        <Text style={styles.searchText}>Search for jobs...</Text>
                    </View>
                    <TouchableOpacity style={styles.filterButton}>
                        <Ionicons name="options-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    {['Design', 'Tech', 'Marketing', 'Finance'].map((cat, i) => (
                        <TouchableOpacity key={i} style={[styles.categoryCard, i === 0 && styles.activeCategoryCard]}>
                            <Text style={[styles.categoryText, i === 0 && styles.activeCategoryText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Featured Jobs */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Featured Jobs</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {[1, 2, 3].map((item) => (
                    <TouchableOpacity key={item} style={styles.jobCard}>
                        <View style={styles.jobIcon}>
                            <Ionicons name="briefcase" size={24} color="#1972ca" />
                        </View>
                        <View style={styles.jobDetails}>
                            <Text style={styles.jobTitle}>UI/UX Designer</Text>
                            <Text style={styles.companyName}>Wakajob Inc.</Text>
                            <View style={styles.jobMeta}>
                                <Text style={styles.jobLocation}>Remote</Text>
                                <Text style={styles.jobSalary}>$80k - $120k</Text>
                            </View>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="bookmark-outline" size={24} color="#666" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="briefcase" size={24} color="#1972ca" />
                    <Text style={[styles.navText, { color: '#1972ca' }]}>Jobs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="bookmark-outline" size={24} color="#666" />
                    <Text style={styles.navText}>Saved</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="document-text-outline" size={24} color="#666" />
                    <Text style={styles.navText}>Applications</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="person-outline" size={24} color="#666" />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
    },
    logoText: {
        fontSize: 32,
        fontFamily: 'Pacifico-Regular',
        color: '#1972ca',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    profileThumbnail: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        paddingHorizontal: 15,
        height: 52,
        borderRadius: 14,
        marginRight: 12,
    },
    searchText: {
        marginLeft: 10,
        color: '#999',
        fontSize: 15,
    },
    filterButton: {
        width: 52,
        height: 52,
        backgroundColor: '#1972ca',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1972ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    seeAll: {
        fontSize: 14,
        color: '#1972ca',
        fontWeight: '600',
    },
    categoriesScroll: {
        marginBottom: 30,
    },
    categoryCard: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f5f7fa',
        marginRight: 10,
    },
    activeCategoryCard: {
        backgroundColor: '#1972ca',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeCategoryText: {
        color: '#FFFFFF',
    },
    jobCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    jobIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#eef6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    jobDetails: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    companyName: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    jobMeta: {
        flexDirection: 'row',
        marginTop: 8,
    },
    jobLocation: {
        fontSize: 12,
        color: '#999',
        marginRight: 15,
    },
    jobSalary: {
        fontSize: 12,
        color: '#1972ca',
        fontWeight: '600',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: 20,
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 10,
        marginTop: 4,
        color: '#666',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        color: '#666',
        fontSize: 16,
    },
});

export default DashboardScreen;
