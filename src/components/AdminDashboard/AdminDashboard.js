import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css'; // This line is added here

const AdminDashboard = () => {
    const backendUrl = 'http://localhost:5000';

    // State for Module Management
    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState({
        title: '',
        description: '',
        credits: '',
        lecturer_id: '',
        pages: '',
        is_published: true // Default to published
    });
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [editingModule, setEditingModule] = useState({ ...newModule });

    // State for User Management
    const [users, setUsers] = useState([]);

    // State for Reports
    const [enrollmentStats, setEnrollmentStats] = useState([]);
    const [completionRates, setCompletionRates] = useState([]);
    const [revenueReport, setRevenueReport] = useState(null);

    // General UI states
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'users', 'reports'

    // Helper to clear messages after a delay
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000); // Clear messages after 5 seconds
    };

    useEffect(() => {
        fetchModules();
        fetchUsers();
        fetchReports();
    }, []);

    // --- Module Management Functions ---
    const fetchModules = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/admin/modules`);
            setModules(response.data);
        } catch (err) {
            console.error('Error fetching modules:', err);
            setError('Failed to fetch modules.');
        } finally {
            setLoading(false);
        }
    };

    const handleModuleInputChange = (e, setter) => {
        const { name, value, type, checked } = e.target;
        setter(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        if (!newModule.title || !newModule.credits || !newModule.lecturer_id || newModule.pages === '') {
            setError('Please fill in all required fields for the new module.');
            clearMessages();
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${backendUrl}/admin/modules`, newModule);
            setMessage('Module added successfully!');
            setNewModule({ title: '', description: '', credits: '', lecturer_id: '', pages: '', is_published: true });
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Add module error:', err);
            setError('Failed to add module: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleEditModule = (module) => {
        setEditingModuleId(module.id);
        setEditingModule({ ...module });
        clearMessages(); // Clear messages when starting an edit
    };

    const handleUpdateModule = async (e) => {
        e.preventDefault();
        if (!editingModule.title || !editingModule.credits || !editingModule.lecturer_id || editingModule.pages === '') {
            setError('Please fill in all required fields for updating the module.');
            clearMessages();
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.put(`${backendUrl}/admin/modules/${editingModuleId}`, editingModule);
            setMessage('Module updated successfully!');
            setEditingModuleId(null);
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Update module error:', err);
            setError('Failed to update module: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteModule = async (id) => {
        if (window.confirm('Are you sure you want to delete this module? This will also delete related enrollments!')) {
            setLoading(true);
            setError('');
            try {
                await axios.delete(`${backendUrl}/admin/modules/${id}`);
                setMessage('Module deleted successfully!');
                fetchModules();
                clearMessages();
            } catch (err) {
                console.error('Delete module error:', err);
                setError('Failed to delete module: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePublishToggle = async (moduleId, currentStatus) => {
        setLoading(true);
        setError('');
        try {
            await axios.put(`${backendUrl}/admin/modules/${moduleId}/publish`, { is_published: !currentStatus });
            setMessage(`Module ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Publish toggle error:', err);
            setError(`Failed to ${!currentStatus ? 'publish' : 'unpublish'} module: ` + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    const handleAssignInstructor = async (moduleId, currentLecturerId) => {
        // IMPORTANT: In a real app, use a custom modal instead of prompt.
        const newLecturerIdInput = prompt(`Enter new Lecturer ID for module ${moduleId}:`, currentLecturerId || '');
        
        // Handle null if user cancels the prompt
        if (newLecturerIdInput === null) {
            setMessage('Instructor assignment cancelled.');
            clearMessages();
            return;
        }

        const newLecturerId = parseInt(newLecturerIdInput);

        if (isNaN(newLecturerId)) {
            setError('Invalid Lecturer ID. Please enter a number.');
            clearMessages();
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            await axios.put(`${backendUrl}/admin/modules/${moduleId}/assign-instructor`, { lecturer_id: newLecturerId });
            setMessage('Instructor assigned successfully!');
            fetchModules();
            clearMessages();
        } catch (err) {
            console.error('Assign instructor error:', err);
            setError('Failed to assign instructor. Check if ID is valid and belongs to a lecturer: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // --- User Management Functions ---
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/admin/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteUser = async (userId, currentRole) => {
        // IMPORTANT: In a real app, use a custom modal instead of alert/confirm.
        if (currentRole === 'admin') {
            alert("Cannot change role of an Admin directly from here. Please manage admin roles directly in the database if necessary.");
            return;
        }

        const newRole = currentRole === 'lecturer' ? 'learner' : 'lecturer'; // Simple toggle for demo
        
        if (window.confirm(`Are you sure you want to change user ${userId}'s role to ${newRole}?`)) {
            setLoading(true);
            setError('');
            try {
                await axios.put(`${backendUrl}/admin/users/${userId}/promote`, { role: newRole });
                setMessage(`User role updated to ${newRole} successfully!`);
                fetchUsers();
                clearMessages();
            } catch (err) {
                console.error('Promote user error:', err);
                setError('Failed to update user role: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        // IMPORTANT: In a real app, use a custom modal instead of confirm.
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        
        if (window.confirm(`Are you sure you want to ${newStatus} user ${userId}?`)) {
            setLoading(true);
            setError('');
            try {
                await axios.put(`${backendUrl}/admin/users/${userId}/status`, { status: newStatus });
                setMessage(`User status set to ${newStatus} successfully!`);
                fetchUsers();
                clearMessages();
            } catch (err) {
                console.error('Toggle user status error:', err);
                setError('Failed to update user status: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteUser = async (id) => {
        // IMPORTANT: In a real app, use a custom modal instead of confirm.
        if (window.confirm('Are you sure you want to permanently delete this user and all their enrollments?')) {
            setLoading(true);
            setError('');
            try {
                await axios.delete(`${backendUrl}/admin/users/${id}`);
                setMessage('User deleted successfully!');
                fetchUsers();
                clearMessages();
            } catch (err) {
                console.error('Delete user error:', err);
                setError('Failed to delete user: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    // --- System Reports Functions ---
    const fetchReports = async () => {
        setLoading(true);
        setError('');
        try {
            const [enrollmentsRes, completionsRes, revenueRes] = await Promise.all([
                axios.get(`${backendUrl}/admin/reports/enrollments`),
                axios.get(`${backendUrl}/admin/reports/completion-rates`),
                axios.get(`${backendUrl}/admin/reports/revenue`) // Placeholder
            ]);
            setEnrollmentStats(enrollmentsRes.data);
            setCompletionRates(completionsRes.data);
            setRevenueReport(revenueRes.data);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to fetch reports.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Replaced inline style with className
        <div className="dashboard-container">
            <h1>Admin Dashboard</h1>
            <p>Welcome, Administrator!</p>

            {/* Replaced inline styles with classNames for messages */}
            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}
            {loading && <div className="loading-message">Loading...</div>}

            {/* Replaced inline style with className */}
            <div className="tab-navigation">
                <button
                    onClick={() => setActiveTab('modules')}
                    className={activeTab === 'modules' ? 'active' : ''}
                >
                    Module Management
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={activeTab === 'users' ? 'active' : ''}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={activeTab === 'reports' ? 'active' : ''}
                >
                    System Reports
                </button>
            </div>

            {/* Module Management Tab */}
            {activeTab === 'modules' && (
                <div className="module-management-section">
                    <h2>Module Management</h2>
                    <h3>Add New Module</h3>
                    {/* Replaced inline style with className */}
                    <form onSubmit={handleAddModule} className="module-form">
                        <input
                            name="title"
                            placeholder="Title"
                            value={newModule.title}
                            onChange={(e) => handleModuleInputChange(e, setNewModule)}
                            required
                            className="form-input"
                        /><br />
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={newModule.description}
                            onChange={(e) => handleModuleInputChange(e, setNewModule)}
                            className="form-textarea"
                        /><br />
                        <input
                            type="number"
                            name="credits"
                            placeholder="Credits"
                            value={newModule.credits}
                            onChange={(e) => handleModuleInputChange(e, setNewModule)}
                            required
                            className="form-input"
                        /><br />
                        <input
                            type="number"
                            name="lecturer_id"
                            placeholder="Lecturer ID"
                            value={newModule.lecturer_id}
                            onChange={(e) => handleModuleInputChange(e, setNewModule)}
                            required
                            className="form-input"
                        /><br />
                        <input
                            type="number"
                            name="pages"
                            placeholder="Number of Pages"
                            value={newModule.pages}
                            onChange={(e) => handleModuleInputChange(e, setNewModule)}
                            required
                            min="0"
                            className="form-input"
                        /><br />
                        {/* Replaced inline style with className */}
                        <label className="form-checkbox-label">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={newModule.is_published}
                                onChange={(e) => handleModuleInputChange(e, setNewModule)}
                            />
                            Published
                        </label><br />
                        {/* Replaced inline style with className */}
                        <button type="submit">Add Module</button>
                    </form>

                    <h3>Existing Modules</h3>
                    {loading && <p>Loading modules...</p>}
                    {!loading && modules.length > 0 ? (
                        // Replaced inline style with className
                        <table className="data-table">
                            <thead>
                                {/* Replaced inline style with className */}
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Credits</th>
                                    <th>Lecturer ID</th>
                                    <th>Pages</th>
                                    <th>Published</th>
                                    <th>Enrollments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map(module => (
                                    <tr key={module.id}>
                                        <td data-label="ID">{module.id}</td>
                                        <td data-label="Title">
                                            {editingModuleId === module.id ? (
                                                <input name="title" value={editingModule.title || ''} onChange={(e) => handleModuleInputChange(e, setEditingModule)} className="table-input" />
                                            ) : (
                                                module.title
                                            )}
                                        </td>
                                        <td data-label="Description">
                                            {editingModuleId === module.id ? (
                                                <textarea name="description" value={editingModule.description || ''} onChange={(e) => handleModuleInputChange(e, setEditingModule)} className="table-textarea" />
                                            ) : (
                                                module.description
                                            )}
                                        </td>
                                        <td data-label="Credits">
                                            {editingModuleId === module.id ? (
                                                <input type="number" name="credits" value={editingModule.credits || ''} onChange={(e) => handleModuleInputChange(e, setEditingModule)} className="table-input" />
                                            ) : (
                                                module.Credits
                                            )}
                                        </td>
                                        <td data-label="Lecturer ID">
                                            {editingModuleId === module.id ? (
                                                <input type="number" name="lecturer_id" value={editingModule.lecturer_id || ''} onChange={(e) => handleModuleInputChange(e, setEditingModule)} className="table-input" />
                                            ) : (
                                                module['Lecturer ID']
                                            )}
                                        </td>
                                        <td data-label="Pages">
                                            {editingModuleId === module.id ? (
                                                <input type="number" name="pages" value={editingModule.pages || ''} onChange={(e) => handleModuleInputChange(e, setEditingModule)} className="table-input" min="0" />
                                            ) : (
                                                module.pages
                                            )}
                                        </td>
                                        <td data-label="Published">
                                            {editingModuleId === module.id ? (
                                                <input type="checkbox" name="is_published" checked={editingModule.is_published} onChange={(e) => handleModuleInputChange(e, setEditingModule)} />
                                            ) : (
                                                module.is_published ? 'Yes' : 'No'
                                            )}
                                        </td>
                                        <td data-label="Enrollments">{module.enrollment_count}</td>
                                        <td data-label="Actions" className="actions-cell">
                                            {editingModuleId === module.id ? (
                                                <>
                                                    <button onClick={handleUpdateModule}>Save</button>
                                                    <button onClick={() => setEditingModuleId(null)} className="cancel-button">Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEditModule(module)} className="edit-button">Edit</button>
                                                    <button onClick={() => handleDeleteModule(module.id)} className="delete-button">Delete</button>
                                                    <button onClick={() => handlePublishToggle(module.id, module.is_published)} className={module.is_published ? 'unpublish-button' : 'publish-button'}>
                                                        {module.is_published ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <button onClick={() => handleAssignInstructor(module.id, module['Lecturer ID'])} className="assign-button">Assign Instructor</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        !loading && <p>No modules available.</p>
                    )}
                </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div className="user-management-section">
                    <h2>User Management</h2>
                    {loading && <p>Loading users...</p>}
                    {!loading && users.length > 0 ? (
                        // Replaced inline style with className
                        <table className="data-table">
                            <thead>
                                {/* Replaced inline style with className */}
                                <tr>
                                    <th>ID</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td data-label="ID">{user.id}</td>
                                        <td data-label="First Name">{user.firstname}</td>
                                        <td data-label="Last Name">{user.lastname}</td>
                                        <td data-label="Username">{user.username}</td>
                                        <td data-label="Email">{user.email}</td>
                                        <td data-label="Role">{user.role}</td>
                                        <td data-label="Status">{user.status}</td>
                                        <td data-label="Actions" className="actions-cell">
                                            {user.role !== 'admin' ? ( // Prevent admin from being promoted/disabled
                                                <>
                                                    <button onClick={() => handlePromoteUser(user.id, user.role)} className="promote-button">
                                                        {user.role === 'lecturer' ? 'Demote to Learner' : 'Promote to Lecturer'}
                                                    </button>
                                                    <button onClick={() => handleToggleUserStatus(user.id, user.status)} className={user.status === 'active' ? 'disable-button' : 'activate-button'}>
                                                        {user.status === 'active' ? 'Disable' : 'Activate'}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="delete-button">Delete</button>
                                                </>
                                            ) : (
                                                <span className="user-role-admin-tag">Admin Account</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        !loading && <p>No users available.</p>
                    )}
                </div>
            )}

            {/* System Reports Tab */}
            {activeTab === 'reports' && (
                <div className="reports-section">
                    <h2>System Reports</h2>
                    {loading && <p>Loading reports...</p>}
                    {!loading && (
                        <>
                            <h3>Enrollment Statistics</h3>
                            {enrollmentStats.length > 0 ? (
                                // Replaced inline style with className
                                <table className="data-table">
                                    <thead>
                                        {/* Replaced inline style with className */}
                                        <tr>
                                            <th>Course Title</th>
                                            <th>Total Enrollments</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollmentStats.map((stat, index) => (
                                            <tr key={index}>
                                                <td data-label="Course Title">{stat.course_title}</td>
                                                <td data-label="Total Enrollments">{stat.total_enrollments}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No enrollment statistics available.</p>
                            )}

                            {/* Replaced inline style with className */}
                            <h3 className="section-title" style={{ marginTop: '20px' }}>Module Completion Rates</h3>
                            {completionRates.length > 0 ? (
                                // Replaced inline style with className
                                <table className="data-table">
                                    <thead>
                                        {/* Replaced inline style with className */}
                                        <tr>
                                            <th>Course Title</th>
                                            <th>Total Enrollments</th>
                                            <th>Completed Enrollments</th>
                                            <th>Completion Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completionRates.map((rate, index) => (
                                            <tr key={index}>
                                                <td data-label="Course Title">{rate.course_title}</td>
                                                <td data-label="Total Enrollments">{rate.total_enrollments}</td>
                                                <td data-label="Completed Enrollments">{rate.completed_enrollments}</td>
                                                <td data-label="Completion Percentage">{rate.completion_percentage ? rate.completion_percentage.toFixed(2) : '0.00'}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No completion rates available.</p>
                            )}

                            {/* Replaced inline style with className */}
                            <h3 className="section-title">Revenue Reports (Placeholder)</h3>
                            <p>{revenueReport ? revenueReport.message : 'Loading revenue data...'}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;