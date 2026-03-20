// screens/Client/WishlistScreen.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function WishlistScreen({ navigation }) {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            const response = await api.get('/client/wishlist');
            setWishlist(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement wishlist:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadWishlist();
    };

    const removeFromWishlist = async (itemId) => {
        Alert.alert(
            'Retirer des souhaits',
            'Voulez-vous retirer ce produit de votre liste ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Retirer',
                    onPress: async () => {
                        try {
                            await api.delete(`/client/wishlist/${itemId}`);
                            Alert.alert('Succès', 'Produit retiré de la liste');
                            loadWishlist();
                        } catch (error) {
                            console.log('❌ Erreur suppression:', error);
                            Alert.alert('Erreur', 'Impossible de retirer le produit');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const addToCart = (product) => {
        Alert.alert(
            'Ajout au panier',
            `${product.nom} a été ajouté au panier`,
            [
                { text: 'Continuer', style: 'cancel' },
                { text: 'Voir le panier', onPress: () => navigation.navigate('Panier') }
            ]
        );
    };

    const renderWishlistItem = ({ item }) => (
        <View style={styles.itemCard}>
            <Image
                source={{ uri: item.produit.image_url || 'https://via.placeholder.com/100' }}
                style={styles.itemImage}
            />

            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.produit.nom}</Text>
                <Text style={styles.itemCategory}>{item.produit.categorie}</Text>
                <Text style={styles.itemPrice}>{item.produit.prix.toLocaleString()} FCFA</Text>

                <View style={styles.itemActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cartButton]}
                        onPress={() => addToCart(item.produit)}
                    >
                        <Icon name="add-shopping-cart" size={18} color="#FF6B6B" />
                        <Text style={styles.cartButtonText}>Ajouter au panier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => removeFromWishlist(item.id)}
                    >
                        <Icon name="delete" size={18} color="#F44336" />
                    </TouchableOpacity>
                </View>
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
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ma liste de souhaits</Text>
                <View style={{ width: 24 }} />
            </View>

            {wishlist.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="favorite-border" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>Votre liste est vide</Text>
                    <Text style={styles.emptyText}>
                        Ajoutez vos produits préférés pour les retrouver facilement
                    </Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Accueil')}
                    >
                        <Text style={styles.shopButtonText}>Découvrir nos produits</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={wishlist}
                    renderItem={renderWishlistItem}
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
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    itemCategory: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 8,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    cartButton: {
        backgroundColor: '#FF6B6B20',
        flex: 1,
    },
    cartButtonText: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '500',
        marginLeft: 4,
    },
    deleteButton: {
        backgroundColor: '#F4433620',
        paddingHorizontal: 10,
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