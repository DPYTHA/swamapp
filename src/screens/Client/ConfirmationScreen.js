import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const MOBILE_MONEY_ACCOUNTS = [
    { id: 'orange', nom: 'Orange Money', numero: '0757123619', titulaire: 'Olivia', couleur: '#FF6B00', icon: 'phone-android' },
    { id: 'mtn', nom: 'MTN Money', numero: '0657432617', titulaire: 'Olivia', couleur: '#FFCC00', icon: 'sim-card' },
    { id: 'wave', nom: 'Wave', numero: '0710069791', titulaire: 'Olivia', couleur: '#2D9CDB', icon: 'waves' },
];

export default function ConfirmationScreen({ navigation, route }) {
    const { user } = useAuth();
    const { clearCart } = useCart();
    const params = route.params || {};

    // ✅ Récupération des paramètres
    const destination = params.destination || { nom: '', adresse: '', telephone: '' };
    const deliveryOption = params.deliveryOption || 'asap';
    const cartTotal = params.cartTotal || 0;
    const finalTotal = params.finalTotal || 0;
    const cartItems = params.cartItems || [];
    const deliveryFee = params.deliveryFee || 0;
    const reduction = params.reduction || 0;
    const tempCodeSuivi = params.codeSuivi || 'SWAM-' + Date.now().toString().slice(-6);

    // ✅ État pour le vrai code de suivi
    const [codeSuivi, setCodeSuivi] = useState(tempCodeSuivi);

    // ✅ Calcul du sous-total (utilise quantity)
    const subTotal = cartItems.reduce((sum, item) => sum + (item.prix * (item.quantity || 1)), 0);

    // ✅ ÉTATS POUR LE SUIVI
    const [orderStatus, setOrderStatus] = useState('en_attente_paiement');
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;

    // ✅ FONCTION POUR OBTENIR LE LIBELLÉ DU STATUT
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

    // ✅ FONCTION POUR VÉRIFIER LE STATUT
    const checkOrderStatus = async () => {
        if (!codeSuivi) return false;

        try {
            console.log('🔍 Vérification avec code:', codeSuivi);
            const response = await api.get(`/commandes/suivi/${codeSuivi}`);
            console.log('📊 Statut commande:', response.data.statut);

            if (response.data.statut !== orderStatus) {
                setOrderStatus(response.data.statut);

                if (response.data.statut !== 'en_attente_paiement') {
                    addBotMessage(`✅ Votre commande a été mise à jour ! Nouveau statut: ${getStatusLabel(response.data.statut)}`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.log('❌ Erreur vérification statut:', error.response?.status, error.message);
            return false;
        }
    };

    // ✅ FONCTION POUR DÉMARRER LA VÉRIFICATION AUTOMATIQUE
    const startStatusChecking = () => {
        const interval = setInterval(async () => {
            const updated = await checkOrderStatus();
            if (updated) {
                clearInterval(interval);
            }
        }, 10000);

        return interval;
    };

    // ✅ EFFET POUR DÉMARRER LA VÉRIFICATION QUAND LE CHAT EST VISIBLE
    useEffect(() => {
        let interval;
        if (isChatVisible && codeSuivi) {
            interval = startStatusChecking();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isChatVisible, codeSuivi]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    const getDeliveryLabel = (id) => {
        const options = { 'asap': 'Dès que possible', '1h': 'Dans 1h', '3h': 'Dans 3h', 'plus': 'Plus tard' };
        return options[id] || id;
    };

    const addBotMessage = (text) => {
        setChatMessages(prev => [...prev, { id: Date.now(), text, isBot: true }]);
    };

    const addUserMessage = (text) => {
        setChatMessages(prev => [...prev, { id: Date.now(), text, isBot: false }]);
    };

    const handleSendMessage = () => {
        if (!messageText.trim()) return;
        addUserMessage(messageText);
        setMessageText('');
        setTimeout(() => addBotMessage("Un admin vous répondra sous peu."), 1000);
    };

    const envoyerCommandeAuBackend = async () => {
        if (!user) {
            Alert.alert('Erreur', 'Veuillez vous connecter');
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem('token');
            console.log('🎫 Token présent:', token ? 'Oui' : 'Non');

            // ✅ Construction des items avec quantity
            const itemsToSend = cartItems.map(item => ({
                produit_id: item.id,
                quantity: item.quantity || 1
            }));

            console.log('📦 Items à envoyer:', itemsToSend); // ✅ Maintenant ça existe

            const commandeData = {
                items: itemsToSend,  // 👈 Utilisation de la variable
                adresse_livraison: `${destination.nom}\n${destination.adresse}\nTel: ${destination.telephone}`,
                methode_paiement: selectedPaymentMethod,
                numero_transaction: `PAIEMENT-${Date.now()}`,
                distance: destination.distance || 0,
                frais_livraison: deliveryFee,
                reduction: reduction,
                delivery_option: deliveryOption,
            };

            console.log('📤 Envoi commande avec détails complets:', JSON.stringify(commandeData, null, 2));

            const response = await api.post('/commandes', commandeData);

            console.log('✅ Réponse du backend:', response.data);

            const vraiCodeSuivi = response.data.code_suivi;
            setCodeSuivi(vraiCodeSuivi);

            clearCart();

            Alert.alert('✅ Succès', `Commande enregistrée\nCode: ${vraiCodeSuivi}`, [
                {
                    text: 'OK', onPress: () => {
                        setIsOrderConfirmed(true);
                        setIsChatVisible(true);
                    }
                }
            ]);

        } catch (error) {
            console.log('❌ Erreur détaillée:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.msg ||
                'Échec de l\'envoi';
            Alert.alert('Erreur', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = () => {
        if (!selectedPaymentMethod) {
            Alert.alert('Erreur', 'Sélectionnez un mode de paiement');
            return;
        }
        Alert.alert('Confirmation', 'Avez-vous effectué le paiement ?', [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui', onPress: envoyerCommandeAuBackend }
        ]);
    };

    const handleCopyNumber = (numero) => {
        Alert.alert('✅ Copié', `Numéro ${numero} copié`);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmation</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            {!isChatVisible ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={[styles.iconContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.checkCircle}>
                            <Icon name="check" size={40} color="#fff" />
                        </View>
                    </Animated.View>

                    <Animated.Text style={[styles.title, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        Vérifiez votre commande
                    </Animated.Text>

                    {/* Code */}
                    <Animated.View style={[styles.codeCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.codeValue}>{codeSuivi}</Text>
                    </Animated.View>

                    {/* Adresse */}
                    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.cardTitle}>📍 Adresse</Text>
                        <Text style={styles.bold}>{destination.nom}</Text>
                        <Text>{destination.adresse}</Text>
                        <Text>{destination.telephone}</Text>
                    </Animated.View>

                    {/* Délai */}
                    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.cardTitle}>⏱️ Délai</Text>
                        <Text style={styles.deliveryText}>{getDeliveryLabel(deliveryOption)}</Text>
                    </Animated.View>

                    {/* Paiement */}
                    <Animated.View style={[styles.paymentSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.paymentWarning}>⚠️ Payez avant de confirmer</Text>
                        {MOBILE_MONEY_ACCOUNTS.map((account) => (
                            <TouchableOpacity
                                key={account.id}
                                style={[styles.paymentCard, selectedPaymentMethod === account.id && styles.paymentCardSelected]}
                                onPress={() => setSelectedPaymentMethod(account.id)}
                            >
                                <View style={[styles.paymentIcon, { backgroundColor: account.couleur + '20' }]}>
                                    <Icon name={account.icon} size={24} color={account.couleur} />
                                </View>
                                <View style={styles.paymentInfo}>
                                    <Text style={styles.paymentName}>{account.nom}</Text>
                                    <View style={styles.paymentNumberContainer}>
                                        <Text>{account.numero}</Text>
                                        <TouchableOpacity onPress={() => handleCopyNumber(account.numero)}>
                                            <Icon name="content-copy" size={16} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text>{account.titulaire}</Text>
                                </View>
                                {selectedPaymentMethod === account.id && (
                                    <Icon name="check-circle" size={24} color="#4CAF50" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {/* Articles */}
                    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.cardTitle}>🛒 Articles ({cartItems.length})</Text>
                        {cartItems.map((item, i) => (
                            <View key={i} style={styles.itemRow}>
                                <Text>{item.nom} x{item.quantity || 1}</Text>
                                <Text style={styles.price}>{(item.prix * (item.quantity || 1)).toLocaleString()} FCFA</Text>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Total */}
                    <Animated.View style={[styles.totalCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.totalTitle}>💰 Total</Text>

                        <View style={styles.totalRow}>
                            <Text>Sous-total</Text>
                            <Text>{cartTotal.toLocaleString()} FCFA</Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text>Frais livraison</Text>
                            <Text style={styles.deliveryFee}>+ {deliveryFee.toLocaleString()} FCFA</Text>
                        </View>

                        {reduction !== 0 && (
                            <View style={styles.totalRow}>
                                <Text>Réduction</Text>
                                <Text style={styles.reduction}>{reduction} FCFA</Text>
                            </View>
                        )}

                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>TOTAL À PAYER</Text>
                            <Text style={styles.grandTotalValue}>{finalTotal.toLocaleString()} FCFA</Text>
                        </View>
                    </Animated.View>

                    {/* Bouton */}
                    <TouchableOpacity
                        style={[styles.confirmButton, (!selectedPaymentMethod || loading) && styles.confirmButtonDisabled]}
                        onPress={handleConfirmOrder}
                        disabled={!selectedPaymentMethod || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>J'ai payé</Text>}
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={styles.chatContainer}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle}>Support SWAM</Text>
                        <View style={styles.chatHeaderButtons}>
                            <TouchableOpacity
                                onPress={async () => {
                                    setCheckingStatus(true);
                                    await checkOrderStatus();
                                    setCheckingStatus(false);
                                }}
                                disabled={checkingStatus}
                                style={styles.refreshButton}
                            >
                                {checkingStatus ? (
                                    <ActivityIndicator size="small" color="#FF6B6B" />
                                ) : (
                                    <Icon name="refresh" size={24} color="#FF6B6B" />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsChatVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView style={styles.chatMessages}>
                        {chatMessages.map(msg => (
                            <View key={msg.id} style={[styles.messageRow, msg.isBot ? styles.botMessageRow : styles.userMessageRow]}>
                                <View style={[styles.messageBubble, msg.isBot ? styles.botBubble : styles.userBubble]}>
                                    <Text style={msg.isBot ? styles.botMessageText : styles.userMessageText}>{msg.text}</Text>
                                </View>
                            </View>
                        ))}
                        {isOrderConfirmed && (
                            <View style={styles.waitingContainer}>
                                <ActivityIndicator size="large" color="#FF6B6B" />
                                <Text style={styles.waitingText}>En attente de validation admin...</Text>
                                <Text style={styles.waitingSubText}>Statut actuel: {getStatusLabel(orderStatus)}</Text>
                            </View>
                        )}
                    </ScrollView>
                    <View style={styles.chatInputContainer}>
                        <TextInput style={styles.chatInput} value={messageText} onChangeText={setMessageText} placeholder="Message..." />
                        <TouchableOpacity onPress={handleSendMessage}>
                            <Icon name="send" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { paddingBottom: 30 },
    iconContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
    checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
    codeCard: { backgroundColor: '#FF6B6B10', margin: 15, padding: 15, borderRadius: 15, borderWidth: 2, borderColor: '#FF6B6B', borderStyle: 'dashed', alignItems: 'center' },
    codeValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    card: { backgroundColor: '#f9f9f9', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 15 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#FF6B6B' },
    bold: { fontWeight: 'bold' },
    deliveryText: { fontSize: 16, color: '#FF6B6B', fontWeight: '500' },
    paymentSection: { marginHorizontal: 15, marginBottom: 15 },
    paymentWarning: { backgroundColor: '#FFA50020', color: '#FFA500', padding: 12, borderRadius: 10, marginBottom: 15, textAlign: 'center', fontWeight: '500' },
    paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
    paymentCardSelected: { borderColor: '#FF6B6B', backgroundColor: '#fff' },
    paymentIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    paymentInfo: { flex: 1 },
    paymentName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    paymentNumberContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    price: { fontWeight: '500' },
    totalCard: { backgroundColor: '#FF6B6B10', margin: 15, padding: 15, borderRadius: 15 },
    totalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    deliveryFee: { color: '#FF6B6B', fontWeight: '500' },
    reduction: { color: '#4CAF50', fontWeight: '500' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#FF6B6B30' },
    grandTotalLabel: { fontSize: 16, fontWeight: 'bold' },
    grandTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6B6B' },
    confirmButton: { backgroundColor: '#4CAF50', margin: 15, padding: 15, borderRadius: 12, alignItems: 'center' },
    confirmButtonDisabled: { backgroundColor: '#ccc' },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    chatContainer: { flex: 1, backgroundColor: '#f5f5f5' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1 },
    chatTitle: { fontSize: 16, fontWeight: 'bold' },
    chatHeaderButtons: { flexDirection: 'row', alignItems: 'center' },
    refreshButton: { marginRight: 15, padding: 5 },
    chatMessages: { flex: 1, padding: 15 },
    messageRow: { marginBottom: 10, alignItems: 'flex-start' },
    botMessageRow: { alignItems: 'flex-start' },
    userMessageRow: { alignItems: 'flex-end' },
    messageBubble: { padding: 10, borderRadius: 10, maxWidth: '80%' },
    botBubble: { backgroundColor: '#fff' },
    userBubble: { backgroundColor: '#FF6B6B' },
    botMessageText: { color: '#333' },
    userMessageText: { color: '#fff' },
    chatInputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1 },
    chatInput: { flex: 1, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 20, marginRight: 10 },
    waitingContainer: { alignItems: 'center', padding: 30 },
    waitingText: { marginTop: 10, color: '#666', textAlign: 'center' },
    waitingSubText: { marginTop: 5, color: '#999', textAlign: 'center', fontSize: 12 },
});