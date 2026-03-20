// screens/Client/AvisScreen.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function AvisScreen({ navigation }) {
    const [avis, setAvis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCommande, setSelectedCommande] = useState(null);
    const [selectedProduit, setSelectedProduit] = useState(null);
    const [note, setNote] = useState(5);
    const [commentaire, setCommentaire] = useState('');

    useEffect(() => {
        loadAvis();
    }, []);

    const loadAvis = async () => {
        try {
            const response = await api.get('/client/avis');
            setAvis(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement avis:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAvis();
    };

    const renderStars = (value, interactive = false) => {
        return [1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
                key={star}
                onPress={() => interactive && setNote(star)}
                disabled={!interactive}
            >
                <Icon
                    name={star <= value ? 'star' : 'star-border'}
                    size={interactive ? 36 : 16}
                    color="#FFD700"
                    style={{ marginHorizontal: 2 }}
                />
            </TouchableOpacity>
        ));
    };

    const renderAvisItem = ({ item }) => (
        <View style={styles.avisCard}>
            <View style={styles.avisHeader}>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.produit_nom}</Text>
                    <View style={styles.stars}>
                        {renderStars(item.note)}
                    </View>
                </View>
                <Text style={styles.avisDate}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
            </View>

            {item.commentaire ? (
                <Text style={styles.commentaire}>{item.commentaire}</Text>
            ) : null}
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
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes avis</Text>
                <View style={{ width: 24 }} />
            </View>

            {avis.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="star-border" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>Aucun avis pour le moment</Text>
                    <Text style={styles.emptyText}>
                        Partagez votre expérience après vos achats
                    </Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Commandes')}
                    >
                        <Text style={styles.shopButtonText}>Voir mes commandes</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={avis}
                    renderItem={renderAvisItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
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
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    list: {
        padding: 15,
    },
    avisCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
    },
    avisHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    stars: {
        flexDirection: 'row',
    },
    avisDate: {
        fontSize: 11,
        color: '#999',
    },
    commentaire: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    shopButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});