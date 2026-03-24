// context/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import api from '../services/api';

// 1. Création et EXPORT du contexte
export const AuthContext = createContext(null);

// 2. Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            console.log('🔍 Chargement du user...');
            const token = await AsyncStorage.getItem('token');
            console.log('🔑 Token trouvé:', token ? 'oui' : 'non');

            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await api.get('/profile');
                console.log('✅ Profil chargé:', response.data);
                setUser(response.data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.log('❌ Erreur chargement user:', error?.response?.data || error.message);
            await AsyncStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (telephone, mot_de_passe) => {
        try {
            console.log('🔑 Tentative login...');
            const response = await api.post('/login', { telephone, mot_de_passe });
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Réponse invalide du serveur');
            }

            await AsyncStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);

            return { success: true, user };
        } catch (error) {
            console.log('❌ Login échoué:', error?.response?.data || error.message);
            return {
                success: false,
                message: error?.response?.data?.message || 'Erreur de connexion'
            };
        }
    };

    const register = async (telephone, mot_de_passe, nom = '') => {
        try {
            console.log('📝 Tentative inscription:', { telephone, nom });

            const response = await api.post('/register', {
                telephone,
                mot_de_passe,
                nom
            });

            console.log('✅ Réponse backend:', response.data);

            if (response.data.token) {
                await AsyncStorage.setItem('token', response.data.token);
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                setUser(response.data.user);
                return { success: true, user: response.data.user };
            }

            return { success: false, message: 'Pas de token reçu' };

        } catch (error) {
            console.log('❌ Inscription échouée:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || "Erreur d'inscription"
            };
        }
    };

    const logout = async () => {
        console.log('🚪 Déconnexion');
        try {
            await AsyncStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } catch (error) {
            console.log('❌ Erreur lors de la déconnexion:', error);
        }
    };

    const value = {
        user,
        isLoading,
        register,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

