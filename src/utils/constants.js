// Constantes de l'application
export const API_URL = 'http://192.168.0.107:5000/api';

export const COLORS = {
    primary: '#FF6B6B',        // Rouge SWAM (corrigé)
    secondary: '#4ECDC4',       // Turquoise
    accent: '#FFE66D',          // Jaune
    background: '#FFFFFF',      // Blanc
    surface: '#F7F7F7',         // Gris clair
    text: '#333333',            // Texte principal
    textLight: '#666666',       // Texte secondaire
    textWhite: '#FFFFFF',       // Texte blanc
    success: '#4CAF50',         // Vert
    warning: '#FFC107',         // Jaune
    error: '#F44336',           // Rouge
    info: '#2196F3',            // Bleu
};

export const CATEGORIES = [
    { id: 'ingredients', name: 'Ingrédients', icon: 'restaurant' },   // basket -> restaurant
    { id: 'boissons', name: 'Boissons', icon: 'local-drink' },        // beer -> local-drink
    { id: 'poissons', name: 'Poissons', icon: 'set-meal' },           // fish -> set-meal
];

export const ORDER_STATUS = {
    EN_ATTENTE: { value: 'en_attente', label: 'En attente', color: '#FFC107' },
    PREPARATION: { value: 'preparation', label: 'En préparation', color: '#2196F3' },
    EN_COURS_LIVRAISON: { value: 'en_cours_livraison', label: 'En livraison', color: '#FF9800' },
    LIVREE: { value: 'livree', label: 'Livrée', color: '#4CAF50' },
    ANNULEE: { value: 'annulee', label: 'Annulée', color: '#F44336' },
};

// 📍 LISTE DES DESTINATIONS AVEC DISTANCES
export const DESTINATIONS = [
    {
        id: 1,
        nom: 'Sicap Liberté 6',
        adresse: 'Sicap Liberté 6, Dakar',
        telephone: '77 123 45 67',
        distance: 3500, // en mètres
        isDefault: true,
    },
    {
        id: 2,
        nom: 'Place de l\'Indépendance',
        adresse: 'Place de l\'Indépendance, Dakar',
        telephone: '78 123 45 67',
        distance: 5200,
        isDefault: false,
    },
    {
        id: 3,
        nom: 'Almadies',
        adresse: 'Route des Almadies, Dakar',
        telephone: '76 123 45 67',
        distance: 8900,
        isDefault: false,
    },
    {
        id: 4,
        nom: 'Gare Routière',
        adresse: 'Gare Routière de Dakar',
        telephone: '70 123 45 67',
        distance: 4200,
        isDefault: false,
    },
    {
        id: 5,
        nom: 'Université Cheikh Anta Diop',
        adresse: 'UCAD, Dakar',
        telephone: '75 123 45 67',
        distance: 6800,
        isDefault: false,
    },
];

// ⏰ OPTIONS DE LIVRAISON
export const DELIVERY_OPTIONS = [
    {
        id: 'asap',
        label: 'ASAP (Dès que possible)',
        description: 'Livraison immédiate',
        reduction: 0,
        icon: 'flash-on',
    },
    {
        id: '1h',
        label: 'Dans 1 heure',
        description: 'Économisez 50 FCFA',
        reduction: -50,
        icon: 'schedule',
    },
    {
        id: '3h',
        label: 'Dans 3 heures',
        description: 'Économisez 90 FCFA',
        reduction: -90,
        icon: 'schedule',
    },
    {
        id: 'plus',
        label: 'Plus tard',
        description: 'Économisez 150 FCFA',
        reduction: -150,
        icon: 'event',
    },
];

// Fonction pour calculer les frais de livraison (100 m = 150 FCFA)
export const calculateDeliveryFee = (distance) => {
    const fee = Math.ceil(distance / 100) * 150;
    return fee;
};