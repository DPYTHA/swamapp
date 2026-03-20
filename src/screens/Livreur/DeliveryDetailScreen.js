import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
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

export default function DeliveryDetailScreen({ navigation, route }) {
    const { deliveryId } = route.params;
    const { user } = useAuth();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadDeliveryDetails();
    }, []);

    const loadDeliveryDetails = async () => {
        try {
            const response = await api.get(`/livreur/commandes/${deliveryId}`);
            setDelivery(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement livraison:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger les détails de la livraison');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDeliveryDetails();
    };

    const getStatusInfo = (statut) => {
        const statusMap = {
            'preparation': { label: 'En préparation', color: '#2196F3', icon: 'pending' },
            'livraison': { label: 'En livraison', color: '#FF6B6B', icon: 'delivery-dining' },
            'livree': { label: 'Livrée', color: '#4CAF50', icon: 'check-circle' },
        };
        return statusMap[statut] || { label: statut, color: '#999', icon: 'help' };
    };

    const handleUpdateStatus = () => {
        if (!delivery) return;

        let nextStatus = '';
        let message = '';

        if (delivery.statut === 'preparation') {
            nextStatus = 'livraison';
            message = 'Démarrer la livraison de cette commande ?';
        } else if (delivery.statut === 'livraison') {
            nextStatus = 'livree';
            message = 'Confirmer la livraison de cette commande ?';
        }

        Alert.alert(
            'Mise à jour',
            message,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: () => updateStatus(nextStatus)
                }
            ]
        );
    };

    const updateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            await api.put(`/livreur/commandes/${delivery.id}/statut`, { statut: newStatus });
            Alert.alert('Succès', 'Statut mis à jour avec succès');
            loadDeliveryDetails();
        } catch (error) {
            console.log('❌ Erreur mise à jour:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
        } finally {
            setUpdating(false);
        }
    };

    const handleCallClient = () => {
        if (!delivery?.client?.telephone) return;

        const phoneNumber = delivery.client.telephone.replace(/\s/g, '');
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleOpenMaps = () => {
        if (!delivery?.adresse) return;

        // Ouvrir dans Google Maps
        const address = encodeURIComponent(delivery.adresse);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des détails...</Text>
            </View>
        );
    }

    if (!delivery) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error-outline" size={60} color="#F44336" />
                <Text style={styles.errorText}>Livraison non trouvée</Text>
                <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.errorButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusInfo = getStatusInfo(delivery.statut);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#FF6B6B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Détail de la livraison</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Code de suivi et statut */}
            <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Code de suivi</Text>
                <Text style={styles.codeValue}>{delivery.code_suivi}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                    <Icon name={statusInfo.icon} size={16} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                    </Text>
                </View>
            </View>

            {/* Informations client */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 Client</Text>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Icon name="person" size={20} color="#FF6B6B" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Nom</Text>
                            <Text style={styles.infoValue}>{delivery.client?.nom || 'Non renseigné'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="phone" size={20} color="#FF6B6B" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Téléphone</Text>
                            <Text style={styles.infoValue}>{delivery.client?.telephone}</Text>
                        </View>
                        <TouchableOpacity style={styles.actionIcon} onPress={handleCallClient}>
                            <Icon name="call" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Adresse de livraison */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Adresse de livraison</Text>
                <View style={styles.addressCard}>
                    <Icon name="location-on" size={20} color="#FF6B6B" />
                    <Text style={styles.addressText}>{delivery.adresse}</Text>
                    <TouchableOpacity style={styles.actionIcon} onPress={handleOpenMaps}>
                        <Icon name="map" size={20} color="#2196F3" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Informations de livraison */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚚 Informations de livraison</Text>
                <View style={styles.deliveryInfoCard}>
                    <View style={styles.deliveryInfoRow}>
                        <Text style={styles.deliveryInfoLabel}>Distance</Text>
                        <Text style={styles.deliveryInfoValue}>
                            {(delivery.distance / 1000).toFixed(1)} km
                        </Text>
                    </View>
                    <View style={styles.deliveryInfoRow}>
                        <Text style={styles.deliveryInfoLabel}>Frais de livraison</Text>
                        <Text style={styles.deliveryInfoValue}>
                            {delivery.frais_livraison?.toLocaleString()} FCFA
                        </Text>
                    </View>
                    <View style={styles.deliveryInfoRow}>
                        <Text style={styles.deliveryInfoLabel}>Gain estimé</Text>
                        <Text style={[styles.deliveryInfoValue, styles.earnings]}>
                            +{Math.round(delivery.frais_livraison * 0.8)} FCFA
                        </Text>
                    </View>
                </View>
            </View>

            {/* Articles */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🛒 Articles</Text>
                <View style={styles.productsCard}>
                    {delivery.articles?.map((item, index) => (
                        <View key={index} style={styles.productRow}>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{item.nom}</Text>
                                <Text style={styles.productQuantity}>x{item.quantite}</Text>
                            </View>
                            <Text style={styles.productPrice}>
                                {(item.prix * item.quantite).toLocaleString()} FCFA
                            </Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total commande</Text>
                        <Text style={styles.totalValue}>{delivery.total?.toLocaleString()} FCFA</Text>
                    </View>
                </View>
            </View>

            {/* Instructions spéciales (optionnel) */}
            {delivery.instructions && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Instructions spéciales</Text>
                    <View style={styles.instructionsCard}>
                        <Text style={styles.instructionsText}>{delivery.instructions}</Text>
                    </View>
                </View>
            )}

            {/* Bouton d'action */}
            {delivery.statut !== 'livree' && (
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: statusInfo.color }]}
                        onPress={handleUpdateStatus}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon
                                    name={delivery.statut === 'preparation' ? 'delivery-dining' : 'check-circle'}
                                    size={20}
                                    color="#fff"
                                />
                                <Text style={styles.actionButtonText}>
                                    {delivery.statut === 'preparation' ? 'Démarrer la livraison' : 'Confirmer la livraison'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        marginBottom: 20,
    },
    errorButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    errorButtonText: {
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
    codeCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    codeLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    codeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B6B',
        letterSpacing: 1,
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 25,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    section: {
        marginHorizontal: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
        marginRight: 12,
        lineHeight: 20,
    },
    deliveryInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    deliveryInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    deliveryInfoLabel: {
        fontSize: 14,
        color: '#666',
    },
    deliveryInfoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    earnings: {
        color: '#4CAF50',
    },
    productsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    productName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    productQuantity: {
        fontSize: 14,
        color: '#999',
        marginLeft: 8,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#FF6B6B20',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    instructionsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    instructionsText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    actionSection: {
        marginHorizontal: 15,
        marginBottom: 30,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});