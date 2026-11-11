import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import sidePanelImg from '../../assets/Images/login_side_panel.jpg';
import Navbar from '../../PublicView/Navbar';
import Footer from '../../PublicView/Footer';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [role, setRole] = useState('Patient');
    const roles = ['Patient', 'Doctor', 'Admin'];

    // Common fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);
    const [formError, setFormError] = useState('');

    // Patient specific
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');

    // Doctor specific
    const [bmdcNumber, setBmdcNumber] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [hospital, setHospital] = useState('');

    // Admin specific
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('');
    const [adminAccessKey, setAdminAccessKey] = useState('');

    const { register, googleLogin, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (password !== confirmPassword) {
            setFormError('Passwords do not match. Please re-enter your password.');
            return;
        }

        if (role === 'Admin' && adminAccessKey !== 'HC-ADMIN-ROOT-2026') {
            setFormError('Invalid Administrator Access Key. Administrative enrollment requires verified authorization.');
            return;
        }

        try {
            const newUser = await register({
                name,
                email,
                password,
                role: role.toLowerCase(),
                extra: {
                    phoneNumber: phone,
                    gender,
                    bmdcNumber,
                    specialty: specialty || 'General Physician',
                    hospital,
                    department,
                },
            });
            navigate(`/${newUser.role}/dashboard`);
        } catch (err) {
            setFormError(err.message || 'Registration failed. Please check inputs.');
        }
    };

    const handleGoogleSignUp = async () => {
        setFormError('');
        try {
            const newUser = await googleLogin(role.toLowerCase());
            navigate(`/${newUser.role}/dashboard`);
        } catch (err) {
            setFormError(err.message || 'Google sign up failed.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Top Navbar */}
            <Navbar />

            {/* Main Register Split Section */}
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
                                Create an account
                            </h1>
                            <p className="text-sm text-gray-500">
                                Register as a {role.toLowerCase()} to get started.
                            </p>
                        </div>

                        {/* Role Segmented Switcher */}
                        <div className="bg-white border border-gray-200 rounded-full p-1 flex mb-6 shadow-xs">
                            {roles.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setRole(item)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                                        role === item
                                            ? 'bg-[#3b8f72] text-white shadow-xs'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        {/* Error Alert */}
                        {formError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                {formError}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                    {role === 'Doctor' ? 'DOCTOR FULL NAME' : 'FULL NAME'}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={role === 'Doctor' ? 'Dr. Sarah Ahmed' : 'Nibir Ahmed'}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                    {role === 'Admin' ? 'OFFICIAL WORK EMAIL' : 'EMAIL'}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={role === 'Admin' ? 'admin@hospital.org' : 'nibir@example.com'}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Patient-specific fields */}
                            {role === 'Patient' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                            PHONE NUMBER
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+880 1700-000000"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                            GENDER
                                        </label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Doctor-specific fields */}
                            {role === 'Doctor' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                                LICENSE / BMDC NO.
                                            </label>
                                            <input
                                                type="text"
                                                value={bmdcNumber}
                                                onChange={(e) => setBmdcNumber(e.target.value)}
                                                placeholder="BMDC-A-12345"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                                SPECIALTY
                                            </label>
                                            <input
                                                type="text"
                                                value={specialty}
                                                onChange={(e) => setSpecialty(e.target.value)}
                                                placeholder="e.g. Cardiology, Medicine"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                            HOSPITAL / CLINIC
                                        </label>
                                        <input
                                            type="text"
                                            value={hospital}
                                            onChange={(e) => setHospital(e.target.value)}
                                            placeholder="Dhaka Medical College Hospital"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Admin-specific fields */}
                            {role === 'Admin' && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                                EMPLOYEE ID
                                            </label>
                                            <input
                                                type="text"
                                                value={employeeId}
                                                onChange={(e) => setEmployeeId(e.target.value)}
                                                placeholder="EMP-99201"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                                DEPARTMENT
                                            </label>
                                            <input
                                                type="text"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                placeholder="Hospital Operations"
                                                required
                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                            ADMIN AUTHORIZATION KEY
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showAdminKey ? 'text' : 'password'}
                                                value={adminAccessKey}
                                                onChange={(e) => setAdminAccessKey(e.target.value)}
                                                placeholder="••••••••••••"
                                                required
                                                className="w-full px-4 py-2.5 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowAdminKey(!showAdminKey)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                                aria-label={showAdminKey ? 'Hide key' : 'Show key'}
                                            >
                                                {showAdminKey ? (
                                                    <HiOutlineEyeOff className="w-5 h-5" />
                                                ) : (
                                                    <HiOutlineEye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Password & Confirm Password */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                        CONFIRM
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full px-4 py-2.5 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? (
                                                <HiOutlineEyeOff className="w-5 h-5" />
                                            ) : (
                                                <HiOutlineEye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-[#3b8f72] hover:bg-[#327a61] text-white font-medium rounded-xl text-sm shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer mt-2"
                            >
                                Register as {role}
                            </button>
                        </form>

                        {/* Divider & Google sign up for Patients */}
                        {role === 'Patient' && (
                            <>
                                <div className="relative my-5 text-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200" />
                                    </div>
                                    <span className="relative bg-gray-50/50 px-3 text-xs text-gray-400">
                                        or
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleSignUp}
                                    disabled={loading}
                                    className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <FcGoogle className="w-5 h-5" />
                                    <span>Sign up with Google</span>
                                </button>
                            </>
                        )}

                        {/* Sign in Footer Link */}
                        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                Sign in
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

export default Register;