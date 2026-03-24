// screens/Client/SupportScreen.js
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function SupportScreen({ navigation }) {
    const [sujet, setSujet] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('question');
    const [loading, setLoading] = useState(false);

    const types = [
        { id: 'question', label: 'Question', icon: 'help' },
        { id: 'reclamation', label: 'Réclamation', icon: 'report' },
        { id: 'bug', label: 'Signaler un bug', icon: 'bug-report' },
        { id: 'autre', label: 'Autre', icon: 'more-horiz' },
    ];

    const handleSubmit = async () => {
        if (!sujet.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir un sujet');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir votre message');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/client/support', {
                sujet,
                message,
                type
            });

            Alert.alert(
                'Message envoyé',
                `Votre demande a été envoyée. Numéro de ticket: ${response.data.ticket_id}`,
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } catch (error) {
            console.log('❌ Erreur envoi support:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer votre message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Service client</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Info section */}
            <View style={styles.infoSection}>
                <Icon name="headset" size={40} color="#FF6B6B" />
                <Text style={styles.infoTitle}>Comment pouvons-nous vous aider ?</Text>
                <Text style={styles.infoText}>
                    Notre équipe vous répondra dans les plus brefs délais
                </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
                <Text style={styles.label}>Type de demande</Text>
                <View style={styles.typeContainer}>
                    {types.map(t => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.typeButton,
                                type === t.id && styles.typeButtonActive
                            ]}
                            onPress={() => setType(t.id)}
                        >
                            <Icon
                                name={t.icon}
                                size={20}
                                color={type === t.id ? '#fff' : '#666'}
                            />
                            <Text style={[
                                styles.typeButtonText,
                                type === t.id && styles.typeButtonTextActive
                            ]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Sujet</Text>
                <TextInput
                    style={styles.input}
                    value={sujet}
                    onChangeText={setSujet}
                    placeholder="Ex: Problème de livraison, Question produit..."
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Décrivez votre demande en détail..."
                    multiline
                    numberOfLines={6}
                />

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Envoyer</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Contact alternatives */}
            <View style={styles.alternatives}>
                <Text style={styles.alternativesTitle}>Autres moyens de nous contacter</Text>

                <View style={styles.alternativeItem}>
                    <Icon name="phone" size={20} color="#FF6B6B" />
                    <Text style={styles.alternativeText}>+225 0757123619</Text>
                </View>

                <View style={styles.alternativeItem}>
                    <Icon name="email" size={20} color="#FF6B6B" />
                    <Text style={styles.alternativeText}>pythacademy91@gmail.com</Text>
                </View>

                <View style={styles.alternativeItem}>
                    <Icon name="chat" size={20} color="#FF6B6B" />
                    <Text style={styles.alternativeText}>Chat en ligne (8h-20h)</Text>
                </View>
            </View>

            <Text style={styles.responseTime}>
                ⏱️ Délai de réponse moyen : 24h
            </Text>
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
    infoSection: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#f9f9f9',
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
        marginTop: 15,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    typeButtonActive: {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
    },
    typeButtonText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    typeButtonTextActive: {
        color: '#fff',
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#FF6B6B',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 25,
    },
    disabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    alternatives: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        marginTop: 20,
    },
    alternativesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    alternativeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    alternativeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
    },
    responseTime: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
        marginVertical: 20,
        fontStyle: 'italic',
    },
});