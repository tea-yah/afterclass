-- Run after schema.sql: mysql -u root -p afterclass < seed.sql
-- PLACEHOLDER data. Event dates are relative to the day you run this script.
USE afterclass;

INSERT INTO teams (name, type, description) VALUES
('Music Club MIT','Music','Open mics, jam sessions and the annual band battle.'),
('Formula Manipal','Technical','Designs and builds a race car for student formula competitions.'),
('Cybersecurity Club MIT','Technical','CTFs, security talks and crypto study groups.'),
('AI & Data Club','Technical','Reading groups, projects and talks on machine learning.'),
('Innovation Lab MIT','Hackathon','Hackathons and a maker space for student ideas.'),
('Open Source Society','Workshop','Workshops on Git, Linux and contributing to open source.'),
('Dramatics Society MIT','Theatre','Stage plays, street theatre and script writing.'),
('Cultural Committee','Cultural','Runs campus fests, dance showcases and food stalls.'),
('Sports Council','Sports','Inter-block leagues and campus tournaments.'),
('Design Collective','Workshop','Posters, UI design and visual identity for campus events.'),
('Quiz Club MIT','Competition','Weekly quizzes and the inter-college quiz league.'),
('Placement Cell Student Team','Recruitment','Resume reviews, mock interviews and recruiter talks.');

INSERT INTO tags (tag_name) VALUES ('ctf'),('security'),('crypto'),('coding'),('teams'),('prizes'),('git'),('beginners'),('careers'),('resume'),('live'),('acoustic'),('open-mic'),('play'),('drama'),('dance'),('food'),('fest'),('football'),('league'),('ml'),('mlops'),('talk'),('design'),('figma'),('quiz'),('trivia'),('jam'),('freshers'),('robotics');

INSERT INTO events (title, description, team_id, category, venue, event_mode, start_datetime, end_datetime, registration_required, registration_fee, external_link, approval_status, event_status) VALUES
('Break the Cipher: CTF Night','A beginner-friendly capture-the-flag with classical ciphers, RSA warm-ups and web challenges. Teams of up to three. Bring a laptop.',(SELECT team_id FROM teams WHERE name='Cybersecurity Club MIT'),'Competition','Academic Block 5, Lab 3','hybrid',TIMESTAMP(CURDATE()+INTERVAL 1 DAY,'18:00:00'),TIMESTAMP(CURDATE()+INTERVAL 1 DAY,'23:00:00'),1,0,'https://example.com/register/ctf','approved','scheduled'),
('Build48 Hackathon','Forty-eight hours to build something useful for campus life. Mentors from alumni will drop in on Saturday. Meals included.',(SELECT team_id FROM teams WHERE name='Innovation Lab MIT'),'Hackathon','Innovation Centre','offline',TIMESTAMP(CURDATE()+INTERVAL 6 DAY,'09:00:00'),TIMESTAMP(CURDATE()+INTERVAL 8 DAY,'09:00:00'),1,300,'https://example.com/register/build48','approved','scheduled'),
('Intro to Git & GitHub','Hands-on session covering commits, branches and pull requests. Ideal for first-years starting their first team project.',(SELECT team_id FROM teams WHERE name='Open Source Society'),'Workshop','NLH 204','offline',TIMESTAMP(CURDATE()+INTERVAL 2 DAY,'16:00:00'),TIMESTAMP(CURDATE()+INTERVAL 2 DAY,'18:00:00'),1,0,'https://example.com/register/git','approved','scheduled'),
('Campus Recruitment Prep Talk','Senior students share what recruiters look for in resumes, aptitude rounds and interviews. Open seating.',(SELECT team_id FROM teams WHERE name='Placement Cell Student Team'),'Recruitment','Dr. TMA Pai Hall','offline',TIMESTAMP(CURDATE()+INTERVAL 3 DAY,'17:00:00'),TIMESTAMP(CURDATE()+INTERVAL 3 DAY,'18:30:00'),0,0,'https://example.com/info/prep','approved','scheduled'),
('Unplugged Evenings','An open-mic evening with acoustic sets from students. Sign up on the day or just come to listen.',(SELECT team_id FROM teams WHERE name='Music Club MIT'),'Music','Quadrangle Lawn','offline',TIMESTAMP(CURDATE(),'19:00:00'),TIMESTAMP(CURDATE(),'22:00:00'),0,0,'https://example.com/info/unplugged','approved','scheduled'),
('The Last Rehearsal','A one-act comedy about a drama club that cannot agree on anything. Limited seating, so register early.',(SELECT team_id FROM teams WHERE name='Dramatics Society MIT'),'Theatre','Auditorium','offline',TIMESTAMP(CURDATE()+INTERVAL 8 DAY,'18:30:00'),TIMESTAMP(CURDATE()+INTERVAL 8 DAY,'20:30:00'),1,50,'https://example.com/register/rehearsal','approved','scheduled'),
('Rangotsav: Cultural Showcase','Regional dance, food stalls and performances by every hostel block. Dress in your favourite traditional wear.',(SELECT team_id FROM teams WHERE name='Cultural Committee'),'Cultural','Student Plaza','offline',TIMESTAMP(CURDATE()+INTERVAL 12 DAY,'16:00:00'),TIMESTAMP(CURDATE()+INTERVAL 12 DAY,'21:00:00'),0,100,'https://example.com/info/rangotsav','approved','scheduled'),
('Inter-Block Football League: Finals','The final of this season''s inter-block league. Come with your block and make some noise.',(SELECT team_id FROM teams WHERE name='Sports Council'),'Sports','Main Ground','offline',TIMESTAMP(CURDATE()+INTERVAL 4 DAY,'16:30:00'),TIMESTAMP(CURDATE()+INTERVAL 4 DAY,'18:30:00'),0,0,'https://example.com/info/football','approved','scheduled'),
('ML in Production','An alumnus walks through deploying a small ML service, from notebook to monitored API. Q&A at the end.',(SELECT team_id FROM teams WHERE name='AI & Data Club'),'Technical','Online (Teams)','online',TIMESTAMP(CURDATE()+INTERVAL 5 DAY,'15:00:00'),TIMESTAMP(CURDATE()+INTERVAL 5 DAY,'16:30:00'),1,0,'https://example.com/register/ml','approved','scheduled'),
('Poster Design in a Weekend','Learn layout, type and colour by designing a fest poster from scratch. Materials and Figma files provided.',(SELECT team_id FROM teams WHERE name='Design Collective'),'Workshop','Library Seminar Room','offline',TIMESTAMP(CURDATE()+INTERVAL 10 DAY,'10:00:00'),TIMESTAMP(CURDATE()+INTERVAL 10 DAY,'15:00:00'),1,150,'https://example.com/register/poster','approved','scheduled'),
('Quiz Night: Everything & Nothing','Teams of three tackle general-knowledge rounds across tech, pop culture and campus trivia.',(SELECT team_id FROM teams WHERE name='Quiz Club MIT'),'Competition','NLH Auditorium','offline',TIMESTAMP(CURDATE()+INTERVAL 15 DAY,'18:00:00'),TIMESTAMP(CURDATE()+INTERVAL 15 DAY,'20:00:00'),1,20,'https://example.com/register/quiz','approved','cancelled'),
('Freshers'' Jam Session','A relaxed jam for new students to meet the band scene. This one has already happened.',(SELECT team_id FROM teams WHERE name='Music Club MIT'),'Music','Student Plaza','offline',TIMESTAMP(CURDATE()-INTERVAL 3 DAY,'19:00:00'),TIMESTAMP(CURDATE()-INTERVAL 3 DAY,'21:00:00'),0,0,'https://example.com/info/jam','approved','scheduled'),
('Robotics Open House','Awaiting admin approval, so it must NOT appear on the public site.',(SELECT team_id FROM teams WHERE name='Formula Manipal'),'Technical','Innovation Centre','offline',TIMESTAMP(CURDATE()+INTERVAL 9 DAY,'11:00:00'),TIMESTAMP(CURDATE()+INTERVAL 9 DAY,'13:00:00'),0,0,NULL,'pending','scheduled');

INSERT INTO event_tags (event_id, tag_id)
SELECT e.event_id, t.tag_id FROM events e JOIN tags t ON (e.title, t.tag_name) IN (
('Break the Cipher: CTF Night','ctf'),('Break the Cipher: CTF Night','security'),('Break the Cipher: CTF Night','crypto'),
('Build48 Hackathon','coding'),('Build48 Hackathon','teams'),('Build48 Hackathon','prizes'),
('Intro to Git & GitHub','git'),('Intro to Git & GitHub','beginners'),
('Campus Recruitment Prep Talk','careers'),('Campus Recruitment Prep Talk','resume'),
('Unplugged Evenings','live'),('Unplugged Evenings','acoustic'),('Unplugged Evenings','open-mic'),
('The Last Rehearsal','play'),('The Last Rehearsal','drama'),
('Rangotsav: Cultural Showcase','dance'),('Rangotsav: Cultural Showcase','food'),('Rangotsav: Cultural Showcase','fest'),
('Inter-Block Football League: Finals','football'),('Inter-Block Football League: Finals','league'),
('ML in Production','ml'),('ML in Production','mlops'),('ML in Production','talk'),
('Poster Design in a Weekend','design'),('Poster Design in a Weekend','figma'),
('Quiz Night: Everything & Nothing','quiz'),('Quiz Night: Everything & Nothing','trivia'),
('Freshers'' Jam Session','jam'),('Freshers'' Jam Session','freshers'),
('Robotics Open House','robotics'));
