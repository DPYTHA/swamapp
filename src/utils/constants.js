
export const API_URL = 'https://swamapp-production.up.railway.app';


export const COLORS = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    background: '#FFFFFF',
    surface: '#F7F7F7',
    text: '#333333',
    textLight: '#666666',
    textWhite: '#FFFFFF',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
};

export const CATEGORIES = [
    { id: 'ingredients', name: 'Ingrédients', icon: 'restaurant' },
    { id: 'boissons', name: 'Boissons', icon: 'local-drink' },
    { id: 'poissons', name: 'Poissons', icon: 'set-meal' },
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

    // ===== PANGO 1 =====
    {
        id: 2,
        nom: 'Pango 1',
        adresse: 'Mosquée, Assinie',
        distance: 600,
    },
    {
        id: 3,
        nom: 'Pango 1',
        adresse: 'Eglise Assemblée de Dieu, Assinie',
        distance: 900,
    },
    {
        id: 4,
        nom: 'Pango 1',
        adresse: 'Résidence Egnehué, Assinie',
        distance: 700,
    },

    // ===== PANGO 2 =====
    {
        id: 5,
        nom: 'Pango 2',
        adresse: 'Pharmacie, Assinie',
        distance: 850,
    },
    {
        id: 6,
        nom: 'Pango 2',
        adresse: 'Atelier espoir, Assinie',
        distance: 1000, // Valeur par défaut si non spécifiée
    },
    {
        id: 7,
        nom: 'Pango 2',
        adresse: 'Chez Mr Akalo, Assinie',
        distance: 1300,
    },

    // ===== EPKOUZAN =====
    {
        id: 8,
        nom: 'Epkouzan',
        adresse: 'Assinie Lodge, Assinie',
        distance: 500,
    },
    {
        id: 9,
        nom: 'Epkouzan',
        adresse: 'Campement, Assinie',
        distance: 550,
    },
    {
        id: 10,
        nom: 'Epkouzan',
        adresse: 'Milan hôtel Sominou, Assinie',
        distance: 750,
    },

    // ===== DONWAHI =====
    {
        id: 11,
        nom: 'Donwahi',
        adresse: 'Epp KPMG, Assinie',
        distance: 900,
    },
    {
        id: 12,
        nom: 'Donwahi',
        adresse: 'Essouman hôtel, Assinie',
        distance: 1000,
    },
    {
        id: 13,
        nom: 'Donwahi',
        adresse: 'Yamaman lodge, Assinie',
        distance: 1300,
    },

    // ===== VOIE PRINCIPALE =====
    {
        id: 14,
        nom: 'Voie principale',
        adresse: 'Sodeci Assinie',
        distance: 400,
    },
    {
        id: 15,
        nom: 'Voie principale',
        adresse: 'Cour royale, Assinie',
        distance: 500,
    },
    {
        id: 16,
        nom: 'Voie principale',
        adresse: 'Quai du Beach, Assinie',
        distance: 700,
    },
    {
        id: 17,
        nom: 'Voie principale',
        adresse: 'Pont, Assinie',
        distance: 1800,
    },
    {
        id: 18,
        nom: 'Voie principale',
        adresse: 'Mairie, Assinie',
        distance: 1300,
    },
    {
        id: 19,
        nom: 'Voie principale',
        adresse: 'Super marché Assinie',
        distance: 1100,
    },

    // ===== ZION =====
    {
        id: 20,
        nom: 'Zion',
        adresse: 'Assinie Beach club, Assinie',
        distance: 650,
    },
    {
        id: 21,
        nom: 'Zion',
        adresse: 'Agence Moov, Assinie',
        distance: 1200,
    },
    {
        id: 22,
        nom: 'Zion',
        adresse: 'Maison ancien chef, Assinie',
        distance: 1500,
    },
    {
        id: 23,
        nom: 'Zion',
        adresse: 'Palais bar, Assinie',
        distance: 700,
    },
    {
        id: 24,
        nom: 'Zion',
        adresse: 'Zion Hôtel, Assinie',
        distance: 1000,
    },

    // ===== VOIE DU MARCHÉ =====
    {
        id: 25,
        nom: 'Voie du marché',
        adresse: 'Au bord chez miss Olga, Assinie',
        distance: 800,
    },
    {
        id: 26,
        nom: 'Voie du marché',
        adresse: 'EPP Assinie 1A et 1B, Assinie',
        distance: 350,
    },
    {
        id: 27,
        nom: 'Voie du marché',
        adresse: 'Boulangerie, Assinie',
        distance: 400,
    },

    // ===== VOIE DU COMMISSARIAT =====
    {
        id: 28,
        nom: 'Voie du commissariat',
        adresse: 'Commissariat, Assinie',
        distance: 270,
    },
    {
        id: 29,
        nom: 'Voie du commissariat',
        adresse: 'Cité des enseignants, Assinie',
        distance: 400,
    },
    {
        id: 30,
        nom: 'Voie du commissariat',
        adresse: 'Hôtel cool Mafia, Assinie',
        distance: 600,
    },

    // ===== VOIE DU DISPENSAIRE =====
    {
        id: 31,
        nom: 'Voie du dispensaire',
        adresse: 'Dispensaire, Assinie',
        distance: 100,
    },
    {
        id: 32,
        nom: 'Voie du dispensaire',
        adresse: 'Hôtel Sandrofia, Assinie',
        distance: 300,
    },
    {
        id: 33,
        nom: 'Voie du dispensaire',
        adresse: 'Église méthodiste, Assinie',
        distance: 400,
    },

    // ===== VOIE CATHOLIQUE =====
    {
        id: 34,
        nom: 'Voie Catholique',
        adresse: 'Maternité, Assinie',
        distance: 200,
    },

    // ===== SAGBADOU =====
    {
        id: 35,
        nom: 'Sagbadou',
        adresse: 'Boutique Sagbadou, Assinie',
        distance: 1200,
    },
    {
        id: 36,
        nom: 'Sagbadou',
        adresse: 'Cimetière, Assinie',
        distance: 800,
    },
    {
        id: 37,
        nom: 'Sagbadou',
        adresse: 'Tarpon, Assinie',
        distance: 650,
    },

    // ===== ALIKRO =====
    {
        id: 38,
        nom: 'Alikro',
        adresse: 'Alikro, Assinie',
        distance: 3000,
    },

    // ===== ABISSA LODGE =====
    {
        id: 39,
        nom: 'Abissa lodge',
        adresse: 'Abissa lodge, Assinie',
        distance: 3100,
    },

    // ===== STATION =====
    {
        id: 40,
        nom: 'Station',
        adresse: 'Station, Assinie',
        distance: 2500,
    },

    // ===== N'GOAKRO =====
    {
        id: 41,
        nom: 'N\'goakro',
        adresse: 'N\'goakro, Assinie',
        distance: 2700,
    },

    // ===== CARREFOUR ESSANKRO =====
    {
        id: 42,
        nom: 'Carrefour Essankro',
        adresse: 'Carrefour Essankro, Assinie',
        distance: 2700,
    },

    // ===== BIKO LODGE =====
    {
        id: 43,
        nom: 'Biko lodge',
        adresse: 'Biko lodge, Assinie',
        distance: 6300,
    },

    // ===== RÉSIDENCE DJÉNE =====
    {
        id: 44,
        nom: 'Résidence Djéne',
        adresse: 'Résidence Djéne, Assinie',
        distance: 6400,
    },

    // ===== LE SUNSHINE LODGE =====
    {
        id: 45,
        nom: 'Le Sunshine lodge',
        adresse: 'Le Sunshine lodge, Assinie',
        distance: 7300,
    },

    // ===== MYKONOS =====
    {
        id: 46,
        nom: 'Mykonos',
        adresse: 'Mykonos, Assinie',
        distance: 7800,
    },

    // ===== L'ESCAPADE HÔTEL =====
    {
        id: 47,
        nom: 'L\'escapade hôtel',
        adresse: 'L\'escapade hôtel, Assinie',
        distance: 8800,
    },

    // ===== AKOULA KAN LODGE =====
    {
        id: 48,
        nom: 'Akoula kan lodge',
        adresse: 'Akoula kan lodge, Assinie',
        distance: 10400,
    },

    // ===== NAHIKO HÔTEL =====
    {
        id: 49,
        nom: 'Nahiko hôtel',
        adresse: 'Nahiko hôtel, Assinie',
        distance: 11300,
    },

    // ===== AKWA BEACH =====
    {
        id: 50,
        nom: 'Akwa beach',
        adresse: 'Akwa beach, Assinie',
        distance: 11600,
    },
    {
        id: 62,
        nom: 'Assinie Beach Hôtel',
        adresse: 'Assinie Beach Hôtel, Assinie',
        distance: 11600,
    },

    // ===== COUCOUÉ LODGE =====
    {
        id: 51,
        nom: 'Coucoué lodge',
        adresse: 'Coucoué lodge, Assinie',
        distance: 13400,
    },

    // ===== MARINE DE BABIHANA =====
    {
        id: 52,
        nom: 'Marine de Babihana',
        adresse: 'Marine de Babihana, Assinie',
        distance: 13500,
    },

    // ===== LE CLIMBIÉ D'ASSINIE =====
    {
        id: 53,
        nom: 'Le Climbié d\'Assinie',
        adresse: 'Le Climbié d\'Assinie, Assinie',
        distance: 15200,
    },

    // ===== HÔTEL ANDRÉ RICHARD =====
    {
        id: 58,
        nom: 'Hôtel André Richard',
        adresse: 'Hôtel André Richard, Assinie',
        distance: 15400,
    },

    // ===== VILLA TOURACO =====
    {
        id: 54,
        nom: 'Villa Touraco',
        adresse: 'Villa Touraco, Assinie',
        distance: 16000,
    },
    {
        id: 55,
        nom: 'La maison d\'Akoula',
        adresse: 'La maison d\'Akoula, Assinie',
        distance: 16000,
    },

    // ===== VILLA AKWABA =====
    {
        id: 56,
        nom: 'Villa Akwaba',
        adresse: 'Villa Akwaba, Assinie',
        distance: 16200,
    },

    // ===== ELIMAH HOUSES =====
    {
        id: 57,
        nom: 'Elimah Houses',
        adresse: 'Elimah Houses, Assinie',
        distance: 16600,
    },

    // ===== FÉLINE LODGE =====
    {
        id: 59,
        nom: 'Féline Lodge',
        adresse: 'Féline Lodge, Assinie',
        distance: 17600,
    },

    // ===== HÔTEL LE PREMIER ASSOUINDÉ =====
    {
        id: 60,
        nom: 'Hôtel le Premier Assouindé',
        adresse: 'Hôtel le Premier Assouindé, Assinie',
        distance: 18500,
    },

    // ===== NOTEVIA HÔTEL =====
    {
        id: 61,
        nom: 'Notevia Hôtel',
        adresse: 'Notevia Hôtel, Assinie',
        distance: 19000,
    },

    // ===== ROND-POINT D'ASSOUINDÉ =====
    {
        id: 63,
        nom: 'Rond-point d\'Assouindé',
        adresse: 'Rond-point d\'Assouindé, Assinie',
        distance: 21200,
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