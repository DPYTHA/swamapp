import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function DeliveryHistoryScreen({ navigation }) {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDeliveryHistory();
    }, []);

    const loadDeliveryHistory = async () => {
        try {
            const response = await api.get('/livreur/historique-livraisons');
            setDeliveries(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement historique:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDeliveryHistory();
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'livree': return '#4CAF50';
            case 'annulee': return '#F44336';
            default: return '#FF6B6B';
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'livree': return 'check-circle';
            case 'annulee': return 'cancel';
            default: return 'help';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const calculateEarnings = (delivery) => {
        return Math.round(delivery.frais_livraison * 0.8);
    };

    const renderDelivery = ({ item }) => (
        <TouchableOpacity
            style={styles.deliveryCard}
            onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.codeContainer}>
                    <Icon name="qr-code" size={16} color="#FF6B6B" />
                    <Text style={styles.deliveryCode}>{item.code_suivi}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '15' }]}>
                    <Icon name={getStatusIcon(item.statut)} size={12} color={getStatusColor(item.statut)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
                        {item.statut === 'livree' ? 'Livrée' : 'Annulée'}
                    </Text>
                </View>
            </View>

            <View style={styles.deliveryInfo}>
                <View style={styles.infoRow}>
                    <Icon name="location-on" size={16} color="#666" />
                    <Text style={styles.address} numberOfLines={1}>
                        {item.adresse_livraison}
                    </Text>
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Icon name="calendar-today" size={14} color="#999" />
                        <Text style={styles.detailText}>{formatDate(item.date_livraison || item.date_commande)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="straighten" size={14} color="#999" />
                        <Text style={styles.detailText}>{(item.distance / 1000).toFixed(1)} km</Text>
                    </View>
                </View>

                <View style={styles.earningsRow}>
                    <Text style={styles.earningsLabel}>Gain</Text>
                    <Text style={styles.earningsValue}>{calculateEarnings(item).toLocaleString()} FCFA</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement de l'historique...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Historique</Text>
                <Text style={styles.headerSubtitle}>
                    {deliveries.length} livraison{deliveries.length !== 1 ? 's' : ''} effectuée{deliveries.length !== 1 ? 's' : ''}
                </Text>
            </View>

            <FlatList
                data={deliveries}
                renderItem={renderDelivery}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B6B']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="history" size={60} color="#ccc" />
                        <Text style={styles.emptyTitle}>Aucun historique</Text>
                        <Text style={styles.emptyText}>
                            Vous n'avez pas encore effectué de livraisons
                        </Text>
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
        paddingTop: 5,
    },
    deliveryCard: {
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
    cardHeader: {
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
    deliveryCode: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 6,
        letterSpacing: 0.5,
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
    deliveryInfo: {
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    address: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    earningsLabel: {
        fontSize: 14,
        color: '#666',
    },
    earningsValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});