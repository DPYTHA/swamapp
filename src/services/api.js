// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../utils/constants';

console.log('🚀 API.JS CHARGÉ');
console.log('🔍 API_URL depuis constants:', API_URL);

const api = axios.create({
    baseURL: API_URL,  // ✅ https://swamapp-production.up.railway.app/api
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('🔑 Token ajouté à la requête');
            }
        } catch (error) {
            console.error('❌ Erreur token:', error);
        }
        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Erreur intercepteur:', error);
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
        } else {
            console.error('❌ Erreur:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;