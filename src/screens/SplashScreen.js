// screens/SplashScreen.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import {
    Animated,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';

console.log('🎨 SplashScreen chargé, type:', typeof SplashScreen);

export default function SplashScreen({ navigation }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animation de pulse du logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Animation du slogan
        setTimeout(() => {
            Animated.timing(sloganOpacity, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }).start();
        }, 1000);

        // Vérifier l'authentification et rediriger
        const checkAuthAndRedirect = async () => {
            try {
                // Attendre 2.5 secondes
                await new Promise(resolve => setTimeout(resolve, 2500));

                // Vérifier si navigation est défini
                if (navigation && navigation.replace) {
                    const token = await AsyncStorage.getItem('token');

                    // 👉 CORRECTION : Rediriger vers Public ou Client selon le token
                    if (token) {
                        navigation.replace('Client'); // ou 'Admin' selon le rôle
                    } else {
                        navigation.replace('Public');
                    }
                } else {
                    console.log('Navigation pas encore prête');
                }
            } catch (error) {
                console.log('Erreur de vérification:', error);
                if (navigation && navigation.replace) {
                    navigation.replace('Public');
                }
            }
        };

        checkAuthAndRedirect();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            <Animated.Image
                source={require('../../assets/images/icon.png')}
                style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
                resizeMode="contain"
            />

            <Animated.Text style={[styles.slogan, { opacity: sloganOpacity }]}>
                Swam, m'a bougé m'ba
            </Animated.Text>

            <Animated.Text style={[styles.developer, { opacity: sloganOpacity }]}>
                "Application développée par la startup Pyth@cademy"
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    slogan: {
        fontSize: 18,
        fontStyle: 'italic',
        color: '#FF6B6B',
        fontWeight: '500',
        position: 'absolute',
        bottom: 80,
    },
    developer: {
        fontSize: 14,
        fontStyle: 'italic',
        fontFamily: 'monospace', // Style typewriter
        color: '#888',
        fontWeight: '400',
        position: 'absolute',
        bottom: 30,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});