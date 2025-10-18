// Quick Reference: Screen Navigation in BusBuddy

// ============================================
// IMPORT NAVIGATION HOOK
// ============================================
import { useNavigation } from '@react-navigation/native';

// ============================================
// IMPORT AUTH HOOK
// ============================================
import { useAuth } from '../contexts/AuthContext';

// ============================================
// SCREEN NAMES (use these to avoid typos)
// ============================================
export const SCREENS = {
  // Auth Screens
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Screens (TODO: add as you create them)
  // HOME: 'Home',
  // PROFILE: 'Profile',
  // SEARCH: 'Search',
};

// ============================================
// NAVIGATION EXAMPLES
// ============================================

// Example 1: Basic Navigation
const Example1 = () => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity onPress={() => navigation.navigate(SCREENS.LOGIN)}>
      <Text>Go to Login</Text>
    </TouchableOpacity>
  );
};

// Example 2: Navigation with Parameters
const Example2 = () => {
  const navigation = useNavigation();
  
  const goToProfile = () => {
    navigation.navigate('Profile', {
      userId: 123,
      userName: 'John Doe'
    });
  };
  
  return <Button title="View Profile" onPress={goToProfile} />;
};

// Example 3: Go Back
const Example3 = () => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Text>← Go Back</Text>
    </TouchableOpacity>
  );
};

// Example 4: Access Route Parameters
const Example4 = ({ route }) => {
  const { userId, userName } = route.params;
  
  return (
    <View>
      <Text>User ID: {userId}</Text>
      <Text>Name: {userName}</Text>
    </View>
  );
};

// ============================================
// AUTHENTICATION EXAMPLES
// ============================================

// Example 5: Login Function
const LoginExample = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      // Call your API
      const response = await fetch('https://api.example.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      // Save user data and token
      // This automatically navigates to main app
      await login(data.user, data.token);
      
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    }
  };
  
  return <Button title="Login" onPress={handleLogin} />;
};

// Example 6: Signup Function
const SignupExample = () => {
  const { signup } = useAuth();
  
  const handleSignup = async () => {
    try {
      // Call your API
      const response = await fetch('https://api.example.com/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* user data */ }),
      });
      
      const data = await response.json();
      
      // Save user and auto-login
      await signup(data.user, data.token);
      
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
    }
  };
  
  return <Button title="Sign Up" onPress={handleSignup} />;
};

// Example 7: Logout Function
const LogoutExample = () => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      // Optional: Call API to invalidate token
      // await fetch('https://api.example.com/logout');
      
      // Clear local auth data
      // This automatically navigates to login screen
      await logout();
      
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };
  
  return <Button title="Logout" onPress={handleLogout} />;
};

// Example 8: Check Auth Status
const AuthCheckExample = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <ActivityIndicator />;
  }
  
  if (!isAuthenticated) {
    return <Text>Please login</Text>;
  }
  
  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Text>Email: {user.email}</Text>
    </View>
  );
};

// Example 9: Update User Data
const UpdateUserExample = () => {
  const { user, updateUser } = useAuth();
  
  const handleUpdate = async () => {
    try {
      // Call API to update user
      const response = await fetch('https://api.example.com/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });
      
      const updatedUser = await response.json();
      
      // Update local user data
      await updateUser(updatedUser);
      
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', 'Update failed');
    }
  };
  
  return <Button title="Update Profile" onPress={handleUpdate} />;
};

// ============================================
// NAVIGATION OPTIONS
// ============================================

// Example 10: Custom Navigation Options
const ScreenWithOptions = () => {
  const navigation = useNavigation();
  
  useEffect(() => {
    navigation.setOptions({
      title: 'Custom Title',
      headerShown: true,
      headerStyle: {
        backgroundColor: '#9B7EDE',
      },
      headerTintColor: '#fff',
    });
  }, []);
  
  return <View>{/* Screen content */}</View>;
};

// ============================================
// COMMON PATTERNS
// ============================================

// Pattern 1: Protected Screen (requires auth)
const ProtectedScreen = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate(SCREENS.LOGIN);
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated) return null;
  
  return <View>{/* Protected content */}</View>;
};

// Pattern 2: Redirect after action
const RedirectExample = () => {
  const navigation = useNavigation();
  
  const handleAction = async () => {
    // Do something...
    await someAsyncOperation();
    
    // Redirect to another screen
    navigation.navigate(SCREENS.LOGIN);
  };
  
  return <Button title="Do Action" onPress={handleAction} />;
};

// Pattern 3: Conditional navigation
const ConditionalNavigationExample = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (isAuthenticated) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate(SCREENS.LOGIN);
    }
  };
  
  return <Button title="View Profile" onPress={handlePress} />;
};

// ============================================
// USEFUL NAVIGATION METHODS
// ============================================

/*
navigation.navigate(screenName, params)  - Go to screen
navigation.goBack()                      - Go back one screen
navigation.popToTop()                    - Go to first screen in stack
navigation.reset({...})                  - Reset navigation state
navigation.replace(screenName)           - Replace current screen
navigation.push(screenName)              - Push new screen (allows duplicates)
navigation.canGoBack()                   - Check if can go back
navigation.setOptions({...})             - Update screen options
*/

// ============================================
// USEFUL AUTH METHODS
// ============================================

/*
const { 
  user,                    - Current user object
  isAuthenticated,         - Boolean: is user logged in?
  isLoading,               - Boolean: is auth check in progress?
  login(user, token),      - Log user in
  signup(user, token),     - Register and log in
  logout(),                - Log user out
  updateUser(userData),    - Update user data
  checkAuthStatus(),       - Recheck auth status
} = useAuth();
*/

export default {
  SCREENS,
  // Export any helper functions here
};
