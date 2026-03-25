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
    const [detailedStats, setDetailedStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('week');

    useEffect(() => {
        loadStats();
        loadDetailedStats();
    }, [period]);

    const loadStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement stats:', error.response?.data || error.message);
        }
    };

    const loadDetailedStats = async () => {
        try {
            const response = await api.get(`/admin/stats/detailed?period=${period}`);
            setDetailedStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement stats détaillées:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        Promise.all([loadStats(), loadDetailedStats()]);
    };

    const formatMoney = (amount) => {
        if (amount === undefined || amount === null) return '0 FCFA';
        return Math.round(amount).toLocaleString() + ' FCFA';
    };

    const safeDetailedStats = detailedStats || {
        commandes_par_jour: [],
        max_commandes: 10,
        ventes_par_categorie: [],
        total_articles: 1,
        top_produits: [],
        livraisons: {
            moyenne: 0,
            distance_moyenne: 0,
            frais_moyens: 0,
            livreurs_actifs: 0
        },
        revenus: {
            total: 0,
            frais_livraison: 0,
            reduction: 0
        },
        satisfaction: {
            moyenne: 4.8,
            total_avis: 0
        }
    };

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

    const chartData = safeDetailedStats.commandes_par_jour || [];
    const maxCount = Math.max(...chartData.map(d => d.count), 1);

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
            {chartData.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Évolution des commandes</Text>
                    <View style={styles.chartContainer}>
                        {chartData.map((item, index) => (
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
            )}

            {/* Ventes par catégorie */}
            {safeDetailedStats.ventes_par_categorie && safeDetailedStats.ventes_par_categorie.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ventes par catégorie</Text>
                    <View style={styles.categoryStats}>
                        {safeDetailedStats.ventes_par_categorie.map((cat, index) => {
                            const percentage = safeDetailedStats.total_articles > 0
                                ? (cat.total / safeDetailedStats.total_articles) * 100
                                : 0;
                            const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D'];
                            return (
                                <View key={index} style={styles.categoryRow}>
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>{cat.nom}</Text>
                                        <Text style={styles.categoryCount}>{cat.total} articles</Text>
                                    </View>
                                    <View style={styles.categoryBarContainer}>
                                        <View
                                            style={[
                                                styles.categoryBar,
                                                {
                                                    width: `${Math.min(percentage, 100)}%`,
                                                    backgroundColor: colors[index % colors.length]
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.categoryPercentage}>
                                        {Math.round(percentage)}%
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Top produits */}
            {safeDetailedStats.top_produits && safeDetailedStats.top_produits.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top 5 des produits</Text>
                    {safeDetailedStats.top_produits.map((produit, index) => (
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
            )}

            {/* Statistiques de livraison */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Livraisons</Text>
                <View style={styles.deliveryGrid}>
                    <View style={styles.deliveryCard}>
                        <Icon name="access-time" size={24} color="#FF6B6B" />
                        <Text style={styles.deliveryStatNumber}>{safeDetailedStats.livraisons?.moyenne || 0} min</Text>
                        <Text style={styles.deliveryStatLabel}>Temps moyen</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="straighten" size={24} color="#4ECDC4" />
                        <Text style={styles.deliveryStatNumber}>{safeDetailedStats.livraisons?.distance_moyenne || 0} km</Text>
                        <Text style={styles.deliveryStatLabel}>Distance moyenne</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="payments" size={24} color="#4CAF50" />
                        <Text style={styles.deliveryStatNumber}>{formatMoney(safeDetailedStats.livraisons?.frais_moyens)}</Text>
                        <Text style={styles.deliveryStatLabel}>Frais moyens</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="local-shipping" size={24} color="#FF9800" />
                        <Text style={styles.deliveryStatNumber}>{safeDetailedStats.livraisons?.livreurs_actifs || 0}</Text>
                        <Text style={styles.deliveryStatLabel}>Livreurs actifs</Text>
                    </View>
                </View>
            </View>

            {/* Revenus détaillés */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Revenus détaillés</Text>
                <View style={styles.revenueCard}>
                    <View style={styles.revenueRow}>
                        <Text style={styles.revenueLabel}>Chiffre d'affaires total</Text>
                        <Text style={styles.revenueValue}>{formatMoney(safeDetailedStats.revenus?.total || stats.chiffre_affaires_mois)}</Text>
                    </View>
                    <View style={styles.revenueRow}>
                        <Text style={styles.revenueLabel}>Dont frais de livraison</Text>
                        <Text style={styles.revenueSubValue}>{formatMoney(safeDetailedStats.revenus?.frais_livraison)}</Text>
                    </View>
                    <View style={styles.revenueRow}>
                        <Text style={styles.revenueLabel}>Dont réductions</Text>
                        <Text style={styles.revenueSubValue}>- {formatMoney(safeDetailedStats.revenus?.reduction)}</Text>
                    </View>
                </View>
            </View>

            {/* Satisfaction client */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Satisfaction client</Text>
                <View style={styles.satisfactionCard}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingNumber}>{safeDetailedStats.satisfaction?.moyenne?.toFixed(1) || '4.8'}</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                    key={star}
                                    name="star"
                                    size={20}
                                    color={star <= Math.round(safeDetailedStats.satisfaction?.moyenne || 4.8) ? '#FFD700' : '#ccc'}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingCount}>{safeDetailedStats.satisfaction?.total_avis || 0} avis</Text>
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
    revenueCard: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 10,
    },
    revenueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    revenueLabel: {
        fontSize: 13,
        color: '#666',
    },
    revenueValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    revenueSubValue: {
        fontSize: 13,
        color: '#333',
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