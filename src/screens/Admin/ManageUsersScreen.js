import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function ManageUsersScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({
        nom: '',
        telephone: '',
        role: '',
        mot_de_passe: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement utilisateurs:', error);
            Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditForm({
            nom: user.nom || '',
            telephone: user.telephone,
            role: user.role,
            mot_de_passe: ''
        });
        setModalVisible(true);
    };

    const handleSaveUser = async () => {
        try {
            const dataToSend = { ...editForm };
            if (!dataToSend.mot_de_passe) {
                delete dataToSend.mot_de_passe; // Ne pas envoyer si vide
            }

            await api.put(`/admin/users/${selectedUser.id}`, dataToSend);
            Alert.alert('Succès', 'Utilisateur modifié avec succès');
            setModalVisible(false);
            loadUsers();
        } catch (error) {
            console.log('❌ Erreur modification:', error);
            Alert.alert('Erreur', 'Impossible de modifier l\'utilisateur');
        }
    };

    const handleDeleteUser = (user) => {
        Alert.alert(
            'Confirmation',
            `Voulez-vous vraiment supprimer l'utilisateur ${user.nom || user.telephone} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    onPress: async () => {
                        try {
                            await api.delete(`/admin/users/${user.id}`);
                            Alert.alert('Succès', 'Utilisateur supprimé');
                            loadUsers();
                        } catch (error) {
                            console.log('❌ Erreur suppression:', error);
                            Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return '#FF6B6B';
            case 'livreur': return '#4CAF50';
            case 'client': return '#2196F3';
            default: return '#999';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return 'admin-panel-settings';
            case 'livreur': return 'local-shipping';
            case 'client': return 'person';
            default: return 'person';
        }
    };

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userHeader}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                    <Icon name={getRoleIcon(item.role)} size={16} color={getRoleColor(item.role)} />
                    <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                        {item.role}
                    </Text>
                </View>
                <View style={styles.userActions}>
                    <TouchableOpacity onPress={() => handleEditUser(item)} style={styles.actionBtn}>
                        <Icon name="edit" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteUser(item)} style={styles.actionBtn}>
                        <Icon name="delete" size={20} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.nom || 'Nom non renseigné'}</Text>
                <Text style={styles.userPhone}>{item.telephone}</Text>
                {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
            </View>

            <View style={styles.userFooter}>
                <Text style={styles.userDate}>
                    Inscrit le: {new Date(item.date_inscription).toLocaleDateString('fr-FR')}
                </Text>
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
                <Text style={styles.headerTitle}>Gestion des utilisateurs</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Statistiques */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>
                        {users.filter(u => u.role === 'admin').length}
                    </Text>
                    <Text style={styles.statLabel}>Admins</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>
                        {users.filter(u => u.role === 'livreur').length}
                    </Text>
                    <Text style={styles.statLabel}>Livreurs</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>
                        {users.filter(u => u.role === 'client').length}
                    </Text>
                    <Text style={styles.statLabel}>Clients</Text>
                </View>
            </View>

            {/* Liste des utilisateurs */}
            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="people" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
                    </View>
                }
            />

            {/* Modal d'édition */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Modifier l'utilisateur</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nom</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.nom}
                                    onChangeText={(text) => setEditForm({ ...editForm, nom: text })}
                                    placeholder="Nom complet"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Téléphone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.telephone}
                                    onChangeText={(text) => setEditForm({ ...editForm, telephone: text })}
                                    placeholder="Téléphone"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Rôle</Text>
                                <View style={styles.roleSelector}>
                                    {['admin', 'livreur', 'client'].map((role) => (
                                        <TouchableOpacity
                                            key={role}
                                            style={[
                                                styles.roleOption,
                                                editForm.role === role && styles.roleOptionActive
                                            ]}
                                            onPress={() => setEditForm({ ...editForm, role })}
                                        >
                                            <Text style={[
                                                styles.roleOptionText,
                                                editForm.role === role && styles.roleOptionTextActive
                                            ]}>
                                                {role}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    Nouveau mot de passe (laisser vide pour ne pas changer)
                                </Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.input, styles.passwordInput]}
                                        value={editForm.mot_de_passe}
                                        onChangeText={(text) => setEditForm({ ...editForm, mot_de_passe: text })}
                                        placeholder="••••••••"
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Icon
                                            name={showPassword ? 'visibility-off' : 'visibility'}
                                            size={20}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveUser}
                            >
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    list: {
        padding: 15,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 5,
        textTransform: 'capitalize',
    },
    userActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        padding: 5,
        marginLeft: 10,
    },
    userInfo: {
        marginBottom: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#999',
    },
    userFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    userDate: {
        fontSize: 11,
        color: '#999',
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
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        color: '#333',
    },
    roleSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    roleOption: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 5,
        borderRadius: 8,
    },
    roleOptionActive: {
        backgroundColor: '#FF6B6B',
    },
    roleOptionText: {
        fontSize: 14,
        color: '#666',
        textTransform: 'capitalize',
    },
    roleOptionTextActive: {
        color: '#fff',
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 40,
    },
    eyeButton: {
        position: 'absolute',
        right: 10,
        top: 12,
    },
    saveButton: {
        backgroundColor: '#FF6B6B',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});