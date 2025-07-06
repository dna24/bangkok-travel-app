import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { apiClient,saveToken,baseURL,getUserId } from '../../services/apiClient';
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,  
} from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
  
    try {
      const response = await fetch('https://api-4x16.onrender.com/api/login_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email: email, password: password }),
      });
  
      const data = await response.json();
      console.log('Login Response:', data);
  
      if (response.ok) {
        if (data.access_token && data.refresh_token) {
          await saveToken(data.access_token, data.refresh_token);
          const userId = await getUserId();
          console.log('user_id:', userId);

          await updateLastLogin(userId); 
  
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
          
        } else {
          Alert.alert('การเข้าสู่ระบบล้มเหลว', 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
        }
      } else {
        Alert.alert('การเข้าสู่ระบบล้มเหลว', `ข้อผิดพลาด: ${data.error || response.status}`);
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาด กรุณาลองใหม่ในภายหลัง');
    }
  };
  
  const updateLastLogin = async () => {
    try {
      const userId = await getUserId(); 
      if (userId) {
        const response = await apiClient.patch(`/users/${userId}/`, {
          last_login: new Date().toISOString(),  
        });
        
        console.log('Last login updated successfully:', response.data);
      } else {
        console.error('User ID not found');
      }
    } catch (error) {
      console.error('Error updating last login:', error.response?.data || error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Log In</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Don’t have an account?{' '}
            <Text style={styles.signUpText} onPress={() => navigation.navigate('Register')}> 
              Sign up
            </Text>
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  formContainer: {
    width: '100%',
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    marginTop: 100
  },
  input: {
    width: '90%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#FFF',
  },
  loginButton: {
    width: '90%',
    padding: 15,
    backgroundColor: '#22B37A',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#777',
  },
  signUpText: {
    color: '#22B37A',
    fontWeight: 'bold',
  },
});

export default LoginScreen;