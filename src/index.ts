/**
 * Feedback Aggregator Worker
 * 
 * This worker receives feedback from various sources (webhooks, scrapers, etc.)
 * and stores them in D1 database. It is designed to write to a Cloudflare Queue
 * "FEEDBACKS-TO-PROCESS" for downstream processing by the feedback-workflow.
 * 
 * Since Cloudflare Queue is a paid feature, the queue writing is documented
 * but not implemented. See README.md for details.
 */

interface Feedback {
	id: string;
	source: 'support' | 'discord' | 'github' | 'email' | 'twitter' | 'forum';
	source_id?: string;
	title?: string;
	content: string;
	author?: string;
	author_email?: string;
	status?: 'pending' | 'processing' | 'processed';
	metadata?: Record<string, any>;
	created_at: number;
	updated_at: number;
}

interface Env {
	feedback_d: D1Database; // D1 database binding
	ASSETS?: Fetcher; // Static assets binding for OpenAPI spec
	WORKFLOW_SERVICE: Fetcher; // Service binding to feedback-workflow worker
	// FEEDBACKS_QUEUE: Queue; // Cloudflare Queue binding (paid feature - not implemented)
}

/**
 * Generate a unique ID for feedback
 */
function generateFeedbackId(): string {
	return `fb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Store feedback in D1 database
 */
async function storeFeedback(db: D1Database, feedback: Feedback): Promise<void> {
	const metadataJson = feedback.metadata ? JSON.stringify(feedback.metadata) : null;
	
	await db.prepare(
		`INSERT INTO feedback (
			id, source, source_id, title, content, author, author_email, 
			status, metadata, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).bind(
		feedback.id,
		feedback.source,
		feedback.source_id || null,
		feedback.title || null,
		feedback.content,
		feedback.author || null,
		feedback.author_email || null,
		feedback.status || 'pending',
		metadataJson,
		feedback.created_at,
		feedback.updated_at
	).run();
}

/**
 * Parse incoming feedback from request body
 */
function parseFeedback(body: any): Feedback | null {
	if (!body || !body.content || !body.source) {
		return null;
	}

	const now = Math.floor(Date.now() / 1000);
	
	return {
		id: body.id || generateFeedbackId(),
		source: body.source,
		source_id: body.source_id,
		title: body.title,
		content: body.content,
		author: body.author,
		author_email: body.author_email,
		status: body.status || 'pending',
		metadata: body.metadata || {},
		created_at: body.created_at || now,
		updated_at: body.updated_at || now,
	};
}

/**
 * Handle POST request to ingest feedback
 */
async function handlePost(request: Request, env: Env): Promise<Response> {
	try {
		const body = await request.json();
		const feedback = parseFeedback(body);

		if (!feedback) {
			return Response.json(
				{ error: 'Invalid feedback data. Required: source, content' },
				{ status: 400 }
			);
		}

		// Store feedback in D1 database
		await storeFeedback(env.feedback_d, feedback);

		// In production, this would write to Cloudflare Queue "FEEDBACKS-TO-PROCESS"
		// Since Queue is a paid feature, this is documented but not implemented
		// See README.md for implementation details
		// await env.FEEDBACKS_QUEUE.send(feedback);

		return Response.json({
			success: true,
			id: feedback.id,
			message: 'Feedback stored successfully. In production, this would be sent to FEEDBACKS-TO-PROCESS queue.',
		}, { status: 201 });
	} catch (error) {
		console.error('Error processing feedback:', error);
		return Response.json(
			{ error: 'Failed to process feedback', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

/**
 * Serve Swagger UI documentation
 */
function serveSwaggerUI(baseUrl: string): Response {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Feedback Aggregator API Documentation</title>
	<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
	<style>
		html {
			box-sizing: border-box;
			overflow: -moz-scrollbars-vertical;
			overflow-y: scroll;
		}
		*, *:before, *:after {
			box-sizing: inherit;
		}
		body {
			margin:0;
			background: #fafafa;
		}
	</style>
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
	<script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
	<script>
		window.onload = function() {
			const ui = SwaggerUIBundle({
				url: "${baseUrl}/openapi.yaml",
				dom_id: '#swagger-ui',
				deepLinking: true,
				presets: [
					SwaggerUIBundle.presets.apis,
					SwaggerUIStandalonePreset
				],
				plugins: [
					SwaggerUIBundle.plugins.DownloadUrl
				],
				layout: "StandaloneLayout",
				validatorUrl: null,
				tryItOutEnabled: true
			});
		};
	</script>
</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html',
		},
	});
}

/**
 * Serve OpenAPI spec
 */
async function serveOpenAPISpec(env: Env, baseUrl: string): Promise<Response> {
	// Try to serve from static assets first
	if (env.ASSETS) {
		try {
			const specResponse = await env.ASSETS.fetch(new URL(`${baseUrl}/openapi.yaml`));
			if (specResponse.ok) {
				return new Response(specResponse.body, {
					headers: {
						'Content-Type': 'application/x-yaml',
					},
				});
			}
		} catch (error) {
			console.warn('Failed to serve OpenAPI spec from assets:', error);
		}
	}
	
	// Fallback: return JSON with instructions
	return Response.json({
		message: 'OpenAPI spec file not found. Please ensure openapi.yaml is in the public directory.',
		spec_url: `${baseUrl}/openapi.yaml`,
	}, {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

/**
 * Fetch pending feedback from D1 database
 */
async function fetchPendingFeedback(db: D1Database, limit: number = 10): Promise<Feedback[]> {
	const result = await db.prepare(
		'SELECT * FROM feedback WHERE status = ? ORDER BY created_at ASC LIMIT ?'
	).bind('pending', limit).all();

	return (result.results || []).map((row: any) => ({
		id: row.id,
		source: row.source,
		source_id: row.source_id || undefined,
		title: row.title || undefined,
		content: row.content,
		author: row.author || undefined,
		author_email: row.author_email || undefined,
		status: row.status || 'pending',
		metadata: row.metadata ? JSON.parse(row.metadata) : {},
		created_at: row.created_at,
		updated_at: row.updated_at,
	}));
}

/**
 * Update feedback status in D1 database
 */
async function updateFeedbackStatus(
	db: D1Database,
	feedbackId: string,
	status: 'pending' | 'processing' | 'processed'
): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	await db.prepare(
		'UPDATE feedback SET status = ?, updated_at = ? WHERE id = ?'
	).bind(status, now, feedbackId).run();
}

/**
 * Process queue: fetch pending feedback, send to workflow service, mark as processed
 */
async function processQueue(env: Env): Promise<{ processed: number; failed: number; errors: string[] }> {
	const errors: string[] = [];
	let processed = 0;
	let failed = 0;

	// Fetch pending feedback from D1
	const pendingFeedback = await fetchPendingFeedback(env.feedback_d, 10);

	if (pendingFeedback.length === 0) {
		return { processed: 0, failed: 0, errors: [] };
	}

	// Process each feedback item
	for (const feedback of pendingFeedback) {
		try {
			// Call workflow service via service binding
			const request = new Request('https://fake-host/process', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(feedback),
			});

			const response = await env.WORKFLOW_SERVICE.fetch(request);

			// If workflow service returns 200 OK, mark as processed
			if (response.status === 200) {
				await updateFeedbackStatus(env.feedback_d, feedback.id, 'processed');
				processed++;
			} else {
				// If not 200, log error but don't mark as processed
				const errorText = await response.text().catch(() => 'Unknown error');
				errors.push(`Feedback ${feedback.id}: Workflow service returned ${response.status} - ${errorText}`);
				failed++;
			}
		} catch (error) {
			// Network or other errors
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			errors.push(`Feedback ${feedback.id}: ${errorMessage}`);
			failed++;
		}
	}

	return { processed, failed, errors };
}

/**
 * Handle POST request to process queue
 */
async function handleProcessQueue(request: Request, env: Env): Promise<Response> {
	try {
		const result = await processQueue(env);

		return Response.json({
			success: true,
			processed: result.processed,
			failed: result.failed,
			errors: result.errors.length > 0 ? result.errors : undefined,
			message: `Processed ${result.processed} feedback items, ${result.failed} failed`,
		});
	} catch (error) {
		console.error('Error processing queue:', error);
		return Response.json(
			{ error: 'Failed to process queue', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

/**
 * Handle GET request to retrieve feedback
 */
async function handleGet(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url);
		const source = url.searchParams.get('source');
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let query = 'SELECT * FROM feedback WHERE 1=1';
		const params: any[] = [];

		if (source) {
			query += ' AND source = ?';
			params.push(source);
		}

		if (status) {
			query += ' AND status = ?';
			params.push(status);
		}

		query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
		params.push(limit, offset);

		const result = await env.feedback_d.prepare(query).bind(...params).all();

		// Parse metadata JSON strings
		const feedback = result.results?.map((row: any) => ({
			...row,
			metadata: row.metadata ? JSON.parse(row.metadata) : null,
		})) || [];

		return Response.json({
			success: true,
			data: feedback,
			count: feedback.length,
		});
	} catch (error) {
		console.error('Error retrieving feedback:', error);
		return Response.json(
			{ error: 'Failed to retrieve feedback', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const method = request.method;
		const url = new URL(request.url);
		const baseUrl = `${url.protocol}//${url.host}`;

		// Swagger UI documentation
		if (url.pathname === '/docs' || url.pathname === '/docs/') {
			return serveSwaggerUI(baseUrl);
		}

		// OpenAPI spec endpoint
		if (url.pathname === '/openapi.yaml' || url.pathname === '/openapi.json') {
			return serveOpenAPISpec(env, baseUrl);
		}

		// Health check endpoint
		if (url.pathname === '/health') {
			return Response.json({ status: 'ok', service: 'feedback-aggregator' });
		}

		// Process queue endpoint
		if (url.pathname === '/process-queue' || url.pathname === '/process-queue/') {
			if (method === 'POST') {
				return handleProcessQueue(request, env);
			} else {
				return Response.json({ error: 'Method not allowed' }, { status: 405 });
			}
		}

		// Main feedback endpoint
		if (url.pathname === '/feedback' || url.pathname === '/feedback/') {
			if (method === 'POST') {
				return handlePost(request, env);
			} else if (method === 'GET') {
				return handleGet(request, env);
			} else {
				return Response.json({ error: 'Method not allowed' }, { status: 405 });
			}
		}

		// Root endpoint
		if (url.pathname === '/') {
			return Response.json({
				service: 'feedback-aggregator',
				endpoints: {
					'POST /feedback': 'Submit new feedback',
					'GET /feedback': 'Retrieve feedback (supports ?source=, ?status=, ?limit=, ?offset=)',
					'POST /process-queue': 'Process pending feedback queue (sends to workflow service)',
					'GET /health': 'Health check',
					'GET /docs': 'Interactive API documentation (Swagger UI)',
					'GET /openapi.yaml': 'OpenAPI specification (YAML)',
				},
			});
		}

		return Response.json({ error: 'Not found' }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
