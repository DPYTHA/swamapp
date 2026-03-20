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
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function ValidateLivreursScreen({ navigation }) {
    const [livreurs, setLivreurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [validating, setValidating] = useState(null);

    useEffect(() => {
        loadLivreurs();
    }, []);

    const loadLivreurs = async () => {
        try {
            // Cette route devra être créée dans le backend
            const response = await api.get('/admin/livreurs-en-attente');
            setLivreurs(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement livreurs:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadLivreurs();
    };

    const handleValidate = (livreurId) => {
        Alert.alert(
            'Valider le livreur',
            'Confirmez-vous l\'inscription de ce livreur ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Valider',
                    onPress: () => validateLivreur(livreurId)
                }
            ]
        );
    };

    const validateLivreur = async (livreurId) => {
        setValidating(livreurId);
        try {
            await api.put(`/admin/livreurs/${livreurId}/valider`);
            Alert.alert('Succès', 'Livreur validé avec succès');
            loadLivreurs(); // Recharger la liste
        } catch (error) {
            console.log('❌ Erreur validation:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de valider le livreur');
        } finally {
            setValidating(null);
        }
    };

    const handleReject = (livreurId) => {
        Alert.alert(
            'Refuser le livreur',
            'Êtes-vous sûr de vouloir refuser cette inscription ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Refuser',
                    style: 'destructive',
                    onPress: () => rejectLivreur(livreurId)
                }
            ]
        );
    };

    const rejectLivreur = async (livreurId) => {
        setValidating(livreurId);
        try {
            await api.delete(`/admin/livreurs/${livreurId}`);
            Alert.alert('Succès', 'Livreur refusé');
            loadLivreurs();
        } catch (error) {
            console.log('❌ Erreur refus:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de refuser le livreur');
        } finally {
            setValidating(null);
        }
    };

    const renderLivreur = ({ item }) => (
        <View style={styles.livreurCard}>
            <View style={styles.livreurHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {item.nom ? item.nom.charAt(0).toUpperCase() : 'L'}
                    </Text>
                </View>
                <View style={styles.livreurInfo}>
                    <Text style={styles.livreurName}>{item.nom || 'Nom non renseigné'}</Text>
                    <Text style={styles.livreurPhone}>{item.telephone}</Text>
                    <Text style={styles.livreurDate}>
                        Inscrit le {new Date(item.date_inscription).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
            </View>

            <View style={styles.livreurActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.validateButton]}
                    onPress={() => handleValidate(item.id)}
                    disabled={validating === item.id}
                >
                    {validating === item.id ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                        <>
                            <Icon name="check" size={18} color="#4CAF50" />
                            <Text style={styles.validateButtonText}>Valider</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                    disabled={validating === item.id}
                >
                    <Icon name="close" size={18} color="#F44336" />
                    <Text style={styles.rejectButtonText}>Refuser</Text>
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Validation des livreurs</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={livreurs}
                renderItem={renderLivreur}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="check-circle" size={50} color="#4CAF50" />
                        <Text style={styles.emptyText}>Aucun livreur en attente</Text>
                        <Text style={styles.emptySubText}>
                            Toutes les demandes ont été traitées
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
        backgroundColor: '#fff',
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
        padding: 35,
    },
    headerTitle: {
        padding:15,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        padding: 15,
    },
    livreurCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    livreurHeader: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
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
        marginBottom: 2,
    },
    livreurDate: {
        fontSize: 12,
        color: '#999',
    },
    livreurActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 15,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    validateButton: {
        backgroundColor: '#4CAF5020',
    },
    validateButtonText: {
        color: '#4CAF50',
        marginLeft: 5,
        fontWeight: '500',
    },
    rejectButton: {
        backgroundColor: '#F4433620',
    },
    rejectButtonText: {
        color: '#F44336',
        marginLeft: 5,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 15,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
});