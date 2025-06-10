import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LearnerDashboard.css'; // Assuming you have a CSS file for styling
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const LearnerDashboard = () => {
    const [learnerName, setLearnerName] = useState('');
    const [availableCourses, setAvailableCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [currentCourse, setCurrentCourse] = useState(null);
    const [courseProgress, setCourseProgress] = useState(0); // Progress based on notes viewed
    const [assessmentReady, setAssessmentReady] = useState(false);
    const [assessmentActive, setAssessmentActive] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Added message state for success messages
    const certificateRef = useRef();
    const backendUrl = 'http://localhost:5000'; // Make sure this matches your backend URL

    // States for notes viewing
    const [viewingNotes, setViewingNotes] = useState(false);
    const [currentNotePage, setCurrentNotePage] = useState(1);
    const [totalNotePages, setTotalNotePages] = useState(0);
    const [noteContent, setNoteContent] = useState('');
    
    // NEW STATE: To track if the user is enrolled in the current selected course
    const [isEnrolled, setIsEnrolled] = useState(false);

    // NEW STATE: To store the dynamically fetched userId
    const [currentUserId, setCurrentUserId] = useState(null);

    // Helper to clear messages after a delay
    const clearMessages = () => {
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000);
    };

    // --- Initial Data Fetch ---
    useEffect(() => {
        // Attempt to get userId from local storage on component mount
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setCurrentUserId(parseInt(storedUserId));
            // In a real app, you might also fetch learnerName based on userId here
        } else {
            // Handle case where userId is not in local storage (e.g., user not logged in)
            setError('Please log in to use the dashboard features.');
        }

        fetchAvailableCourses();
    }, []);

    // Effect to check enrollment status when a course is selected or user name changes
    // In a real application, this would involve a backend call to check if 'userId' is enrolled in 'selectedCourseId'
    useEffect(() => {
        if (currentCourse && learnerName.trim() && currentUserId) {
            // This is a placeholder. For a real app, you'd fetch the actual enrollment status
            // from your backend using currentUserId and currentCourse.id
            // For now, isEnrolled is managed by the handleEnroll function.
            // If you had an API endpoint like `/enrollments/status?userId=X&courseId=Y`
            // you would call it here and update setIsEnrolled accordingly.
            // axios.get(`${backendUrl}/enrollments/status?userId=${currentUserId}&courseId=${currentCourse.id}`)
            // .then(res => setIsEnrolled(res.data.isEnrolled))
            // .catch(err => console.error("Failed to fetch enrollment status:", err));
        } else {
            setIsEnrolled(false); // Reset enrollment status if no course, name, or user ID
        }
    }, [currentCourse, learnerName, currentUserId]);


    // --- Effect for Notes Progress and Assessment Readiness ---
    useEffect(() => {
        if (currentCourse && totalNotePages > 0) {
            const newProgress = (currentNotePage / totalNotePages) * 100;
            setCourseProgress(Math.min(newProgress, 100)); // Cap at 100%
            if (newProgress >= 70 && !assessmentReady) {
                setAssessmentReady(true);
                setMessage(`Hello ${learnerName}, you have viewed 70% of ${currentCourse.title} notes. You can now take the assessment.`);
                clearMessages();
            }
        }
    }, [currentCourse, currentNotePage, totalNotePages, learnerName, assessmentReady]);

    // --- Effect to fetch notes when currentNotePage or currentCourse changes ---
    useEffect(() => {
        if (viewingNotes && currentCourse && currentNotePage > 0) {
            fetchCourseNotesPage(currentCourse.title, currentNotePage);
        }
    }, [viewingNotes, currentCourse, currentNotePage]); // Depend on currentCourse to ensure it's loaded

    const fetchAvailableCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${backendUrl}/courses`);
            setAvailableCourses(response.data);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to load courses. Please check your backend server.');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e) => {
        setLearnerName(e.target.value);
    };

    const handleCourseSelect = (e) => {
        const selectedId = e.target.value;
        const course = availableCourses.find(c => c.id === parseInt(selectedId));

        setSelectedCourseId(selectedId);
        setCurrentCourse(course || null); // Set currentCourse immediately on selection
        setCourseProgress(0);
        setAssessmentReady(false);
        setAssessmentActive(false);
        setQuestions([]);
        setAnswers({});
        setResults(null);
        setShowCertificate(false);
        setViewingNotes(false); // Reset notes view
        setCurrentNotePage(1);
        setTotalNotePages(course ? course.pages : 0); // Set total pages based on selected course
        setNoteContent('');
        setError('');
        setMessage('');
        setIsEnrolled(false); // Reset enrollment status on course change
    };

    // New/Modified: handleEnroll function for explicit enrollment
    const handleEnroll = async () => {
        if (!currentUserId) {
            setError('User ID not found. Please ensure you are logged in correctly.');
            clearMessages();
            return;
        }
        if (!learnerName.trim()) {
            setError('Please enter your name before enrolling.');
            clearMessages();
            return;
        }
        if (!selectedCourseId) {
            setError('Please select a course to enroll in.');
            clearMessages();
            return;
        }

        setLoading(true);
        setError('');
        setMessage(''); // Clear any previous messages
        try {
            // Make the POST request to your backend's enrollment endpoint
            const response = await axios.post(`${backendUrl}/enrollments`, {
                userId: currentUserId, // Use dynamic userId
                moduleId: parseInt(selectedCourseId) // Use selectedCourseId
            });
            setMessage(response.data.message || `Successfully enrolled in ${currentCourse.title}!`);
            setIsEnrolled(true); // Set enrollment status to true
            clearMessages();
        } catch (err) {
            console.error('Enrollment error:', err);
            setError('Failed to enroll: ' + (err.response?.data?.message || err.response?.data?.error || 'Server error.'));
            clearMessages();
        } finally {
            setLoading(false);
        }
    };

    // Modified: handleStartCourse now assumes enrollment has happened
    const handleStartCourse = () => {
        if (!currentUserId) {
            setError('User ID not found. Please ensure you are logged in correctly.');
            return;
        }
        if (!learnerName.trim() || !selectedCourseId || !currentCourse || !isEnrolled) {
            setError('Please enter your name, select a course, and enroll before starting.');
            return;
        }
        if (currentCourse.pages === 0) {
            setError(`Course "${currentCourse.title}" has no notes configured.`);
            return;
        }

        setViewingNotes(true); // Only start viewing notes
        setCurrentNotePage(1); // Always start from the first page when starting a course
        fetchCourseNotesPage(currentCourse.title, 1);
        setError('');
        setMessage(''); // Clear previous messages
    };


    const handlePrepareAssessment = async () => {
        if (!currentCourse) {
            setError('Please start a course before taking the assessment.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage(''); // Clear messages
        setViewingNotes(false); // Hide notes when starting assessment
        try {
            const courseTitleForAssessment = currentCourse.title;
            const response = await axios.get(`${backendUrl}/assessments/${courseTitleForAssessment}`);

            const fetchedQuestions = response.data.map(q => ({
                id: q.id,
                question: q.question,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                answer: q.answer, // Assuming backend provides the correct answer for grading
            }));

            setQuestions(fetchedQuestions);
            setAssessmentActive(true);
            setAnswers({});
            setResults(null);
            setShowCertificate(false);
        } catch (err) {
            console.error('Error fetching questions:', err);
            const errorMessage = err.response && err.response.data && err.response.data.error
                                 ? err.response.data.error
                                 : 'Failed to load assessment questions. Please check your backend server and ensure questions are configured for this course.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prevAnswers => ({ ...prevAnswers, [questionId]: value }));
    };

    const handleSubmitAssessment = async () => { // Made async to send results to backend
        if (questions.length === 0) {
            setError('No questions to submit.');
            clearMessages();
            return;
        }

        let correctCount = 0;
        const detailedResults = {};
        const marksPerQuestion = 10;

        questions.forEach(question => {
            const userAnswer = answers[question.id];
            let isCorrect = false;

            if (question.options && question.options.length > 0) {
                isCorrect = (userAnswer === question.answer);
            } else {
                const trimmedUserAnswer = (userAnswer || '').toString().trim().toLowerCase();
                const trimmedCorrectAnswer = (question.answer || '').toString().trim().toLowerCase();
                isCorrect = (trimmedUserAnswer === trimmedCorrectAnswer);
            }

            if (isCorrect) {
                correctCount++;
            }
            detailedResults[question.id] = {
                question: question.question,
                userAnswer: userAnswer || 'Not answered',
                correctAnswer: question.answer,
                passed: isCorrect,
            };
        });

        const totalPossibleMarks = questions.length * marksPerQuestion;
        const earnedMarks = correctCount * marksPerQuestion;
        const percentage = (earnedMarks / totalPossibleMarks) * 100;

        setResults({ percentage, detailed: detailedResults });
        setAssessmentActive(false);
        setError('');

        if (percentage >= 70) {
            setShowCertificate(true);
            setMessage('Congratulations! You passed the assessment.');
            // NEW: Send completion status to backend
            await sendCompletionStatus(true, percentage);
        } else {
            setShowCertificate(false);
            setMessage('You did not pass. Please review and retake.');
            // NEW: Send completion status to backend (failed)
            await sendCompletionStatus(false, percentage);
        }
        clearMessages();
    };

    // NEW FUNCTION: sendCompletionStatus to backend
    const sendCompletionStatus = async (passed, score) => {
        if (!currentCourse || !selectedCourseId || !currentUserId) {
            console.error("Cannot send completion status: Missing current course, selected course ID, or user ID.");
            setError("Cannot update completion: user not logged in or course not selected."); // Added for clarity
            clearMessages();
            return;
        }

        try {
            await axios.put(`${backendUrl}/enrollments/complete`, {
                userId: currentUserId, // Use dynamic userId
                moduleId: parseInt(selectedCourseId),
                completionStatus: passed ? 'completed' : 'failed', // Or 'passed', 'failed'
                score: score,
                completionDate: new Date().toISOString()
            });
            console.log('Completion status sent to backend successfully!');
        } catch (err) {
            console.error('Error sending completion status to backend:', err);
            setError('Failed to update completion status: ' + (err.response?.data?.message || err.response?.data?.error || 'Server error.'));
            clearMessages();
            // Don't show error to user, as assessment results are already displayed
        }
    };


    const handleRetakeAssessment = () => {
        setAssessmentActive(true);
        setAnswers({});
        setResults(null);
        setShowCertificate(false);
        setError('');
        setMessage(''); // Clear messages
    };

    const handleDownloadCertificate = () => {
        if (!certificateRef.current) {
            setError('Certificate content not found.');
            return;
        }
        html2canvas(certificateRef.current, { scale: 2 })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                pdf.save(`${learnerName}_${currentCourse ? currentCourse.title.replace(/\s/g, '_') : 'Course'}_Certificate.pdf`);
                setMessage('Certificate downloaded successfully!');
                clearMessages();
            })
            .catch(err => {
                console.error("Error generating PDF:", err);
                setError("Failed to generate PDF certificate.");
                clearMessages();
            });
    };

    const fetchCourseNotesPage = async (courseTitle, pageNumber) => {
        setLoading(true);
        setError('');
        setMessage(''); // Clear messages
        try {
            const response = await axios.get(`${backendUrl}/courses/${courseTitle}/notes/${pageNumber}`);
            setNoteContent(response.data.content);
            // Optionally update total pages from backend if your backend provides it dynamically
            // setTotalNotePages(response.data.totalPages); 
            setCurrentNotePage(response.data.pageNumber); // Ensure current page is in sync
        } catch (err) {
            console.error('Error fetching notes:', err);
            const errorMessage = err.response && err.response.data && err.response.data.error
                                 ? err.response.data.error
                                 : 'Failed to load course notes.';
            setError(errorMessage);
            setNoteContent('Failed to load notes for this page.');
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (currentCourse && currentNotePage < currentCourse.pages) {
            setCurrentNotePage(prevPage => prevPage + 1);
            setMessage('Next page loaded.');
            clearMessages();
        } else {
            setMessage('You have reached the last page of notes.');
            clearMessages();
        }
    };

    const handlePreviousPage = () => {
        if (currentNotePage > 1) {
            setCurrentNotePage(prevPage => prevPage - 1);
            setMessage('Previous page loaded.');
            clearMessages();
        } else {
            setMessage('You are on the first page of notes.');
            clearMessages();
        }
    };

    const handleToggleNotesView = () => {
        setViewingNotes(prev => !prev);
        setAssessmentActive(false); // Hide assessment if notes are toggled
        setResults(null); // Clear results if notes are toggled
        setShowCertificate(false); // Hide certificate if notes are toggled
        setError('');
        setMessage(''); // Clear messages
        // If turning notes ON, ensure we're on page 1 of the current course
        if (!viewingNotes && currentCourse && currentCourse.pages > 0) {
            setCurrentNotePage(1);
            fetchCourseNotesPage(currentCourse.title, 1);
        }
    };

    return (
        <div className="dashboard-background">
            <div className="dashboard-container">
                <h1>Learner Dashboard</h1>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Enter your full name"
                        value={learnerName}
                        onChange={handleNameChange}
                        className="name-input"
                        disabled={loading}
                    />
                </div>

                {loading && <p className="loading-message">Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {message && <p className="success-message">{message}</p>} {/* Display success messages */}

                <div className="course-section">
                    <h2>Available Courses</h2>
                    <select id="courseSelect" value={selectedCourseId} onChange={handleCourseSelect} disabled={loading || viewingNotes || assessmentActive}>
                        <option value="">Select a course</option>
                        {availableCourses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>
                    <br />
                    
                    {/* NEW: Dedicated Enroll button */}
                    {!isEnrolled && selectedCourseId && learnerName.trim() && currentUserId && (
                        <button
                            onClick={handleEnroll}
                            disabled={loading}
                            className="enroll-button" // Add a class for specific styling if needed
                        >
                            Enroll in Selected Course
                        </button>
                    )}
                     {!currentUserId && (
                         <p className="error-message">Please log in to enroll in courses.</p>
                     )}

                    {/* Show "View Notes" or "Continue Notes" button only if enrolled */}
                    {isEnrolled && currentCourse && !viewingNotes && !assessmentActive && (
                        <button
                            onClick={handleStartCourse} // Renamed from handleStartCourse, now just view/continue notes
                            disabled={loading || currentCourse.pages === 0}
                            className="start-course-button" // Add a class for specific styling
                        >
                            {courseProgress > 0 ? 'Continue Reading Notes' : 'Start Course Notes'}
                        </button>
                    )}

                </div>

                {currentCourse && isEnrolled && ( // Show progress section only if enrolled
                    <div className="progress-section">
                        <h2>Course: {currentCourse.title}</h2>
                        <p>Progress: {courseProgress.toFixed(2)}% (Notes Viewed)</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${courseProgress}%` }}></div>
                        </div>
                        {courseProgress < 100 && (
                            <p>Continue viewing notes to complete the course content.</p>
                        )}
                        {/* The "Take Assessment" button is displayed conditionally */}
                        {assessmentReady && !assessmentActive && !results && !viewingNotes && (
                            <button onClick={handlePrepareAssessment} disabled={loading} className="take-assessment-button">Take Assessment</button>
                        )}
                    </div>
                )}

                {/* Notes Viewing Section */}
                {viewingNotes && currentCourse && (
                    <div className="notes-section">
                        <h3>Notes for {currentCourse.title}</h3>
                        {loading ? (
                            <p className="loading-message">Loading notes...</p>
                        ) : (
                            <>
                                {/* Using dangerouslySetInnerHTML to render HTML content from backend */}
                                <div className="note-content" dangerouslySetInnerHTML={{ __html: noteContent }}></div>
                                <div className="pagination-controls">
                                    <button onClick={handlePreviousPage} disabled={currentNotePage <= 1 || loading}>Previous Page</button>
                                    <span> Page {currentNotePage} of {currentCourse.pages} </span>
                                    <button onClick={handleNextPage} disabled={currentNotePage >= currentCourse.pages || loading}>Next Page</button>
                                </div>
                                <button onClick={handleToggleNotesView} className="close-notes-button">Close Notes</button>
                            </>
                        )}
                    </div>
                )}

                {/* Assessment Section */}
                {assessmentActive && currentCourse && (
                    <div className="assessment-section">
                        <h2>Assessment for {currentCourse.title}</h2>
                        {questions.length > 0 ? (
                            questions.map(question => (
                                <div key={question.id} className="question-item">
                                    <p className="question-text">{question.question}</p>
                                    {question.options && question.options.length > 0 ? (
                                        <div className="options-group">
                                            {question.options.map(option => (
                                                <label key={option} className="option-label">
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={option}
                                                        checked={answers[question.id] === option}
                                                        onChange={() => handleAnswerChange(question.id, option)}
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Your answer"
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            className="text-answer-input"
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No questions available for this course.</p>
                        )}
                        <button onClick={handleSubmitAssessment} disabled={loading} className="submit-assessment-button">Submit Assessment</button>
                    </div>
                )}

                {/* Results Section */}
                {results && (
                    <div className="results-section">
                        <h2>Assessment Results</h2>
                        <p>Your score: <strong style={{ color: results.percentage >= 70 ? 'green' : 'red' }}>{results.percentage.toFixed(2)}%</strong></p>
                        <div className="detailed-results-list">
                            {Object.values(results.detailed).map((item, index) => (
                                <div key={item.question + index} className={`result-item ${item.passed ? 'passed' : 'failed'}`}>
                                    <p><strong>Question:</strong> {item.question}</p>
                                    <p><strong>Your Answer:</strong> {item.userAnswer}</p>
                                    <p><strong>Correct Answer:</strong> {item.correctAnswer}</p>
                                    <p className={`status-text ${item.passed ? 'passed' : 'failed'}`}>Status: {item.passed ? 'Passed' : 'Failed'}</p>
                                </div>
                            ))}
                        </div>
                        {results.percentage < 70 ? (
                            <button onClick={handleRetakeAssessment} className="retake-assessment-button">Retake Assessment</button>
                        ) : (
                            <p className="success-message">Congratulations! You passed the assessment.</p>
                        )}
                    </div>
                )}

                {/* Certificate Section */}
                {showCertificate && results && results.percentage >= 70 && currentCourse && learnerName.trim() && (
                    <div className="certificate-section">
                        <div className="certificate-preview" ref={certificateRef}>
                            <h3>Certificate of Completion</h3>
                            <p>This certifies that</p>
                            <h4>{learnerName}</h4>
                            <p>has successfully completed:</p>
                            <p><em>{currentCourse.title}</em></p>
                            <p>with a score of: {results.percentage.toFixed(2)}%</p>
                            <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#555' }}>Date: {new Date().toLocaleDateString()}</p>
                        </div>
                        <button onClick={handleDownloadCertificate} className="download-certificate-button">Download Certificate</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearnerDashboard;
