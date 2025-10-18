import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Add your password reset logic here
    console.log('Reset password for:', email);
    Alert.alert(
      'Success',
      'Password reset link has been sent to your email',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <View style={styles.mapPin1} />
              <View style={styles.mapPin2} />
              <View style={styles.routeLine} />
            </View>
          </View>
          <Text style={styles.appName}>BusBuddy</Text>
        </View>

        {/* Header Text */}
        <Text style={styles.headerText}>Forgot Password?</Text>
        <Text style={styles.subText}>
          Don't worry! Enter your email address and we'll send you a link to
          reset your password.
        </Text>

        {/* Input Field */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3D4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
          >
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.backContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Remember your password?{' '}
            <Text
              style={styles.infoLink}
              onPress={() => navigation.navigate('Login')}
            >
              Log In
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  mapPin1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c4dff',
    position: 'absolute',
    top: 5,
    left: 10,
    borderWidth: 2,
    borderColor: '#5e35b1',
  },
  mapPin2: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c4dff',
    position: 'absolute',
    top: 5,
    right: 10,
    borderWidth: 2,
    borderColor: '#5e35b1',
  },
  routeLine: {
    width: 30,
    height: 2,
    backgroundColor: '#7c4dff',
    position: 'absolute',
    top: 30,
    left: 10,
    borderRadius: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subText: {
    fontSize: 14,
    color: '#B8C1E8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonText: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backContainer: {
    alignItems: 'center',
  },
  backText: {
    color: '#B8C1E8',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  infoText: {
    color: '#B8C1E8',
    fontSize: 14,
  },
  infoLink: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;