import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApi } from '../server/api.mjs';
import { createIntelligence, groundReview, plainDialogue, validateDialogue } from '../server/intelligence.mjs';
import { validateSetup, chooseScenario } from '../shared/scenarios.mjs';

const scenario = {
  title: 'Smoke beside a market', domain: 'fire', brief: 'A bystander sees smoke.',
  language: 'en', difficulty: 'challenging',
  caller: { name: 'Asha', personality: 'An observant shopkeeper', panic: 'moderate', coherence: 'fragmented' },
  facts: { location: 'Fictional Market Gate B', situation: 'Smoke, no visible flames', safety: 'Across the street', people: 'Unknown', callback: 'SIMULATED CALLBACK', unknowns: 'Source of smoke' },
  opening: '[nervous, speaking quickly] There is smoke near the market.',
};

async function withServer(options, run) {
  const api = createApi(options);
  const server = http.createServer((req, res) => { api(req, res).catch(error => { res.writeHead(500); res.end(error.message); }); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body, headers = {}) => {
    const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  try { await run({ base, post }); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('empty scope works; optional constraints remain optional and invalid values fail', () => {
  assert.deepEqual(validateSetup(), { mode: 'random', difficulty: '', language: '', domains: [] });
  assert.equal(chooseScenario({}, () => 0).domain, 'road');
  assert.equal(chooseScenario({ domains: ['fire'] }, () => 0).domain, 'fire');
  assert.throws(() => validateSetup({ domains: ['invented'] }));
  assert.throws(() => validateSetup({ domains: 'fire' }));
  assert.throws(() => validateSetup({ mode: 'scheduled' }));
  assert.equal(plainDialogue('[shaky breath] Please <emphasis>help</emphasis> me.'), 'Please help me.');
  assert.throws(() => validateDialogue('[silence]'));
  const review = groundReview({ moments: [{ segmentId: 'real' }, { segmentId: 'invented' }, { segmentId: 'caller' }] }, [{ segmentId: 'real', role: 'user' }, { segmentId: 'caller', role: 'agent' }]);
  assert.deepEqual(review.moments, [{ segmentId: 'real' }]);
});

test('OpenAI SDK receives structured, non-stored requests and rejects scope drift', async () => {
  const requests = [];
  const intelligence = createIntelligence({}, { responses: { parse: async request => {
    requests.push(request); return { status: 'completed', output_parsed: structuredClone(scenario) };
  } } });
  const generated = await intelligence.generate(validateSetup({}));
  assert.equal(generated.domain, 'fire');
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].text.format.type, 'json_schema');
  assert.equal(requests[0].text.format.strict, true);
  await assert.rejects(intelligence.generate(validateSetup({ domains: ['road'] })));
});

test('a complete voice call: no onboarding, hidden facts, tagged Fish speech, authoritative transcript, idempotent debrief', async () => {
  const spoken = []; let reviews = 0;
  const intelligence = {
    generate: async scope => { assert.equal(scope.mode, 'random'); assert.deepEqual(scope.domains, []); return structuredClone(scenario); },
    reply: async session => { assert.equal(session.scenario.facts.location, 'Fictional Market Gate B'); return { dialogue: '[trying to focus] At the market, Gate B.', endCall: false }; },
    review: async session => { reviews++; return { headline: 'A location to build on.', overview: 'You asked a location question.', moments: [{ kind: 'observation', segmentId: session.transcript[1].segmentId, title: 'Location', comment: 'Review the answer.' }], nextPractice: { title: 'Confirm the landmark', explanation: 'Try a follow-up.', prompt: 'Which gate?' } }; },
  };
  await withServer({ env: { OPENAI_API_KEY: 'test-only', FISH_API_KEY: 'test-only' }, intelligence,
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.fish.audio/v1/tts'); assert.equal(options.headers.model, 'drama-3');
      spoken.push(JSON.parse(options.body)); return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/mpeg' } });
    },
  }, async ({ base, post }) => {
    const status = await (await fetch(base + '/api/status')).json(); assert.equal(status.voiceConfigured, true);
    const start = await post('/api/sessions', {}); assert.equal(start.status, 200);
    assert.equal(start.body.briefing, null); assert.equal(start.body.scenario, undefined); assert.equal(start.body.caller.text, 'There is smoke near the market.');
    assert.equal(spoken[0].text, scenario.opening); assert.ok(start.body.audio);
    const id = start.body.id;
    const reply = await post(`/api/sessions/${id}/turn`, { text: 'Where exactly are you?' });
    assert.equal(reply.status, 200); assert.equal(reply.body.user.role, 'user'); assert.equal(reply.body.caller.text, 'At the market, Gate B.');
    assert.ok(spoken[1].text.startsWith('[trying to focus]'));
    const end = await post(`/api/sessions/${id}/end`, { playedCallerIds: [start.body.caller.segmentId] });
    assert.equal(end.status, 200); assert.equal(end.body.transcript.length, 3);
    assert.equal(end.body.transcript[0].playbackConfirmed, true); assert.equal(end.body.transcript[2].playbackConfirmed, false);
    assert.equal(end.body.scenario.title, scenario.title); assert.ok(end.body.review);
    assert.equal((await post(`/api/sessions/${id}/end`, {})).status, 200); assert.equal(reviews, 1);
    assert.equal((await post(`/api/sessions/${id}/turn`, { text: 'Still there?' })).status, 409);
  });
});

test('missing credentials, malformed scope, cross-origin access, and unavailable review are explicit', async () => {
  await withServer({ env: {} }, async ({ post }) => {
    assert.equal((await post('/api/sessions', {})).status, 503);
    assert.equal((await post('/api/sessions', { scope: { language: 'xx' } })).status, 400);
    assert.equal((await post('/api/sessions', {}, { Origin: 'https://untrusted.example' })).status, 403);
  });
  await withServer({ env: { OPENAI_API_KEY: 'test-only' }, intelligence: { generate: async () => structuredClone(scenario), review: async () => { throw new Error('upstream unavailable'); } } }, async ({ post }) => {
    const start = await post('/api/sessions', { kind: 'text' }); assert.equal(start.status, 200);
    const end = await post(`/api/sessions/${start.body.id}/end`, {});
    assert.equal(end.status, 200); assert.equal(end.body.review, null); assert.ok(end.body.reviewError); assert.equal(end.body.transcript.length, 1);
  });
});
