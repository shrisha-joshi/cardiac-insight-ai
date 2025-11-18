import { http, HttpResponse } from 'msw';

// Helper to match both real Supabase and placeholder
const supabaseMatcher = /supabase\.co\/rest\/v1\/(prediction_feedback|ml_prediction_feedback)/;

export const handlers = [
  // Preflight OPTIONS for Supabase
  http.options(supabaseMatcher, () => {
    return new HttpResponse(null, { status: 204 });
  }),
  // Supabase prediction_feedback GET
  http.get(supabaseMatcher, () => {
    return HttpResponse.json([]);
  }),

  // Supabase prediction_feedback INSERT (POST)
  http.post(supabaseMatcher, async ({ request }) => {
    const raw = await request.json().catch(() => ({}));
    const body = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
    return HttpResponse.json({ ...body, id: 'fb-1' }, { status: 201 });
  }),

  // Backend history endpoint (relative path match)
  http.get(/\/history\/[^/]+$/, () => {
    // Return empty history by default for tests unless overridden per test
    return HttpResponse.json({ user_id: 'test-user', count: 0, predictions: [], limit: 100 });
  })
];
