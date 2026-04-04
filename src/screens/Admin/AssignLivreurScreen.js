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
import api from '../../services/api';

export default function AssignLivreurScreen({ navigation, route }) {
    const { commandeId } = route.params || {};
    const [commandes, setCommandes] = useState([]);
    const [livreurs, setLivreurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCommande, setSelectedCommande] = useState(commandeId);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [commandesRes, livreursRes] = await Promise.all([
                api.get('/admin/commandes-en-attente-livreur'),
                api.get('/admin/livreurs-disponibles')
            ]);
            setCommandes(commandesRes.data);
            setLivreurs(livreursRes.data);
        } catch (error) {
            console.log('❌ Erreur chargement:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleAssignLivreur = (commande, livreur) => {
        Alert.alert(
            'Assigner un livreur',
            `Voulez-vous assigner ${livreur.nom} à la commande ${commande.code_suivi} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Assigner',
                    onPress: () => assignLivreur(commande.id, livreur.id)
                }
            ]
        );
    };

    const assignLivreur = async (commandeId, livreurId) => {
        try {
            await api.post(`/admin/commandes/${commandeId}/assigner-livreur`, {
                livreur_id: livreurId
            });
            Alert.alert('Succès', 'Livreur assigné avec succès');
            loadData();
        } catch (error) {
            console.log('❌ Erreur assignation:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible d\'assigner le livreur');
        }
    };

    const handleStartSearch = (commandeId) => {
        Alert.alert(
            'Lancer la recherche',
            'Voulez-vous lancer la recherche automatique d\'un livreur ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Lancer',
                    onPress: () => startSearch(commandeId)
                }
            ]
        );
    };

    const startSearch = async (commandeId) => {
        try {
            await api.post(`/admin/commandes/${commandeId}/rechercher-livreur`);
            Alert.alert('Succès', 'Recherche de livreur lancée');
            loadData();
        } catch (error) {
            console.log('❌ Erreur recherche:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de lancer la recherche');
        }
    };

    const renderCommande = ({ item }) => (
        <View style={styles.commandeCard}>
            <View style={styles.commandeHeader}>
                <Text style={styles.commandeCode}>{item.code_suivi}</Text>
                <View style={styles.timeBadge}>
                    <Icon name="access-time" size={14} color="#FF6B6B" />
                    <Text style={styles.timeText}>{item.temps_recherche} min</Text>
                </View>
            </View>

            <Text style={styles.clientName}>{item.client.nom}</Text>
            <Text style={styles.address} numberOfLines={1}>{item.adresse}</Text>

            <View style={styles.commandeDetails}>
                <Text style={styles.detailText}>💰 {item.total.toLocaleString()} FCFA</Text>
                <Text style={styles.detailText}>🚚 {(item.distance / 1000).toFixed(1)} km</Text>
                <Text style={styles.detailText}>💵 {item.gain_livreur.toLocaleString()} FCFA</Text>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => navigation.navigate('SelectLivreur', {
                        commande: item,
                        livreurs: livreurs
                    })}
                >
                    <Icon name="person-add" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Assigner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.searchButton]}
                    onPress={() => handleStartSearch(item.id)}
                >
                    <Icon name="search" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Rechercher</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestion des livreurs</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={commandes}
                renderItem={renderCommande}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="local-shipping" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Aucune commande en attente</Text>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        padding: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
         paddingTop:50,
    },
    list: {
        padding: 15,
    },
    commandeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    commandeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    commandeCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    timeText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginLeft: 4,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    commandeDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    assignButton: {
        backgroundColor: '#2196F3',
    },
    searchButton: {
        backgroundColor: '#FF6B6B',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
});