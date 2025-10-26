import React, {useState} from 'react';
import Swal from 'sweetalert2';
import {Shield} from 'lucide-react';

interface AdminAuthProps {
    onAuthenticate: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({onAuthenticate}) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // In a real application, this would be a secure password check
        if (password === 'NFCADMIN') {
            onAuthenticate();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Invalid admin password',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="flex items-center justify-center mb-6">
                    <Shield className="w-12 h-12 text-blue-600"/>
                </div>
                <h2 className="text-2xl font-bold text-center mb-6">Admin Authentication</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminAuth;