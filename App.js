// App.js - Version avec CartProvider
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext'; // 👈 AJOUTÉ
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
    useEffect(() => {
        const hideSplash = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await SplashScreen.hideAsync();
        };
        hideSplash();
    }, []);

    return (
        <SafeAreaProvider>
            <AuthProvider>
                <CartProvider>
                    <NavigationContainer>
                        <AppNavigator />
                    </NavigationContainer>
                </CartProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}