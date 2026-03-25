import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StatsScreen({ navigation }) {
    const [stats, setStats] = useState({
        total_commandes: 0,
        commandes_en_attente: 0,
        paiements_en_attente: 0,
        total_clients: 0,
        total_livreurs: 0,
        commandes_aujourdhui: 0,
        chiffre_affaires_mois: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('week');

    useEffect(() => {
        loadStats();
    }, [period]);

    const loadStats = async () => {
        try {
            setError(null);
            // Essayer de charger les stats
            const response = await api.get(`/admin/stats?period=${period}`);
            console.log('📊 Stats reçues:', response.data);
            setStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement stats:', error.response?.data || error.message);
            setError(error.response?.data?.message || 'Impossible de charger les statistiques');
            // Garder les valeurs par défaut
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const formatMoney = (amount) => {
        if (amount === undefined || amount === null) return '0 FCFA';
        return Math.round(amount).toLocaleString() + ' FCFA';
    };

    // Données de démonstration pour l'évolution des commandes
    const chartData = {
        week: [
            { jour: 'Lun', count: 12 },
            { jour: 'Mar', count: 18 },
            { jour: 'Mer', count: 15 },
            { jour: 'Jeu', count: 22 },
            { jour: 'Ven', count: 28 },
            { jour: 'Sam', count: 35 },
            { jour: 'Dim', count: 20 },
        ],
        month: [
            { jour: 'Sem 1', count: 45 },
            { jour: 'Sem 2', count: 52 },
            { jour: 'Sem 3', count: 48 },
            { jour: 'Sem 4', count: 65 },
        ],
        year: [
            { jour: 'Jan', count: 120 },
            { jour: 'Fév', count: 135 },
            { jour: 'Mar', count: 148 },
            { jour: 'Avr', count: 162 },
            { jour: 'Mai', count: 178 },
            { jour: 'Juin', count: 190 },
        ],
    };

    const currentChartData = chartData[period] || chartData.week;
    const maxCount = Math.max(...currentChartData.map(d => d.count), 1);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error-outline" size={60} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#FF6B6B']}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FF6B6B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Statistiques</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Période */}
            <View style={styles.periodSelector}>
                <TouchableOpacity
                    style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
                    onPress={() => setPeriod('week')}
                >
                    <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>
                        Semaine
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
                    onPress={() => setPeriod('month')}
                >
                    <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
                        Mois
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
                    onPress={() => setPeriod('year')}
                >
                    <Text style={[styles.periodText, period === 'year' && styles.periodTextActive]}>
                        Année
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Cartes principales */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#FF6B6B20' }]}>
                        <Icon name="shopping-cart" size={30} color="#FF6B6B" />
                    </View>
                    <Text style={styles.statNumber}>{stats.total_commandes || 0}</Text>
                    <Text style={styles.statLabel}>Commandes totales</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#FFA50020' }]}>
                        <Icon name="pending" size={30} color="#FFA500" />
                    </View>
                    <Text style={styles.statNumber}>{stats.commandes_en_attente || 0}</Text>
                    <Text style={styles.statLabel}>En attente</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
                        <Icon name="payment" size={30} color="#4CAF50" />
                    </View>
                    <Text style={styles.statNumber}>{stats.paiements_en_attente || 0}</Text>
                    <Text style={styles.statLabel}>Paiements à valider</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
                        <Icon name="people" size={30} color="#2196F3" />
                    </View>
                    <Text style={styles.statNumber}>{stats.total_clients || 0}</Text>
                    <Text style={styles.statLabel}>Clients</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#9C27B020' }]}>
                        <Icon name="local-shipping" size={30} color="#9C27B0" />
                    </View>
                    <Text style={styles.statNumber}>{stats.total_livreurs || 0}</Text>
                    <Text style={styles.statLabel}>Livreurs</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#00BCD420' }]}>
                        <Icon name="today" size={30} color="#00BCD4" />
                    </View>
                    <Text style={styles.statNumber}>{stats.commandes_aujourdhui || 0}</Text>
                    <Text style={styles.statLabel}>Commandes aujourd'hui</Text>
                </View>
            </View>

            {/* Chiffre d'affaires */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chiffre d'affaires du mois</Text>
                <View style={styles.revenueCard}>
                    <Text style={styles.revenueAmount}>{formatMoney(stats.chiffre_affaires_mois)}</Text>
                    <Text style={styles.revenuePeriod}>Ce mois-ci</Text>
                </View>
            </View>

            {/* Graphique des commandes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Évolution des commandes</Text>
                <View style={styles.chartContainer}>
                    {currentChartData.map((item, index) => (
                        <View key={index} style={styles.chartBarContainer}>
                            <View style={styles.chartBarWrapper}>
                                <View
                                    style={[
                                        styles.chartBar,
                                        {
                                            height: Math.max(20, (item.count / maxCount) * 120),
                                            backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'][index % 7]
                                        }
                                    ]}
                                />
                                <Text style={styles.chartValue}>{item.count}</Text>
                            </View>
                            <Text style={styles.chartLabel}>{item.jour}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Ventes par catégorie (simulé) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ventes par catégorie</Text>
                <View style={styles.categoryStats}>
                    <View style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                            <Text style={styles.categoryName}>Ingrédients</Text>
                            <Text style={styles.categoryCount}>156 articles</Text>
                        </View>
                        <View style={styles.categoryBarContainer}>
                            <View style={[styles.categoryBar, { width: '65%', backgroundColor: '#FF6B6B' }]} />
                        </View>
                        <Text style={styles.categoryPercentage}>65%</Text>
                    </View>
                    <View style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                            <Text style={styles.categoryName}>Boissons</Text>
                            <Text style={styles.categoryCount}>89 articles</Text>
                        </View>
                        <View style={styles.categoryBarContainer}>
                            <View style={[styles.categoryBar, { width: '37%', backgroundColor: '#4ECDC4' }]} />
                        </View>
                        <Text style={styles.categoryPercentage}>37%</Text>
                    </View>
                    <View style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                            <Text style={styles.categoryName}>Poissons</Text>
                            <Text style={styles.categoryCount}>72 articles</Text>
                        </View>
                        <View style={styles.categoryBarContainer}>
                            <View style={[styles.categoryBar, { width: '30%', backgroundColor: '#FFE66D' }]} />
                        </View>
                        <Text style={styles.categoryPercentage}>30%</Text>
                    </View>
                </View>
            </View>

            {/* Top produits (simulé) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top 5 des produits</Text>
                {[
                    { nom: 'Riz parfumé', total: 45, prix: 3500 },
                    { nom: 'Jus de Bissap', total: 38, prix: 1000 },
                    { nom: 'Huile Arachide', total: 32, prix: 2500 },
                    { nom: 'Marlin fumé', total: 28, prix: 4500 },
                    { nom: 'Thiakry', total: 25, prix: 1500 },
                ].map((produit, index) => (
                    <View key={index} style={styles.topProductRow}>
                        <View style={[styles.topProductRank, { backgroundColor: '#FF6B6B20' }]}>
                            <Text style={[styles.topProductRankText, { color: '#FF6B6B' }]}>
                                {index + 1}
                            </Text>
                        </View>
                        <View style={styles.topProductInfo}>
                            <Text style={styles.topProductName}>{produit.nom}</Text>
                            <Text style={styles.topProductCount}>{produit.total} vendus</Text>
                        </View>
                        <Text style={styles.topProductRevenue}>
                            {formatMoney(produit.prix * produit.total)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Statistiques de livraison */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Livraisons</Text>
                <View style={styles.deliveryGrid}>
                    <View style={styles.deliveryCard}>
                        <Icon name="access-time" size={24} color="#FF6B6B" />
                        <Text style={styles.deliveryStatNumber}>45 min</Text>
                        <Text style={styles.deliveryStatLabel}>Temps moyen</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="straighten" size={24} color="#4ECDC4" />
                        <Text style={styles.deliveryStatNumber}>8.5 km</Text>
                        <Text style={styles.deliveryStatLabel}>Distance moyenne</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="payments" size={24} color="#4CAF50" />
                        <Text style={styles.deliveryStatNumber}>1 250 FCFA</Text>
                        <Text style={styles.deliveryStatLabel}>Frais moyens</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="local-shipping" size={24} color="#FF9800" />
                        <Text style={styles.deliveryStatNumber}>8</Text>
                        <Text style={styles.deliveryStatLabel}>Livreurs actifs</Text>
                    </View>
                </View>
            </View>

            {/* Satisfaction client */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Satisfaction client</Text>
                <View style={styles.satisfactionCard}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingNumber}>4.8</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Icon key={star} name="star" size={20} color={star <= 4 ? '#FFD700' : '#ccc'} />
                            ))}
                        </View>
                        <Text style={styles.ratingCount}>156 avis</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.updateText}>
                Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginVertical: 20,
    },
    retryButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF6B6B15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    periodSelector: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        marginTop: 1,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
        marginHorizontal: 5,
    },
    periodButtonActive: {
        backgroundColor: '#FF6B6B',
    },
    periodText: {
        fontSize: 14,
        color: '#666',
    },
    periodTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        backgroundColor: '#fff',
        marginTop: 10,
    },
    statCard: {
        width: '33.33%',
        padding: 12,
        alignItems: 'center',
    },
    statIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        marginTop: 4,
    },
    section: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    revenueCard: {
        backgroundColor: '#FF6B6B10',
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
    },
    revenueAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 5,
    },
    revenuePeriod: {
        fontSize: 14,
        color: '#666',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 180,
    },
    chartBarContainer: {
        alignItems: 'center',
        width: 40,
    },
    chartBarWrapper: {
        alignItems: 'center',
        width: '100%',
        position: 'relative',
    },
    chartBar: {
        width: 30,
        borderRadius: 15,
        marginBottom: 5,
    },
    chartValue: {
        fontSize: 10,
        color: '#666',
        position: 'absolute',
        top: -18,
    },
    chartLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 5,
    },
    categoryStats: {
        marginTop: 5,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryInfo: {
        width: 90,
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    categoryCount: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    categoryBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    categoryBar: {
        height: '100%',
        borderRadius: 4,
    },
    categoryPercentage: {
        width: 40,
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        textAlign: 'right',
    },
    topProductRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
    },
    topProductRank: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    topProductRankText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    topProductInfo: {
        flex: 1,
    },
    topProductName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    topProductCount: {
        fontSize: 11,
        color: '#999',
    },
    topProductRevenue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    deliveryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    deliveryCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    deliveryStatNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginVertical: 5,
    },
    deliveryStatLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    satisfactionCard: {
        backgroundColor: '#F8F9FA',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    ratingContainer: {
        alignItems: 'center',
    },
    ratingNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 5,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    ratingCount: {
        fontSize: 12,
        color: '#666',
    },
    updateText: {
        textAlign: 'center',
        fontSize: 11,
        color: '#999',
        marginVertical: 20,
    },
});