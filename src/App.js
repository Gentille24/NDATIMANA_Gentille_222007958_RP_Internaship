// src/App.js

// Core React imports
import React, { useState } from 'react'; // ADDED useState import here

// React Router DOM for navigation
import { Routes, Route } from 'react-router-dom'; // REMOVED useNavigate as it's not used here

// react-pdf for PDF viewing capabilities
import { Document, Page, pdfjs } from 'react-pdf';

// Import your custom components
import LoginRegister from './components/LoginRegister/LoginRegister';
import LearnerDashboard from './components/LearnerDashboard/LearnerDashboard';
import LecturerDashboard from './components/LecturerDashboard/LecturerDashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';

// --- Configuration for react-pdf ---
// This line is crucial for react-pdf to load PDF files.
// It tells react-pdf where to find its worker script.
// Ensure 'pdf.worker.min.js' is copied into your 'public' folder.
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;


// --- PDF Viewer Component ---
// This component handles displaying a PDF file.
// It uses state to manage the number of pages in the document.
const PDFViewer = () => {
    const [numPages, setNumPages] = useState(null); // State to store the total number of pages

    // Callback function when the PDF document successfully loads
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages); // Update state with the number of pages
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>PDF Document Viewer</h1>
            <p style={{ color: '#666', marginBottom: '15px' }}>
                Loading PDF: <code style={{ backgroundColor: '#e0e0e0', padding: '3px 6px', borderRadius: '4px' }}>/sample.pdf</code>
            </p>
            <div style={{ border: '1px solid #ccc', margin: '20px auto', maxWidth: '800px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <Document
                    file="/sample.pdf" // Path to your PDF file (must be in the 'public' folder)
                    onLoadSuccess={onDocumentLoadSuccess} // Callback on successful load
                    onLoadError={(error) => { // Callback for load errors
                        console.error('Error loading PDF:', error);
                        // IMPORTANT: Do NOT use alert() in production React apps. Use a custom modal.
                        // alert('Failed to load PDF. Please check the console for details.');
                        // For now, we'll keep it as is, but be aware.
                    }}
                    loading={<p style={{ padding: '20px', color: '#007bff' }}>Loading PDF...</p>} // Custom loading message
                    noData={<p style={{ padding: '20px', color: '#dc3545' }}>No PDF file specified or found.</p>} // Message if file prop is empty or invalid
                >
                    {/*
                      Renders all pages of the PDF.
                      `Array.from(new Array(numPages))` creates an array with `numPages` elements,
                      which is then mapped to render each page.
                    */}
                    {Array.from(new Array(numPages || 0), (el, index) => (
                        <Page
                            key={`page_${index + 1}`} // Unique key for each page
                            pageNumber={index + 1} // Current page number
                            renderTextLayer={false} // Improves performance by not rendering selectable text layer
                            renderAnnotationLayer={false} // Improves performance by not rendering annotations
                            scale={1.0} // Adjusts the zoom level of the page (1.0 is 100%)
                            width={780} // Set a fixed width for the page to control scaling within the container
                            style={{ margin: '10px auto', border: '1px solid #eee' }} // Basic styling for individual pages
                        />
                    ))}
                </Document>
            </div>
            {/* Display current page and total pages if PDF is loaded */}
            {numPages && (
                <p style={{ color: '#555', fontSize: '0.9em' }}>
                    Page {1} of {numPages} (All pages are displayed vertically)
                </p>
            )}
        </div>
    );
};


// --- NotFoundPage Component ---
// This component is rendered when no other route matches the URL.
// It provides a user-friendly 404 message.
const NotFoundPage = () => {
    return (
        <div style={{
            textAlign: 'center',
            padding: '50px',
            fontSize: '1.5em',
            color: '#dc3545', // Red color for error text
            backgroundColor: '#f8d7da', // Light red background
            border: '1px solid #f5c6cb', // Border matching the background
            borderRadius: '8px',
            margin: '50px auto', // Center the box on the page
            maxWidth: '600px', // Max width for readability
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)' // Subtle shadow
        }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
            <p>Please check the URL or return to the <a href="/" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>Login Page</a>.</p>
        </div>
    );
};


// --- Main App Component ---
// This is the root component of your application's routing.
// It defines all the possible paths and the components to render for each path.
function App() {
    return (
        // <BrowserRouter> (aliased as <Router>) is placed in index.js to wrap the entire app.
        // So, here we just use <Routes> directly, as the routing context is already provided.
        <Routes>
            {/*
              Root Path: Serves as the default entry point.
              It will display the Login/Registration form.
              Your LoginRegister component should handle successful login by
              redirecting the user to the appropriate dashboard path (e.g., /dashboard/admin).
            */}
            <Route path="/" element={<LoginRegister />} />

            {/*
              Login Path: Explicitly for the login form.
              It also renders the LoginRegister component.
            */}
            <Route path="/login" element={<LoginRegister />} />

            {/*
              Registration Path (Optional):
              If you want a direct link to the registration form, you can pass a prop
              to the LoginRegister component to indicate it should show the register form initially.
              (Requires LoginRegister to handle a 'formType' prop, for example).
            */}
            <Route path="/register" element={<LoginRegister formType="register" />} />

            {/*
              Dashboard Routes:
              These routes are for different user roles.
              The components will be rendered when the URL matches their respective paths.
            */}
            <Route path="/dashboard/learner" element={<LearnerDashboard />} />
            <Route path="/dashboard/lecturer" element={<LecturerDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} /> {/* Admin Dashboard Route */}

            {/*
              Default Dashboard Route:
              This route handles the specific path `/dashboard/default`.
              Your LoginRegister component might navigate here if the user's role
              is not explicitly 'learner', 'lecturer', or 'admin', or if it defaults to 'default'.
              We assume 'default' should lead to the LearnerDashboard.
            */}
            <Route path="/dashboard/default" element={<LearnerDashboard />} />

            {/*
              PDF Viewer Route:
              Displays the PDFViewer component.
            */}
            <Route path="/pdf" element={<PDFViewer />} />

            {/*
              Catch-all Route for 404 (Not Found) Pages:
              This route uses `path="*"` to match any URL that hasn't been matched by the routes above.
              It should always be the LAST route defined in your <Routes> component.
              It renders the NotFoundPage component, providing a user-friendly error message.
            */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App;