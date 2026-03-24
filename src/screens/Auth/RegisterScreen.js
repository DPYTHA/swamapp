import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';


export default function RegisterScreen({ navigation }) {
    const [nom, setNom] = useState('');
    const [telephone, setTelephone] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        // Validations
        if (!telephone || !motDePasse) {
            Alert.alert('Erreur', 'Téléphone et mot de passe requis');
            return;
        }

        if (motDePasse !== confirmMotDePasse) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (motDePasse.length < 4) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 4 caractères');
            return;
        }

        setLoading(true);
        const result = await register(telephone, motDePasse, nom);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Erreur', result.message);
        } else {
            // ✅ Message de succès et redirection vers Login
            Alert.alert(
                '🎉 Inscription réussie !',
                'Merci de vous être inscrit sur SWAM ! Veuillez vous connecter.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>SWAM</Text>
                    <Text style={styles.slogan}>Rejoignez-nous !</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Inscription</Text>

                    <View style={styles.inputContainer}>
                        <Icon name="person" size={20} color="#FF6B6B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nom (optionnel)"
                            value={nom}
                            onChangeText={setNom}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="phone" size={20} color="#FF6B6B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Téléphone"
                            value={telephone}
                            onChangeText={setTelephone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#FF6B6B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mot de passe"
                            value={motDePasse}
                            onChangeText={setMotDePasse}
                            secureTextEntry
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock-outline" size={20} color="#FF6B6B" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmer mot de passe"
                            value={confirmMotDePasse}
                            onChangeText={setConfirmMotDePasse}
                            secureTextEntry
                            placeholderTextColor="#999"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Inscription...' : "S'inscrire"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={styles.linkContainer}
                    >
                        <Text style={styles.linkText}>
                            Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Styles inchangés
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    slogan: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
    },
    formContainer: {
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    inputIcon: {
        padding: 10,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#FF6B6B',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 16,
        color: '#666',
    },
    linkBold: {
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
});