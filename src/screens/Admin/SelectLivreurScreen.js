import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function SelectLivreurScreen({ navigation, route }) {
    const { commande, livreurs } = route.params;

    const handleSelectLivreur = (livreur) => {
        Alert.alert(
            'Confirmation',
            `Assigner ${livreur.nom || 'ce livreur'} à la commande ${commande.code_suivi} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Assigner',
                    onPress: () => assignLivreur(livreur.id)
                }
            ]
        );
    };

    const assignLivreur = async (livreurId) => {
        try {
            await api.post(`/admin/commandes/${commande.id}/assigner-livreur`, {
                livreur_id: livreurId
            });
            Alert.alert('Succès', 'Livreur assigné avec succès');
            navigation.goBack();
            // Recharger la liste des commandes si nécessaire
            navigation.navigate('AssignLivreur', { refresh: true });
        } catch (error) {
            console.log('❌ Erreur assignation:', error.response?.data || error.message);
            Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'assigner le livreur');
        }
    };

    const getStatusColor = (statut) => {
        return statut === 'disponible' ? '#4CAF50' : '#FFA500';
    };

    const renderLivreur = ({ item }) => (
        <TouchableOpacity
            style={styles.livreurCard}
            onPress={() => handleSelectLivreur(item)}
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
                </View>
                <View style={styles.statItem}>
                    <Icon name="local-shipping" size={16} color="#FF6B6B" />
                    <Text style={styles.statValue}>{item.livraisons_aujourdhui || 0} aujourd'hui</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Choisir un livreur</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.infoBanner}>
                <Icon name="info" size={20} color="#FF6B6B" />
                <Text style={styles.infoText}>
                    Commande: {commande.code_suivi} - {commande.total.toLocaleString()} FCFA
                </Text>
            </View>

            <FlatList
                data={livreurs}
                renderItem={renderLivreur}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="local-shipping" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun livreur disponible</Text>
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
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B15',
        padding: 15,
        margin: 15,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#FF6B6B',
        marginLeft: 10,
        flex: 1,
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
        marginBottom: 10,
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