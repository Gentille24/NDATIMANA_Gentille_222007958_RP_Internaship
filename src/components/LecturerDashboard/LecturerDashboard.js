import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LecturerDashboard.css'; // Import the new CSS file

const LecturerDashboard = () => {
    // State to store the list of courses fetched from the backend
    const [courses, setCourses] = useState([]);
    // State for the form to add a new course
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        credits: '',
        lecturer_id: '',
        pages: '' // Added 'pages' field
    });
    // State to track the ID of the course being edited
    const [editingCourseId, setEditingCourseId] = useState(null);
    // State to hold the data of the course being edited
    const [editingCourse, setEditingCourse] = useState({ ...newCourse }); // Initialize with the structure of newCourse
    // State for displaying success messages to the user
    const [message, setMessage] = useState('');
    // State for displaying error messages to the user
    const [error, setError] = useState('');
    // State to indicate if data is currently being loaded
    const [loading, setLoading] = useState(false);

    // Base URL of your backend API
    const backendUrl = 'http://localhost:5000';

    // Helper to clear messages after a delay
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000); // Clear messages after 5 seconds
    };

    // useEffect hook to fetch courses when the component mounts
    useEffect(() => {
        fetchCourses();
    }, []);

    // Function to fetch the list of courses from the backend
    const fetchCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/courses`);
            setCourses(response.data);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to fetch courses.');
        } finally {
            setLoading(false);
        }
    };

    // Generic handler for input changes in forms
    const handleInputChange = (e, setter) => {
        const { name, value } = e.target;
        setter(prev => ({ ...prev, [name]: value }));
    };

    // Handler for adding a new course
    const handleAddCourse = async (e) => {
        e.preventDefault();
        clearMessages();
        // Basic client-side validation for required fields
        if (!newCourse.title || !newCourse.credits || !newCourse.lecturer_id || !newCourse.pages) {
            setError('Please fill in all required fields (Title, Credits, Lecturer ID, Pages).');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.post(`${backendUrl}/courses`, newCourse);
            setMessage('Course added successfully!');
            setNewCourse({ title: '', description: '', credits: '', lecturer_id: '', pages: '' }); // Reset the form
            fetchCourses(); // Refresh the course list
            clearMessages();
        } catch (err) {
            console.error('Add error:', err);
            setError('Failed to add course: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // Handler to set a course for editing
    const handleEditCourse = (course) => {
        setEditingCourseId(course.id);
        setEditingCourse({ ...course }); // Populate the edit form with course data
        clearMessages();
    };

    // Handler for updating an existing course
    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        clearMessages();
        // Basic client-side validation for required fields
        if (!editingCourse.title || !editingCourse.credits || !editingCourse.lecturer_id || !editingCourse.pages) {
            setError('Please fill in all required fields for editing (Title, Credits, Lecturer ID, Pages).');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await axios.put(`${backendUrl}/courses/${editingCourseId}`, editingCourse);
            setMessage('Course updated successfully!');
            setEditingCourseId(null); // Clear the editing state
            fetchCourses(); // Refresh the course list
            clearMessages();
        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update course: ' + (err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // Handler for deleting a course
    const handleDeleteCourse = async (id) => {
        // IMPORTANT: Replace window.confirm with a custom modal UI in a real application
        if (window.confirm('Are you sure you want to delete this course?')) {
            setLoading(true);
            setError('');
            try {
                await axios.delete(`${backendUrl}/courses/${id}`);
                setMessage('Course deleted successfully!');
                fetchCourses(); // Refresh the course list
                clearMessages();
            } catch (err) {
                console.error('Delete error:', err);
                setError('Failed to delete course: ' + (err.response?.data?.error || 'Server error.'));
                clearMessages();
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="lecturer-dashboard-container">
            <h1>Lecturer Dashboard</h1>
            <p>Welcome, Lecturer!</p>

            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}
            {loading && <div className="loading-message">Loading...</div>}

            <div className="add-course-section">
                <h2>Add New Course</h2>
                <form onSubmit={handleAddCourse} className="course-form">
                    <input
                        name="title"
                        placeholder="Course Title"
                        value={newCourse.title}
                        onChange={(e) => handleInputChange(e, setNewCourse)}
                        required
                        className="form-input"
                    /><br />
                    <textarea
                        name="description"
                        placeholder="Course Description"
                        value={newCourse.description}
                        onChange={(e) => handleInputChange(e, setNewCourse)}
                        className="form-textarea"
                    /><br />
                    <input
                        type="number"
                        name="credits"
                        placeholder="Credits (e.g., 3)"
                        value={newCourse.credits}
                        onChange={(e) => handleInputChange(e, setNewCourse)}
                        required
                        className="form-input"
                    /><br />
                    <input
                        type="number"
                        name="lecturer_id"
                        placeholder="Your Lecturer ID"
                        value={newCourse.lecturer_id}
                        onChange={(e) => handleInputChange(e, setNewCourse)}
                        required
                        className="form-input"
                    /><br />
                    <input
                        type="number"
                        name="pages"
                        placeholder="Number of Pages (e.g., 50)"
                        value={newCourse.pages}
                        onChange={(e) => handleInputChange(e, setNewCourse)}
                        required
                        min="1" // Ensure at least 1 page
                        className="form-input"
                    /><br />
                    <button type="submit" className="add-course-button">Add Course</button>
                </form>
            </div>

            <div className="course-list-section">
                <h2>Course List</h2>
                {loading && <p>Loading courses...</p>}
                {!loading && courses.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Credits</th>
                                <th>Lecturer ID</th>
                                <th>Pages</th> {/* Added Pages column header */}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(course => (
                                <tr key={course.id}>
                                    {/* Display fields for viewing or editing */}
                                    <td data-label="Title">
                                        {editingCourseId === course.id ? (
                                            <input
                                                type="text"
                                                name="title"
                                                value={editingCourse.title || ''}
                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                className="table-input"
                                            />
                                        ) : (
                                            course.title
                                        )}
                                    </td>
                                    <td data-label="Description">
                                        {editingCourseId === course.id ? (
                                            <textarea
                                                name="description"
                                                value={editingCourse.description || ''}
                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                className="table-textarea"
                                            />
                                        ) : (
                                            course.description
                                        )}
                                    </td>
                                    <td data-label="Credits">
                                        {editingCourseId === course.id ? (
                                            <input
                                                type="number"
                                                name="credits"
                                                value={editingCourse.credits || ''}
                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                className="table-input"
                                            />
                                        ) : (
                                            course.Credits
                                        )}
                                    </td>
                                    <td data-label="Lecturer ID">
                                        {editingCourseId === course.id ? (
                                            <input
                                                type="number"
                                                name="lecturer_id"
                                                value={editingCourse.lecturer_id || ''}
                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                className="table-input"
                                            />
                                        ) : (
                                            course['Lecturer ID']
                                        )}
                                    </td>
                                    <td data-label="Pages">
                                        {editingCourseId === course.id ? (
                                            <input
                                                type="number"
                                                name="pages"
                                                value={editingCourse.pages || ''}
                                                onChange={(e) => handleInputChange(e, setEditingCourse)}
                                                min="1"
                                                className="table-input"
                                            />
                                        ) : (
                                            course.pages
                                        )}
                                    </td>
                                    <td data-label="Actions" className="actions-cell">
                                        {editingCourseId === course.id ? (
                                            <>
                                                <button onClick={handleUpdateCourse} className="save-button">Save</button>
                                                <button onClick={() => {setEditingCourseId(null); clearMessages();}} className="cancel-button">Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEditCourse(course)} className="edit-button">Edit</button>
                                                <button onClick={() => handleDeleteCourse(course.id)} className="delete-button">Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    !loading && <p>No courses available.</p>
                )}
            </div>
        </div>
    );
};

export default LecturerDashboard;