// screens/Client/StatistiquesAchatScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StatistiquesAchatScreen({ navigation }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.get('/client/statistiques');
            setStats(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const formatMontant = (montant) => {
        return montant.toLocaleString() + ' FCFA';
    };

    const StatCard = ({ icon, label, value, color }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Icon name={icon} size={24} color={color} />
            <View style={styles.statCardContent}>
                <Text style={styles.statCardLabel}>{label}</Text>
                <Text style={styles.statCardValue}>{value}</Text>
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
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes statistiques</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Icon name="refresh" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Statistiques générales */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
                
                <StatCard 
                    icon="shopping-cart"
                    label="Total commandes"
                    value={stats.total_commandes}
                    color="#FF6B6B"
                />
                
                <StatCard 
                    icon="payments"
                    label="Total dépensé"
                    value={formatMontant(stats.total_depense)}
                    color="#4CAF50"
                />
                
                <StatCard 
                    icon="shopping-bag"
                    label="Produits achetés"
                    value={stats.produits_achetes}
                    color="#2196F3"
                />
            </View>

            {/* Moyennes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Moyennes</Text>
                
                <StatCard 
                    icon="trending-up"
                    label="Moyenne par commande"
                    value={formatMontant(stats.moyenne_commande)}
                    color="#9C27B0"
                />
                
                <View style={styles.minMaxContainer}>
                    <View style={[styles.minMaxCard, { backgroundColor: '#4CAF5020' }]}>
                        <Icon name="arrow-upward" size={20} color="#4CAF50" />
                        <Text style={styles.minMaxLabel}>Max</Text>
                        <Text style={styles.minMaxValue}>{formatMontant(stats.commande_max)}</Text>
                    </View>
                    
                    <View style={[styles.minMaxCard, { backgroundColor: '#F4433620' }]}>
                        <Icon name="arrow-downward" size={20} color="#F44336" />
                        <Text style={styles.minMaxLabel}>Min</Text>
                        <Text style={styles.minMaxValue}>{formatMontant(stats.commande_min)}</Text>
                    </View>
                </View>
            </View>

            {/* Catégories favorites */}
            {stats.categories_favorites && stats.categories_favorites.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Catégories favorites</Text>
                    
                    {stats.categories_favorites.map((cat, index) => (
                        <View key={index} style={styles.categoryRow}>
                            <Text style={styles.categoryName}>{cat.categorie}</Text>
                            <View style={styles.categoryBar}>
                                <View 
                                    style={[
                                        styles.categoryBarFill,
                                        { 
                                            width: `${(cat.quantite / stats.produits_achetes * 100).toFixed(1)}%`,
                                            backgroundColor: index === 0 ? '#FF6B6B' : 
                                                             index === 1 ? '#4CAF50' : '#2196F3'
                                        }
                                    ]} 
                                />
                            </View>
                            <Text style={styles.categoryCount}>{cat.quantite} produits</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Habitudes d'achat */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Habitudes d'achat</Text>
                
                {stats.mois_plus_actif && (
                    <View style={styles.habitCard}>
                        <Icon name="calendar-month" size={24} color="#FF6B6B" />
                        <View style={styles.habitContent}>
                            <Text style={styles.habitLabel}>Mois le plus actif</Text>
                            <Text style={styles.habitValue}>{stats.mois_plus_actif}</Text>
                        </View>
                    </View>
                )}
                
                {stats.jour_prefere && (
                    <View style={styles.habitCard}>
                        <Icon name="calendar-today" size={24} color="#4CAF50" />
                        <View style={styles.habitContent}>
                            <Text style={styles.habitLabel}>Jour préféré</Text>
                            <Text style={styles.habitValue}>{stats.jour_prefere}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Bouton pour voir plus de détails */}
            <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => navigation.navigate('Commandes')}
            >
                <Text style={styles.detailsButtonText}>Voir l'historique détaillé</Text>
                <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
        </ScrollView>
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
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    statCardContent: {
        marginLeft: 15,
        flex: 1,
    },
    statCardLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    statCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    minMaxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    minMaxCard: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    minMaxLabel: {
        fontSize: 12,
        color: '#666',
        marginVertical: 4,
    },
    minMaxValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    categoryRow: {
        marginBottom: 15,
    },
    categoryName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    categoryBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginBottom: 4,
    },
    categoryBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    categoryCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    habitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    habitContent: {
        marginLeft: 15,
        flex: 1,
    },
    habitLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    habitValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        textTransform: 'capitalize',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        margin: 20,
        padding: 15,
        borderRadius: 10,
    },
    detailsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
    },
});