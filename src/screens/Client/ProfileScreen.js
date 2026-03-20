import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalCommandes: 0,
        commandesLivrees: 0,
        commandesEnCours: 0,
        depensesTotal: 0,
        pointsFidelite: 0,
        reductionsGagnees: 0,
    });
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [editForm, setEditForm] = useState({
        nom: '',
        email: '',
    });
    const [addressForm, setAddressForm] = useState({
        nom: '',
        adresse: '',
        telephone: '',
        estPrincipale: false,
    });

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);

            // Charger le profil
            const profileRes = await api.get('/profile');
            setProfile(profileRes.data);

            // Charger les commandes
            const ordersRes = await api.get('/commandes/client');
            setOrders(ordersRes.data);

            // Calculer les statistiques à partir des commandes
            const livrees = ordersRes.data.filter(o => o.statut === 'livree').length;
            const enCours = ordersRes.data.filter(o =>
                ['preparation', 'livraison'].includes(o.statut)
            ).length;
            const totalDepenses = ordersRes.data.reduce((sum, o) => sum + (o.total || 0), 0);
            const reductions = ordersRes.data.reduce((sum, o) => sum + (o.reduction || 0), 0);

            setStats({
                totalCommandes: ordersRes.data.length,
                commandesLivrees: livrees,
                commandesEnCours: enCours,
                depensesTotal: totalDepenses,
                pointsFidelite: Math.floor(totalDepenses / 1000),
                reductionsGagnees: reductions,
            });

            // Charger les adresses
            try {
                const addressesRes = await api.get('/client/adresses');
                setAddresses(addressesRes.data);
            } catch (error) {
                console.log('⚠️ Pas de module adresses');
                setAddresses([]);
            }

        } catch (error) {
            console.log('❌ Erreur chargement données:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
    };

    const handleEditProfile = () => {
        setEditForm({
            nom: profile?.nom || '',
            email: profile?.email || '',
        });
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const response = await api.put('/profile/update', editForm);
            setProfile(response.data.user);
            Alert.alert('Succès', 'Profil mis à jour avec succès');
            setEditModalVisible(false);
        } catch (error) {
            console.log('❌ Erreur mise à jour:', error);
            Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = () => {
        setSelectedAddress(null);
        setAddressForm({
            nom: '',
            adresse: '',
            telephone: '',
            estPrincipale: false,
        });
        setAddressModalVisible(true);
    };

    const handleEditAddress = (address) => {
        setSelectedAddress(address);
        setAddressForm({
            nom: address.nom,
            adresse: address.adresse,
            telephone: address.telephone,
            estPrincipale: address.estPrincipale,
        });
        setAddressModalVisible(true);
    };

    const handleSaveAddress = async () => {
        try {
            if (selectedAddress) {
                await api.put(`/client/adresses/${selectedAddress.id}`, addressForm);
                Alert.alert('Succès', 'Adresse modifiée');
            } else {
                await api.post('/client/adresses', addressForm);
                Alert.alert('Succès', 'Adresse ajoutée');
            }
            setAddressModalVisible(false);
            loadAllData();
        } catch (error) {
            console.log('❌ Erreur adresse:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder l\'adresse');
        }
    };

    const handleDeleteAddress = (addressId) => {
        Alert.alert(
            'Confirmation',
            'Voulez-vous supprimer cette adresse ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    onPress: async () => {
                        try {
                            await api.delete(`/client/adresses/${addressId}`);
                            Alert.alert('Succès', 'Adresse supprimée');
                            loadAllData();
                        } catch (error) {
                            console.log('❌ Erreur suppression:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer l\'adresse');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    onPress: async () => {
                        await logout();
                        navigation.getParent()?.replace('Public');
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // Fonction pour le niveau de fidélité
    const getNiveauFidelite = (points) => {
        if (points >= 10000) return 'Platine ⭐';
        if (points >= 5000) return 'Or 🥇';
        if (points >= 1000) return 'Argent 🥈';
        return 'Bronze 🥉';
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'livree': return '#4CAF50';
            case 'preparation': return '#2196F3';
            case 'livraison': return '#FF9800';
            case 'annulee': return '#F44336';
            default: return '#999';
        }
    };

    const getStatusText = (statut) => {
        switch (statut) {
            case 'preparation': return 'En préparation';
            case 'livraison': return 'En livraison';
            case 'livree': return 'Livrée';
            case 'annulee': return 'Annulée';
            default: return statut;
        }
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderCode}>{item.code_suivi}</Text>
                    <Text style={styles.orderDate}>
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
                <View style={[styles.orderStatus, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
                    <Text style={[styles.orderStatusText, { color: getStatusColor(item.statut) }]}>
                        {getStatusText(item.statut)}
                    </Text>
                </View>
            </View>
            <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{item.total?.toLocaleString()} FCFA</Text>
                <Text style={styles.orderItems}>{item.articles_count || 0} articles</Text>
            </View>
        </TouchableOpacity>
    );

    const renderAddressItem = ({ item }) => (
        <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
                <View style={styles.addressTitle}>
                    <Icon name="location-on" size={20} color="#FF6B6B" />
                    <Text style={styles.addressName}>{item.nom}</Text>
                    {item.estPrincipale && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Principale</Text>
                        </View>
                    )}
                </View>
                <View style={styles.addressActions}>
                    <TouchableOpacity onPress={() => handleEditAddress(item)}>
                        <Icon name="edit" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
                        <Icon name="delete" size={20} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.addressText}>{item.adresse}</Text>
            <Text style={styles.addressPhone}>{item.telephone}</Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement de votre profil...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Icon name="lock" size={50} color="#ccc" />
                <Text style={styles.message}>Connectez-vous pour voir votre profil</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.replace('Auth', { screen: 'Login' })}
                >
                    <Text style={styles.loginButtonText}>Se connecter</Text>
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
                    tintColor="#FF6B6B"
                />
            }
        >
            {/* Header avec avatar */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {profile?.nom ? profile.nom.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
                <Text style={styles.userName}>{profile?.nom || 'Utilisateur'}</Text>
                <Text style={styles.userPhone}>{profile?.telephone}</Text>
                <Text style={styles.userEmail}>{profile?.email || 'Email non renseigné'}</Text>

                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Icon name="edit" size={20} color="#fff" />
                    <Text style={styles.editButtonText}>Modifier le profil</Text>
                </TouchableOpacity>
            </View>

            {/* Cartes de statistiques */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Icon name="shopping-bag" size={24} color="#FF6B6B" />
                    <Text style={styles.statNumber}>{stats.totalCommandes}</Text>
                    <Text style={styles.statLabel}>Commandes</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.statNumber}>{stats.commandesLivrees}</Text>
                    <Text style={styles.statLabel}>Livrées</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="local-shipping" size={24} color="#2196F3" />
                    <Text style={styles.statNumber}>{stats.commandesEnCours}</Text>
                    <Text style={styles.statLabel}>En cours</Text>
                </View>
            </View>

            {/* Statistiques détaillées */}
            <View style={styles.detailedStats}>
                <View style={styles.detailStatRow}>
                    <Text style={styles.detailStatLabel}>Total dépensé</Text>
                    <Text style={styles.detailStatValue}>{stats.depensesTotal.toLocaleString()} FCFA</Text>
                </View>
                <View style={styles.detailStatRow}>
                    <Text style={styles.detailStatLabel}>Points fidélité</Text>
                    <Text style={styles.detailStatValue}>{stats.pointsFidelite} pts</Text>
                </View>
                <View style={styles.detailStatRow}>
                    <Text style={styles.detailStatLabel}>Réductions obtenues</Text>
                    <Text style={styles.detailStatValue}>{stats.reductionsGagnees.toLocaleString()} FCFA</Text>
                </View>
            </View>

            {/* Informations personnelles */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations personnelles</Text>

                <View style={styles.infoItem}>
                    <Icon name="person" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Nom:</Text>
                    <Text style={styles.infoValue}>{profile?.nom || 'Non renseigné'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Icon name="phone" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Téléphone:</Text>
                    <Text style={styles.infoValue}>{profile?.telephone}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Icon name="email" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{profile?.email || 'Non renseigné'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Icon name="calendar-today" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Membre depuis:</Text>
                    <Text style={styles.infoValue}>
                        {profile?.date_inscription ? new Date(profile.date_inscription).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Adresses de livraison */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Adresses de livraison</Text>
                    <TouchableOpacity onPress={handleAddAddress}>
                        <Icon name="add" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>

                {addresses.length === 0 ? (
                    <View style={styles.emptyAddress}>
                        <Icon name="location-off" size={40} color="#ccc" />
                        <Text style={styles.emptyAddressText}>Aucune adresse enregistrée</Text>
                        <TouchableOpacity
                            style={styles.addAddressButton}
                            onPress={handleAddAddress}
                        >
                            <Text style={styles.addAddressButtonText}>Ajouter une adresse</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={addresses}
                        renderItem={renderAddressItem}
                        keyExtractor={item => item.id.toString()}
                        scrollEnabled={false}
                    />
                )}
            </View>

            {/* Dernières commandes */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Dernières commandes</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Commandes')}>
                        <Text style={styles.seeAllText}>Voir tout</Text>
                    </TouchableOpacity>
                </View>

                {orders.length === 0 ? (
                    <View style={styles.emptyOrders}>
                        <Icon name="shopping-bag" size={40} color="#ccc" />
                        <Text style={styles.emptyOrdersText}>Aucune commande pour le moment</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('Accueil')}
                        >
                            <Text style={styles.shopButtonText}>Découvrir nos produits</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={orders.slice(0, 3)}
                        renderItem={renderOrderItem}
                        keyExtractor={item => item.id.toString()}
                        scrollEnabled={false}
                    />
                )}
            </View>

            {/* Options - Historique des commandes seulement */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Options</Text>

                {/* Historique des commandes (gardé) */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Commandes')}
                >
                    <Icon name="history" size={20} color="#FF6B6B" />
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Historique des commandes</Text>
                        <Text style={styles.menuSubtext}>Suivez toutes vos commandes</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Programme de fidélité */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Accueil', { screen: 'Fidelite' })}
                >
                    <Icon name="card-giftcard" size={20} color="#FF6B6B" />
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Programme de fidélité</Text>
                        <Text style={styles.menuSubtext}>
                            {stats.pointsFidelite} points · Niveau {getNiveauFidelite(stats.pointsFidelite)}
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Liste de souhaits */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Accueil', { screen: 'Wishlist' })}

                >
                    <Icon name="favorite" size={20} color="#FF6B6B" />
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Liste de souhaits</Text>
                        <Text style={styles.menuSubtext}>Produits que vous adorez</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Avis et évaluations */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Accueil', { screen: 'Avis' })}

                >
                    <Icon name="star" size={20} color="#FF6B6B" />
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Avis et évaluations</Text>
                        <Text style={styles.menuSubtext}>Partagez votre expérience</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Service client */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Accueil', { screen: 'Support' })}

                >
                    <Icon name="headset" size={20} color="#FF6B6B" />
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Service client</Text>
                        <Text style={styles.menuSubtext}>Aide, chat, FAQ</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Statistiques d'achat */}
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('Accueil', { screen: 'StatistiquesAchat' })}

                >
                    <Icon name="analytics" size={20} color="#FF6B6B" />
                    <View style={styles.menuContent}>
                        <Text style={styles.menuText}>Statistiques d'achat</Text>
                        <Text style={styles.menuSubtext}>Analysez vos dépenses</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Déconnexion */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>

            {/* Modal d'édition du profil */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Modifier le profil</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nom</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.nom}
                                    onChangeText={(text) => setEditForm({ ...editForm, nom: text })}
                                    placeholder="Votre nom"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.email}
                                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                                    placeholder="votre@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveProfile}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal d'ajout/édition d'adresse */}
            <Modal
                visible={addressModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                            </Text>
                            <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nom de l'adresse</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressForm.nom}
                                    onChangeText={(text) => setAddressForm({ ...addressForm, nom: text })}
                                    placeholder="Maison, Bureau, etc."
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Adresse complète</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={addressForm.adresse}
                                    onChangeText={(text) => setAddressForm({ ...addressForm, adresse: text })}
                                    placeholder="Numéro, rue, quartier, ville"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Téléphone de contact</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressForm.telephone}
                                    onChangeText={(text) => setAddressForm({ ...addressForm, telephone: text })}
                                    placeholder="77 123 45 67"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setAddressForm({ ...addressForm, estPrincipale: !addressForm.estPrincipale })}
                            >
                                <Icon
                                    name={addressForm.estPrincipale ? 'check-box' : 'check-box-outline-blank'}
                                    size={24}
                                    color="#FF6B6B"
                                />
                                <Text style={styles.checkboxLabel}>Définir comme adresse principale</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveAddress}
                            >
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}


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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#f9f9f9',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    userPhone: {
        fontSize: 16,
        color: '#666',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#999',
        marginBottom: 15,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#fff',
    },
    statCard: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    detailedStats: {
        backgroundColor: '#f5f5f5',
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    detailStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailStatLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 15,
        color: '#666',
        marginLeft: 10,
        width: 120,
    },
    infoValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    menuContent: {
        flex: 1,
        marginLeft: 15,
    },
    menuText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    menuSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    addressCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
        marginRight: 8,
    },
    defaultBadge: {
        backgroundColor: '#4CAF5020',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    defaultBadgeText: {
        fontSize: 10,
        color: '#4CAF50',
        fontWeight: '500',
    },
    addressActions: {
        flexDirection: 'row',
        gap: 10,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    addressPhone: {
        fontSize: 13,
        color: '#999',
    },
    emptyAddress: {
        alignItems: 'center',
        padding: 20,
    },
    emptyAddressText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
        marginBottom: 15,
    },
    addAddressButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addAddressButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
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
        marginBottom: 8,
    },
    orderCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    orderStatus: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    orderStatusText: {
        fontSize: 11,
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
    orderItems: {
        fontSize: 12,
        color: '#999',
    },
    emptyOrders: {
        alignItems: 'center',
        padding: 20,
    },
    emptyOrdersText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
        marginBottom: 15,
    },
    shopButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
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
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336',
        margin: 20,
        padding: 15,
        borderRadius: 10,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#ccc',
        marginBottom: 20,
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
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: '#FF6B6B',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});