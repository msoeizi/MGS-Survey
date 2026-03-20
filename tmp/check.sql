.headers on
.mode column
SELECT count(*) as total_tokens, 
       sum(case when c.email is null or c.email = '' then 1 else 0 end) as missing_emails
FROM AccessToken a 
LEFT JOIN Contact c ON a.contactId = c.id 
WHERE a.batchId = (SELECT id FROM Batch ORDER BY createdAt DESC LIMIT 1);
