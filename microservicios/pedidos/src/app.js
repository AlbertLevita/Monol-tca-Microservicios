const express = require('express');
const pool = require('./db');
const axios = require('axios');

const app = express();
app.use(express.json());

const USUARIOS_URL = process.env.USUARIOS_URL || 'http://usuarios:3001';
const PRODUCTOS_URL = process.env.PRODUCTOS_URL || 'http://productos:3002';

async function validarReferencias(usuarioId, productoId) {
  try {
    const [resUser, resProd] = await Promise.all([
      axios.get(`${USUARIOS_URL}/usuarios/${usuarioId}`, { validateStatus: status => status < 500 }),
      axios.get(`${PRODUCTOS_URL}/productos/${productoId}`, { validateStatus: status => status < 500 })
    ]);

    if (resUser.status === 404 || resProd.status === 404) {
      return false;
    }
    return true;
  } catch (e) {
    throw new Error('Error al consultar Usuarios o Productos');
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/pedidos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pedidos/detalle', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pedidos');
    let usuarios = [], productos = [];
    try { usuarios = (await axios.get(`${USUARIOS_URL}/usuarios`)).data; } catch(e){}
    try { productos = (await axios.get(`${PRODUCTOS_URL}/productos`)).data; } catch(e){}

    const det = r.rows.map(p => ({
      id: p.id,
      cantidad: p.cantidad,
      usuario: usuarios.find(u => u.id === p.usuario_id) || { id: p.usuario_id, error: 'No encontrado' },
      producto: productos.find(pr => pr.id === p.producto_id) || { id: p.producto_id, error: 'No encontrado' }
    }));
    res.json(det);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/pedidos', async (req, res) => {
  const { usuario_id, producto_id, cantidad } = req.body;
  if (![usuario_id, producto_id, cantidad].every(val => Number.isInteger(Number(val)) && Number(val) > 0)) {
    return res.status(400).json({ error: 'usuario_id, producto_id y cantidad deben ser enteros positivos' });
  }
  try {
    const esValido = await validarReferencias(usuario_id, producto_id);
    if (!esValido) {
      return res.status(400).json({ error: 'El usuario o producto indicado no existe' });
    }

    const result = await pool.query(
      'INSERT INTO pedidos (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id, producto_id, cantidad]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

app.put('/pedidos/:id', async (req, res) => {
  const { usuario_id, producto_id, cantidad } = req.body;
  if (![usuario_id, producto_id, cantidad].every(val => Number.isInteger(Number(val)) && Number(val) > 0)) {
    return res.status(400).json({ error: 'usuario_id, producto_id y cantidad deben ser enteros positivos' });
  }
  try {
    const esValido = await validarReferencias(usuario_id, producto_id);
    if (!esValido) {
      return res.status(400).json({ error: 'El usuario o producto indicado no existe' });
    }

    const result = await pool.query(
      'UPDATE pedidos SET usuario_id = $1, producto_id = $2, cantidad = $3 WHERE id = $4 RETURNING *',
      [usuario_id, producto_id, cantidad, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

app.delete('/pedidos/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json({ mensaje: 'Pedido eliminado', pedido: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
});

module.exports = app;