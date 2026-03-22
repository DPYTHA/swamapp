// App.js - Version avec CartProvider et test API
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { API_URL } from './src/utils/constants'; // 👈 AJOUTÉ

SplashScreen.preventAutoHideAsync();

export default function App() {
    useEffect(() => {
        // 👇 TEST API AU DÉMARRAGE
        const testAPI = async () => {
            try {
                console.log('🔍 Test API sur:', API_URL);
                const response = await fetch(`${API_URL}/health`);
                const data = await response.json();
                console.log('✅ API OK:', data);
            } catch (error) {
                console.log('❌ API ERROR:', error.message);
            }
        };
        testAPI();

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