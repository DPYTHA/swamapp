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

export default function ManageLivreursScreen({ navigation }) {
    const [livreurs, setLivreurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLivreurs();
    }, []);

    const loadLivreurs = async () => {
        try {
            const response = await api.get('/admin/livreurs-disponibles');
            setLivreurs(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement livreurs:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger la liste des livreurs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadLivreurs();
    };

    const getStatusColor = (statut) => {
        return statut === 'disponible' ? '#4CAF50' : '#FFA500';
    };

    const renderLivreur = ({ item }) => (
        <TouchableOpacity
            style={styles.livreurCard}
            onPress={() => navigation.navigate('LivreurDetails', { livreurId: item.id })}
        >
            <View style={styles.livreurHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {item.nom ? item.nom.charAt(0).toUpperCase() : 'L'}
                    </Text>
                </View>
                <View style={styles.livreurInfo}>
                    <Text style={styles.livreurName}>{item.nom || 'Livreur'}</Text>
                    <Text style={styles.livreurPhone}>{item.telephone}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
                        {item.statut}
                    </Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Icon name="star" size={16} color="#FFD700" />
                    <Text style={styles.statValue}>{item.note?.toFixed(1) || '4.8'}</Text>
                    <Text style={styles.statLabel}>note</Text>
                </View>
                <View style={styles.statItem}>
                    <Icon name="local-shipping" size={16} color="#FF6B6B" />
                    <Text style={styles.statValue}>{item.livraisons_aujourdhui || 0}</Text>
                    <Text style={styles.statLabel}>aujourd'hui</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.assignButton}
                onPress={() => {
                    // Si on vient d'une commande spécifique, on peut assigner
                    if (navigation.getState().routes.some(r => r.name === 'AssignLivreur')) {
                        navigation.navigate('AssignLivreur', { livreurId: item.id });
                    }
                }}
            >
                <Icon name="assignment" size={18} color="#FF6B6B" />
                <Text style={styles.assignButtonText}>Assigner à une commande</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des livreurs...</Text>
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
                data={livreurs}
                renderItem={renderLivreur}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B6B']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="local-shipping" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun livreur disponible</Text>
                        <Text style={styles.emptySubText}>
                            Les livreurs validés apparaîtront ici
                        </Text>
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
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
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
        paddingTop: 50,
    },
    list: {
        padding: 15,
    },
    livreurCard: {
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
    livreurHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },
    livreurInfo: {
        flex: 1,
    },
    livreurName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    livreurPhone: {
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
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
        marginRight: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B15',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        borderStyle: 'dashed',
    },
    assignButtonText: {
        fontSize: 13,
        color: '#FF6B6B',
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});