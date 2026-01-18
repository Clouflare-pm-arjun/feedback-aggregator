-- Feedback table to store feedback from various sources
CREATE TABLE IF NOT EXISTS feedback (
	id TEXT PRIMARY KEY,
	source TEXT NOT NULL, -- 'support', 'discord', 'github', 'email', 'twitter', 'forum'
	source_id TEXT, -- Original ID from the source system
	title TEXT,
	content TEXT NOT NULL,
	author TEXT, -- Username, email, or identifier
	author_email TEXT,
	status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'processed'
	metadata JSON, -- Additional source-specific metadata
	created_at INTEGER NOT NULL, -- Unix timestamp
	updated_at INTEGER NOT NULL -- Unix timestamp
);

-- Index for querying by source
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Index for querying by created_at
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
