const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ estado: 'ok' });
});

app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            estado: 'ok',
            mensaje: 'Conexión con PostgreSQL correcta',
            fecha: result.rows[0].now
        });
    } catch (error) {
        res.status(500).json({
            estado: 'error',
            mensaje: 'No se pudo conectar con PostgreSQL',
            detalle: error.message
        });
    }
});

app.get('/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json({
            estado: 'ok',
            total: result.rowCount,
            datos: result.rows
        });
    } catch (error) {
        res.status(500).json({
            estado: 'error',
            mensaje: 'Error al consultar productos',
            detalle: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
