// screens/Livreur/DeliveriesScreen.js
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

export default function DeliveriesScreen({ navigation }) {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accepting, setAccepting] = useState(null);

    useEffect(() => {
        loadAvailableDeliveries();

        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(() => {
            loadAvailableDeliveries();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadAvailableDeliveries = async () => {
        try {
            // Route à créer dans le backend
            const response = await api.get('/livreur/commandes-disponibles');
            setDeliveries(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement livraisons:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAvailableDeliveries();
    };

    const handleAcceptDelivery = (deliveryId) => {
        Alert.alert(
            'Accepter la livraison',
            'Voulez-vous accepter cette livraison ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Accepter',
                    onPress: () => acceptDelivery(deliveryId)
                }
            ]
        );
    };

    const acceptDelivery = async (deliveryId) => {
        setAccepting(deliveryId);
        try {
            await api.put(`/livreur/commandes/${deliveryId}/accepter`, {
                livreur_id: user.id
            });
            Alert.alert('Succès', 'Livraison acceptée avec succès');
            loadAvailableDeliveries();
        } catch (error) {
            console.log('❌ Erreur acceptation:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible d\'accepter la livraison');
        } finally {
            setAccepting(null);
        }
    };

    const getEstimatedTime = (distance) => {
        // Estimation: 1km = 5 minutes en moyenne
        const minutes = Math.ceil(distance / 1000 * 5);
        return `${minutes} min`;
    };

    // 🟢 MODIFICATION ICI : Gain basé sur 60% des frais de livraison
    const getEarnings = (deliveryFee) => {
        // Le livreur gagne 60% des frais de livraison
        return Math.round(deliveryFee * 0.6);
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
                <View style={[styles.statusBadge, { backgroundColor: '#FF6B6B15' }]}>
                    <Text style={[styles.statusText, { color: '#FF6B6B' }]}>Disponible</Text>
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
                        <Icon name="straighten" size={14} color="#999" />
                        <Text style={styles.detailText}>
                            {(item.distance / 1000).toFixed(1)} km
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="access-time" size={14} color="#999" />
                        <Text style={styles.detailText}>
                            {getEstimatedTime(item.distance)}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="payments" size={14} color="#4CAF50" />
                        <Text style={[styles.detailText, styles.earnings]}>
                            {/* 🟢 Utilisation de item.frais_livraison au lieu de item.total */}
                            +{getEarnings(item.frais_livraison || 0)} FCFA
                        </Text>
                    </View>
                </View>

                <View style={styles.clientInfo}>
                    <Icon name="person" size={14} color="#999" />
                    <Text style={styles.clientName}>{item.client?.nom || 'Client'}</Text>
                    <Text style={styles.clientPhone}>{item.client?.telephone}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptDelivery(item.id)}
                disabled={accepting === item.id}
            >
                {accepting === item.id ? (
                    <ActivityIndicator size="small" color="#FF6B6B" />
                ) : (
                    <>
                        <Icon name="check-circle" size={18} color="#FF6B6B" />
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                    </>
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des livraisons...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('LivreurProfile')}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Livraisons disponibles</Text>
                    <Text style={styles.headerSubtitle}>
                        {deliveries.length} livraison{deliveries.length !== 1 ? 's' : ''} trouvée{deliveries.length !== 1 ? 's' : ''}
                    </Text>
                </View>
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
                        <Icon name="local-shipping" size={60} color="#ccc" />
                        <Text style={styles.emptyTitle}>Aucune livraison disponible</Text>
                        <Text style={styles.emptyText}>
                            Revenez plus tard, de nouvelles commandes seront disponibles
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#F8F9FA',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deliveryInfo: {
        marginBottom: 12,
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
    earnings: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clientName: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
        marginLeft: 4,
        marginRight: 8,
    },
    clientPhone: {
        fontSize: 12,
        color: '#999',
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B15',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    acceptButtonText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
        marginLeft: 8,
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
        paddingHorizontal: 40,
    },
});