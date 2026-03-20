import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function AdminDashboardScreen({ navigation }) {
    const { logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = async () => {
        try {
            // Charger les statistiques
            const statsResponse = await api.get('/admin/stats');
            setStats(statsResponse.data);

            // Charger les dernières commandes
            const ordersResponse = await api.get('/admin/commandes?limit=5');
            setRecentOrders(ordersResponse.data);
        } catch (error) {
            console.log('❌ Erreur chargement dashboard:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    // 👇 FONCTION DE DÉCONNEXION
    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    onPress: async () => {
                        await logout();
                        navigation.replace('Public');
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tableau de bord</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Icon name="logout" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.dateContainer}>
                <Text style={styles.headerDate}>
                    {new Date().toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </Text>
            </View>

            {/* Cartes de statistiques */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#FF6B6B20' }]}>
                    <Icon name="shopping-cart" size={30} color="#FF6B6B" />
                    <Text style={styles.statNumber}>{stats?.total_commandes || 0}</Text>
                    <Text style={styles.statLabel}>Commandes totales</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#FFA50020' }]}>
                    <Icon name="pending" size={30} color="#FFA500" />
                    <Text style={styles.statNumber}>{stats?.commandes_en_attente || 0}</Text>
                    <Text style={styles.statLabel}>En attente</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#4CAF5020' }]}>
                    <Icon name="payment" size={30} color="#4CAF50" />
                    <Text style={styles.statNumber}>{stats?.paiements_en_attente || 0}</Text>
                    <Text style={styles.statLabel}>Paiements à valider</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#2196F320' }]}>
                    <Icon name="people" size={30} color="#2196F3" />
                    <Text style={styles.statNumber}>{stats?.total_clients || 0}</Text>
                    <Text style={styles.statLabel}>Clients</Text>
                </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions rapides</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('AssignLivreur')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FF6B6B20' }]}>
                            <Icon name="local-shipping" size={24} color="#FF6B6B" />
                        </View>
                        <Text style={styles.actionText}>Assigner livreur</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Commandes' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FF6B6B20' }]}>
                            <Icon name="list-alt" size={24} color="#FF6B6B" />
                        </View>
                        <Text style={styles.actionText}>Commandes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('ValidateLivreurs')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#4CAF5020' }]}>
                            <Icon name="local-shipping" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.actionText}>Livreurs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Produits' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#2196F320' }]}>
                            <Icon name="inventory" size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.actionText}>Produits</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Stats')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FFA50020' }]}>
                            <Icon name="bar-chart" size={24} color="#FFA500" />
                        </View>
                        <Text style={styles.actionText}>Statistiques</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('AdminTabs', { screen: 'Utilisateurs' })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#9C27B020' }]}>
                            <Icon name="people" size={24} color="#9C27B0" />
                        </View>
                        <Text style={styles.actionText}>Utilisateurs</Text>
                    </TouchableOpacity>
                </View>
            </View>


            {/* Dernières commandes */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Dernières commandes</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ManageOrders')}>
                        <Text style={styles.seeAllText}>Voir tout</Text>
                    </TouchableOpacity>
                </View>

                {recentOrders.map((order, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.orderCard}
                        onPress={() => navigation.navigate('OrderDetailsAdmin', { orderId: order.code_suivi })}
                    >
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={styles.orderCode}>{order.code_suivi}</Text>
                                <Text style={styles.orderClient}>{order.client.nom}</Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(order.statut) + '20' }
                            ]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.statut) }]}>
                                    {order.statut}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.orderFooter}>
                            <Text style={styles.orderTotal}>{order.total.toLocaleString()} FCFA</Text>
                            <Text style={styles.orderDate}>
                                {new Date(order.date).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Paiements en attente */}
            {stats?.paiements_en_attente > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paiements en attente</Text>
                    <TouchableOpacity
                        style={styles.paymentAlert}
                        onPress={() => navigation.navigate('AdminTabs', {
                            screen: 'Commandes',
                            params: { filter: 'paiements' }
                        })}
                    >
                        <Icon name="warning" size={24} color="#FFA500" />
                        <Text style={styles.paymentAlertText}>
                            {stats.paiements_en_attente} paiement(s) en attente de validation
                        </Text>
                        <Icon name="chevron-right" size={24} color="#FFA500" />
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const getStatusColor = (statut) => {
    switch (statut) {
        case 'en_attente_paiement': return '#FFA500';
        case 'preparation': return '#2196F3';
        case 'livraison': return '#FF6B6B';
        case 'livree': return '#4CAF50';
        case 'annulee': return '#F44336';
        default: return '#999';
    }
};

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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 30,
        paddingHorizontal: 20,
        backgroundColor: '#FF6B6B',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutButton: {
        padding: 8,
    },
    dateContainer: {
        backgroundColor: '#FF6B6B',
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerDate: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        marginTop: -20,
    },
    statCard: {
        width: '50%',
        padding: 15,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        fontSize: 14,
        color: '#FF6B6B',
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 15,
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        color: '#666',
    },
    orderCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderClient: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    orderDate: {
        fontSize: 12,
        color: '#999',
    },
    paymentAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA50020',
        padding: 15,
        borderRadius: 10,
    },
    paymentAlertText: {
        flex: 1,
        fontSize: 14,
        color: '#FFA500',
        marginLeft: 10,
    },
});