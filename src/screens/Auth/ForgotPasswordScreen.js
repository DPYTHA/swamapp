// screens/Auth/ForgotPasswordScreen.js
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
import api from '../../services/api';

export default function ForgotPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1); // 1: téléphone, 2: code, 3: nouveau mot de passe
    const [telephone, setTelephone] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [debugCode, setDebugCode] = useState('');

    const inputRefs = useRef([]);

    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(t => t - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const formatTelephone = (text) => {
        // Ne garder que les chiffres
        const cleaned = text.replace(/[^0-9]/g, '');
        // Limiter à 9 chiffres
        return cleaned.slice(0, 9);
    };

    const handleSendCode = async () => {
        if (telephone.length < 9) {
            Alert.alert('Erreur', 'Veuillez entrer un numéro valide (9 chiffres)');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/forgot-password', { telephone });

            // En développement, on reçoit le code dans la réponse
            if (response.data.debug_code) {
                setDebugCode(response.data.debug_code);
                Alert.alert(
                    'Code de test',
                    `Votre code est: ${response.data.debug_code}`,
                    [{ text: 'OK' }]
                );
            }

            Alert.alert('Succès', 'Un code de vérification a été envoyé');
            setStep(2);
            setTimer(300); // 5 minutes en secondes

        } catch (error) {
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible d\'envoyer le code'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        const codeString = code.join('');
        if (codeString.length < 6) {
            Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
            return;
        }

        setLoading(true);
        try {
            await api.post('/verify-reset-code', {
                telephone,
                code: codeString
            });

            setStep(3);
        } catch (error) {
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Code invalide'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 4) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 4 caractères');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset-password', {
                telephone,
                code: code.join(''),
                new_password: newPassword
            });

            Alert.alert(
                'Succès',
                'Mot de passe réinitialisé avec succès',
                [
                    {
                        text: 'Se connecter',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de réinitialiser le mot de passe'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (text, index) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus suivant
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        // Si backspace et champ vide, focus précédent
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const resendCode = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            await api.post('/forgot-password', { telephone });
            setTimer(300);
            Alert.alert('Succès', 'Un nouveau code a été envoyé');
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.message || 'Impossible de renvoyer le code');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header avec retour */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (step === 1) navigation.goBack();
                            else setStep(step - 1);
                        }}
                    >
                        <Icon name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mot de passe oublié</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Illustration */}
                <View style={styles.iconContainer}>
                    <Icon name="lock-reset" size={80} color="#FF6B6B" />
                </View>

                {/* Step 1: Téléphone */}
                {step === 1 && (
                    <View style={styles.form}>
                        <Text style={styles.description}>
                            Entrez votre numéro de téléphone pour recevoir un code de vérification
                        </Text>

                        <View style={styles.inputContainer}>
                            <Icon name="phone" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="77 123 45 67"
                                value={telephone}
                                onChangeText={(text) => setTelephone(formatTelephone(text))}
                                keyboardType="phone-pad"
                                maxLength={9}
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSendCode}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Envoyer le code</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.whatsup} >Ecrivez nous via Whatssap en cas de problemes +7 9879040719</Text>

                    </View>
                )}

                {/* Step 2: Code de vérification */}
                {step === 2 && (
                    <View style={styles.form}>
                        <Text style={styles.description}>
                            Entrez le code à 6 chiffres envoyé au {telephone}
                        </Text>

                        <View style={styles.codeContainer}>
                            {code.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => inputRefs.current[index] = ref}
                                    style={styles.codeInput}
                                    value={digit}
                                    onChangeText={(text) => handleCodeChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    editable={!loading}
                                />
                            ))}
                        </View>

                        <View style={styles.timerContainer}>
                            <Icon name="access-time" size={16} color="#FF6B6B" />
                            <Text style={styles.timerText}>
                                {timer > 0 ? formatTime(timer) : 'Code expiré'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleVerifyCode}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Vérifier</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={resendCode}
                            disabled={timer > 0 || loading}
                        >
                            <Text style={[
                                styles.resendText,
                                timer > 0 && styles.resendDisabled
                            ]}>
                                Renvoyer le code
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.whatsup} >Ecrivez nous via Whatssap en cas de problemes +7 9879040719</Text>
                    </View>
                )}

                {/* Step 3: Nouveau mot de passe */}
                {step === 3 && (
                    <View style={styles.form}>
                        <Text style={styles.description}>
                            Choisissez votre nouveau mot de passe
                        </Text>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nouveau mot de passe"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Réinitialiser</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    whatsup: {
        color: "#FF6B6B"
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    form: {
        flex: 1,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#FF6B6B',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    codeInput: {
        width: 45,
        height: 55,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    timerText: {
        fontSize: 16,
        color: '#FF6B6B',
        marginLeft: 8,
        fontWeight: '500',
    },
    resendButton: {
        alignItems: 'center',
        marginTop: 20,
    },
    resendText: {
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    resendDisabled: {
        opacity: 0.5,
    },
});