-- OPTIONAL placeholder rows so you can see the calendar colours. NOT the real academic calendar.
-- mysql -u root -p afterclass < seed_academic.sql   (dates fall in the current month)
USE afterclass;
INSERT INTO academic_events (title, description, start_datetime, end_datetime, category) VALUES
('Course registration deadline', 'Placeholder entry.', TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-05'),'09:00:00'), TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-05'),'17:00:00'), 'Deadline'),
('Mid-semester examinations', 'Placeholder entry.', TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-10'),'09:00:00'), TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-16'),'17:00:00'), 'Exam'),
('Institute holiday', 'Placeholder entry.', TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-20'),'00:00:00'), TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-20'),'23:59:00'), 'Holiday'),
('Project review week', 'Placeholder entry.', TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-24'),'10:00:00'), TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-26'),'16:00:00'), 'Academic'),
('ES End sem lab', 'Placeholder entry.', TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-03'),'9:00:00'), TIMESTAMP(DATE_FORMAT(CURDATE(),'%Y-%m-03'),'11:00:00'), 'Exam');
