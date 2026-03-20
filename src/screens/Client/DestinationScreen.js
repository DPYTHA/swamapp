import { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Données des destinations avec distances
const DESTINATIONS = [
    {
        id: 1,
        nom: 'Sicap Liberté 6',
        adresse: 'Sicap Liberté 6, Dakar',
        telephone: '77 123 45 67',
        distance: 3500, // en mètres
    },
    {
        id: 2,
        nom: 'Place de l\'Indépendance',
        adresse: 'Place de l\'Indépendance, Dakar',
        telephone: '78 123 45 67',
        distance: 5200,
    },
    {
        id: 3,
        nom: 'Almadies',
        adresse: 'Route des Almadies, Dakar',
        telephone: '76 123 45 67',
        distance: 8900,
    },
    {
        id: 4,
        nom: 'Gare Routière',
        adresse: 'Gare Routière de Dakar',
        telephone: '70 123 45 67',
        distance: 4200,
    },
    {
        id: 5,
        nom: 'Université Cheikh Anta Diop',
        adresse: 'UCAD, Dakar',
        telephone: '75 123 45 67',
        distance: 6800,
    },
];

// Options de livraison
const DELIVERY_OPTIONS = [
    {
        id: 'asap',
        label: 'ASAP',
        description: 'Dès que possible',
        reduction: 0,
        icon: 'flash-on',
    },
    {
        id: '1h',
        label: '1 heure',
        description: 'Économisez 50 FCFA',
        reduction: -50,
        icon: 'schedule',
    },
    {
        id: '3h',
        label: '3 heures',
        description: 'Économisez 90 FCFA',
        reduction: -90,
        icon: 'schedule',
    },
    {
        id: 'plus',
        label: 'Plus tard',
        description: 'Économisez 150 FCFA',
        reduction: -150,
        icon: 'event',
    },
];

// Fonction pour calculer les frais de livraison (dans DestinationScreen)
const calculateDeliveryFee = (distance) => {
    const fee = Math.ceil(distance / 100) * 150;
    console.log('📐 Calcul frais:', distance, 'm →', fee, 'FCFA');
    return fee;
};

export default function DestinationScreen({ navigation, route }) {
    const { cartTotal, cartItems } = route.params;
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [selectedDelivery, setSelectedDelivery] = useState('asap');
    const [showNewAddressModal, setShowNewAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({
        nom: '',
        adresse: '',
        telephone: '',
        distance: '3000',
    });

    // Calculer le total avec frais et réductions
    const calculateFinalTotal = () => {
        if (!selectedDestination) return cartTotal;

        const deliveryFee = calculateDeliveryFee(selectedDestination.distance);
        const deliveryOption = DELIVERY_OPTIONS.find(opt => opt.id === selectedDelivery);
        const reduction = deliveryOption?.reduction || 0;

        return cartTotal + deliveryFee + reduction;
    };

    const handleAddNewAddress = () => {
        if (!newAddress.nom || !newAddress.adresse || !newAddress.telephone) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        const newDest = {
            id: Date.now(),
            nom: newAddress.nom,
            adresse: newAddress.adresse,
            telephone: newAddress.telephone,
            distance: parseInt(newAddress.distance) || 3000,
        };

        // Ajouter à la liste
        DESTINATIONS.push(newDest);
        setSelectedDestination(newDest);
        setShowNewAddressModal(false);
        setNewAddress({ nom: '', adresse: '', telephone: '', distance: '3000' });
    };

    // Dans DestinationScreen.js - handleGoToConfirmation
    const handleGoToConfirmation = () => {
        if (!selectedDestination) {
            Alert.alert('Erreur', 'Veuillez choisir une adresse de livraison');
            return;
        }

        // Calculer les valeurs ICI avant de les envoyer
        const deliveryFee = calculateDeliveryFee(selectedDestination.distance);
        const reduction = DELIVERY_OPTIONS.find(opt => opt.id === selectedDelivery).reduction;
        const finalTotal = cartTotal + deliveryFee + reduction;
        const codeSuivi = 'SWAM-' + Date.now().toString().slice(-6);

        console.log('📤 ENVOI VERS CONFIRMATION:', {
            destination: selectedDestination.nom,
            cartTotal,
            deliveryFee,
            reduction,
            finalTotal
        });

        navigation.navigate('CommandeConfirmation', {
            destination: selectedDestination,
            deliveryOption: selectedDelivery,
            cartTotal: cartTotal,
            finalTotal: finalTotal,           // ← Calculé
            cartItems: cartItems,
            deliveryFee: deliveryFee,         // ← Calculé
            reduction: reduction,             // ← Calculé
            codeSuivi: codeSuivi,
        });
    };

    const renderDestination = ({ item }) => {
        const isSelected = selectedDestination?.id === item.id;
        const deliveryFee = calculateDeliveryFee(item.distance);

        return (
            <TouchableOpacity
                style={[styles.destinationCard, isSelected && styles.selectedCard]}
                onPress={() => setSelectedDestination(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                        <Icon
                            name="location-on"
                            size={20}
                            color={isSelected ? '#FF6B6B' : '#666'}
                        />
                        <Text style={[styles.destinationName, isSelected && styles.selectedText]}>
                            {item.nom}
                        </Text>
                    </View>
                    {isSelected && (
                        <Icon name="check-circle" size={24} color="#4CAF50" />
                    )}
                </View>

                <Text style={styles.addressText}>{item.adresse}</Text>
                <Text style={styles.phoneText}>{item.telephone}</Text>

                <View style={styles.distanceInfo}>
                    <Icon name="straighten" size={16} color="#666" />
                    <Text style={styles.distanceText}>
                        {(item.distance / 1000).toFixed(1)} km
                    </Text>
                    <Text style={styles.feeText}>
                        Frais: {deliveryFee.toLocaleString()} FCFA
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Destination</Text>
                <TouchableOpacity onPress={() => setShowNewAddressModal(true)}>
                    <Icon name="add" size={24} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Message si aucune adresse sélectionnée */}
                {!selectedDestination && (
                    <View style={styles.infoMessage}>
                        <Icon name="info" size={24} color="#FF6B6B" />
                        <Text style={styles.infoText}>
                            Veuillez choisir une adresse de livraison
                        </Text>
                    </View>
                )}

                {/* Liste des destinations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Adresses disponibles</Text>
                    <FlatList
                        data={DESTINATIONS}
                        renderItem={renderDestination}
                        keyExtractor={item => item.id.toString()}
                        scrollEnabled={false}
                    />
                </View>

                {/* Options de livraison - visible seulement si une adresse est sélectionnée */}
                {selectedDestination && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Délai de livraison</Text>
                        <View style={styles.optionsGrid}>
                            {DELIVERY_OPTIONS.map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionCard,
                                        selectedDelivery === option.id && styles.selectedOption,
                                    ]}
                                    onPress={() => setSelectedDelivery(option.id)}
                                >
                                    <Icon
                                        name={option.icon}
                                        size={24}
                                        color={selectedDelivery === option.id ? '#FF6B6B' : '#666'}
                                    />
                                    <Text style={[
                                        styles.optionLabel,
                                        selectedDelivery === option.id && styles.selectedOptionLabel
                                    ]}>
                                        {option.label}
                                    </Text>
                                    <Text style={styles.optionDesc}>{option.description}</Text>
                                    {option.reduction !== 0 && (
                                        <Text style={styles.reductionText}>
                                            {option.reduction} FCFA
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Récapitulatif - visible seulement si une adresse est sélectionnée */}
                {selectedDestination && (
                    <View style={styles.summarySection}>
                        <Text style={styles.sectionTitle}>Récapitulatif</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Sous-total</Text>
                            <Text style={styles.summaryValue}>
                                {cartTotal.toLocaleString()} FCFA
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Frais de livraison</Text>
                            <Text style={styles.summaryValue}>
                                {calculateDeliveryFee(selectedDestination.distance).toLocaleString()} FCFA
                            </Text>
                        </View>

                        {selectedDelivery !== 'asap' && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Réduction</Text>
                                <Text style={styles.reductionValue}>
                                    {DELIVERY_OPTIONS.find(o => o.id === selectedDelivery).reduction} FCFA
                                </Text>
                            </View>
                        )}

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>
                                {calculateFinalTotal().toLocaleString()} FCFA
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* ✅ Bouton modifié pour aller vers Confirmation */}
            <TouchableOpacity
                style={[styles.confirmButton, !selectedDestination && styles.confirmButtonDisabled]}
                onPress={handleGoToConfirmation}
                disabled={!selectedDestination}
            >
                <Text style={styles.confirmButtonText}>
                    {selectedDestination ? 'Passer à la confirmation' : 'Choisissez une adresse'}
                </Text>
                {selectedDestination && <Icon name="arrow-forward" size={20} color="#fff" />}
            </TouchableOpacity>

            {/* Modal pour nouvelle adresse */}
            <Modal
                visible={showNewAddressModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouvelle adresse</Text>
                            <TouchableOpacity onPress={() => setShowNewAddressModal(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Nom (ex: Maison, Bureau)"
                            value={newAddress.nom}
                            onChangeText={(text) => setNewAddress({ ...newAddress, nom: text })}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Adresse complète"
                            value={newAddress.adresse}
                            onChangeText={(text) => setNewAddress({ ...newAddress, adresse: text })}
                            multiline
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Téléphone"
                            value={newAddress.telephone}
                            onChangeText={(text) => setNewAddress({ ...newAddress, telephone: text })}
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Distance (mètres)"
                            value={newAddress.distance}
                            onChangeText={(text) => setNewAddress({ ...newAddress, distance: text })}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleAddNewAddress}
                        >
                            <Text style={styles.saveButtonText}>Enregistrer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    infoMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B20',
        margin: 15,
        padding: 15,
        borderRadius: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#FF6B6B',
        marginLeft: 10,
        flex: 1,
    },
    section: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    destinationCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#FF6B6B',
        backgroundColor: '#fff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    destinationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    selectedText: {
        color: '#FF6B6B',
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 28,
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 14,
        color: '#999',
        marginLeft: 28,
        marginBottom: 8,
    },
    distanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 28,
    },
    distanceText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        marginRight: 10,
    },
    feeText: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    optionCard: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    selectedOption: {
        borderColor: '#FF6B6B',
        backgroundColor: '#fff',
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginTop: 5,
    },
    selectedOptionLabel: {
        color: '#FF6B6B',
    },
    optionDesc: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
    reductionText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginTop: 2,
    },
    summarySection: {
        padding: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    reductionValue: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    confirmButton: {
        backgroundColor: '#FF6B6B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 15,
        padding: 15,
        borderRadius: 10,
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 14,
    },
    saveButton: {
        backgroundColor: '#FF6B6B',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});