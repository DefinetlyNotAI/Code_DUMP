import {useState} from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import AdminAuth from './components/AdminAuth.tsx';
import Dashboard from './components/Dashboard.tsx';
import UserList from './components/UserList.tsx';
import Navbar from './components/Navbar.tsx';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return <AdminAuth onAuthenticate={() => setIsAuthenticated(true)}/>;
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-100">
                <Navbar/>
                <div className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<Dashboard/>}/>
                        <Route path="/list" element={<UserList/>}/>
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;