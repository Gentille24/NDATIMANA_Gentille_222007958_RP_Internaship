-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2025 at 02:13 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elearning`
--

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

CREATE TABLE `assessments` (
  `id` int(11) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `question` text NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`options`)),
  `answer` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assessments`
--

INSERT INTO `assessments` (`id`, `course_name`, `question`, `options`, `answer`, `created_at`) VALUES
(1, 'Networking', 'Which of the following is a Layer 3 device in the OSI model?', '[\"Switch\", \"Hub\", \"Router\", \"Bridge\", \"Repeater\"]', 'Router', '2025-06-03 07:57:17'),
(2, 'Networking', 'What is the purpose of the Domain Name System (DNS)?', '[\"To assign IP addresses to devices\", \"To encrypt internet connections\", \"To translate domain names into IP addresses\", \"To host websites\", \"To manage firewall rules\"]', 'To translate domain names into IP addresses', '2025-06-03 07:57:17'),
(3, 'Networking', 'Which of the following IP addresses is a private IP address?', '[\"192.0.2.1\", \"10.0.0.5\", \"8.8.8.8\", \"172.32.0.1\", \"169.254.0.1\"]', '10.0.0.5', '2025-06-03 07:57:17'),
(4, 'Networking', 'What protocol is used to send email from a client to a mail server?', '[\"HTTP\", \"IMAP\", \"POP3\", \"SMTP\", \"FTP\"]', 'SMTP', '2025-06-03 07:57:17'),
(5, 'Networking', 'Which of the following topologies has the highest fault tolerance?', '[\"Bus\", \"Star\", \"Ring\", \"Mesh\", \"Tree\"]', 'Mesh', '2025-06-03 07:57:17'),
(6, 'Networking', 'What is the default port number for HTTP?', '[\"443\", \"22\", \"80\", \"21\", \"110\"]', '80', '2025-06-03 07:57:17'),
(7, 'Networking', 'Which layer of the OSI model is responsible for reliable data transfer?', '[\"Physical\", \"Network\", \"Transport\", \"Session\", \"Data Link\"]', 'Transport', '2025-06-03 07:57:17'),
(8, 'Networking', 'Which device is used to connect different network segments and operates at Layer 2?', '[\"Router\", \"Firewall\", \"Hub\", \"Switch\", \"Gateway\"]', 'Switch', '2025-06-03 07:57:17'),
(9, 'Networking', 'Which of the following is NOT a characteristic of TCP?', '[\"Connection-oriented\", \"Reliable delivery\", \"Sequencing\", \"Fast, low latency\", \"Error checking\"]', 'Fast, low latency', '2025-06-03 07:57:17'),
(10, 'Networking', 'What is the function of ARP (Address Resolution Protocol)?', '[\"Assign IP addresses\", \"Translate domain names\", \"Map MAC addresses to IP addresses\", \"Map IP addresses to MAC addresses\", \"Filter network traffic\"]', 'Map IP addresses to MAC addresses', '2025-06-03 07:57:17'),
(11, 'IT', 'Which of the following is an example of system software?', '[\"Microsoft Word\", \"Adobe Photoshop\", \"Linux Operating System\", \"Google Chrome\", \"WhatsApp\"]', 'Linux Operating System', '2025-06-03 07:58:10'),
(12, 'IT', 'Which of the following is used to protect a computer from unauthorized access?', '[\"Compiler\", \"Firewall\", \"Text Editor\", \"Router\", \"Modem\"]', 'Firewall', '2025-06-03 07:58:10'),
(13, 'IT', 'Which one is a non-volatile memory?', '[\"RAM\", \"Cache\", \"ROM\", \"Registers\", \"Stack\"]', 'ROM', '2025-06-03 07:58:10'),
(14, 'IT', 'Which language is considered low-level and machine-dependent?', '[\"Java\", \"C++\", \"Assembly Language\", \"Python\", \"HTML\"]', 'Assembly Language', '2025-06-03 07:58:10'),
(15, 'IT', 'Which device is used to convert digital signals into analog and vice versa?', '[\"Switch\", \"Repeater\", \"Router\", \"Modem\", \"Bridge\"]', 'Modem', '2025-06-03 07:58:10'),
(16, 'IT', 'What does GUI stand for?', '[\"General User Input\", \"Graphic Utility Interface\", \"Graphical User Interface\", \"General Unit Interface\", \"Graphical User Integration\"]', 'Graphical User Interface', '2025-06-03 07:58:10'),
(17, 'IT', 'In database management systems, what does SQL stand for?', '[\"Standard Query Language\", \"Sequential Query Language\", \"Structured Query Language\", \"Server Query Language\", \"Static Query Language\"]', 'Structured Query Language', '2025-06-03 07:58:10'),
(18, 'IT', 'What is the primary function of an operating system?', '[\"Manage internet connections\", \"Store files in the cloud\", \"Manage hardware and software resources\", \"Provide antivirus protection\", \"Monitor energy usage\"]', 'Manage hardware and software resources', '2025-06-03 07:58:10'),
(19, 'IT', 'Which of the following is NOT a cloud storage provider?', '[\"Google Drive\", \"Dropbox\", \"OneDrive\", \"Oracle VM\", \"iCloud\"]', 'Oracle VM', '2025-06-03 07:58:10'),
(20, 'IT', 'Which of the following best describes phishing?', '[\"Downloading illegal software\", \"Sending spam emails\", \"Tricking users into revealing personal information\", \"Installing firewalls\", \"Encrypting network traffic\"]', 'Tricking users into revealing personal information', '2025-06-03 07:58:10');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `title` char(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `Credits` int(5) NOT NULL,
  `Lecturer ID` int(5) NOT NULL,
  `pages` int(11) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `enrollment_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `description`, `Credits`, `Lecturer ID`, `pages`, `is_published`, `enrollment_count`) VALUES
(4, 'Networking', 'this is module structure', 15, 5, 50, 1, 5),
(5, 'IT', 'MODULE SLIDES', 20, 6, 45, 1, 6),
(8, 'financial accounting', 'This module will help me learner how to manage limited resources', 10, 5, 45, 1, 0),
(12, 'french', 'french course', 15, 7, 10, 1, 0),
(15, 'kinyarwanda', 'more information', 10, 10, 19, 1, 0),
(17, 'css', 'ddf', 6, 44, 11, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrollment_date` datetime DEFAULT current_timestamp(),
  `completion_status` varchar(20) DEFAULT 'in_progress',
  `completion_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `user_id`, `course_id`, `enrollment_date`, `completion_status`, `completion_date`) VALUES
(3, 20, 5, '2025-06-06 09:17:59', 'in_progress', NULL),
(4, 24, 5, '2025-06-06 09:22:55', 'in_progress', NULL),
(7, 28, 4, '2025-06-06 10:05:09', 'in_progress', NULL),
(8, 29, 5, '2025-06-09 07:38:55', 'in_progress', NULL),
(10, 20, 4, '2025-06-09 16:27:52', 'in_progress', NULL),
(12, 40, 5, '2025-06-11 09:10:14', 'in_progress', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `registration`
--

CREATE TABLE `registration` (
  `id` int(11) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration`
--

INSERT INTO `registration` (`id`, `firstname`, `lastname`, `username`, `email`, `password`, `role`, `status`) VALUES
(20, 'nelly', 'iragena', 'nelly', 'ira@gmail.com', '$2b$10$GyBlBYC4sXdEU3dYgt7ws.i0s63127iNBnkjPMCFt4ikLgbWSnGHu', 'learner', 'disabled'),
(21, 'goloria', 'mbabazi', 'gogo', 'm1@gmail.com', '$2b$10$OyNjghxwFJBMuNXflClcbOCdQ5ZueGQ.3bIJY0j28wkJuTZiNLwWG', 'lecturer', 'active'),
(22, 'gentille', 'uwimana', 'simi', 'nn@gmail.com', '$2b$10$LgPxjxV34smdF6lanbi10eZVy/2.xv6mJ60yWTWeAxLtvcp7W/846', 'admin', 'active'),
(23, 'b', 'c', 'gisele', 'g@gmail.com', '$2b$10$A0YIWQyK8DL9.qzmgxPx7.N81QO28.ZjZFkjfmW52YVpKHf8XIk1q', 'lecturer', 'active'),
(24, 'tier', 'vb', 'tresol', 'tresol@gmail.com', '$2b$10$xKTVvaeM1alc.5CmSbzo9.HAx3WO7wo89tzizk2D.k/PAGXRm9sFW', 'learner', 'active'),
(28, 'ndatimana', 'gentille', 'gentille', 'ndatimanagentille@gmail.com', '$2b$10$MdV/YL7Lt4V0wmjhVaTrG.KTheH9c0llDs3aUlLSEieWb4zmkEUvi', 'learner', 'active'),
(29, 'uwera', 'bg', 'uwera', 'u@gmail.com', '$2b$10$6I63DZ46ez00zgnWXj8Oa..Aq26GKwm3UZxs7m4CL71wJCR3BGysy', 'learner', 'active'),
(30, 'teta', 'hirwa', 'hirwa', 'hirwa@gmail.com', '$2b$10$779z1YaPi8CSRbYMsnQkj.LYZcnF24BKXqWxtQCe8L8yOIoBcBCUa', 'lecturer', 'active'),
(31, 'amina', 'uwera', 'amina', 'amina@gmail.com', '$2b$10$Sg7CwlbkzbgcTslcKlCd0upKXntz0DxyhL6/1bJ5U9NzeCqwylYhO', 'learner', 'active'),
(39, 'fidele', 'uwimana', 'fidele', 'fidele@gmail.com', '$2b$10$FbWfaNgUhq8sDTdHVl2WmuIJUYTCsLOXxt0Ike0xaLWWJGFoBfX3O', 'lecturer', 'active'),
(40, 'janvier', 'niyo', 'janvier', 'm@gmail.com', '$2b$10$7wVDIrcAViEIsh/MRuqWuO6mfijUb46sMvo5fr1L57t3HRUjHJkaa', 'learner', 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`course_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `registration`
--
ALTER TABLE `registration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `registration`
--
ALTER TABLE `registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `registration` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
