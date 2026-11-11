import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import sidePanelImg from '../../assets/Images/login_side_panel.jpg';
import logoIcon from '../../assets/Images/logo_icon.jpg';
import Navbar from '../../PublicView/Navbar';
import Footer from '../../PublicView/Footer';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [role, setRole] = useState('Patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const { login, googleLogin, loading } = useAuth();
    const navigate = useNavigate();

    const roles = ['Patient', 'Doctor', 'Admin'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const loggedInUser = await login(email, password, role);
            navigate(`/${loggedInUser.role}/dashboard`);
        } catch (err) {
            setFormError(err.message || 'Failed to sign in. Please verify your credentials.');
        }
    };

    const handleGoogleSignIn = async () => {
        setFormError('');
        try {
            const loggedInUser = await googleLogin(role);
            navigate(`/${loggedInUser.role}/dashboard`);
        } catch (err) {
            setFormError(err.message || 'Google sign in failed.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Top Navbar */}
            <Navbar />

            {/* Main Login Split Section */}
            <main className="flex-1 flex flex-col md:flex-row border-b border-gray-100">
                {/* Left Banner Panel */}
                <div
                    className="relative md:w-1/2 min-h-[440px] md:min-h-[640px] flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-cover bg-center text-white rounded-3xl overflow-hidden shadow-lg my-6 md:my-8 ml-6 md:ml-12"
                    style={{ backgroundImage: `url(${sidePanelImg})` }}
                >

                    {/* Soft dark teal overlay for contrast */}
                    <div className="absolute inset-0 bg-emerald-950/40 backdrop-brightness-90" />

                    {/* Main Pitch */}
                    <div className="relative z-10 max-w-md my-auto py-10">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                            Healthcare, <br />
                            made easy.
                        </h2>
                        <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed">
                            Check your symptoms, book a doctor, and keep all your
                            reports in one secure place.
                        </p>
                    </div>

                    {/* Disclaimer Note */}
                    <div className="relative z-10 text-xs text-emerald-100/80 pt-4">
                        All data is encrypted and stored securely. HealthConnect is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gray-50/30">
                    <div className="w-full max-w-md">
                        {/* Welcome Heading */}
                        <div className="mb-6">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                Welcome back
                            </h1>
                            <p className="text-sm text-gray-500">
                                Sign in to continue to your dashboard.
                            </p>
                        </div>

                        {/* Role Segmented Switcher */}
                        <div className="bg-white border border-gray-200 rounded-full p-1 flex mb-6 shadow-xs">
                            {roles.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setRole(item)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${role === item
                                            ? 'bg-[#3b8f72] text-white shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        {/* Error Message */}
                        {formError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                {formError}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                    EMAIL
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                    PASSWORD
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full px-4 py-2.5 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <HiOutlineEyeOff className="w-5 h-5" />
                                        ) : (
                                            <HiOutlineEye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => alert(`Password reset instructions will be sent to: ${email || 'your email'}`)}
                                    className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer bg-transparent border-0 p-0"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-[#3b8f72] hover:bg-[#327a61] text-white font-medium rounded-xl text-sm shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6 text-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <span className="relative bg-gray-50/50 px-3 text-xs text-gray-400">
                                or
                            </span>
                        </div>

                        {/* Google Sign In */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={role === 'Admin' || loading}
                            title={role === 'Admin' ? 'OAuth prohibited for Admin accounts' : 'Sign in with Google'}
                            className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <FcGoogle className="w-5 h-5" />
                            <span>{role === 'Admin' ? 'Google OAuth Blocked for Admin' : 'Sign in with Google'}</span>
                        </button>

                        {/* Register Footer Link */}
                        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Login;