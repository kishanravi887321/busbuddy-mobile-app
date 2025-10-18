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
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Add your sign up logic here
    console.log('Sign up with:', email, password);
  };

  const handleGoogleSignUp = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-Up Success:', userInfo);
      // Add your Google auth logic here
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
      Alert.alert('Error', 'Google Sign-Up failed');
    }
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

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>Create Account</Text>
        <Text style={styles.subText}>Sign up to get started</Text>

        {/* Input Fields */}
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

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3D4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3D4"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
          >
            <Text style={styles.googleButtonText}>🔍 Sign up with Google</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
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
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#B8C1E8',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
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
  signupButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  signupButtonText: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#B8C1E8',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  googleButtonText: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#B8C1E8',
    fontSize: 14,
  },
  loginLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;