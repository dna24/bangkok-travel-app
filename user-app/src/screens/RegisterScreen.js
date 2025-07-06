import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { FontAwesome } from '@expo/vector-icons';

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState(null);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();

  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword || !gender || !day || !month || !year) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    const currentYear = new Date().getFullYear();
    if (parseInt(year) > currentYear || parseInt(year) < 1900) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกปีที่ถูกต้อง (ค.ศ.)');
      return;
    }

    const user_birthday = `${year}-${month}-${day}`;

    fetch('https://api-4x16.onrender.com/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name: username,
        user_email: email,
        password: password,
        user_birthday: user_birthday,
        user_gender: gender,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          Alert.alert('สำเร็จ', data.message);
          navigation.navigate('Login');
        } else {
          Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลงทะเบียนได้');
        }
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดบางประการ');
      });
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <View style={styles.backIconContainer}>
          <FontAwesome name="chevron-left" size={20} color="grey" />
        </View>
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.scrollViewContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>Register</Text>
              <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
              <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <DropDownPicker
                open={open}
                value={gender}
                items={[{ label: 'ชาย', value: 'ชาย' }, { label: 'หญิง', value: 'หญิง' }, { label: 'อื่นๆ', value: 'อื่นๆ' }]}
                setOpen={setOpen}
                setValue={setGender}
                placeholder="Gender"
                style={styles.inputpicker}
                dropDownContainerStyle={styles.dropdown}
                listItemContainerStyle={styles.listItem}
              />
              <View style={styles.birthdayContainer}>
                <TextInput style={styles.birthdayInput} placeholder="Day" keyboardType="numeric" maxLength={2} value={day} onChangeText={setDay} />
                <TextInput style={styles.birthdayInput} placeholder="Month" keyboardType="numeric" maxLength={2} value={month} onChangeText={setMonth} />
                <TextInput style={styles.birthdayInput} placeholder="Year" keyboardType="numeric" maxLength={4} value={year} onChangeText={setYear} />
              </View>
              <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  scrollViewContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  formContainer: {
    width: '100%',
    height: '85%',
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
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputpicker: {
    width: '90%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    marginBottom: 15,
    marginLeft: 16,
    backgroundColor: '#FFF',
  },
  dropdown: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginLeft: 16,
    maxHeight: 120,
  },
  listItem: {
    height: 35,
  },
  birthdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 15,
  },
  birthdayInput: {
    width: '30%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    backgroundColor: '#FFF',
    textAlign: 'center',
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
  registerButton: {
    width: '90%',
    padding: 15,
    backgroundColor: '#22B37A',
    borderRadius: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
