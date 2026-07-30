// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../utils/constants';


// ✅ Doit afficher: https://swamapp-production.up.railway.app/api

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('🔑 Token ajouté à la requête');
            } else {
                console.log('⚠️ Aucun token trouvé');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du token:', error);
        }

        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Erreur intercepteur requête:', error);
        return Promise.reject(error);
    }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
    (response) => {
        console.log(`✅ ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`❌ ${error.response.status} ${error.response.config?.url}`);
            console.error('📄 Erreur:', error.response.data);
        } else if (error.request) {
            console.error('❌ Pas de réponse du serveur');
            console.error('📄 URL:', error.config?.url);
            console.error('📄 BaseURL:', error.config?.baseURL);

            // ✅ Ajouter une suggestion pour résoudre le problème
            if (error.config?.baseURL?.includes('localhost') || error.config?.baseURL?.includes('127.0.0.1')) {
                console.warn('⚠️ Attention: Vous utilisez localhost. Assurez-vous que le backend est en cours d\'exécution.');
                console.warn('   Si vous êtes sur un vrai appareil, utilisez l\'IP de votre ordinateur.');
            }
        } else {
            console.error('❌ Erreur:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;