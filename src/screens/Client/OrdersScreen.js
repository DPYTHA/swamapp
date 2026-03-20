import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const getStatutInfo = (statut) => {
    const statuts = {
        'en_attente_paiement': {
            label: 'En attente de paiement',
            color: '#FFA500',
            icon: 'payment',
            bgColor: '#FFA50015'
        },
        'preparation': {
            label: 'En préparation',
            color: '#2196F3',
            icon: 'local-dining',
            bgColor: '#2196F315'
        },
        'livraison': {
            label: 'En livraison',
            color: '#FF6B6B',
            icon: 'delivery-dining',
            bgColor: '#FF6B6B15'
        },
        'livree': {
            label: 'Livrée',
            color: '#4CAF50',
            icon: 'check-circle',
            bgColor: '#4CAF5015'
        },
        'annulee': {
            label: 'Annulée',
            color: '#F44336',
            icon: 'cancel',
            bgColor: '#F4433615'
        },
    };
    return statuts[statut] || { label: statut, color: '#999', icon: 'help', bgColor: '#99999915' };
};

export default function OrdersScreen({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            console.log('📦 Chargement des commandes pour user:', user.id);
            const response = await api.get('/commandes/client');
            console.log('✅ Commandes reçues:', response.data);
            setOrders(response.data);
            setError(null);
        } catch (error) {
            console.log('❌ Erreur détaillée:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            setError(error.response?.data?.message || 'Erreur de chargement');

            // Afficher une alerte en cas d'erreur
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de charger vos commandes'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.lockedContainer}>
                    <Icon name="lock" size={50} color="#ccc" />
                    <Text style={styles.message}>Connectez-vous pour voir vos commandes</Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                    >
                        <Text style={styles.loginButtonText}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement de vos commandes...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error-outline" size={60} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderOrder = ({ item, index }) => {
        const statutInfo = getStatutInfo(item.statut);

        return (
            <TouchableOpacity
                style={[styles.orderCard, index === 0 && styles.firstCard]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.code_suivi })}
                activeOpacity={0.7}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.codeContainer}>
                        <Icon name="qr-code" size={16} color="#FF6B6B" />
                        <Text style={styles.orderCode}>{item.code_suivi}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statutInfo.bgColor }]}>
                        <Icon name={statutInfo.icon} size={12} color={statutInfo.color} />
                        <Text style={[styles.statusText, { color: statutInfo.color }]}>
                            {statutInfo.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderMeta}>
                    <View style={styles.metaItem}>
                        <Icon name="calendar-today" size={14} color="#999" />
                        <Text style={styles.metaText}>{item.date}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Icon name="shopping-bag" size={14} color="#999" />
                        <Text style={styles.metaText}>{item.articles_count || 0} article(s)</Text>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <View>
                        <Text style={styles.totalLabel}>Montant total</Text>
                        <Text style={styles.orderTotal}>{item.total?.toLocaleString() || 0} FCFA</Text>
                    </View>
                    <View style={styles.detailsButton}>
                        <Text style={styles.detailsButtonText}>Voir détails</Text>
                        <Icon name="arrow-forward" size={16} color="#FF6B6B" />
                    </View>
                </View>

                {item.statut_paiement === 'en_attente' && (
                    <View style={styles.paymentPending}>
                        <Icon name="warning" size={14} color="#FFA500" />
                        <Text style={styles.paymentPendingText}>Paiement en attente</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mes commandes</Text>
                <Text style={styles.headerSubtitle}>
                    {orders.length} commande{orders.length !== 1 ? 's' : ''}
                </Text>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={item => item.code_suivi}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B6B']}
                        tintColor="#FF6B6B"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="receipt-long" size={60} color="#ccc" />
                        <Text style={styles.emptyTitle}>Aucune commande</Text>
                        <Text style={styles.emptyText}>
                            Vous n'avez pas encore passé de commande.
                        </Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('ProductsList')}
                        >
                            <Text style={styles.shopButtonText}>Voir les produits</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#F8F9FA',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    list: {
        padding: 15,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    orderCode: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    orderMeta: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    metaText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 15,
    },
    totalLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B15',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    detailsButtonText: {
        fontSize: 13,
        color: '#FF6B6B',
        fontWeight: '600',
        marginRight: 4,
    },
    paymentPending: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA50015',
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
    },
    paymentPendingText: {
        fontSize: 12,
        color: '#FFA500',
        fontWeight: '500',
        marginLeft: 6,
    },
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    message: {
        fontSize: 16,
        color: '#666',
        marginVertical: 20,
        textAlign: 'center',
    },
    loginButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});