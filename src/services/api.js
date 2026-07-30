// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../utils/constants';

console.log('🚀 API.JS CHARGÉ');
console.log('🔍 API_URL depuis constants:', API_URL);

// ✅ URL de base correcte
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

        // ✅ CORRECTION: Afficher l'URL complète
        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Erreur intercepteur requête:', error);
        return Promise.reject(error);
    }
);
// src/services/api.js - Ajouter dans l'intercepteur
api.interceptors.request.use(
    async (config) => {
        // ✅ Afficher l'URL complète
        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log('🔍 BaseURL:', config.baseURL);
        console.log('🔍 URL:', config.url);
        return config;
    },
    (error) => Promise.reject(error)
);
// Intercepteur pour les réponses
api.interceptors.response.use(
    (response) => {
        console.log(`✅ ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.response) {
            // Le serveur a répondu avec un code d'erreur
            console.error(`❌ ${error.response.status} ${error.response.config?.url}`);
            console.error('📄 Erreur:', error.response.data);
        } else if (error.request) {
            // La requête a été faite mais pas de réponse
            console.error('❌ Pas de réponse du serveur');
            console.error('📄 URL:', error.config?.url);
            console.error('📄 BaseURL:', error.config?.baseURL);

            // ✅ Suggestion pour résoudre le problème
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