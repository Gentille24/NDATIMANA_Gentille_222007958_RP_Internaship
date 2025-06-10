import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdOutlineLockPerson,
    MdDriveFileRenameOutline, // Corrected import
    MdAttachEmail,
} from 'react-icons/md';
import {
    FaUserShield,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserCog, // Icon for Admin
} from 'react-icons/fa';
import './LoginRegister.css'; // Ensure your CSS file is correctly styled for these elements

const LoginRegister = () => {
    const [formType, setFormType] = useState('login'); // 'login', 'register', 'reset'
    const [role, setRole] = useState('learner'); // Default role for registration
    const [successMessage, setSuccessMessage] = useState(''); // For success messages
    const [errorMessage, setErrorMessage] = useState(''); // For error messages

    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [resetEmail, setResetEmail] = useState('');
    const [registerData, setRegisterData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        password: '',
    });

    const navigate = useNavigate();

    // Helper to clear messages
    const clearMessages = () => {
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleChange = (e, type = 'register') => {
        const { name, value } = e.target;
        if (type === 'register') {
            setRegisterData({ ...registerData, [name]: value });
        } else {
            setLoginData({ ...loginData, [name]: value });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        clearMessages(); // Clear previous messages

        // Basic client-side validation
        if (!registerData.firstname || !registerData.lastname || !registerData.username || !registerData.email || !registerData.password) {
            setErrorMessage('All fields are required for registration.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/registration', { // Ensure this matches your backend registration endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...registerData, role }), // Send the selected role
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Registration successful! Please log in.');
                setFormType('login'); // Switch to login form after successful registration
                // Clear registration form data
                setRegisterData({
                    firstname: '',
                    lastname: '',
                    username: '',
                    email: '',
                    password: '',
                });
            } else {
                setErrorMessage('Registration failed: ' + (data.error || 'Unknown error.'));
            }
        } catch (err) {
            console.error('Registration network error:', err);
            setErrorMessage('Registration failed: Network or server error. Please try again later.');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        clearMessages(); // Clear previous messages

        // Basic client-side validation
        if (!loginData.username || !loginData.password) {
            setErrorMessage('Username and password are required.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/login', { // Ensure this matches your backend login endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Login successful!');
                // Store user role, username, and crucially, userId
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('username', data.username);
                // IMPORTANT: Save the userId to localStorage
                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                    console.log('User ID saved to localStorage:', data.userId); // For debugging
                } else {
                    console.warn('Login response did not contain userId.'); // Warn if userId is missing
                    setErrorMessage('Login successful, but user data incomplete. Please contact support.');
                    return; // Prevent navigation if critical data is missing
                }

                // Navigate to the appropriate dashboard based on the role from the backend
                // The backend sends 'admin', 'lecturer', or 'learner'
                navigate(`/dashboard/${data.role || 'default'}`); // Ensure your App.js handles these routes
            } else {
                setErrorMessage(data.error || 'Invalid credentials. Please check your username and password.');
            }
        } catch (err) {
            console.error('Login network error:', err);
            setErrorMessage('Login failed: Network or server error. Please try again later.');
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        clearMessages(); // Clear previous messages

        // Basic client-side validation
        if (!resetEmail) {
            setErrorMessage('Please enter your email address.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/reset', { // Ensure this matches your backend reset endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage(data.message);
                setFormType('login'); // Redirect to login after reset request
                setResetEmail('');
            } else {
                setErrorMessage('Password reset failed: ' + (data.error || 'Failed to send reset link.'));
            }
        } catch (err) {
            console.error('Reset network error:', err);
            setErrorMessage('Password reset failed: Network or server error. Please try again later.');
        }
    };

    // Reusable InputField component
    const InputField = ({ type = 'text', name, placeholder, value, icon, onChange }) => (
        <div className="input-box">
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                required
                value={value}
                onChange={
                    onChange || // Use custom onChange if provided (e.g., for resetEmail)
                    ((e) => handleChange(e, formType === 'login' ? 'login' : 'register'))
                }
            />
            {icon}
        </div>
    );

    return (
        <div className="wrapper">
            {formType === 'login' && (
                <div className="form-box login">
                    <form onSubmit={handleLogin}>
                        <h1>LOGIN</h1>
                        {successMessage && <p className="status-message success">{successMessage}</p>}
                        {errorMessage && <p className="status-message error">{errorMessage}</p>}

                        <InputField
                            name="username"
                            placeholder="Username"
                            value={loginData.username}
                            icon={<FaUserShield className="icon" />}
                        />
                        <InputField
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={loginData.password}
                            icon={<MdOutlineLockPerson className="icon" />}
                        />
                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" /> Remember Me
                            </label>
                            <button type="button" onClick={() => { setFormType('reset'); clearMessages(); }}>
                                Forgot password?
                            </button>
                        </div>
                        <button type="submit">Login</button>
                        <div className="register-link">
                            <p>
                                Don’t have an account?{' '}
                                <button type="button" onClick={() => { setFormType('register'); clearMessages(); }}>
                                    Register
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {formType === 'register' && (
                <div className="form-box register">
                    <form onSubmit={handleRegister}>
                        <h1>REGISTRATION</h1>
                        {successMessage && <p className="status-message success">{successMessage}</p>}
                        {errorMessage && <p className="status-message error">{errorMessage}</p>}

                        {['firstname', 'lastname', 'username', 'email', 'password'].map((field) => (
                            <InputField
                                key={field}
                                name={field}
                                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                value={registerData[field]}
                                icon={{
                                    firstname: <MdDriveFileRenameOutline className="icon" />,
                                    lastname: <MdDriveFileRenameOutline className="icon" />,
                                    username: <FaUserShield className="icon" />,
                                    email: <MdAttachEmail className="icon" />,
                                    password: <MdOutlineLockPerson className="icon" />,
                                }[field]}
                            />
                        ))}

                        <div className="role-selection">
                            {/* Corrected role values to match backend: 'learner', 'lecturer', 'admin' */}
                            {[
                                { key: 'learner', label: 'Learner', icon: <FaUserGraduate /> },
                                { key: 'lecturer', label: 'Lecturer', icon: <FaChalkboardTeacher /> },
                                { key: 'admin', label: 'Admin', icon: <FaUserCog /> },
                            ].map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={role === key ? 'active' : ''}
                                    onClick={() => setRole(key)}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>

                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" required /> I agree to terms and conditions
                            </label>
                        </div>

                        <button type="submit">Register</button>
                        <div className="register-link">
                            <p>
                                Already have an account?{' '}
                                <button type="button" onClick={() => { setFormType('login'); clearMessages(); }}>
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {formType === 'reset' && (
                <div className="form-box reset">
                    <form onSubmit={handleReset}>
                        <h1>RESET PASSWORD</h1>
                        {successMessage && <p className="status-message success">{successMessage}</p>}
                        {errorMessage && <p className="status-message error">{errorMessage}</p>}

                        <InputField
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={resetEmail}
                            icon={<MdAttachEmail className="icon" />}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                        <button type="submit">Send Reset Link</button>
                        <div className="register-link">
                            <p>
                                Remembered your password?{' '}
                                <button type="button" onClick={() => { setFormType('login'); clearMessages(); }}>
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default LoginRegister;
