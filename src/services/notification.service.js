// src/services/notification.service.js
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api'; // Votre instance axios

// 1. Configuration du gestionnaire pour le comportement en premier-plan
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {

    // Fonction pour enregistrer le token sur le serveur
    // src/services/notification.service.js

    async registerForPushNotificationsAsync(userId, userRole) {
        console.log('🚀 ===== DÉBUT ENREGISTREMENT NOTIFICATION =====');
        console.log('👤 User ID:', userId, 'Rôle:', userRole);

        let token;

        // Vérifier si on est sur un appareil physique
        if (!Device.isDevice) {
            console.log('❌ Les notifications push nécessitent un appareil physique');
            return;
        }
        console.log('✅ Appareil physique détecté');

        // Demander les permissions
        try {
            console.log('🔑 Vérification des permissions...');
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log('📊 Statut permission existant:', existingStatus);

            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                console.log('🔑 Demande de permission...');
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('📊 Nouveau statut:', status);
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Permission refusée par l\'utilisateur');
                return;
            }
            console.log('✅ Permission accordée');
        } catch (permError) {
            console.log('❌ Erreur lors de la demande de permission:', permError);
            return;
        }

        // Obtenir le token Expo
        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
            console.log('📋 Project ID:', projectId);

            if (!projectId) {
                console.log('⚠️ Project ID non trouvé. Vérifiez votre configuration EAS dans app.json');
                // Essayer sans projectId (certaines versions d'Expo Go)
                token = (await Notifications.getExpoPushTokenAsync()).data;
            } else {
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            }

            console.log('✅ Token Expo obtenu:', token);
        } catch (e) {
            console.log('❌ Erreur lors de l\'obtention du token:', e);
            return;
        }

        // Configurer le canal Android
        if (Platform.OS === 'android') {
            try {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
                await Notifications.setNotificationChannelAsync('new-orders', {
                    name: 'Nouvelles commandes',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF6B6B',
                    sound: 'notification.wav',
                });
                console.log('✅ Canaux Android configurés');
            } catch (channelError) {
                console.log('⚠️ Erreur configuration canaux:', channelError);
            }
        }

        // Envoyer le token à votre backend Flask
        try {
            console.log('📤 Envoi du token au backend...');
            const payload = {
                userId: userId,
                token: token,
                role: userRole,
                platform: Platform.OS,
            };
            console.log('📦 Payload:', payload);

            const response = await api.post('/notifications/register-token', payload);
            console.log('✅ Réponse backend:', response.data);
            console.log('✅ Token enregistré avec succès sur le backend');
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du token au backend:');
            console.error('  - Status:', error.response?.status);
            console.error('  - Data:', error.response?.data);
            console.error('  - Message:', error.message);
        }

        console.log('🏁 ===== FIN ENREGISTREMENT =====');
        return token;
    }
    // Fonction pour configurer les écouteurs de notification
    setupNotificationListeners(navigation) {
        // Écouteur pour les notifications reçues pendant que l'app est ouverte
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification reçue en premier-plan:', notification);
        });

        // Écouteur pour quand l'utilisateur clique sur la notification
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification cliquée:', response);
            const { data } = response.notification.request.content;

            // Gérer la navigation en fonction des données de la notification
            if (data) {
                if (data.type === 'new_order' && data.orderId) {
                    // Naviguer vers les détails de la commande (pour l'admin)
                    navigation.navigate('OrderDetailsAdmin', { orderId: data.orderId });
                } else if (data.type === 'livreur_order_available' && data.orderId) {
                    // Naviguer vers la livraison disponible (pour le livreur)
                    navigation.navigate('DeliveryDetail', { deliveryId: data.orderId });
                }
            }
        });

        // Retourner les listeners pour pouvoir les nettoyer plus tard
        return { notificationListener, responseListener };
    }
}

export default new NotificationService();