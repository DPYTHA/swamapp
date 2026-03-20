import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

export default function LivreurProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        nom: '',
        email: '',
    });

    useEffect(() => {
        loadProfile();
        loadStats();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get('/profile');
            setProfile(response.data);
            setEditForm({
                nom: response.data.nom || '',
                email: response.data.email || '',
            });
        } catch (error) {
            console.log('❌ Erreur chargement profil:', error.response?.data || error.message);
        }
    };

    const loadStats = async () => {
        try {
            const response = await api.get('/livreur/stats');
            setStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement stats:', error.response?.data || error.message);
            // Valeurs par défaut réalistes
            setStats({
                total_livraisons: 0,
                livraisons_mois: 0,
                gains_total: 0,
                gains_mois: 0,
                note_moyenne: 0,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        Promise.all([loadProfile(), loadStats()]);
    };

    const handleEditProfile = () => {
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        try {
            const response = await api.put('/profile/update', editForm);
            setProfile(response.data.user);
            Alert.alert('Succès', 'Profil mis à jour avec succès');
            setEditModalVisible(false);
        } catch (error) {
            console.log('❌ Erreur mise à jour:', error.response?.data || error.message);
            Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le profil');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    onPress: async () => {
                        await logout();
                        // ✅ RESET sur le navigateur parent (racine)
                        navigation.getParent()?.reset({
                            index: 0,
                            routes: [{ name: 'Public' }],
                        });
                    },
                    style: 'destructive'
                }
            ]
        );
    };
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement du profil...</Text>
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
            {/* Header avec avatar et infos principales */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {profile?.nom ? profile.nom.charAt(0).toUpperCase() : 'L'}
                    </Text>
                </View>
                <Text style={styles.userName}>{profile?.nom || 'Livreur'}</Text>
                <Text style={styles.userPhone}>{profile?.telephone}</Text>

                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Icon name="edit" size={18} color="#fff" />
                    <Text style={styles.editButtonText}>Modifier le profil</Text>
                </TouchableOpacity>
            </View>

            {/* Cartes de statistiques */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Icon name="local-shipping" size={24} color="#FF6B6B" />
                    <Text style={styles.statNumber}>{stats?.total_livraisons || 0}</Text>
                    <Text style={styles.statLabel}>Livraisons totales</Text>
                </View>

                <View style={styles.statCard}>
                    <Icon name="star" size={24} color="#FFD700" />
                    <Text style={styles.statNumber}>{stats?.note_moyenne?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.statLabel}>Note moyenne</Text>
                </View>

                <View style={styles.statCard}>
                    <Icon name="payments" size={24} color="#4CAF50" />
                    <Text style={styles.statNumber}>
                        {stats?.gains_total?.toLocaleString() || 0} FCFA
                    </Text>
                    <Text style={styles.statLabel}>Gains totaux</Text>
                </View>

                <View style={styles.statCard}>
                    <Icon name="trending-up" size={24} color="#2196F3" />
                    <Text style={styles.statNumber}>
                        {stats?.gains_mois?.toLocaleString() || 0} FCFA
                    </Text>
                    <Text style={styles.statLabel}>Gains du mois</Text>
                </View>
            </View>

            {/* Informations personnelles */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations personnelles</Text>

                <View style={styles.infoItem}>
                    <Icon name="person" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Nom</Text>
                    <Text style={styles.infoValue}>{profile?.nom || 'Non renseigné'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Icon name="phone" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Téléphone</Text>
                    <Text style={styles.infoValue}>{profile?.telephone}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Icon name="email" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{profile?.email || 'Non renseigné'}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Icon name="calendar-today" size={20} color="#FF6B6B" />
                    <Text style={styles.infoLabel}>Membre depuis</Text>
                    <Text style={styles.infoValue}>
                        {profile?.date_inscription ?
                            new Date(profile.date_inscription).toLocaleDateString('fr-FR') :
                            'N/A'}
                    </Text>
                </View>
            </View>

            {/* Statistiques détaillées */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Statistiques détaillées</Text>

                <View style={styles.statsDetailCard}>
                    <View style={styles.statsDetailRow}>
                        <Text style={styles.statsDetailLabel}>Livraisons ce mois</Text>
                        <Text style={styles.statsDetailValue}>{stats?.livraisons_mois || 0}</Text>
                    </View>

                    <View style={styles.statsDetailRow}>
                        <Text style={styles.statsDetailLabel}>Note de satisfaction</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                    key={star}
                                    name="star"
                                    size={16}
                                    color={star <= Math.round(stats?.note_moyenne || 0) ? '#FFD700' : '#ccc'}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions rapides</Text>

               // LivreurProfileScreen.js - Actions rapides corrigées
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Disponibles')} // ✅ Gardez tel quel si défini dans LivreurStack
                >
                    <Icon name="list-alt" size={20} color="#FF6B6B" />
                    <Text style={styles.actionButtonText}>Voir les livraisons disponibles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('MesLivraisons')} // ✅ SANS ESPACE !
                >
                    <Icon name="local-shipping" size={20} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Mes livraisons en cours</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Historique')} // ✅ Gardez tel quel
                >
                    <Icon name="history" size={20} color="#4CAF50" />
                    <Text style={styles.actionButtonText}>Mon historique</Text>
                </TouchableOpacity>

            </View>

            {/* Support */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <Icon name="help" size={20} color="#666" />
                    <Text style={styles.menuText}>Centre d'aide</Text>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Icon name="info" size={20} color="#666" />
                    <Text style={styles.menuText}>À propos</Text>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Bouton de déconnexion */}
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
                            >
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView >
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
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 40,
        color: '#fff',
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 16,
        color: '#666',
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
        flexWrap: 'wrap',
        padding: 15,
        marginTop: -10,
    },
    statCard: {
        width: '50%',
        padding: 10,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    section: {
        padding: 20,
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
        width: 120,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    statsDetailCard: {
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 12,
    },
    statsDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statsDetailLabel: {
        fontSize: 14,
        color: '#666',
    },
    statsDetailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    starsContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336',
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        borderRadius: 12,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
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
        minHeight: 300,
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
        fontWeight: '600',
    },
});