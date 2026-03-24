// screens/Client/StatistiquesAchatScreen.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StatistiquesAchatScreen({ navigation }) {
    const [stats, setStats] = useState({
        total_commandes: 0,
        total_depense: 0,
        moyenne_commande: 0,
        commande_max: 0,
        commande_min: 0,
        produits_achetes: 0,
        points_fidelite: 0,
        categories_favorites: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.get('/client/statistiques');
            console.log('📊 Statistiques reçues:', response.data);

            // ✅ Assurer que toutes les valeurs existent avec des valeurs par défaut
            setStats({
                total_commandes: response.data.total_commandes || 0,
                total_depense: response.data.total_depense || 0,
                moyenne_commande: response.data.moyenne_commande || 0,
                commande_max: response.data.commande_max || 0,
                commande_min: response.data.commande_min || 0,
                produits_achetes: response.data.produits_achetes || 0,
                points_fidelite: response.data.points_fidelite || 0,
                categories_favorites: response.data.categories_favorites || []
            });
        } catch (error) {
            console.log('❌ Erreur chargement stats:', error);
            // ✅ Garder les valeurs par défaut en cas d'erreur
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const formatMontant = (montant) => {
        if (montant === undefined || montant === null) return '0 FCFA';
        return Math.round(montant).toLocaleString() + ' FCFA';
    };

    const StatCard = ({ icon, label, value, color }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Icon name={icon} size={24} color={color} />
            <View style={styles.statCardContent}>
                <Text style={styles.statCardLabel}>{label}</Text>
                <Text style={styles.statCardValue}>{value}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes statistiques</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Icon name="refresh" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Statistiques générales */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vue d'ensemble</Text>

                <StatCard
                    icon="shopping-cart"
                    label="Total commandes"
                    value={stats.total_commandes}
                    color="#FF6B6B"
                />

                <StatCard
                    icon="payments"
                    label="Total dépensé"
                    value={formatMontant(stats.total_depense)}
                    color="#4CAF50"
                />

                <StatCard
                    icon="shopping-bag"
                    label="Produits achetés"
                    value={stats.produits_achetes}
                    color="#2196F3"
                />
            </View>

            {/* Moyennes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Moyennes</Text>

                <StatCard
                    icon="trending-up"
                    label="Moyenne par commande"
                    value={formatMontant(stats.moyenne_commande)}
                    color="#9C27B0"
                />

                <View style={styles.minMaxContainer}>
                    <View style={[styles.minMaxCard, { backgroundColor: '#4CAF5020' }]}>
                        <Icon name="arrow-upward" size={20} color="#4CAF50" />
                        <Text style={styles.minMaxLabel}>Max</Text>
                        <Text style={styles.minMaxValue}>{formatMontant(stats.commande_max)}</Text>
                    </View>

                    <View style={[styles.minMaxCard, { backgroundColor: '#F4433620' }]}>
                        <Icon name="arrow-downward" size={20} color="#F44336" />
                        <Text style={styles.minMaxLabel}>Min</Text>
                        <Text style={styles.minMaxValue}>{formatMontant(stats.commande_min)}</Text>
                    </View>
                </View>
            </View>

            {/* Points fidélité */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Programme de fidélité</Text>
                <View style={styles.pointsCard}>
                    <Icon name="card-giftcard" size={40} color="#FF6B6B" />
                    <View style={styles.pointsContent}>
                        <Text style={styles.pointsLabel}>Vos points</Text>
                        <Text style={styles.pointsValue}>{stats.points_fidelite}</Text>
                    </View>
                </View>
            </View>

            {/* Catégories favorites */}
            {stats.categories_favorites && stats.categories_favorites.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Catégories favorites</Text>

                    {stats.categories_favorites.map((cat, index) => (
                        <View key={index} style={styles.categoryRow}>
                            <Text style={styles.categoryName}>{cat.categorie}</Text>
                            <View style={styles.categoryBar}>
                                <View
                                    style={[
                                        styles.categoryBarFill,
                                        {
                                            width: `${Math.min((cat.quantite / (stats.produits_achetes || 1)) * 100, 100)}%`,
                                            backgroundColor: index === 0 ? '#FF6B6B' :
                                                index === 1 ? '#4CAF50' : '#2196F3'
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={styles.categoryCount}>{cat.quantite} produits</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Bouton pour voir l'historique */}
            <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => navigation.navigate('Commandes')}
            >
                <Text style={styles.detailsButtonText}>Voir l'historique détaillé</Text>
                <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.footer} />
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
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
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
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    statCardContent: {
        marginLeft: 15,
        flex: 1,
    },
    statCardLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    statCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    minMaxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    minMaxCard: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    minMaxLabel: {
        fontSize: 12,
        color: '#666',
        marginVertical: 4,
    },
    minMaxValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    pointsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B10',
        padding: 20,
        borderRadius: 15,
    },
    pointsContent: {
        marginLeft: 15,
        flex: 1,
    },
    pointsLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    pointsValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    categoryRow: {
        marginBottom: 15,
    },
    categoryName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    categoryBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginBottom: 4,
    },
    categoryBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    categoryCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
    },
    detailsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
    },
    footer: {
        height: 30,
    },
});