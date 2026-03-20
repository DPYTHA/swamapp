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
import api from '../../services/api';

export default function OrderDetailsAdminScreen({ navigation, route }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [validating, setValidating] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadOrderDetails();
    }, []);

    const loadOrderDetails = async () => {
        try {
            const response = await api.get(`/admin/commandes/${orderId}`);
            console.log('📦 Détails commande reçus:', {
                code: response.data.code_suivi,
                statut: response.data.statut,
                paiement_statut: response.data.paiement?.statut,
                total: response.data.total,
                sous_total: response.data.sous_total,
                frais: response.data.frais_livraison,
                recherche_livreur: response.data.recherche_livreur,
                livreur_id: response.data.livreur_id
            });
            setOrder(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement commande:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    const handleStartSearch = async (commandeId) => {
        try {
            await api.post(`/admin/commandes/${commandeId}/rechercher-livreur`);
            Alert.alert('Succès', 'Recherche de livreur lancée');
            await loadOrderDetails(); // Recharger pour mettre à jour recherche_livreur
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de lancer la recherche');
        }
    };
    const onRefresh = () => {
        setRefreshing(true);
        loadOrderDetails();
    };

    const handleValidatePayment = () => {
        if (!order?.paiement?.id) {
            Alert.alert('Erreur', 'ID de paiement manquant');
            return;
        }

        Alert.alert(
            'Valider le paiement',
            'Confirmez-vous la réception du paiement ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Valider',
                    onPress: () => validatePayment()
                }
            ]
        );
    };

    const validatePayment = async () => {
        setValidating(true);
        try {
            await api.post(`/admin/paiements/${order.paiement.id}/valider`, {});
            Alert.alert('Succès', 'Paiement validé avec succès');
            await loadOrderDetails();
        } catch (error) {
            console.log('❌ Erreur validation:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.msg ||
                'Impossible de valider le paiement';
            Alert.alert('Erreur', errorMessage);
        } finally {
            setValidating(false);
        }
    };

    const handleUpdateStatus = (newStatus) => {
        if (!order?.id) {
            Alert.alert('Erreur', 'ID de commande manquant');
            return;
        }

        Alert.alert(
            'Changer le statut',
            `Passer la commande en "${getStatusLabel(newStatus)}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: () => updateStatus(newStatus)
                }
            ]
        );
    };

    const getStatusLabel = (statut) => {
        const labels = {
            'en_attente_paiement': 'En attente de paiement',
            'preparation': 'En préparation',
            'livraison': 'En livraison',
            'livree': 'Livrée',
            'annulee': 'Annulée'
        };
        return labels[statut] || statut;
    };

    const updateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            await api.put(`/commandes/${order.id}/statut`, { statut: newStatus });
            Alert.alert('Succès', 'Statut mis à jour');
            await loadOrderDetails();
        } catch (error) {
            console.log('❌ Erreur mise à jour statut:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.msg ||
                'Impossible de mettre à jour le statut';
            Alert.alert('Erreur', errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    // Calculs directement depuis les données reçues
    const sousTotal = order?.sous_total || 0;
    const fraisLivraison = order?.frais_livraison || 0;
    const reduction = order?.reduction || 0;
    const total = order?.total || 0;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement de la commande...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error" size={60} color="#F44336" />
                <Text style={styles.errorText}>Commande non trouvée</Text>
                <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.errorButtonText}>Retour</Text>
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
                <Text style={styles.headerTitle}>Détail de la commande</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Code de suivi */}
            <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Code de suivi</Text>
                <Text style={styles.codeValue}>{order.code_suivi}</Text>
            </View>

            {/* Informations client */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>👤 Client</Text>
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Nom</Text>
                        <Text style={styles.infoValue}>{order.client?.nom || 'Non renseigné'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Téléphone</Text>
                        <Text style={styles.infoValue}>{order.client?.telephone}</Text>
                    </View>
                </View>
            </View>

            {/* Adresse */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>📍 Adresse de livraison</Text>
                <View style={styles.addressCard}>
                    <Icon name="location-on" size={20} color="#FF6B6B" />
                    <Text style={styles.addressText}>{order.adresse}</Text>
                </View>
            </View>

            {/* Articles */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>🛒 Articles</Text>
                <View style={styles.productsCard}>
                    {order.articles?.map((item, index) => (
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
                </View>
            </View>

            {/* Paiement */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>💳 Paiement</Text>
                <View style={styles.paymentCard}>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Méthode</Text>
                        <Text style={styles.paymentValue}>
                            {order.paiement?.methode === 'orange' ? 'Orange Money' :
                                order.paiement?.methode === 'mtn' ? 'MTN Money' :
                                    order.paiement?.methode === 'wave' ? 'Wave' : 'Non spécifié'}
                        </Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Statut</Text>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: order.paiement?.statut === 'valide' ? '#4CAF5020' : '#FFA50020' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: order.paiement?.statut === 'valide' ? '#4CAF50' : '#FFA500' }
                            ]}>
                                {order.paiement?.statut === 'valide' ? 'Validé' : 'En attente'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Récapitulatif des montants */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>💰 Détail des montants</Text>
                <View style={styles.totalCard}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Montant des articles</Text>
                        <Text style={styles.totalValue}>{sousTotal.toLocaleString()} FCFA</Text>
                    </View>

                    {fraisLivraison > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Frais de livraison</Text>
                            <Text style={styles.totalValue}>+ {fraisLivraison.toLocaleString()} FCFA</Text>
                        </View>
                    )}

                    {reduction !== 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Réduction</Text>
                            <Text style={[styles.totalValue, styles.reductionText]}>{reduction} FCFA</Text>
                        </View>
                    )}

                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>{total.toLocaleString()} FCFA</Text>
                    </View>
                </View>
            </View>

            {/* Actions admin */}
            <View style={styles.actionsSection}>
                {/* Bouton de validation - apparaît uniquement si le paiement est en attente */}
                {order.paiement?.statut === 'en_attente' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.validateButton]}
                        onPress={handleValidatePayment}
                        disabled={validating}
                    >
                        {validating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon name="check-circle" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Valider le paiement</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* ✅ Bouton d'assignation de livreur - CORRIGÉ ET PLACÉ ICI */}
                {order.statut === 'preparation' && !order.livreur_id && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#2196F3', marginBottom: 20 }]}
                        onPress={() => navigation.navigate('AssignLivreur', {
                            commandeId: order.id,
                            commande: order
                        })}
                    >
                        <Icon name="local-shipping" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Trouver un livreur</Text>
                    </TouchableOpacity>
                )}
                {order.statut === 'preparation' && !order.livreur_id && (
                    <>
                        {/* Bouton pour lancer la recherche */}
                        {!order.recherche_livreur && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#FFA500', marginBottom: 10 }]}
                                onPress={() => handleStartSearch(order.id)}
                            >
                                <Icon name="notifications" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Lancer la recherche</Text>
                            </TouchableOpacity>
                        )}

                        {/* Bouton pour trouver un livreur (visible après recherche) */}
                        {order.recherche_livreur && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#2196F3', marginBottom: 10 }]}
                                onPress={() => navigation.navigate('AssignLivreur', {
                                    commandeId: order.id
                                })}
                            >
                                <Icon name="local-shipping" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Trouver un livreur</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <Text style={styles.statusTitle}>Changer le statut :</Text>
                <View style={styles.statusButtons}>
                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#2196F3' }]}
                        onPress={() => handleUpdateStatus('preparation')}
                        disabled={updating}
                    >
                        <Text style={styles.statusButtonText}>En préparation</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#FF6B6B' }]}
                        onPress={() => handleUpdateStatus('livraison')}
                        disabled={updating}
                    >
                        <Text style={styles.statusButtonText}>En livraison</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleUpdateStatus('livree')}
                        disabled={updating}
                    >
                        <Text style={styles.statusButtonText}>Livrée</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#F44336' }]}
                        onPress={() => handleUpdateStatus('annulee')}
                        disabled={updating}
                    >
                        <Text style={styles.statusButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        borderWidth: 2,
        borderColor: '#FF6B6B',
        borderStyle: 'dashed',
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
    },
    infoSection: {
        marginHorizontal: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    infoGrid: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoItem: {
        marginBottom: 10,
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
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
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
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#666',
    },
    paymentValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    totalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    reductionText: {
        color: '#4CAF50',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#FF6B6B20',
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    actionsSection: {
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
    validateButton: {
        backgroundColor: '#4CAF50',
        marginBottom: 15,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    statusTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        marginTop: 5,
    },
    statusButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statusButton: {
        width: '48%',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    statusButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});