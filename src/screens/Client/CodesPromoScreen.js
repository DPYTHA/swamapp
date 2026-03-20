// screens/Client/CodesPromoScreen.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function CodesPromoScreen({ navigation }) {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPromos();
    }, []);

    const loadPromos = async () => {
        try {
            const response = await api.get('/client/promos');
            setPromos(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement promos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadPromos();
    };

    const copyToClipboard = (code) => {
        Clipboard.setString(code);
        Alert.alert('✅ Copié !', 'Le code a été copié dans le presse-papier');
    };

    const getReductionText = (promo) => {
        if (promo.reduction_type === 'pourcentage') {
            return `${promo.reduction_value}% de réduction`;
        } else {
            return `${promo.reduction_value.toLocaleString()} FCFA de réduction`;
        }
    };

    const getDaysLeft = (dateFin) => {
        const fin = new Date(dateFin);
        const maintenant = new Date();
        const diff = Math.ceil((fin - maintenant) / (1000 * 60 * 60 * 24));
        return diff > 0 ? `${diff} jours` : 'Expiré';
    };

    const renderPromoItem = ({ item }) => (
        <View style={styles.promoCard}>
            <View style={styles.promoHeader}>
                <Text style={styles.promoCode}>{item.code}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(item.code)}>
                    <Icon name="content-copy" size={20} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <Text style={styles.promoDescription}>{item.description}</Text>

            <View style={styles.promoDetails}>
                <View style={styles.promoDetail}>
                    <Icon name="local-offer" size={16} color="#4CAF50" />
                    <Text style={styles.promoDetailText}>
                        {getReductionText(item)}
                    </Text>
                </View>

                {item.min_commande > 0 && (
                    <View style={styles.promoDetail}>
                        <Icon name="shopping-cart" size={16} color="#2196F3" />
                        <Text style={styles.promoDetailText}>
                            Min. {item.min_commande.toLocaleString()} FCFA
                        </Text>
                    </View>
                )}

                <View style={styles.promoDetail}>
                    <Icon name="access-time" size={16} color="#FF9800" />
                    <Text style={styles.promoDetailText}>
                        Expire dans {getDaysLeft(item.date_fin)}
                    </Text>
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
                <Text style={styles.headerTitle}>Mes codes promo</Text>
                <View style={{ width: 24 }} />
            </View>

            {promos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="local-offer" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>Aucun code promo</Text>
                    <Text style={styles.emptyText}>
                        Vous n'avez pas de codes promo pour le moment
                    </Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Accueil')}
                    >
                        <Text style={styles.shopButtonText}>Continuer mes achats</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={promos}
                    renderItem={renderPromoItem}
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
    promoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    promoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    promoCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF6B6B',
        letterSpacing: 1,
    },
    promoDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    promoDetails: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    promoDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    promoDetailText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
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