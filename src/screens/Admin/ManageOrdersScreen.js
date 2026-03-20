import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function ManageOrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    const filters = [
        { id: 'all', label: 'Toutes' },
        { id: 'en_attente_paiement', label: 'En attente' },
        { id: 'preparation', label: 'Préparation' },
        { id: 'livraison', label: 'Livraison' },
        { id: 'livree', label: 'Livrées' },
        { id: 'annulee', label: 'Annulées' },
    ];

    const loadOrders = async () => {
        try {
            const response = await api.get('/admin/commandes');
            setOrders(response.data);
            filterOrders(response.data, selectedFilter, searchQuery);
        } catch (error) {
            console.log('❌ Erreur chargement commandes:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders(orders, selectedFilter, searchQuery);
    }, [selectedFilter, searchQuery]);

    const filterOrders = (ordersList, filter, query) => {
        let filtered = [...ordersList];

        // Filtre par statut
        if (filter !== 'all') {
            filtered = filtered.filter(order => order.statut === filter);
        }

        // Filtre par recherche (code ou client)
        if (query) {
            filtered = filtered.filter(order =>
                order.code_suivi.toLowerCase().includes(query.toLowerCase()) ||
                order.client.nom.toLowerCase().includes(query.toLowerCase()) ||
                order.client.telephone.includes(query)
            );
        }

        setFilteredOrders(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'en_attente_paiement': return '#FFA500';
            case 'preparation': return '#2196F3';
            case 'livraison': return '#FF6B6B';
            case 'livree': return '#4CAF50';
            case 'annulee': return '#F44336';
            default: return '#999';
        }
    };

    const getStatusLabel = (statut) => {
        switch (statut) {
            case 'en_attente_paiement': return 'En attente';
            case 'preparation': return 'Préparation';
            case 'livraison': return 'Livraison';
            case 'livree': return 'Livrée';
            case 'annulee': return 'Annulée';
            default: return statut;
        }
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetailsAdmin', { orderId: item.code_suivi })}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderCode}>{item.code_suivi}</Text>
                    <Text style={styles.orderClient}>{item.client.nom} - {item.client.telephone}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
                        {getStatusLabel(item.statut)}
                    </Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.orderItems} numberOfLines={1}>
                    {item.articles?.map(a => a.nom).join(', ') || 'Aucun article'}
                </Text>
                <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>{item.total?.toLocaleString() || 0} FCFA</Text>
                    <Text style={styles.orderDate}>
                        {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                    </Text>
                </View>
            </View>

            {/* ✅ Bouton d'assignation de livreur - CORRIGÉ */}
            {item.statut === 'preparation' && !item.livreur_id && (
                <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => navigation.navigate('AssignLivreur', {
                        commandeId: item.id,
                        commande: item
                    })}
                >
                    <Icon name="person-add" size={18} color="#FF6B6B" />
                    <Text style={styles.assignButtonText}>Assigner un livreur</Text>
                </TouchableOpacity>
            )}

            {item.paiement?.statut === 'en_attente' && (
                <View style={styles.paymentWarning}>
                    <Icon name="warning" size={16} color="#FFA500" />
                    <Text style={styles.paymentWarningText}>Paiement en attente</Text>
                </View>
            )}
        </TouchableOpacity>
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestion des commandes</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher par code ou client..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filtres */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
            >
                {filters.map(filter => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterChip,
                            selectedFilter === filter.id && styles.filterChipActive
                        ]}
                        onPress={() => setSelectedFilter(filter.id)}
                    >
                        <Text style={[
                            styles.filterText,
                            selectedFilter === filter.id && styles.filterTextActive
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Liste des commandes */}
            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="receipt" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Aucune commande trouvée</Text>
                    </View>
                }
            />
        </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        padding: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        height: 45,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    filtersContainer: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    filterChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 10,
    },
    filterChipActive: {
        backgroundColor: '#FF6B6B',
    },
    filterText: {
        fontSize: 13,
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 15,
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
        marginBottom: 10,
    },
    orderCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderClient: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    orderDetails: {
        marginBottom: 8,
    },
    orderItems: {
        fontSize: 13,
        color: '#999',
        marginBottom: 5,
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
    orderDate: {
        fontSize: 12,
        color: '#999',
    },
    // ✅ Nouveau style pour le bouton d'assignation
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F315',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#2196F3',
        borderStyle: 'dashed',
    },
    assignButtonText: {
        fontSize: 13,
        color: '#2196F3',
        fontWeight: '600',
        marginLeft: 8,
    },
    paymentWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA50020',
        padding: 8,
        borderRadius: 5,
        marginTop: 8,
    },
    paymentWarningText: {
        fontSize: 12,
        color: '#FFA500',
        marginLeft: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
});