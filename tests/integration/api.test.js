import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../../server/src/app.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function req(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test('Integration: /health returns 200 ok', async () => {
  const res = await req('/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
});

test('Integration: /api/v1/auth/me returns authenticated demo architect', async () => {
  const res = await req('/api/v1/auth/me');
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.data.user.email);
});

test('Integration: full decision intelligence pipeline lifecycle', async () => {
  // 1. Create Project
  const createProjRes = await req('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Global Expansion Feasibility Project',
      domain: 'business',
      objective: 'Evaluate international market expansion options under tariff uncertainty',
      context: { budgetCap: 1000000 },
    }),
  });
  assert.equal(createProjRes.status, 201);
  const projectId = createProjRes.data.data.id;
  assert.ok(projectId);

  // 2. Upload Dataset (multipart form)
  const csvData = `year,revenue,expenses,headcount
2022,1200000,900000,15
2023,1500000,1100000,22
2024,1950000,1350000,30`;

  const boundary = '----WebKitFormBoundaryTest1234';
  const bodyBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="expansion_benchmark.csv"\r\nContent-Type: text/csv\r\n\r\n${csvData}\r\n--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nHistorical Financials\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch(`${baseUrl}/api/v1/projects/${projectId}/datasets/upload`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer demo-token',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuffer,
  });
  const uploadJson = await uploadRes.json();
  assert.equal(uploadRes.status, 201);
  assert.equal(uploadJson.success, true);
  assert.ok(uploadJson.data.dataset.id);
  assert.ok(uploadJson.data.qualityReport.qualityScore > 0);

  // 3. Run Data Intelligence Analytics
  const analysisRes = await req(`/api/v1/projects/${projectId}/analysis`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(analysisRes.status, 201);
  assert.ok(analysisRes.data.data.analysis_results.descriptiveStatistics.revenue);
  assert.ok(analysisRes.data.data.evidence_references.length > 0);

  // 4. Create Two Alternatives
  const alt1Res = await req(`/api/v1/projects/${projectId}/alternatives`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Option Alpha: Direct Foreign Subsidiary',
      description: 'Fully owned branch with local inventory',
      estimated_cost: 600000,
      expected_return: 1400000,
    }),
  });
  const alt2Res = await req(`/api/v1/projects/${projectId}/alternatives`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Option Beta: Exclusive Regional Distribution Partner',
      description: 'License distribution rights to vetted local distributor',
      estimated_cost: 250000,
      expected_return: 850000,
    }),
  });
  assert.equal(alt1Res.status, 201);
  assert.equal(alt2Res.status, 201);
  const alt1Id = alt1Res.data.data.id;
  const alt2Id = alt2Res.data.data.id;

  // 5. Create Two Criteria
  const crit1Res = await req(`/api/v1/projects/${projectId}/criteria`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Net 3-Year Return',
      direction: 'benefit',
      weight: 60,
    }),
  });
  const crit2Res = await req(`/api/v1/projects/${projectId}/criteria`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Initial Setup Capital',
      direction: 'cost',
      weight: 40,
    }),
  });
  assert.equal(crit1Res.status, 201);
  assert.equal(crit2Res.status, 201);
  const crit1Id = crit1Res.data.data.id;
  const crit2Id = crit2Res.data.data.id;

  // 6. Execute MCDA Evaluation
  const evalRes = await req(`/api/v1/projects/${projectId}/evaluate`, {
    method: 'POST',
    body: JSON.stringify({
      scores: [
        { alternative_id: alt1Id, criterion_id: crit1Id, raw_value: 1400 },
        { alternative_id: alt1Id, criterion_id: crit2Id, raw_value: 600 },
        { alternative_id: alt2Id, criterion_id: crit1Id, raw_value: 850 },
        { alternative_id: alt2Id, criterion_id: crit2Id, raw_value: 250 },
      ],
    }),
  });
  assert.equal(evalRes.status, 201);
  assert.equal(evalRes.data.data.rankings.length, 2);
  assert.equal(evalRes.data.data.rankings[0].rank, 1);

  // 7. Assess Risks
  const riskRes = await req(`/api/v1/projects/${projectId}/risks/assess`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(riskRes.status, 201);
  assert.ok(riskRes.data.data.matrix.length === 5);

  // 8. Generate Explainable AI Recommendation
  const recRes = await req(`/api/v1/projects/${projectId}/recommendations/generate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(recRes.status, 201);
  assert.ok(recRes.data.data.recommendation_type);
  assert.ok(recRes.data.data.recommendation_summary);

  // 9. Human Decision Authorization
  const decRes = await req(`/api/v1/projects/${projectId}/decisions`, {
    method: 'POST',
    body: JSON.stringify({
      selected_alternative_id: alt1Id,
      recommendation_id: recRes.data.data.id,
      decision_status: 'approved',
      decision_reason: 'Selected Option Alpha because higher net ROI outweighs setup capital requirements under baseline scenarios.',
    }),
  });
  assert.equal(decRes.status, 201);
  assert.equal(decRes.data.data.decision_status, 'approved');

  // 10. Monitoring KPI & Observation
  const metricRes = await req(`/api/v1/projects/${projectId}/monitoring/metrics`, {
    method: 'POST',
    body: JSON.stringify({
      metric_name: 'Monthly Recurring Revenue',
      expected_value: 50000,
      unit: '$',
      threshold: 15,
    }),
  });
  assert.equal(metricRes.status, 201);
  const metricId = metricRes.data.data.id;

  const obsRes = await req(`/api/v1/monitoring/metrics/${metricId}/observations`, {
    method: 'POST',
    body: JSON.stringify({
      observed_value: 41000, // 18% below -> exceeds 15% threshold -> breaches!
    }),
  });
  assert.equal(obsRes.status, 201);
  assert.equal(obsRes.data.data.status, 'breached');
  assert.ok(obsRes.data.data.alert); // Alert auto-generated!

  // 11. Comprehensive Audit Report
  const reportRes = await req(`/api/v1/projects/${projectId}/reports`);
  assert.equal(reportRes.status, 200);
  assert.equal(reportRes.data.data.projectOverview.title, 'Global Expansion Feasibility Project');
  assert.equal(reportRes.data.data.finalDecisionStatus.decisionStatus, 'approved');
});
