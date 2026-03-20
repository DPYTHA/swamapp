// screens/Client/FideliteScreen.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function FideliteScreen({ navigation }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFidelite();
    }, []);

    const loadFidelite = async () => {
        try {
            // Récupérer les stats depuis l'API (ou calculer à partir des commandes)
            const response = await api.get('/client/statistiques');
            setStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNiveauInfo = (points) => {
        if (points >= 10000) return {
            nom: 'Platine',
            color: '#E5E4E2',
            icon: 'stars',
            next: null,
            progress: 100
        };
        if (points >= 5000) return {
            nom: 'Or',
            color: '#FFD700',
            icon: 'emoji-events',
            next: 'Platine',
            nextPoints: 10000,
            progress: (points / 10000) * 100
        };
        if (points >= 1000) return {
            nom: 'Argent',
            color: '#C0C0C0',
            icon: 'workspace-premium',
            next: 'Or',
            nextPoints: 5000,
            progress: (points / 5000) * 100
        };
        return {
            nom: 'Bronze',
            color: '#CD7F32',
            icon: 'military-tech',
            next: 'Argent',
            nextPoints: 1000,
            progress: (points / 1000) * 100
        };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    const niveau = getNiveauInfo(stats?.pointsFidelite || 0);

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Programme de fidélité</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Carte de niveau */}
            <View style={[styles.niveauCard, { backgroundColor: niveau.color + '20' }]}>
                <Icon name={niveau.icon} size={60} color={niveau.color} />
                <Text style={[styles.niveauNom, { color: niveau.color }]}>
                    {niveau.nom}
                </Text>
                <Text style={styles.pointsCount}>
                    {stats?.pointsFidelite || 0} points
                </Text>
            </View>

            {/* Barre de progression */}
            {niveau.next && (
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressText}>
                            Prochain niveau : {niveau.next}
                        </Text>
                        <Text style={styles.progressText}>
                            {stats?.pointsFidelite || 0}/{niveau.nextPoints}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${Math.min(niveau.progress, 100)}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressInfo}>
                        Plus que {niveau.nextPoints - (stats?.pointsFidelite || 0)} points
                        pour atteindre le niveau {niveau.next}
                    </Text>
                </View>
            )}

            {/* Avantages */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vos avantages</Text>

                <View style={styles.avantageCard}>
                    <Icon name="local-offer" size={24} color="#FF6B6B" />
                    <View style={styles.avantageContent}>
                        <Text style={styles.avantageTitle}>Réductions exclusives</Text>
                        <Text style={styles.avantageDesc}>
                            Bénéficiez de réductions spéciales réservées aux membres
                        </Text>
                    </View>
                </View>

                <View style={styles.avantageCard}>
                    <Icon name="local-shipping" size={24} color="#4CAF50" />
                    <View style={styles.avantageContent}>
                        <Text style={styles.avantageTitle}>Livraison prioritaire</Text>
                        <Text style={styles.avantageDesc}>
                            Vos commandes sont traitées en priorité
                        </Text>
                    </View>
                </View>

                <View style={styles.avantageCard}>
                    <Icon name="cake" size={24} color="#2196F3" />
                    <View style={styles.avantageContent}>
                        <Text style={styles.avantageTitle}>Cadeau d'anniversaire</Text>
                        <Text style={styles.avantageDesc}>
                            Un code promo spécial pour votre anniversaire
                        </Text>
                    </View>
                </View>
            </View>

            {/* Comment gagner des points */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gagner des points</Text>

                <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Chaque achat</Text>
                    <Text style={styles.ruleValue}>1 point / 1 FCFA</Text>
                </View>

                <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Parrainage</Text>
                    <Text style={styles.ruleValue}>2 points</Text>
                </View>

                <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Avis sur un produit</Text>
                    <Text style={styles.ruleValue}>1 points</Text>
                </View>

                <View style={styles.ruleRow}>
                    <Text style={styles.ruleLabel}>Anniversaire</Text>
                    <Text style={styles.ruleValue}>5 points</Text>
                </View>
            </View>

            {/* Boutons d'action */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Commandes')}
                >
                    <Icon name="history" size={20} color="#FF6B6B" />
                    <Text style={styles.actionButtonText}>Voir mes achats</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Wishlist')}
                >
                    <Icon name="favorite" size={20} color="#FF6B6B" />
                    <Text style={styles.actionButtonText}>Ma liste de souhaits</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    niveauCard: {
        alignItems: 'center',
        padding: 30,
        margin: 20,
        borderRadius: 15,
    },
    niveauNom: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 10,
    },
    pointsCount: {
        fontSize: 18,
        color: '#333',
        marginTop: 5,
    },
    progressSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginBottom: 5,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF6B6B',
        borderRadius: 4,
    },
    progressInfo: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    section: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    avantageCard: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    avantageContent: {
        marginLeft: 15,
        flex: 1,
    },
    avantageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    avantageDesc: {
        fontSize: 13,
        color: '#666',
    },
    ruleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    ruleLabel: {
        fontSize: 14,
        color: '#666',
    },
    ruleValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B20',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#FF6B6B',
        marginLeft: 8,
    },
});