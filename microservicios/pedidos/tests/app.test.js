const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});

describe('Pruebas del servicio de Pedidos', () => {
  test('GET /health debe responder con status OK', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('GET /pedidos debe devolver un arreglo', async () => {
    const response = await request(app).get('/pedidos');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});