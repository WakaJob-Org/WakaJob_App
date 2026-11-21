
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// base guideline size (usually based on iPhone 11/12/13/14)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;


export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;   // scale width based on screen size 

export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;   // scale height based on screen size

// scale fonts, but with a moderate factor so it doesn't get too huge on tablets
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT; // check if the device is in landscape mode


export const getDimensions = () => Dimensions.get('window'); // get the current dimensions (useful for dynamic re-renders on rotation)


