-- Mock data for various feedback sources
-- This can be run manually to populate the database with sample data

-- Customer Support Tickets
INSERT INTO feedback (id, source, source_id, title, content, author, author_email, status, metadata, created_at, updated_at) VALUES
('fb-001', 'support', 'TICKET-12345', 'Slow API response times', 'We are experiencing very slow response times from the API, especially during peak hours. Response times are around 5-10 seconds which is unacceptable.', 'john.doe@company.com', 'john.doe@company.com', 'pending', '{"priority": "high", "category": "performance", "tags": ["api", "performance"]}', 1704067200, 1704067200),
('fb-002', 'support', 'TICKET-12346', 'Feature request: Dark mode', 'Please add a dark mode option to the dashboard. Many users work late hours and would benefit from this feature.', 'sarah.smith@company.com', 'sarah.smith@company.com', 'pending', '{"priority": "medium", "category": "feature-request", "tags": ["ui", "accessibility"]}', 1704153600, 1704153600),
('fb-003', 'support', 'TICKET-12347', 'Payment processing error', 'Getting an error when trying to process payments. Error code: PAYMENT_001. This is blocking our checkout flow.', 'billing@startup.io', 'billing@startup.io', 'pending', '{"priority": "critical", "category": "bug", "tags": ["payment", "critical"]}', 1704240000, 1704240000);

-- Discord messages
INSERT INTO feedback (id, source, source_id, title, content, author, author_email, status, metadata, created_at, updated_at) VALUES
('fb-004', 'discord', 'discord-msg-789', NULL, 'Hey team! Love the new update but I noticed the search feature is a bit slow. Any plans to optimize it?', 'DiscordUser#1234', NULL, 'pending', '{"channel": "general", "server": "community", "message_id": "789"}', 1704326400, 1704326400),
('fb-005', 'discord', 'discord-msg-790', NULL, 'The mobile app crashes when I try to upload large files. Happens every time with files over 50MB.', 'MobileDev#5678', NULL, 'pending', '{"channel": "bug-reports", "server": "community", "message_id": "790"}', 1704412800, 1704412800),
('fb-006', 'discord', 'discord-msg-791', NULL, 'Would be great to have keyboard shortcuts for common actions. Like Cmd+K for quick search.', 'PowerUser#9012', NULL, 'pending', '{"channel": "feature-requests", "server": "community", "message_id": "791"}', 1704499200, 1704499200);

-- GitHub Issues
INSERT INTO feedback (id, source, source_id, title, content, author, author_email, status, metadata, created_at, updated_at) VALUES
('fb-007', 'github', 'github-issue-456', 'Memory leak in worker initialization', 'We have identified a memory leak that occurs during worker initialization. The memory usage keeps growing over time and eventually causes the worker to crash.', 'github-user-1', 'dev@example.com', 'pending', '{"repo": "cloudflare/workers", "issue_number": 456, "labels": ["bug", "memory"], "state": "open"}', 1704585600, 1704585600),
('fb-008', 'github', 'github-issue-457', 'Add support for WebAssembly modules', 'It would be great to have native support for WebAssembly modules in Workers. This would enable better performance for compute-intensive tasks.', 'github-user-2', 'contributor@example.com', 'pending', '{"repo": "cloudflare/workers", "issue_number": 457, "labels": ["enhancement", "wasm"], "state": "open"}', 1704672000, 1704672000),
('fb-009', 'github', 'github-issue-458', 'Documentation missing for R2 bucket permissions', 'The documentation for R2 bucket permissions is incomplete. Need examples for setting up CORS and access policies.', 'github-user-3', 'docs@example.com', 'pending', '{"repo": "cloudflare/docs", "issue_number": 458, "labels": ["documentation"], "state": "open"}', 1704758400, 1704758400);

-- Email feedback
INSERT INTO feedback (id, source, source_id, title, content, author, author_email, status, metadata, created_at, updated_at) VALUES
('fb-010', 'email', 'email-msg-001', 'Re: Product Feedback', 'Hi team, I wanted to share some feedback about the onboarding process. It feels a bit overwhelming with too many steps. Could we simplify it?', 'feedback@customer.com', 'feedback@customer.com', 'pending', '{"subject": "Product Feedback", "thread_id": "thread-001", "in_reply_to": null}', 1704844800, 1704844800),
('fb-011', 'email', 'email-msg-002', 'Re: Feature Request', 'I think adding a collaboration feature where multiple users can work on the same document would be a game-changer for our team.', 'team-lead@company.com', 'team-lead@company.com', 'pending', '{"subject": "Feature Request", "thread_id": "thread-002", "in_reply_to": null}', 1704931200, 1704931200),
('fb-012', 'email', 'email-msg-003', 'Re: Bug Report', 'There is a bug in the export functionality. When exporting to PDF, some formatting is lost, especially tables and images.', 'user@startup.io', 'user@startup.io', 'pending', '{"subject": "Bug Report", "thread_id": "thread-003", "in_reply_to": null}', 1705017600, 1705017600);

-- X/Twitter mentions
INSERT INTO feedback (id, source, source_id, title, content, author, author_email, status, metadata, created_at, updated_at) VALUES
('fb-013', 'twitter', 'tweet-1234567890', NULL, '@CloudflareWorkers The new AI features are amazing! But I wish there was better error handling when the AI model times out.', '@tech_enthusiast', NULL, 'pending', '{"tweet_id": "1234567890", "user_id": "tech_enthusiast", "retweets": 5, "likes": 23, "url": "https://twitter.com/tech_enthusiast/status/1234567890"}', 1705104000, 1705104000),
('fb-014', 'twitter', 'tweet-1234567891', NULL, '@CloudflareWorkers Love the platform but the pricing is confusing. Would love to see a clearer breakdown of costs.', '@startup_founder', NULL, 'pending', '{"tweet_id": "1234567891", "user_id": "startup_founder", "retweets": 12, "likes": 45, "url": "https://twitter.com/startup_founder/status/1234567891"}', 1705190400, 1705190400),
('fb-015', 'twitter', 'tweet-1234567892', NULL, '@CloudflareWorkers The documentation is great but could use more code examples. Sometimes hard to understand without seeing it in action.', '@developer_123', NULL, 'pending', '{"tweet_id": "1234567892", "user_id": "developer_123", "retweets": 8, "likes": 34, "url": "https://twitter.com/developer_123/status/1234567892"}', 1705276800, 1705276800);

-- Community Forum posts
INSERT INTO feedback (id, source, source_id, title, content, author, author_email, status, metadata, created_at, updated_at) VALUES
('fb-016', 'forum', 'forum-post-1001', 'Integration with third-party services', 'Has anyone successfully integrated with Stripe? I am having trouble with webhook verification. The documentation seems outdated.', 'forum_user_1', 'forum_user_1@example.com', 'pending', '{"forum": "community", "category": "integrations", "views": 156, "replies": 8, "upvotes": 12}', 1705363200, 1705363200),
('fb-017', 'forum', 'forum-post-1002', 'Performance optimization tips', 'I noticed my worker is running slower than expected. Any tips on optimizing performance? Currently using D1 and R2.', 'forum_user_2', 'forum_user_2@example.com', 'pending', '{"forum": "community", "category": "performance", "views": 234, "replies": 15, "upvotes": 28}', 1705449600, 1705449600),
('fb-018', 'forum', 'forum-post-1003', 'Feature suggestion: Better monitoring', 'It would be great to have more detailed monitoring and analytics. Right now it is hard to debug issues in production.', 'forum_user_3', 'forum_user_3@example.com', 'pending', '{"forum": "community", "category": "feature-request", "views": 89, "replies": 5, "upvotes": 19}', 1705536000, 1705536000);
