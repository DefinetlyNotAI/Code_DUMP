import React, {useEffect, useState} from 'react';
import Swal from 'sweetalert2';
import {Database, DollarSign, FileDown, History, Search, ShoppingCart, UserPlus} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';

const Dashboard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [uuid, setUuid] = useState(searchParams.get('uuid') || '');
    const [newName, setNewName] = useState('');
    const [itemBought, setItemBought] = useState('');
    const [receiptId, setReceiptId] = useState('');
    const [cost, setCost] = useState('');
    const [gainAmount, setGainAmount] = useState('');
    const [gainReason, setGainReason] = useState('');
    const [bulkNames, setBulkNames] = useState('');
    const [initialBalance, setInitialBalance] = useState('0');
    const [createdUsers, setCreatedUsers] = useState<Array<{ name: string; uuid: string }>>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ uuid: string; name: string; scraps: number }>>([]);
    const [transactions, setTransactions] = useState<Array<{ timestamp: string; log: string }>>([]);
    const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
    const [batchAmount, setBatchAmount] = useState('');
    const [batchReason, setBatchReason] = useState('');

    // Effect to load transactions when UUID is provided in URL
    useEffect(() => {
        if (uuid) {
            handleViewTransactions();
        }
    }, [uuid]);

    const handleModifyName = async () => {
        try {
            const response = await fetch('/api/modify-name', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({uuid, newName}),
            });

            if (!response.ok) throw new Error('Failed to modify name');

            await Swal.fire({
                icon: 'success',
                title: 'Name Updated',
                text: 'The user\'s name has been successfully updated.',
            });
        } catch (error) {
            console.log(error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update name. Please try again.',
            });
        }
    };

    const handleBuyItem = async () => {
        try {
            const response = await fetch('/api/buy', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({uuid, itemBought, receiptId, cost}),
            });

            if (!response.ok) throw new Error('Failed to process purchase');

            await Swal.fire({
                icon: 'success',
                title: 'Purchase Successful',
                text: 'The transaction has been processed successfully.',
            });
        } catch (error) {
            console.log(error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to process purchase. Please check the balance and try again.',
            });
        }
    };

    const handleGainMoney = async () => {
        try {
            const response = await fetch('/api/gain-money', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({uuid, amount: gainAmount, reason: gainReason}),
            });

            if (!response.ok) throw new Error('Failed to add money');

            await Swal.fire({
                icon: 'success',
                title: 'Money Added',
                text: 'The amount has been successfully added to the user\'s balance.',
            });
        } catch (error) {
            console.log(error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to add money. Please try again.',
            });
        }
    };

    const handleBulkCreate = async () => {
        try {
            const names = bulkNames.split(',').map(name => name.trim()).filter(name => name);

            if (names.length === 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please enter at least one name.',
                });
                return;
            }

            const response = await fetch('/api/create-users', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({names, initialBalance: parseInt(initialBalance)}),
            });

            if (!response.ok) throw new Error('Failed to create users');

            const result = await response.json();
            setCreatedUsers(result.users);
            setBulkNames('');

            await Swal.fire({
                icon: 'success',
                title: 'Users Created',
                text: `Successfully created ${result.users.length} users.`,
            });
        } catch (error) {
            console.log(error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed to create users. Please try again.`,
            });
        }
    };

    const handleSearch = async () => {
        try {
            const response = await fetch(`/api/search-users?term=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('Failed to search users');
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.log(error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to search users. Please try again.',
            });
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch('/api/export-users');
            if (!response.ok) throw new Error('Failed to export users');
            const data = await response.json();

            const csv = [
                ['UUID', 'Name', 'Balance'],
                ...data.map((user: any) => [user.uuid, user.name, user.scraps])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.log(error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to export users. Please try again.',
            });
        }
    };

    const handleViewTransactions = async () => {
        try {
            const response = await fetch(`/api/transactions/${uuid}`);
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.log(error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch transactions. Please try again.',
            });
        }
    };

    const handleBatchOperation = async () => {
        if (selectedUuids.length === 0) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please select at least one user.',
            });
            return;
        }

        try {
            const response = await fetch('/api/batch-money', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    uuids: selectedUuids,
                    amount: parseInt(batchAmount),
                    reason: batchReason
                }),
            });

            if (!response.ok) throw new Error('Failed to process batch operation');

            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Updated balance for ${selectedUuids.length} users.`,
            });

            setSelectedUuids([]);
            setBatchAmount('');
            setBatchReason('');
        } catch (error) {
            console.log(error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to process batch operation. Please try again.',
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Search Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Search className="w-6 h-6 mr-2"/>
                    Search Users
                </h2>
                <div className="flex space-x-4 mb-6">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Search by name or UUID"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Search
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        <FileDown className="w-4 h-4 mr-2"/>
                        Export All
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                            <tr>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Select</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Name</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">UUID</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Balance</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {searchResults.map((user) => (
                                <tr key={user.uuid}>
                                    <td className="py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedUuids.includes(user.uuid)}
                                            onChange={(e) => {
                                                setSelectedUuids(prev =>
                                                    e.target.checked
                                                        ? [...prev, user.uuid]
                                                        : prev.filter(id => id !== user.uuid)
                                                );
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="py-2 text-sm text-gray-900">{user.name}</td>
                                    <td className="py-2 text-sm text-gray-500 font-mono">{user.uuid}</td>
                                    <td className="py-2 text-sm text-gray-900">{user.scraps}</td>
                                    <td className="py-2">
                                        <a
                                            href={`/?uuid=${user.uuid}`}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            View Details
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedUuids.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Batch Operation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="number"
                                value={batchAmount}
                                onChange={(e) => setBatchAmount(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Amount"
                            />
                            <input
                                type="text"
                                value={batchReason}
                                onChange={(e) => setBatchReason(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Reason"
                            />
                            <button
                                onClick={handleBatchOperation}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                            >
                                Update Selected ({selectedUuids.length})
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Create Users Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <UserPlus className="w-6 h-6 mr-2"/>
                    Bulk Create Users
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Names (comma-separated)
                        </label>
                        <textarea
                            value={bulkNames}
                            onChange={(e) => setBulkNames(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                            placeholder="John Doe, Jane Smith, Mike Johnson"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Balance
                        </label>
                        <input
                            type="number"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="0"
                        />
                    </div>
                    <button
                        onClick={handleBulkCreate}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
                    >
                        Create Users
                    </button>
                </div>

                {createdUsers.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Created Users</h3>
                        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                <tr>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Name</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">UUID</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {createdUsers.map((user, index) => (
                                    <tr key={index}>
                                        <td className="py-2 text-sm text-gray-900">{user.name}</td>
                                        <td className="py-2 text-sm text-gray-500 font-mono">{user.uuid}</td>
                                        <td className="py-2">
                                            <a
                                                href={`/?uuid=${user.uuid}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View Details
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* User Management Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Database className="w-6 h-6 mr-2"/>
                    User Management
                </h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">UUID</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={uuid}
                            onChange={(e) => setUuid(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Enter UUID"
                        />
                        <button
                            onClick={handleViewTransactions}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                        >
                            <History className="w-4 h-4 mr-2"/>
                            History
                        </button>
                    </div>
                </div>

                {transactions.length > 0 && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                        <table className="min-w-full">
                            <thead>
                            <tr>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Timestamp</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Action</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {transactions.map((transaction, index) => (
                                <tr key={index}>
                                    <td className="py-2 text-sm text-gray-500">{new Date(transaction.timestamp).toLocaleString()}</td>
                                    <td className="py-2 text-sm text-gray-900">{transaction.log}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Modify Name Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Modify Name</h3>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                            placeholder="New Name"
                        />
                        <button
                            onClick={handleModifyName}
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                        >
                            Update Name
                        </button>
                    </div>

                    {/* Buy Item Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2"/>
                            Buy Item
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={itemBought}
                                onChange={(e) => setItemBought(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Item Name"
                            />
                            <input
                                type="text"
                                value={receiptId}
                                onChange={(e) => setReceiptId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Receipt ID"
                            />
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Cost"
                            />
                            <button
                                onClick={handleBuyItem}
                                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                            >
                                Process Purchase
                            </button>
                        </div>
                    </div>

                    {/* Gain Money Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2"/>
                            Add Money
                        </h3>
                        <div className="space-y-4">
                            <input
                                type="number"
                                value={gainAmount}
                                onChange={(e) => setGainAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Amount"
                            />
                            <input
                                type="text"
                                value={gainReason}
                                onChange={(e) => setGainReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Reason"
                            />
                            <button
                                onClick={handleGainMoney}
                                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
                            >
                                Add Money
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;