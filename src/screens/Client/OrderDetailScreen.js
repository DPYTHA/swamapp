import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
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

const getStatutInfo = (statut) => {
    const statuts = {
        'en_attente_paiement': {
            label: 'En attente de paiement',
            color: '#FFA500',
            icon: 'payment',
            bgColor: '#FFA50015',
            nextSteps: ['preparation', 'annulee']
        },
        'preparation': {
            label: 'En préparation',
            color: '#2196F3',
            icon: 'local-dining',
            bgColor: '#2196F315',
            nextSteps: ['livraison', 'annulee']
        },
        'livraison': {
            label: 'En livraison',
            color: '#FF6B6B',
            icon: 'delivery-dining',
            bgColor: '#FF6B6B15',
            nextSteps: ['livree', 'annulee']
        },
        'livree': {
            label: 'Livrée',
            color: '#4CAF50',
            icon: 'check-circle',
            bgColor: '#4CAF5015',
            nextSteps: []
        },
        'annulee': {
            label: 'Annulée',
            color: '#F44336',
            icon: 'cancel',
            bgColor: '#F4433615',
            nextSteps: []
        },
    };
    return statuts[statut] || {
        label: statut,
        color: '#999',
        icon: 'help',
        bgColor: '#99999915',
        nextSteps: []
    };
};

const getTimelineSteps = (commande) => {
    return [
        {
            id: 'commande',
            label: 'Commande passée',
            date: commande.date_commande,
            completed: true,
            icon: 'shopping-cart',
        },
        {
            id: 'preparation',
            label: 'En préparation',
            date: commande.statut === 'preparation' || commande.statut === 'livraison' || commande.statut === 'livree' ? commande.date_commande : null,
            completed: ['preparation', 'livraison', 'livree'].includes(commande.statut),
            icon: 'local-dining',
        },
        {
            id: 'livraison',
            label: 'En livraison',
            date: commande.statut === 'livraison' || commande.statut === 'livree' ? commande.date_commande : null,
            completed: ['livraison', 'livree'].includes(commande.statut),
            icon: 'delivery-dining',
        },
        {
            id: 'livree',
            label: 'Livrée',
            date: commande.date_livraison,
            completed: commande.statut === 'livree',
            icon: 'check-circle',
        },
    ];
};

export default function OrderDetailScreen({ route, navigation }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadOrderDetails();
    }, []);

    const loadOrderDetails = async () => {
        try {
            // Charger les détails de la commande
            const response = await api.get(`/commandes/suivi/${orderId}`);
            setOrder(response.data);

            // Charger les détails du paiement si nécessaire
            try {
                const paymentResponse = await api.get(`/commandes/${orderId}/paiement`);
                setOrder(prev => ({ ...prev, paiement: paymentResponse.data }));
            } catch (paymentError) {
                console.log('⚠️ Pas de détails de paiement:', paymentError.message);
            }
        } catch (error) {
            console.log('❌ Erreur chargement commande:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrderDetails();
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    onPress: cancelOrder,
                    style: 'destructive'
                }
            ]
        );
    };

    const cancelOrder = async () => {
        setCancelling(true);
        try {
            await api.put(`/commandes/${order.id}/statut`, { statut: 'annulee' });
            Alert.alert('Succès', 'Commande annulée avec succès');
            loadOrderDetails();
        } catch (error) {
            console.log('❌ Erreur annulation:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible d\'annuler la commande');
        } finally {
            setCancelling(false);
        }
    };

    const handleWhatsApp = () => {
        const phoneNumber = '+2250757123619';
        const url = `whatsapp://send?phone=${phoneNumber}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur votre téléphone');
            }
        });
    };

    const handleEmail = () => {
        const email = 'pythacademy91@gmail.com';
        const url = `mailto:${email}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement de votre commande...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error-outline" size={60} color="#F44336" />
                <Text style={styles.errorText}>Commande introuvable</Text>
                <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.errorButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statutInfo = getStatutInfo(order.statut);
    const timeline = getTimelineSteps(order);
    const canCancel = ['en_attente_paiement', 'preparation'].includes(order.statut);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: statutInfo.bgColor }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color={statutInfo.color} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: statutInfo.color }]}>
                        Commande {order.code_suivi}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.statusContainer}>
                    <View style={[styles.statusIconContainer, { backgroundColor: statutInfo.color + '20' }]}>
                        <Icon name={statutInfo.icon} size={40} color={statutInfo.color} />
                    </View>
                    <Text style={[styles.statusLabel, { color: statutInfo.color }]}>
                        {statutInfo.label}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B6B']}
                        tintColor="#FF6B6B"
                    />
                }
            >
                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suivi de commande</Text>
                    <View style={styles.timelineContainer}>
                        {timeline.map((step, index) => (
                            <View key={step.id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <View style={[
                                        styles.timelineDot,
                                        step.completed && styles.timelineDotCompleted,
                                        { borderColor: step.completed ? '#4CAF50' : '#ddd' }
                                    ]}>
                                        {step.completed && (
                                            <Icon name="check" size={12} color="#fff" />
                                        )}
                                    </View>
                                    {index < timeline.length - 1 && (
                                        <View style={[
                                            styles.timelineLine,
                                            step.completed && styles.timelineLineCompleted
                                        ]} />
                                    )}
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineStatus}>{step.label}</Text>
                                    {step.date && (
                                        <Text style={styles.timelineDate}>
                                            {new Date(step.date).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    )}
                                </View>
                                <View style={[
                                    styles.timelineIcon,
                                    { backgroundColor: step.completed ? '#4CAF5020' : '#f0f0f0' }
                                ]}>
                                    <Icon
                                        name={step.icon}
                                        size={20}
                                        color={step.completed ? '#4CAF50' : '#999'}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Articles commandés */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Articles commandés</Text>
                    <View style={styles.productsContainer}>
                        {order.articles.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.nom}</Text>
                                    <Text style={styles.itemQuantity}>x{item.quantite}</Text>
                                </View>
                                <Text style={styles.itemPrice}>
                                    {(item.prix * item.quantite).toLocaleString()} FCFA
                                </Text>
                            </View>
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalPrice}>{order.total.toLocaleString()} FCFA</Text>
                        </View>
                    </View>
                </View>

                {/* Informations de livraison */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Livraison</Text>
                    <View style={styles.deliveryCard}>
                        <View style={styles.infoRow}>
                            <Icon name="location-on" size={20} color="#FF6B6B" />
                            <Text style={styles.infoText}>{order.adresse}</Text>
                        </View>
                    </View>
                </View>

                {/* Informations de paiement */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paiement</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Méthode</Text>
                            <Text style={styles.paymentValue}>
                                {order.paiement?.methode === 'orange' ? 'Orange Money' :
                                    order.paiement?.methode === 'mtn' ? 'MTN Money' :
                                        order.paiement?.methode === 'wave' ? 'Wave' :
                                            order.methode_paiement === 'orange' ? 'Orange Money' :
                                                order.methode_paiement === 'mtn' ? 'MTN Money' :
                                                    order.methode_paiement === 'wave' ? 'Wave' : 'Non spécifié'}
                            </Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Statut</Text>
                            <View style={[
                                styles.paymentStatus,
                                { backgroundColor: (order.paiement?.statut === 'valide' || order.statut_paiement === 'valide') ? '#4CAF5020' : '#FFA50020' }
                            ]}>
                                <Text style={[
                                    styles.paymentStatusText,
                                    { color: (order.paiement?.statut === 'valide' || order.statut_paiement === 'valide') ? '#4CAF50' : '#FFA500' }
                                ]}>
                                    {(order.paiement?.statut === 'valide' || order.statut_paiement === 'valide') ? 'Validé' : 'En attente'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {canCancel && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelOrder}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <ActivityIndicator color="#F44336" />
                            ) : (
                                <>
                                    <Icon name="cancel" size={20} color="#F44336" />
                                    <Text style={styles.cancelButtonText}>Annuler la commande</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Support avec WhatsApp et Email */}
                    <View style={styles.supportContainer}>
                        <Text style={styles.supportTitle}>Contacter le support</Text>

                        <TouchableOpacity style={styles.supportButton} onPress={handleWhatsApp}>
                            <Icon name="chat" size={24} color="#25D366" />
                            <View style={styles.supportTextContainer}>
                                <Text style={styles.supportButtonText}>WhatsApp</Text>
                                <Text style={styles.supportDetail}>+225 07 57 12 36 19</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.supportButton} onPress={handleEmail}>
                            <Icon name="email" size={24} color="#FF6B6B" />
                            <View style={styles.supportTextContainer}>
                                <Text style={styles.supportButtonText}>Email</Text>
                                <Text style={styles.supportDetail}>pythacademy91@gmail.com</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
        fontSize: 18,
        color: '#666',
        marginTop: 16,
        marginBottom: 20,
    },
    errorButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    statusIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 15,
    },
    timelineContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    timelineLeft: {
        alignItems: 'center',
        width: 30,
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    timelineDotCompleted: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#ddd',
        marginTop: 5,
        marginBottom: -5,
    },
    timelineLineCompleted: {
        backgroundColor: '#4CAF50',
    },
    timelineContent: {
        flex: 1,
        marginLeft: 10,
    },
    timelineStatus: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    timelineDate: {
        fontSize: 12,
        color: '#999',
    },
    timelineIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    productsContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    itemQuantity: {
        fontSize: 14,
        color: '#999',
        marginLeft: 8,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 2,
        borderTopColor: '#f0f0f0',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    deliveryCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
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
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
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
    paymentStatus: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    paymentStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        padding: 20,
        paddingTop: 0,
        marginBottom: 20,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
        marginBottom: 10,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#F44336',
        fontWeight: '600',
        marginLeft: 10,
    },
    supportContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    supportTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    supportTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    supportButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    supportDetail: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
});