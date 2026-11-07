import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Lets code outside the component tree (notification tap handlers, deep
// links) trigger navigation once the container has mounted.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
