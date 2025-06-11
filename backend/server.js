const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For password hashing
const nodemailer = require('nodemailer'); // Import Nodemailer

const app = express();

// Enable CORS for all origins (you might want to restrict this in production)
app.use(cors());
app.use(bodyParser.json());

// MySQL database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // IMPORTANT: REPLACE WITH YOUR ACTUAL MYSQL PASSWORD if you have one set
    database: 'elearning'
};

const db = mysql.createConnection(dbConfig);

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('ERROR: Could not connect to MySQL database:', err.stack);
        return;
    }
    console.log('SUCCESS: Connected to MySQL database as id ' + db.threadId);
});

// --- Nodemailer Transporter Setup ---
// !!! CRITICAL: This section is the MOST COMMON reason emails don't send !!!
// You MUST replace 'your_email@example.com' and 'your_email_password' with your actual
// email address and its corresponding password or, for services like Gmail, an App Password.

// Steps to Troubleshoot Email Sending:
// 1. Double-check 'user' and 'pass' credentials.
// 2. If using GMAIL and you have 2-Factor Authentication (2FA) enabled:
//    You CANNOT use your regular Gmail password directly here.
//    You MUST generate an "App Password" from your Google Account security settings.
//    Go to: Google Account -> Security -> How you sign in to Google -> App passwords.
//    Generate a new app password and use that string for the 'pass' field.
// 3. If you do NOT have 2FA enabled for Gmail:
//    You might need to enable "Less secure app access" for your Google account.
//    (Note: Google is phasing this out, so App Passwords are preferred if 2FA is on.)
// 4. Check your server's firewall/network settings to ensure outgoing SMTP traffic (port 465 or 587) is not blocked.
// 5. Look for detailed errors in your backend console output (where you run node server.js).

const transporter = nodemailer.createTransport({
    service: 'gmail', // Example: 'gmail'. You can also use ''outlook', 'sendgrid', 'smtp' (with host/port)
    auth: {
        user: 'your_email@example.com', // <-- REPLACE THIS with your actual sending email
        pass: 'your_email_password',    // <-- REPLACE THIS with your actual password or App Password
    },
    // Uncomment these lines to get more detailed debug logs from Nodemailer
    // logger: true,
    // debug: true,
});

// --- Helper function to send emails ---
const sendEmail = async (toEmail, subject, htmlContent) => {
    // Basic check to prevent sending if credentials are still default placeholders
    if (!transporter.options.auth.user || transporter.options.auth.user === 'your_email@example.com') {
        console.error('ERROR: Nodemailer transporter not configured. Please set up your email credentials in server.js.');
        return; // Prevent email sending if not configured
    }

    try {
        const info = await transporter.sendMail({
            from: '"E-Learning Platform" <your_email@example.com>', // Sender address, REPLACE THIS with your email
            to: toEmail, // Recipient address
            subject: subject, // Subject line
            html: htmlContent, // HTML body
        });
        console.log(`Email sent successfully to ${toEmail} for subject: "${subject}". Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`ERROR: Failed to send email to ${toEmail} with subject "${subject}":`, error);
        console.error('Nodemailer error details:', error.response); // Log more details from Nodemailer
        console.error('--- COMMON EMAIL SENDING ISSUES & FIXES ---');
        console.error('1. Incorrect "user" or "pass" in Nodemailer config.');
        console.error('2. For Gmail: Did you use an "App Password" if 2FA is ON?');
        console.error('3. For Gmail: Is "Less secure app access" enabled if 2FA is OFF?');
        console.error('4. Network firewall blocking outgoing SMTP (ports 465/587).');
        console.error('5. Recipient email address might be invalid or rejecting emails.');
    }
};


// --- API Endpoints ---

// User Registration
app.post('/registration', async (req, res) => {
    const { firstname, lastname, username, email, password, role } = req.body;

    // Input validation
    if (!firstname || !lastname || !username || !email || !password || !role) {
        console.error('ERROR: Registration - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All fields are required for registration.' });
    }

    try {
        // Check if username or email already exists in the 'registration' table
        const checkUserSql = 'SELECT * FROM registration WHERE username = ? OR email = ?';
        db.query(checkUserSql, [username, email], async (checkErr, checkResults) => {
            if (checkErr) {
                console.error('ERROR: Database error checking existing user during registration:', checkErr.stack);
                return res.status(500).json({ error: 'ERROR: Database error during registration.' });
            }

            if (checkResults.length > 0) {
                console.warn('WARNING: Registration attempt with existing username or email:', username, email);
                return res.status(409).json({ error: 'ERROR: Username or email already exists.' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user into the 'registration' table
            const insertSql = 'INSERT INTO registration (firstname, lastname, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, "active")'; // Added status default
            db.query(insertSql, [firstname, lastname, username, email, hashedPassword, role], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('ERROR: Database error registering user:', insertErr.stack);
                    return res.status(500).json({ error: 'ERROR: Database error during registration.' });
                }
                console.log('SUCCESS: User registered successfully:', insertResult.insertId);
                return res.status(201).json({ message: 'SUCCESS: Registration successful!' });
            });
        });
    } catch (error) {
        console.error('ERROR: Uncaught error during registration process:', error.stack);
        return res.status(500).json({ error: 'ERROR: Internal server error during registration.' });
    }
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.error('ERROR: Login - Username and password are required.');
        return res.status(400).json({ error: 'ERROR: Username and password are required.' });
    }

    // Select user from the 'registration' table
    const sql = 'SELECT id, username, password, role, status, email FROM registration WHERE username = ?'; // Added email to select
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('ERROR: Database error during login query:', err.stack);
            return res.status(500).json({ error: 'ERROR: Database error during login.' });
        }

        if (results.length === 0) {
            console.warn('WARNING: Login attempt with non-existent username:', username);
            return res.status(401).json({ error: 'ERROR: Invalid credentials.' });
        }

        const user = results[0];
        // Check if user is disabled
        if (user.status === 'disabled') {
            console.warn('WARNING: Login attempt for disabled account:', username);
            return res.status(403).json({ error: 'ERROR: Your account has been disabled. Please contact support.' });
        }

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                console.log('SUCCESS: User logged in:', user.username, 'Role:', user.role);
                // In a real app, you'd generate a JWT here
                return res.status(200).json({
                    message: 'SUCCESS: Login successful!',
                    role: user.role,
                    username: user.username,
                    userId: user.id,
                    email: user.email // Included user email in login response for future use
                });
            } else {
                console.warn('WARNING: Login attempt with incorrect password for user:', username);
                return res.status(401).json({ error: 'ERROR: Invalid credentials.' });
            }
        } catch (bcryptError) {
            console.error('ERROR: Error comparing passwords during login:', bcryptError.stack);
            return res.status(500).json({ error: 'ERROR: Internal server error during login.' });
        }
    });
});

// Password Reset (Basic Implementation - Needs email sending in production)
app.post('/reset', (req, res) => {
    const { email } = req.body;

    if (!email) {
        console.error('ERROR: Password Reset - Email is required.');
        return res.status(400).json({ error: 'ERROR: Email is required for password reset.' });
    }

    // Select user from the 'registration' table for password reset
    const sql = 'SELECT id, email, firstname, username FROM registration WHERE email = ?'; // Select firstname and username for email
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('ERROR: Database error during password reset request:', err.stack);
            return res.status(500).json({ error: 'ERROR: Database error during password reset.' });
        }

        if (results.length === 0) {
            console.warn('WARNING: Password Reset attempt for non-existent email:', email);
            return res.status(404).json({ error: 'ERROR: User with this email not found.' });
        }

        const user = results[0];
        console.log('INFO: Password reset requested for:', user.email);
        // In a real application, you'd generate a reset token, save it to DB,
        // and send an email with a link containing the token to the user's email.
        const resetHtml = `
            <p>Dear ${user.firstname || user.username || 'User'},</p>
            <p>You recently requested a password reset for your E-Learning Platform account.</p>
            <p>Please click on the following link to reset your password: <a href='YOUR_FRONTEND_RESET_PAGE_URL_HERE?token=YOUR_RESET_TOKEN'>Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The E-Learning Platform Team</p>
        `;
        sendEmail(user.email, "E-Learning Platform: Password Reset Request", resetHtml);
        return res.status(200).json({ message: 'INFO: Password reset link sent to your email (actual email sent in this implementation).' });
    });
});


// --- NEW ENROLLMENT ENDPOINTS with Email Notifications ---

// POST: Enroll a learner in a course
app.post('/enrollments', (req, res) => {
    const { userId, moduleId } = req.body;

    if (!userId || !moduleId) {
        console.error('ERROR: Enrollment - User ID and Module ID are required.');
        return res.status(400).json({ error: 'ERROR: User ID and Module ID are required for enrollment.' });
    }

    // Check if enrollment already exists to prevent duplicates
    const checkEnrollmentSql = 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?';
    db.query(checkEnrollmentSql, [userId, moduleId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('ERROR: Database error checking existing enrollment:', checkErr.stack);
            return res.status(500).json({ error: 'ERROR: Database error during enrollment.' });
        }

        if (checkResults.length > 0) {
            console.warn(`WARNING: Enrollment attempt for existing enrollment (User ID: ${userId}, Module ID: ${moduleId}).`);
            return res.status(409).json({ message: 'User is already enrolled in this module.' });
        }

        // Insert new enrollment record
        const insertEnrollmentSql = 'INSERT INTO enrollments (user_id, course_id, enrollment_date, completion_status) VALUES (?, ?, ?, ?)';
        const enrollmentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format for MySQL DATETIME
        db.query(insertEnrollmentSql, [userId, moduleId, enrollmentDate, 'in_progress'], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('ERROR: Database error inserting new enrollment:', insertErr.stack);
                return res.status(500).json({ error: 'ERROR: Failed to enroll in module.', details: insertErr.message });
            }

            // Fetch user's email and course title for email notification
            const userCourseDetailsSql = `
                SELECT
                    r.email,
                    r.firstname,
                    r.lastname,
                    c.title AS course_title
                FROM registration r
                JOIN courses c ON c.id = ?
                WHERE r.id = ?;
            `;
            db.query(userCourseDetailsSql, [moduleId, userId], (detailsErr, detailsResults) => {
                if (detailsErr) {
                    console.error('ERROR: Database error fetching user/course details for enrollment email:', detailsErr.stack);
                } else if (detailsResults.length > 0 && detailsResults[0].email) {
                    const userDetails = detailsResults[0];
                    const emailSubject = `Welcome to Your New Course: ${userDetails.course_title}!`;
                    const emailHtml = `
                        <p>Dear ${userDetails.firstname || userDetails.username || 'Learner'},</p>
                        <p>Welcome to your new course, <strong>${userDetails.course_title}</strong>!</p>
                        <p>You have successfully enrolled and can now start learning. We hope you enjoy the material!</p>
                        <p>Best regards,<br>The E-Learning Platform Team</p>
                    `;
                    sendEmail(userDetails.email, emailSubject, emailHtml);
                } else {
                    console.warn(`WARNING: Could not send enrollment email. User details or email not found for User ID: ${userId}`);
                }
            });

            // OPTIONAL: Increment enrollment_count in the courses table
            const updateCourseCountSql = 'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?';
            db.query(updateCourseCountSql, [moduleId], (updateErr) => {
                if (updateErr) {
                    console.error('ERROR: Failed to update enrollment count in courses table:', updateErr.stack);
                }
            });

            console.log('SUCCESS: Learner enrolled successfully. Enrollment ID:', insertResult.insertId);
            res.status(201).json({ message: 'Enrollment successful!', enrollmentId: insertResult.insertId });
        });
    });
});

// PUT: Update enrollment completion status with Email Notification
app.put('/enrollments/complete', (req, res) => {
    const { userId, moduleId, completionStatus, score, completionDate } = req.body;

    if (!userId || !moduleId || !completionStatus || score === undefined || !completionDate) {
        console.error('ERROR: Update Enrollment Completion - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: Missing required fields for updating completion status.' });
    }

    // Ensure completionStatus is valid
    if (!['completed', 'failed', 'in_progress'].includes(completionStatus)) {
        console.error('ERROR: Update Enrollment Completion - Invalid completion status:', completionStatus);
        return res.status(400).json({ error: 'ERROR: Invalid completion status provided.' });
    }

    const updateSql = 'UPDATE enrollments SET completion_status = ?, score = ?, completion_date = ? WHERE user_id = ? AND course_id = ?';
    const formattedCompletionDate = new Date(completionDate).toISOString().slice(0, 19).replace('T', ' '); // Format for MySQL DATETIME

    db.query(updateSql, [completionStatus, score, formattedCompletionDate, userId, moduleId], (err, result) => {
        if (err) {
            console.error('ERROR: Database error updating enrollment completion status:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update enrollment completion status.', details: err.message });
        }

        if (result.affectedRows === 0) {
            console.warn(`WARNING: Attempt to update non-existent enrollment (User ID: ${userId}, Module ID: ${moduleId}).`);
            return res.status(404).json({ message: 'ERROR: Enrollment record not found for update.' });
        }

        // Fetch user's email and course title for email notification
        if (completionStatus === 'completed') { // Only send completion email if status is 'completed'
            const userCourseDetailsSql = `
                SELECT
                    r.email,
                    r.firstname,
                    r.lastname,
                    c.title AS course_title
                FROM registration r
                JOIN courses c ON c.id = ?
                WHERE r.id = ?;
            `;
            db.query(userCourseDetailsSql, [moduleId, userId], (detailsErr, detailsResults) => {
                if (detailsErr) {
                    console.error('ERROR: Database error fetching user/course details for completion email:', detailsErr.stack);
                } else if (detailsResults.length > 0 && detailsResults[0].email) {
                    const userDetails = detailsResults[0];
                    const emailSubject = `Course Completion & Certificate: ${userDetails.course_title}!`;
                    const emailHtml = `
                        <p>Dear ${userDetails.firstname || userDetails.username || 'Learner'},</p>
                        <p>Congratulations! You have successfully completed the course: <strong>${userDetails.course_title}</strong> with a score of ${score.toFixed(2)}%!</p>
                        <p>We are thrilled to see your progress.</p>
                        <p>You can now download your certificate directly from your Learner Dashboard.</p>
                        <p>Keep up the great work!</p>
                        <p>Best regards,<br>The E-Learning Platform Team</p>
                    `;
                    sendEmail(userDetails.email, emailSubject, emailHtml);
                } else {
                    console.warn(`WARNING: Could not send completion email. User details or email not found for User ID: ${userId}`);
                }
            });
        }

        console.log('SUCCESS: Enrollment completion status updated for User ID:', userId, 'Module ID:', moduleId);
        res.status(200).json({ message: 'SUCCESS: Enrollment completion status updated successfully!' });
    });
});

// --- Admin Module/Course Management Endpoints ---

// GET all courses (modules) with enrollment count
app.get('/admin/modules', (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.title,
            c.description,
            c.Credits,
            c.\`Lecturer ID\`,
            c.pages,
            c.is_published,
            COUNT(e.id) AS enrollment_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title, c.description, c.Credits, c.\`Lecturer ID\`, c.pages, c.is_published
        ORDER BY c.title;
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching modules for admin:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch modules from the database', details: err.message });
        }
        res.json(results);
    });
});

// POST a new course (module) - Admin
app.post('/admin/modules', (req, res) => {
    const { title, description, credits, lecturer_id, pages, is_published } = req.body;
    if (!title || !credits || !lecturer_id || pages === undefined || is_published === undefined) {
        console.error('ERROR: Admin Add Module - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All required fields (title, credits, lecturer_id, pages, is_published) are needed to add a module.' });
    }
    const sql = 'INSERT INTO courses (title, description, Credits, `Lecturer ID`, pages, is_published) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [title, description, credits, lecturer_id, pages, is_published], (err, result) => {
        if (err) {
            console.error('ERROR: Error adding module:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to add module to the database', details: err.message });
        }
        console.log('SUCCESS: Module added by admin. Insert ID:', result.insertId);
        res.status(201).json({ message: 'SUCCESS: Module added successfully', insertId: result.insertId });
    });
});

// PUT (update) an existing course (module) - Admin
app.put('/admin/modules/:id', (req, res) => {
    const courseId = req.params.id;
    const { title, description, credits, lecturer_id, pages, is_published } = req.body;
    if (!title || !credits || !lecturer_id || pages === undefined || is_published === undefined) {
        console.error('ERROR: Admin Update Module - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All required fields (title, credits, lecturer_id, pages, is_published) are needed to update a module.' });
    }
    const sql = 'UPDATE courses SET title = ?, description = ?, Credits = ?, `Lecturer ID` = ?, pages = ?, is_published = ? WHERE id = ?';
    db.query(sql, [title, description, credits, lecturer_id, pages, is_published, courseId], (err, result) => {
        if (err) {
            console.error('ERROR: Error updating module:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update module in the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Admin Update Module - Module not found for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Module not found' });
        }
        console.log('SUCCESS: Module updated by admin. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: Module updated successfully', affectedRows: result.affectedRows });
    });
});

// DELETE a course (module) - Admin
app.delete('/admin/modules/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'DELETE FROM courses WHERE id = ?';
    db.query(sql, [courseId], (err, result) => {
        if (err) {
            console.error('ERROR: Error deleting module:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to delete module from the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Admin Delete Module - Module not found for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Module not found.' });
        }
        console.log('SUCCESS: Module deleted by admin. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: Module deleted successfully', affectedRows: result.affectedRows });
    });
});

// Publish/Unpublish a module
app.put('/admin/modules/:id/publish', (req, res) => {
    const moduleId = req.params.id;
    const { is_published } = req.body; // Expect boolean true/false

    if (typeof is_published !== 'boolean') {
        console.error('ERROR: Publish/Unpublish - is_published must be a boolean value.');
        return res.status(400).json({ error: 'ERROR: is_published must be a boolean value.' });
    }

    const sql = 'UPDATE courses SET is_published = ? WHERE id = ?';
    db.query(sql, [is_published, moduleId], (err, result) => {
        if (err) {
            console.error(`ERROR: Error ${is_published ? 'publishing' : 'unpublishing'} module ${moduleId}:`, err.stack);
            return res.status(500).json({ error: `ERROR: Failed to ${is_published ? 'publish' : 'unpublish'} module.`, details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Publish/Unpublish - Module not found for ID:', moduleId);
            return res.status(404).json({ error: 'ERROR: Module not found.' });
        }
        console.log(`SUCCESS: Module ${moduleId} ${is_published ? 'published' : 'unpublished'} successfully.`);
        res.json({ message: `SUCCESS: Module ${is_published ? 'published' : 'unpublished'} successfully.` });
    });
});

// Assign instructor to a module
app.put('/admin/modules/:moduleId/assign-instructor', (req, res) => {
    const moduleId = req.params.moduleId;
    const { lecturer_id } = req.body;

    if (!lecturer_id) {
        console.error('ERROR: Assign Instructor - Lecturer ID is required.');
        return res.status(400).json({ error: 'ERROR: Lecturer ID is required.' });
    }

    // Optional: Verify lecturer_id exists and has 'lecturer' role in 'registration' table
    const verifyLecturerSql = 'SELECT id FROM registration WHERE id = ? AND role = "lecturer"';
    db.query(verifyLecturerSql, [lecturer_id], (verifyErr, verifyResults) => {
        if (verifyErr) {
            console.error('ERROR: Database error verifying lecturer for assignment:', verifyErr.stack);
            return res.status(500).json({ error: 'ERROR: Database error during instructor assignment.' });
        }
        if (verifyResults.length === 0) {
            console.warn('WARNING: Assign Instructor - Invalid Lecturer ID or user is not a lecturer:', lecturer_id);
            return res.status(400).json({ error: 'ERROR: Invalid Lecturer ID or user is not a lecturer.' });
        }

        const assignSql = 'UPDATE courses SET `Lecturer ID` = ? WHERE id = ?';
        db.query(assignSql, [lecturer_id, moduleId], (assignErr, assignResult) => {
            if (assignErr) {
                console.error('ERROR: Error assigning instructor to module:', assignErr.stack);
                return res.status(500).json({ error: 'ERROR: Failed to assign instructor.', details: assignErr.message });
            }
            if (assignResult.affectedRows === 0) {
                console.warn('WARNING: Assign Instructor - Module not found for ID:', moduleId);
                return res.status(404).json({ error: 'ERROR: Module not found.' });
            }
            console.log('SUCCESS: Instructor assigned successfully for Module ID:', moduleId, 'Lecturer ID:', lecturer_id);
            res.json({ message: 'SUCCESS: Instructor assigned successfully.' });
        });
    });
});


// --- Admin User Management Endpoints ---

// GET all users
app.get('/admin/users', (req, res) => {
    const sql = 'SELECT id, firstname, lastname, username, email, role, status FROM registration';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching users for admin:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch users from the database', details: err.message });
        }
        res.json(results);
    });
});

// Promote user to instructor role
app.put('/admin/users/:id/promote', (req, res) => {
    const userId = req.params.id;
    const { role } = req.body; // Expected to be 'lecturer' or 'learner'

    if (!['lecturer', 'learner', 'admin'].includes(role)) { // Allow setting back to learner or admin
        console.error('ERROR: Promote/Demote User - Invalid role specified:', role);
        return res.status(400).json({ error: 'ERROR: Invalid role specified. Must be "lecturer", "learner", or "admin".' });
    }

    const sql = 'UPDATE registration SET role = ? WHERE id = ?';
    db.query(sql, [role, userId], (err, result) => {
        if (err) {
            console.error(`ERROR: Error promoting/demoting user ${userId} to ${role}:`, err.stack);
            return res.status(500).json({ error: `ERROR: Failed to update user role.`, details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Promote/Demote User - User not found for ID:', userId);
            return res.status(404).json({ error: 'ERROR: User not found.' });
        }
        console.log(`SUCCESS: User ${userId} role updated to ${role} successfully.`);
        res.json({ message: `SUCCESS: User role updated to ${role} successfully.` });
    });
});

// Disable/Enable user
app.put('/admin/users/:id/status', (req, res) => {
    const userId = req.params.id;
    const { status } = req.body; // Expected to be 'active' or 'disabled'

    if (!['active', 'disabled'].includes(status)) {
        console.error('ERROR: Update User Status - Invalid status specified:', status);
        return res.status(400).json({ error: 'ERROR: Invalid status specified. Must be "active" or "disabled".' });
    }

    const sql = 'UPDATE registration SET status = ? WHERE id = ?';
    db.query(sql, [status, userId], (err, result) => {
        if (err) {
            console.error(`ERROR: Error setting user ${userId} status to ${status}:`, err.stack);
            return res.status(500).json({ error: `ERROR: Failed to update user status.`, details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Update User Status - User not found for ID:', userId);
            return res.status(404).json({ error: 'ERROR: User not found.' });
        }
        console.log(`SUCCESS: User ${userId} status set to ${status} successfully.`);
        res.json({ message: `SUCCESS: User status set to ${status} successfully.` });
    });
});

// DELETE user
app.delete('/admin/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM registration WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('ERROR: Error deleting user:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to delete user from the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Delete User - User not found for ID:', userId);
            return res.status(404).json({ error: 'ERROR: User not found.' });
        }
        console.log('SUCCESS: User deleted. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: User deleted successfully', affectedRows: result.affectedRows });
    });
});

// --- Admin System Reports Endpoints ---

// Get Enrollment Statistics
app.get('/admin/reports/enrollments', (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.title AS course_title,
            COUNT(e.id) AS total_enrollments
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title, c.description, c.Credits, c.\`Lecturer ID\`, c.pages, c.is_published
        ORDER BY c.title;
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching enrollment statistics:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch enrollment statistics.', details: err.message });
        }
        res.json(results);
    });
});

// Get Module Completion Rates
app.get('/admin/reports/completion-rates', (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.title AS course_title,
            COUNT(e.id) AS total_enrollments,
            SUM(CASE WHEN e.completion_status = 'completed' THEN 1 ELSE 0 END) AS completed_enrollments,
            (SUM(CASE WHEN e.completion_status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(e.id)) AS completion_percentage
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title, c.description, c.Credits, c.\`Lecturer ID\`, c.pages, c.is_published
        HAVING COUNT(e.id) > 0
        ORDER BY completion_percentage DESC;
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching completion rates:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch completion rates.', details: err.message });
        }
        res.json(results);
    });
});

// Placeholder for Revenue Reports (no actual revenue logic in current schema)
app.get('/admin/reports/revenue', (req, res) => {
    console.log('INFO: Revenue report endpoint hit (placeholder).');
    res.json({
        message: "Revenue reports are a placeholder. Implement actual revenue logic here.",
        total_revenue: 0,
        recent_transactions: []
    });
});


// --- Existing Learner/Course Endpoints (Kept for compatibility) ---

// GET all courses (for learners, only published ones)
app.get('/courses', (req, res) => {
    const sql = 'SELECT id, title, description, Credits, `Lecturer ID`, pages FROM courses WHERE is_published = TRUE';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching courses for learners:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch courses from the database', details: err.message });
        }
        res.json(results);
    });
});

// POST a new course (Lecturer Dashboard uses this, but Admin can also use /admin/modules)
app.post('/courses', (req, res) => {
    const { title, description, credits, lecturer_id, pages } = req.body;
    if (!title || !credits || !lecturer_id || pages === undefined) {
        console.error('ERROR: Add Course - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All required fields (title, credits, lecturer_id, pages) are needed to add a course.' });
    }
    const sql = 'INSERT INTO courses (title, description, Credits, `Lecturer ID`, pages, is_published) VALUES (?, ?, ?, ?, ?, TRUE)';
    db.query(sql, [title, description, credits, lecturer_id, pages], (err, result) => {
        if (err) {
            console.error('ERROR: Error adding course:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to add course to the database', details: err.message });
        }
        console.log('SUCCESS: Course added. Insert ID:', result.insertId);
        res.status(201).json({ message: 'SUCCESS: Course added successfully', insertId: result.insertId });
    });
});

// GET a single course by ID (for learners)
app.get('/courses/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'SELECT id, title, description, Credits, `Lecturer ID`, pages FROM courses WHERE id = ? AND is_published = TRUE';
    db.query(sql, [courseId], (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching single course:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to fetch course from the database', details: err.message });
        }
        if (results.length === 0) {
            console.warn('WARNING: Single Course Fetch - Course not found or not published for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Course not found or not published' });
        }
        res.json(results[0]);
    });
});

// PUT (update) an existing course by ID (Lecturer Dashboard uses this)
app.put('/courses/:id', (req, res) => {
    const courseId = req.params.id;
    const { title, description, credits, lecturer_id, pages } = req.body;
    if (!title || !credits || !lecturer_id || pages === undefined) {
        console.error('ERROR: Update Course - Missing required fields.');
        return res.status(400).json({ error: 'ERROR: All required fields (title, credits, lecturer_id, pages) are needed to update a course.' });
    }
    const sql = 'UPDATE courses SET title = ?, description = ?, Credits = ?, `Lecturer ID` = ?, pages = ? WHERE id = ?';
    db.query(sql, [title, description, credits, lecturer_id, pages, courseId], (err, result) => {
        if (err) {
            console.error('ERROR: Error updating course:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to update course in the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Update Course - Course not found for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Course not found' });
        }
        console.log('SUCCESS: Course updated. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: Course updated successfully', affectedRows: result.affectedRows });
    });
});

// DELETE a course by ID (Lecturer Dashboard uses this)
app.delete('/courses/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'DELETE FROM courses WHERE id = ?';
    db.query(sql, [courseId], (err, result) => {
        if (err) {
            console.error('ERROR: Error deleting course:', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to delete course from the database', details: err.message });
        }
        if (result.affectedRows === 0) {
            console.warn('WARNING: Delete Course - Course not found for ID:', courseId);
            return res.status(404).json({ error: 'ERROR: Course not found' });
        }
        console.log('SUCCESS: Course deleted. Affected Rows:', result.affectedRows);
        res.json({ message: 'SUCCESS: Course deleted successfully', affectedRows: result.affectedRows });
    });
});

// GET assessment questions for a specific course
app.get('/assessments/:courseName', (req, res) => {
    const courseName = req.params.courseName;
    const sql = 'SELECT id, question, options, answer FROM assessments WHERE course_name = ?';
    db.query(sql, [courseName], (err, results) => {
        if (err) {
            console.error('ERROR: Error fetching assessment questions for ' + courseName + ':', err.stack);
            return res.status(500).json({ error: 'ERROR: Failed to load assessment questions from the database', details: err.message });
        }
        if (results.length === 0) {
            console.warn('WARNING: No assessment questions found for ' + courseName);
            return res.status(404).json({ error: 'ERROR: No assessment questions found for ' + courseName + '. Make sure questions are configured for this course on the backend.' });
        }
        res.json(results);
    });
});

// Get course notes for a specific page with varied content
app.get('/courses/:courseTitle/notes/:pageNumber', (req, res) => {
    const courseTitle = req.params.courseTitle;
    const pageNumber = parseInt(req.params.pageNumber);

    if (isNaN(pageNumber) || pageNumber < 1) {
        console.error('ERROR: Fetch Notes - Invalid page number provided:', req.params.pageNumber);
        return res.status(400).json({ error: 'Invalid page number.' });
    }

    let totalPages = 0;
    let pageSpecificContent = '';

    if (courseTitle === 'Networking') {
        totalPages = 50;
        switch (pageNumber) {
            case 1:
                pageSpecificContent = `
                    <p>Welcome to **Networking Fundamentals - Page 1**.</p>
                    <p>This page introduces the basic concepts of computer networks, including definitions of network types (LAN, WAN, MAN) and their importance in modern communication. We'll explore the idea of interconnected devices and the need for protocols.</p>
                    <p>Key terms: Node, Link, Protocol, Topology.</p>
                `;
                break;
            case 2:
                pageSpecificContent = `
                    <p>On **Networking Fundamentals - Page 2**, we delve into network topologies.</p>
                    <p>Learn about different ways devices can be arranged in a network: Bus, Star, Ring, Mesh, and Hybrid topologies. Each has its own advantages and disadvantages in terms of cost, reliability, and performance.</p>
                    <p>Consider the scalability of a Star topology versus the redundancy of a Mesh network.</p>
                `;
                break;
            case 3:
                pageSpecificContent = `
                    <p>Today, on **Networking Fundamentals - Page 3**, we cover the OSI Model.</p>
                    <p>The Open Systems Interconnection (OSI) model is a conceptual framework that describes network functions. It consists of seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. Understanding this model is crucial for troubleshooting and designing networks.</p>
                    <p>Remember, "Please Do Not Throw Sausage Pizza Away" (Physical, Data Link, Network, Transport, Session, Presentation, Application).</p>
                `;
                break;
            default:
                pageSpecificContent = `
                    <p><strong>Networking Fundamentals - Page ${pageNumber}</strong></p>
                    <p>This page continues our exploration into advanced networking concepts. We're now discussing topics like routing algorithms, network security best practices, and the latest advancements in wireless technologies.</p>
                    <ul>
                        <li>Detailed analysis of Network Protocols and Standards.</li>
                        <li>Understanding IP addressing and subnetting.</li>
                        <li>Exploring network security threats and countermeasures.</li>
                    </ul>
                    <p>Keep up the great work!</p>
                `;
        }
    } else if (courseTitle === 'IT') {
        totalPages = 54;
        switch (pageNumber) {
            case 1:
                pageSpecificContent = `
                    <p>Welcome to **Information Technology Basics - Page 1**.</p>
                    <p>This page introduces the broad field of Information Technology, covering its definition, key components (hardware, software, data, people, processes), and its impact on modern society and businesses.</p>
                    <p>IT is everywhere, from your smartphone to global financial systems.</p>
                `;
                break;
            case 2:
                pageSpecificContent = `
                    <p>On **Information Technology Basics - Page 2**, we focus on Computer Hardware.</p>
                    <p>Explore the essential physical components of a computer system: CPU, RAM, Storage (HDD/SSD), Motherboard, and peripherals. Understand their roles and how they interact to execute tasks.</p>
                    <p>A strong understanding of hardware is foundational for any IT professional.</p>
                `;
                break;
            case 3:
                pageSpecificContent = `
                    <p>Today, on **Information Technology Basics - Page 3**, we discuss Software Categories.</p>
                    <p>Differentiate between System Software (Operating Systems, Utility Programs) and Application Software (Word Processors, Browsers, Games). Learn about their functions and examples of each.</p>
                    <p>Software is what makes hardware perform useful functions.</p>
                `;
                break;
            default:
                pageSpecificContent = `
                    <p><strong>Information Technology Basics - Page ${pageNumber}</strong></p>
                    <p>This page expands on various aspects of IT, including cybersecurity threats, cloud computing models, and database management systems. We're exploring how these technologies shape the digital landscape.</p>
                    <ul>
                        <li>Understanding the nuances of Data Management and Big Data.</li>
                        <li>Practical examples for Cloud Computing Services (IaaS, PaaS, SaaS).</li>
                        <li>Future trends in Artificial Intelligence and Machine Learning in IT.</li>
                    </ul>
                    <p>Continue your journey into the world of IT!</p>
                `;
        }
    } else {
        totalPages = 10;
        pageSpecificContent = `
            <p><strong>Generic Course Notes - Page ${pageNumber}</strong></p>
            <p>This is placeholder content for a generic course. In a real system, you would have specific notes for each course and page.</p>
            <p>Current Page: ${pageNumber} / ${totalPages}</p>
        `;
    }

    if (pageNumber > totalPages) {
        console.warn(`WARNING: Fetch Notes - Page ${pageNumber} not found for ${courseTitle}. Total pages: ${totalPages}.`);
        return res.status(404).json({ error: `Page ${pageNumber} not found for ${courseTitle}. Total pages: ${totalPages}.` });
    }

    const noteContentHtml = `
        <div style="padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9; font-family: 'Inter', sans-serif; line-height: 1.6;">
            ${pageSpecificContent}
            <p style="font-size: 0.8em; color: #999; margin-top: 20px;">(This is dynamically generated content for demonstration purposes.)</p>
        </div>
    `;

    res.json({
        courseTitle: courseTitle,
        pageNumber: pageNumber,
        totalPages: totalPages,
        content: noteContentHtml
    });
});

// --- NEW: Email Test Endpoint ---
// Use this endpoint to quickly test your Nodemailer setup.
// Replace 'test_recipient@example.com' with an actual email address you can check.
app.post('/test-email', async (req, res) => {
    const { recipientEmail } = req.body; // Expect a recipient email in the request body

    if (!recipientEmail) {
        return res.status(400).json({ error: 'Recipient email is required for testing.' });
    }

    const testSubject = 'Test Email from E-Learning Platform';
    const testHtml = `
        <p>This is a test email sent from your Node.js E-Learning Platform backend.</p>
        <p>If you received this, your Nodemailer setup is likely configured correctly!</p>
        <p>Please remember to replace placeholder credentials and email addresses in production.</p>
    `;

    console.log(`Attempting to send test email to: ${recipientEmail}`);
    try {
        await sendEmail(recipientEmail, testSubject, testHtml);
        res.status(200).json({ message: `Test email sent successfully to ${recipientEmail}!` });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ error: 'Failed to send test email. Check server console for details.', details: error.message });
    }
});


// Start the server
const port = 5000;
app.listen(port, () => {
    console.log(`SUCCESS: Server listening on port ${port}`);
    console.log(`Available endpoints:`);
    console.log(`  POST /registration`);
    console.log(`  POST /login`);
    console.log(`  POST /reset`);
    console.log(`  POST /enrollments`); // NEW
    console.log(`  PUT /enrollments/complete`); // NEW
    console.log(`  GET /admin/modules`);
    console.log(`  POST /admin/modules`);
    console.log(`  PUT /admin/modules/:id`);
    console.log(`  DELETE /admin/modules/:id`);
    console.log(`  PUT /admin/modules/:id/publish`);
    console.log(`  PUT /admin/modules/:moduleId/assign-instructor`);
    console.log(`  GET /admin/users`);
    console.log(`  PUT /admin/users/:id/promote`);
    console.log(`  PUT /admin/users/:id/status`);
    console.log(`  DELETE /admin/users/:id`);
    console.log(`  GET /admin/reports/enrollments`);
    console.log(`  GET /admin/reports/completion-rates`);
    console.log(`  GET /admin/reports/revenue`);
    console.log(`  GET /courses`);
    console.log(`  POST /courses`);
    console.log(`  GET /courses/:id`);
    console.log(`  PUT /courses/:id`);
    console.log(`  DELETE /courses/:id`);
    console.log(`  GET /assessments/:courseName`);
    console.log(`  GET /courses/:courseTitle/notes/:pageNumber`);
    console.log(`  POST /test-email`); // NEW TEST ENDPOINT
});
