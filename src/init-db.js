const pool = require('./db');

async function inicializarBD() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                precio DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabla "productos" creada correctamente.');

        await pool.query('DELETE FROM productos;');
        await pool.query(`
            INSERT INTO productos (nombre, precio, stock) VALUES
            ('Laptop Pro 15', 1299.99, 10),
            ('Mouse Inalámbrico', 25.50, 50),
            ('Teclado Mecánico RGB', 85.00, 30);
        `);
        console.log('Datos de prueba insertados con éxito.');

        process.exit(0);
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error.message);
        process.exit(1);
    }
}

inicializarBD();
