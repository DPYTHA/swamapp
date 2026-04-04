import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen({ navigation }) {
    const { logout } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [autoConfirm, setAutoConfirm] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    onPress: async () => {
                        await logout();
                        navigation.replace('Public');
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Vider le cache',
            'Cette action supprimera les données temporaires. Continuer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Vider',
                    onPress: async () => {
                        // Implémenter le nettoyage du cache
                        Alert.alert('Succès', 'Cache vidé avec succès');
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Notifications */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Icon name="notifications" size={20} color="#FF6B6B" />
                        <Text style={styles.settingLabel}>Notifications push</Text>
                    </View>
                    <Switch
                        value={notifications}
                        onValueChange={setNotifications}
                        trackColor={{ false: '#f0f0f0', true: '#FF6B6B' }}
                        thumbColor={notifications ? '#fff' : '#f0f0f0'}
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Icon name="email" size={20} color="#FF6B6B" />
                        <Text style={styles.settingLabel}>Alertes email</Text>
                    </View>
                    <Switch
                        value={emailAlerts}
                        onValueChange={setEmailAlerts}
                        trackColor={{ false: '#f0f0f0', true: '#FF6B6B' }}
                        thumbColor={emailAlerts ? '#fff' : '#f0f0f0'}
                    />
                </View>
            </View>

            {/* Commandes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Commandes</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Icon name="check-circle" size={20} color="#FF6B6B" />
                        <Text style={styles.settingLabel}>Confirmation automatique</Text>
                    </View>
                    <Switch
                        value={autoConfirm}
                        onValueChange={setAutoConfirm}
                        trackColor={{ false: '#f0f0f0', true: '#FF6B6B' }}
                        thumbColor={autoConfirm ? '#fff' : '#f0f0f0'}
                    />
                </View>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Icon name="receipt" size={20} color="#666" />
                        <Text style={styles.menuText}>Délais de livraison</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Icon name="local-shipping" size={20} color="#666" />
                        <Text style={styles.menuText}>Frais de livraison</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Application */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Application</Text>

                <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
                    <View style={styles.menuLeft}>
                        <Icon name="delete-sweep" size={20} color="#666" />
                        <Text style={styles.menuText}>Vider le cache</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Version</Text>
                    <Text style={styles.infoValue}>1.0.0</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Environnement</Text>
                    <Text style={styles.infoValue}>Production</Text>
                </View>
            </View>

            {/* Support */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Icon name="help" size={20} color="#666" />
                        <Text style={styles.menuText}>Centre d'aide</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Icon name="chat" size={20} color="#666" />
                        <Text style={styles.menuText}>Contacter le support</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Icon name="description" size={20} color="#666" />
                        <Text style={styles.menuText}>Conditions d'utilisation</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            {/* Déconnexion */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>

            <Text style={styles.copyright}>© 2026 SWAM. Tous droits réservés.</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336',
        margin: 20,
        padding: 15,
        borderRadius: 10,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    copyright: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
    },
});