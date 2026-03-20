// screens/Admin/LivreurDetailsScreen.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function LivreurDetailsScreen({ navigation, route }) {
    const { livreurId } = route.params;
    const [livreur, setLivreur] = useState(null);
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        enCours: 0,
        livrees: 0,
        gains: 0,
    });

    useEffect(() => {
        loadLivreurDetails();
    }, []);

    const loadLivreurDetails = async () => {
        try {
            // Charger les infos du livreur
            const livreurResponse = await api.get(`/admin/livreurs/${livreurId}`);
            setLivreur(livreurResponse.data);

            // Charger les commandes du livreur
            const commandesResponse = await api.get(`/admin/livreurs/${livreurId}/commandes`);
            setCommandes(commandesResponse.data);

            // Calculer les stats
            calculateStats(commandesResponse.data);
        } catch (error) {
            console.log('❌ Erreur chargement:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (commandesList) => {
        const enCours = commandesList.filter(c =>
            ['preparation', 'livraison'].includes(c.statut)
        ).length;

        const livrees = commandesList.filter(c =>
            c.statut === 'livree'
        ).length;

        const gains = commandesList.reduce((total, cmd) => {
            return total + (cmd.frais_livraison ? cmd.frais_livraison * 0.6 : 0);
        }, 0);

        setStats({
            total: commandesList.length,
            enCours,
            livrees,
            gains: Math.round(gains),
        });
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

    const renderCommande = ({ item }) => (
        <TouchableOpacity
            style={styles.commandeCard}
            onPress={() => navigation.navigate('OrderDetailsAdmin', {
                orderId: item.id,
                code: item.code_suivi
            })}
        >
            <View style={styles.commandeHeader}>
                <Text style={styles.commandeCode}>{item.code_suivi}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
                        {getStatusText(item.statut)}
                    </Text>
                </View>
            </View>

            <View style={styles.commandeInfo}>
                <View style={styles.infoRow}>
                    <Icon name="person" size={16} color="#666" />
                    <Text style={styles.infoText}>{item.client?.nom || 'Client'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="location-on" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {item.adresse_livraison}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="access-time" size={16} color="#666" />
                    <Text style={styles.infoText}>
                        {new Date(item.date_commande).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
            </View>

            <View style={styles.commandeFooter}>
                <Text style={styles.commandeTotal}>
                    {item.total?.toLocaleString()} FCFA
                </Text>
                {item.frais_livraison > 0 && (
                    <Text style={styles.commandeGain}>
                        Gain: {Math.round(item.frais_livraison * 0.6)} FCFA
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement du profil...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header avec retour */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Détails du livreur</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Infos livreur */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {livreur?.nom?.charAt(0) || 'L'}
                        </Text>
                    </View>
                    <Text style={styles.nom}>{livreur?.nom || 'Livreur'}</Text>
                    <Text style={styles.telephone}>{livreur?.telephone}</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Commandes</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.enCours}</Text>
                            <Text style={styles.statLabel}>En cours</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.livrees}</Text>
                            <Text style={styles.statLabel}>Livrées</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.gains.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Gains (FCFA)</Text>
                        </View>
                    </View>
                </View>

                {/* Liste des commandes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Commandes effectuées</Text>

                    {commandes.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="list-alt" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>
                                Aucune commande pour ce livreur
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={commandes}
                            renderItem={renderCommande}
                            keyExtractor={item => item.id.toString()}
                            scrollEnabled={false}
                        />
                    )}
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
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    nom: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    telephone: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 20,
    },
    statItem: {
        width: '50%',
        alignItems: 'center',
        marginBottom: 15,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    commandeCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    commandeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    commandeCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    commandeInfo: {
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    commandeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 10,
    },
    commandeTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    commandeGain: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
    },
});