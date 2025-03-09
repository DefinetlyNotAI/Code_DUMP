import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Home, Users} from 'lucide-react';

const Navbar: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link
                            to="/"
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                                location.pathname === '/'
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                        >
                            <Home className="w-5 h-5"/>
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            to="/list"
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                                location.pathname === '/list'
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                        >
                            <Users className="w-5 h-5"/>
                            <span>User List</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;