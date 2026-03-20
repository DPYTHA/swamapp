// hooks/useNotifications.js
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import notificationService from '../services/notification.service';
import { useAuth } from './useAuth';

export const useNotifications = () => {
    const { user } = useAuth();
    const navigation = useNavigation();

    useEffect(() => {
        if (!user) return;

        // 1. Enregistrer le token quand l'utilisateur se connecte
        notificationService.registerForPushNotificationsAsync(user.id, user.role);

        // 2. Configurer les écouteurs
        const { notificationListener, responseListener } =
            notificationService.setupNotificationListeners(navigation);

        // 3. Nettoyage des écouteurs
        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, [user]); // Se relance quand l'utilisateur change
};