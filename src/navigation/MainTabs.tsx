import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ApplicationsScreen from '../screens/Applications/ApplicationsScreen';
import SavedScreen from '../screens/Saved/SavedScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ConversationsListScreen from '../screens/Chat/ConversationsListScreen';
import BottomTab, { TabType } from '../components/BottomTab';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Tab = createBottomTabNavigator<MainTabParamList>();



const MainTabs = () => {
    const { conversations } = useChat();
    const chatUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return (
        <Tab.Navigator
            tabBar={(props) => (
                <BottomTab
                    activeTab={props.state.routeNames[props.state.index].toLowerCase() as TabType}
                    chatUnreadCount={chatUnreadCount}
                    onTabPress={(tab) => {
                        const routeName = props.state.routeNames.find(
                            (name) => name.toLowerCase() === tab.toLowerCase()
                        );
                        if (routeName) {
                            props.navigation.navigate(routeName);
                        }
                    }}
                />
            )}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Jobs" component={DashboardScreen} />
            <Tab.Screen name="Saved" component={SavedScreen} />
            <Tab.Screen name="Applications" component={ApplicationsScreen} />
            <Tab.Screen name="Chat" component={ConversationsListScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabs;
