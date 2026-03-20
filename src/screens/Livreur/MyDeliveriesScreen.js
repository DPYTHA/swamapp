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

export default function MyDeliveriesScreen({ navigation }) {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        console.log('📦 Chargement des livraisons...');
        try {
            const response = await api.get('/livreur/mes-livraisons');
            console.log('✅ Réponse reçue:', response.data);
            setDeliveries(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger vos livraisons');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDeliveries();
    };

    const handleUpdateStatus = async (deliveryId, currentStatus) => {
        console.log('🔄 Clic sur le bouton - ID:', deliveryId, 'Statut:', currentStatus);
        
        let nextStatus = '';
        let message = '';

        if (currentStatus === 'preparation') {
            nextStatus = 'livraison';
            message = 'Démarrer la livraison ?';
        } else if (currentStatus === 'livraison') {
            nextStatus = 'livree';
            message = 'Marquer comme livrée ?';
        }

        Alert.alert(
            'Mise à jour',
            message,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: () => updateStatus(deliveryId, nextStatus)
                }
            ]
        );
    };

    const updateStatus = async (deliveryId, newStatus) => {
        console.log('📤 Envoi mise à jour:', { deliveryId, newStatus });
        try {
            await api.put(`/livreur/commandes/${deliveryId}/statut`, { statut: newStatus });
            console.log('✅ Statut mis à jour');
            Alert.alert('Succès', 'Statut mis à jour');
            loadDeliveries();
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
        }
    };

    const renderDelivery = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
        >
            <View style={styles.header}>
                <Text style={styles.code}>{item.code_suivi}</Text>
                <View style={[styles.statusBadge, { 
                    backgroundColor: item.statut === 'preparation' ? '#2196F3' : '#FF6B6B' 
                }]}>
                    <Text style={styles.statusText}>
                        {item.statut === 'preparation' ? 'À livrer' : 'En cours'}
                    </Text>
                </View>
            </View>

            <Text style={styles.client}>{item.client.nom}</Text>
            <Text style={styles.address} numberOfLines={1}>{item.adresse_livraison}</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => handleUpdateStatus(item.id, item.statut)}
            >
                <Text style={styles.buttonText}>
                    {item.statut === 'preparation' ? 'Démarrer livraison' : 'Marquer livrée'}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={deliveries}
                renderItem={renderDelivery}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Icon name="local-shipping" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Aucune livraison en cours</Text>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    list: {
        padding: 15,
    },
    card: {
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    code: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    client: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#FF6B6B',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
});