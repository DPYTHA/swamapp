import { useRef, useState } from 'react';
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
    // ===== PANGO 1 =====
    {
        id: 2,
        nom: 'Pango 1',
        adresse: 'Mosquée, Assinie',
        distance: 600,
    },
    {
        id: 3,
        nom: 'Pango 1',
        adresse: 'Eglise Assemblée de Dieu, Assinie',
        distance: 900,
    },
    {
        id: 4,
        nom: 'Pango 1',
        adresse: 'Résidence Egnehué, Assinie',
        distance: 700,
    },

    // ===== PANGO 2 =====
    {
        id: 5,
        nom: 'Pango 2',
        adresse: 'Pharmacie, Assinie',
        distance: 850,
    },
    {
        id: 6,
        nom: 'Pango 2',
        adresse: 'Atelier espoir, Assinie',
        distance: 1000,
    },
    {
        id: 7,
        nom: 'Pango 2',
        adresse: 'Chez Mr Akalo, Assinie',
        distance: 1300,
    },

    // ===== EPKOUZAN =====
    {
        id: 8,
        nom: 'Epkouzan',
        adresse: 'Assinie Lodge, Assinie',
        distance: 500,
    },
    {
        id: 9,
        nom: 'Epkouzan',
        adresse: 'Campement, Assinie',
        distance: 550,
    },
    {
        id: 10,
        nom: 'Epkouzan',
        adresse: 'Milan hôtel Sominou, Assinie',
        distance: 750,
    },

    // ===== DONWAHI =====
    {
        id: 11,
        nom: 'Donwahi',
        adresse: 'Epp KPMG, Assinie',
        distance: 900,
    },
    {
        id: 12,
        nom: 'Donwahi',
        adresse: 'Essouman hôtel, Assinie',
        distance: 1000,
    },
    {
        id: 13,
        nom: 'Donwahi',
        adresse: 'Yamaman lodge, Assinie',
        distance: 1300,
    },

    // ===== VOIE PRINCIPALE =====
    {
        id: 14,
        nom: 'Voie principale',
        adresse: 'Sodeci Assinie',
        distance: 400,
    },
    {
        id: 15,
        nom: 'Voie principale',
        adresse: 'Cour royale, Assinie',
        distance: 500,
    },
    {
        id: 16,
        nom: 'Voie principale',
        adresse: 'Quai du Beach, Assinie',
        distance: 700,
    },
    {
        id: 17,
        nom: 'Voie principale',
        adresse: 'Pont, Assinie',
        distance: 1800,
    },
    {
        id: 18,
        nom: 'Voie principale',
        adresse: 'Mairie, Assinie',
        distance: 1300,
    },
    {
        id: 19,
        nom: 'Voie principale',
        adresse: 'Super marché Assinie',
        distance: 1100,
    },

    // ===== ZION =====
    {
        id: 20,
        nom: 'Zion',
        adresse: 'Assinie Beach club, Assinie',
        distance: 650,
    },
    {
        id: 21,
        nom: 'Zion',
        adresse: 'Agence Moov, Assinie',
        distance: 1200,
    },
    {
        id: 22,
        nom: 'Zion',
        adresse: 'Maison ancien chef, Assinie',
        distance: 1500,
    },
    {
        id: 23,
        nom: 'Zion',
        adresse: 'Palais bar, Assinie',
        distance: 700,
    },
    {
        id: 24,
        nom: 'Zion',
        adresse: 'Zion Hôtel, Assinie',
        distance: 1000,
    },

    // ===== VOIE DU MARCHÉ =====
    {
        id: 25,
        nom: 'Voie du marché',
        adresse: 'Au bord chez miss Olga, Assinie',
        distance: 800,
    },
    {
        id: 26,
        nom: 'Voie du marché',
        adresse: 'EPP Assinie 1A et 1B, Assinie',
        distance: 490,
    },
    {
        id: 27,
        nom: 'Voie du marché',
        adresse: 'Boulangerie, Assinie',
        distance: 400,
    },

    // ===== VOIE DU COMMISSARIAT =====
    {
        id: 28,
        nom: 'Voie du commissariat',
        adresse: 'Commissariat, Assinie',
        distance: 400,
    },
    {
        id: 29,
        nom: 'Voie du commissariat',
        adresse: 'Cité des enseignants, Assinie',
        distance: 400,
    },
    {
        id: 30,
        nom: 'Voie du commissariat',
        adresse: 'Hôtel cool Mafia, Assinie',
        distance: 600,
    },

    // ===== VOIE DU DISPENSAIRE =====
    {
        id: 31,
        nom: 'Voie du dispensaire',
        adresse: 'Dispensaire, Assinie',
        distance: 400,
    },
    {
        id: 32,
        nom: 'Voie du dispensaire',
        adresse: 'Hôtel Sandrofia, Assinie',
        distance: 400,
    },
    {
        id: 33,
        nom: 'Voie du dispensaire',
        adresse: 'Église méthodiste, Assinie',
        distance: 400,
    },

    // ===== VOIE CATHOLIQUE =====
    {
        id: 34,
        nom: 'Voie Catholique',
        adresse: 'Maternité, Assinie',
        distance: 400,
    },

    // ===== SAGBADOU =====
    {
        id: 35,
        nom: 'Sagbadou',
        adresse: 'Boutique Sagbadou, Assinie',
        distance: 1200,
    },
    {
        id: 36,
        nom: 'Sagbadou',
        adresse: 'Cimetière, Assinie',
        distance: 800,
    },
    {
        id: 37,
        nom: 'Sagbadou',
        adresse: 'Tarpon, Assinie',
        distance: 650,
    },

    // ===== ALIKRO =====
    {
        id: 38,
        nom: 'Alikro',
        adresse: 'Alikro, Assinie',
        distance: 3000,
    },

    // ===== ABISSA LODGE =====
    {
        id: 39,
        nom: 'Abissa lodge',
        adresse: 'Abissa lodge, Assinie',
        distance: 3100,
    },

    // ===== STATION =====
    {
        id: 40,
        nom: 'Station',
        adresse: 'Station, Assinie',
        distance: 2500,
    },

    // ===== N'GOAKRO =====
    {
        id: 41,
        nom: 'N\'goakro',
        adresse: 'N\'goakro, Assinie',
        distance: 2700,
    },

    // ===== CARREFOUR ESSANKRO =====
    {
        id: 42,
        nom: 'Carrefour Essankro',
        adresse: 'Carrefour Essankro, Assinie',
        distance: 2700,
    },

    // ===== BIKO LODGE =====
    {
        id: 43,
        nom: 'Biko lodge',
        adresse: 'Biko lodge, Assinie',
        distance: 6300,
    },

    // ===== RÉSIDENCE DJÉNE =====
    {
        id: 44,
        nom: 'Résidence Djéne',
        adresse: 'Résidence Djéne, Assinie',
        distance: 6400,
    },

    // ===== LE SUNSHINE LODGE =====
    {
        id: 45,
        nom: 'Le Sunshine lodge',
        adresse: 'Le Sunshine lodge, Assinie',
        distance: 7300,
    },

    // ===== MYKONOS =====
    {
        id: 46,
        nom: 'Mykonos',
        adresse: 'Mykonos, Assinie',
        distance: 7800,
    },

    // ===== L'ESCAPADE HÔTEL =====
    {
        id: 47,
        nom: 'L\'escapade hôtel',
        adresse: 'L\'escapade hôtel, Assinie',
        distance: 8800,
    },

    // ===== AKOULA KAN LODGE =====
    {
        id: 48,
        nom: 'Akoula kan lodge',
        adresse: 'Akoula kan lodge, Assinie',
        distance: 10400,
    },

    // ===== NAHIKO HÔTEL =====
    {
        id: 49,
        nom: 'Nahiko hôtel',
        adresse: 'Nahiko hôtel, Assinie',
        distance: 11300,
    },

    // ===== AKWA BEACH =====
    {
        id: 50,
        nom: 'Akwa beach',
        adresse: 'Akwa beach, Assinie',
        distance: 11600,
    },
    {
        id: 62,
        nom: 'Assinie Beach Hôtel',
        adresse: 'Assinie Beach Hôtel, Assinie',
        distance: 11600,
    },

    // ===== COUCOUÉ LODGE =====
    {
        id: 51,
        nom: 'Coucoué lodge',
        adresse: 'Coucoué lodge, Assinie',
        distance: 13400,
    },

    // ===== MARINE DE BABIHANA =====
    {
        id: 52,
        nom: 'Marine de Babihana',
        adresse: 'Marine de Babihana, Assinie',
        distance: 13500,
    },

    // ===== LE CLIMBIÉ D'ASSINIE =====
    {
        id: 53,
        nom: 'Le Climbié d\'Assinie',
        adresse: 'Le Climbié d\'Assinie, Assinie',
        distance: 15200,
    },

    // ===== HÔTEL ANDRÉ RICHARD =====
    {
        id: 58,
        nom: 'Hôtel André Richard',
        adresse: 'Hôtel André Richard, Assinie',
        distance: 15400,
    },

    // ===== VILLA TOURACO =====
    {
        id: 54,
        nom: 'Villa Touraco',
        adresse: 'Villa Touraco, Assinie',
        distance: 16000,
    },
    {
        id: 55,
        nom: 'La maison d\'Akoula',
        adresse: 'La maison d\'Akoula, Assinie',
        distance: 16000,
    },

    // ===== VILLA AKWABA =====
    {
        id: 56,
        nom: 'Villa Akwaba',
        adresse: 'Villa Akwaba, Assinie',
        distance: 16200,
    },

    // ===== ELIMAH HOUSES =====
    {
        id: 57,
        nom: 'Elimah Houses',
        adresse: 'Elimah Houses, Assinie',
        distance: 16600,
    },

    // ===== FÉLINE LODGE =====
    {
        id: 59,
        nom: 'Féline Lodge',
        adresse: 'Féline Lodge, Assinie',
        distance: 17600,
    },

    // ===== HÔTEL LE PREMIER ASSOUINDÉ =====
    {
        id: 60,
        nom: 'Hôtel le Premier Assouindé',
        adresse: 'Hôtel le Premier Assouindé, Assinie',
        distance: 18500,
    },

    // ===== NOTEVIA HÔTEL =====
    {
        id: 61,
        nom: 'Notevia Hôtel',
        adresse: 'Notevia Hôtel, Assinie',
        distance: 19000,
    },

    // ===== ROND-POINT D'ASSOUINDÉ =====
    {
        id: 63,
        nom: 'Rond-point d\'Assouindé',
        adresse: 'Rond-point d\'Assouindé, Assinie',
        distance: 21200,
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
        reduction: -110,
        icon: 'event',
    },
];

// Fonction pour calculer les frais de livraison
const calculateDeliveryFee = (distance) => {
    const fee = Math.ceil(distance / 100) * 50;
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

    // Ref pour le ScrollView
    const scrollViewRef = useRef(null);

    // Fonction pour défiler vers la section livraison
    const scrollToDeliverySection = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleSelectDestination = (destination) => {
        setSelectedDestination(destination);
        scrollToDeliverySection();
    };

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

        DESTINATIONS.push(newDest);
        handleSelectDestination(newDest);
        setShowNewAddressModal(false);
        setNewAddress({ nom: '', adresse: '', telephone: '', distance: '3000' });
    };

    const handleGoToConfirmation = () => {
        if (!selectedDestination) {
            Alert.alert('Erreur', 'Veuillez choisir une adresse de livraison');
            return;
        }

        const deliveryFee = calculateDeliveryFee(selectedDestination.distance);
        const reduction = DELIVERY_OPTIONS.find(opt => opt.id === selectedDelivery).reduction;
        const finalTotal = cartTotal + deliveryFee + reduction;
        const codeSuivi = 'SWAM-' + Date.now().toString().slice(-6);

        navigation.navigate('CommandeConfirmation', {
            destination: selectedDestination,
            deliveryOption: selectedDelivery,
            cartTotal: cartTotal,
            finalTotal: finalTotal,
            cartItems: cartItems,
            deliveryFee: deliveryFee,
            reduction: reduction,
            codeSuivi: codeSuivi,
        });
    };

    const renderDestination = ({ item }) => {
        const isSelected = selectedDestination?.id === item.id;
        const deliveryFee = calculateDeliveryFee(item.distance);

        return (
            <TouchableOpacity
                style={[styles.destinationCard, isSelected && styles.selectedCard]}
                onPress={() => handleSelectDestination(item)}
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

            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
            >
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

                {/* Options de livraison */}
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

                {/* Récapitulatif */}
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

            {/* Bouton confirmation */}
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