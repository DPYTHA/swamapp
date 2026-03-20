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
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('week'); // week, month, year

    useEffect(() => {
        loadStats();
    }, [period]);

    const loadStats = async () => {
        try {
            const response = await api.get(`/admin/stats?period=${period}`);
            setStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement stats:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    // Format monétaire
    const formatMoney = (amount) => {
        return (amount || 0).toLocaleString() + ' FCFA';
    };

    // Obtenir la couleur pour le graphique
    const getChartColor = (index) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#2196F3', '#4CAF50', '#FF9800'];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des statistiques...</Text>
            </View>
        );
    }

    // Données par défaut si stats est null
    const data = stats || {
        total_commandes: 0,
        nouveaux_clients: 0,
        produits_vendus: 0,
        chiffre_affaires: 0,
        commandes_par_jour: [
            { jour: 'Lun', count: 0 },
            { jour: 'Mar', count: 0 },
            { jour: 'Mer', count: 0 },
            { jour: 'Jeu', count: 0 },
            { jour: 'Ven', count: 0 },
            { jour: 'Sam', count: 0 },
            { jour: 'Dim', count: 0 },
        ],
        max_commandes: 10,
        ventes_par_categorie: [
            { nom: 'Ingrédients', total: 0, couleur: '#FF6B6B' },
            { nom: 'Boissons', total: 0, couleur: '#4ECDC4' },
            { nom: 'Poissons', total: 0, couleur: '#FFE66D' },
        ],
        total_articles: 1,
        top_produits: [],
        livraisons: {
            moyenne: 0,
            distance_moyenne: 0,
            frais_moyens: 0,
            total_livreurs: 0,
            livreurs_actifs: 0
        },
        revenus: {
            total: 0,
            frais_livraison: 0,
            reduction: 0
        },
        satisfaction: {
            moyenne: 0,
            total_avis: 0
        }
    };

    // Valeurs sécurisées pour éviter les erreurs
    const safeSatisfaction = data.satisfaction || { moyenne: 0, total_avis: 0 };
    const safeLivraisons = data.livraisons || {
        moyenne: 0,
        distance_moyenne: 0,
        frais_moyens: 0,
        livreurs_actifs: 0
    };
    const safeRevenus = data.revenus || { total: 0, frais_livraison: 0, reduction: 0 };

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
                    <Text style={styles.statNumber}>{data.total_commandes}</Text>
                    <Text style={styles.statLabel}>Commandes</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
                        <Icon name="people" size={30} color="#4CAF50" />
                    </View>
                    <Text style={styles.statNumber}>{data.nouveaux_clients}</Text>
                    <Text style={styles.statLabel}>Nouveaux clients</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
                        <Icon name="inventory" size={30} color="#2196F3" />
                    </View>
                    <Text style={styles.statNumber}>{data.produits_vendus}</Text>
                    <Text style={styles.statLabel}>Produits vendus</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#FFA50020' }]}>
                        <Icon name="trending-up" size={30} color="#FFA500" />
                    </View>
                    <Text style={styles.statNumber}>{formatMoney(data.chiffre_affaires)}</Text>
                    <Text style={styles.statLabel}>Chiffre d'affaires</Text>
                </View>
            </View>

            {/* Graphique des commandes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Évolution des commandes</Text>
                <View style={styles.chartContainer}>
                    {data.commandes_par_jour?.map((item, index) => (
                        <View key={index} style={styles.chartBarContainer}>
                            <View style={styles.chartBarWrapper}>
                                <View
                                    style={[
                                        styles.chartBar,
                                        {
                                            height: Math.max(20, (item.count / (data.max_commandes || 1)) * 150),
                                            backgroundColor: getChartColor(index)
                                        }
                                    ]}
                                />
                                {item.count > 0 && (
                                    <Text style={styles.chartValue}>{item.count}</Text>
                                )}
                            </View>
                            <Text style={styles.chartLabel}>{item.jour}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Répartition par catégorie */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ventes par catégorie</Text>
                <View style={styles.categoryStats}>
                    {data.ventes_par_categorie?.map((cat, index) => {
                        const percentage = data.total_articles > 0
                            ? (cat.total / data.total_articles) * 100
                            : 0;
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
                                                width: `${percentage}%`,
                                                backgroundColor: cat.couleur || getChartColor(index)
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

            {/* Top produits */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top 5 des produits</Text>
                {data.top_produits?.length > 0 ? (
                    data.top_produits.map((produit, index) => (
                        <View key={index} style={styles.topProductRow}>
                            <View style={[styles.topProductRank, { backgroundColor: getChartColor(index) + '20' }]}>
                                <Text style={[styles.topProductRankText, { color: getChartColor(index) }]}>
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
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="inventory" size={40} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun produit vendu</Text>
                    </View>
                )}
            </View>

            {/* Statistiques de livraison */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Livraisons</Text>
                <View style={styles.deliveryGrid}>
                    <View style={styles.deliveryCard}>
                        <Icon name="access-time" size={24} color="#FF6B6B" />
                        <Text style={styles.deliveryStatNumber}>{safeLivraisons.moyenne}</Text>
                        <Text style={styles.deliveryStatLabel}>Temps moyen (min)</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="straighten" size={24} color="#4ECDC4" />
                        <Text style={styles.deliveryStatNumber}>{safeLivraisons.distance_moyenne} km</Text>
                        <Text style={styles.deliveryStatLabel}>Distance moyenne</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="payments" size={24} color="#4CAF50" />
                        <Text style={styles.deliveryStatNumber}>{formatMoney(safeLivraisons.frais_moyens)}</Text>
                        <Text style={styles.deliveryStatLabel}>Frais moyens</Text>
                    </View>
                    <View style={styles.deliveryCard}>
                        <Icon name="local-shipping" size={24} color="#FF9800" />
                        <Text style={styles.deliveryStatNumber}>{safeLivraisons.livreurs_actifs}</Text>
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
                        <Text style={styles.revenueValue}>{formatMoney(safeRevenus.total || data.chiffre_affaires)}</Text>
                    </View>
                    <View style={styles.revenueRow}>
                        <Text style={styles.revenueLabel}>Dont frais de livraison</Text>
                        <Text style={styles.revenueSubValue}>{formatMoney(safeRevenus.frais_livraison)}</Text>
                    </View>
                    <View style={styles.revenueRow}>
                        <Text style={styles.revenueLabel}>Dont réductions</Text>
                        <Text style={styles.revenueSubValue}>- {formatMoney(safeRevenus.reduction)}</Text>
                    </View>
                </View>
            </View>

            {/* Satisfaction client */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Satisfaction client</Text>
                <View style={styles.satisfactionCard}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingNumber}>{safeSatisfaction.moyenne.toFixed(1)}</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                    key={star}
                                    name="star"
                                    size={20}
                                    color={star <= Math.round(safeSatisfaction.moyenne) ? '#FFD700' : '#ccc'}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingCount}>{safeSatisfaction.total_avis} avis</Text>
                    </View>
                </View>
            </View>

            {/* Bouton d'export (optionnel) */}
            <TouchableOpacity style={styles.exportButton}>
                <Icon name="download" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Exporter les données</Text>
            </TouchableOpacity>

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
        width: '50%',
        padding: 10,
        alignItems: 'center',
    },
    statIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
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
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 200,
    },
    chartBarContainer: {
        alignItems: 'center',
        width: 40,
    },
    chartBarWrapper: {
        alignItems: 'center',
        width: '100%',
    },
    chartBar: {
        width: 30,
        backgroundColor: '#FF6B6B',
        borderRadius: 15,
        marginBottom: 5,
    },
    chartValue: {
        fontSize: 10,
        color: '#666',
        position: 'absolute',
        top: -15,
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
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    categoryBar: {
        height: '100%',
        borderRadius: 5,
    },
    categoryPercentage: {
        width: 40,
        fontSize: 13,
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
        padding: 15,
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 10,
        padding: 15,
        borderRadius: 10,
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    updateText: {
        textAlign: 'center',
        fontSize: 11,
        color: '#999',
        marginBottom: 20,
    },
});