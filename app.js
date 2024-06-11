const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 3000;


// Usar el middleware cors
app.use(cors());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: '50.6.160.90',
    user: 'antraxse_admin',
    password: 'I5+os]rQ=?s&',
    database: 'antraxse_pos5'
});

// Conectar a MySQL nuevo de nuevo
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado a la base de datos MySQL');
});


app.use(express.json());
// Ruta de prueba para verificar la conexión
app.get('/createdb', (req, res) => {
    let sql = 'CREATE DATABASE nodemysql';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send('Base de datos creada...');
    });
});

// Ruta para actualizar el precio de un producto
app.put('/api/items/:id/price', (req, res) => {
    const { id } = req.params;
    const { price } = req.body;

    if (!price) {
        res.status(400).json({ message: 'El precio es requerido' });
        return;
    }

    const query = 'UPDATE products SET price = ? WHERE id = ?';
    db.query(query, [price, id], (err, result) => {
        if (err) {
            res.status(500).json({ message: err.message });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }
        res.status(200).json({ message: 'Precio actualizado correctamente' });
    });
});

// Ruta para obtener los productos con sus categorías
app.get('/api/items', (req, res) => {
    const query = `
       SELECT
           c.id as category_id,
           c.code as category_code,
           c.name as category_name,
           c.created_at as category_created_at,
           c.updated_at as category_updated_at,
           c.deleted_at as category_deleted_at,
           p.id as product_id,
           p.type as product_type,
           p.code as product_code,
           p.Type_barcode as product_barcode_type,
           p.name as product_name,
           p.cost as product_cost,
           p.price as product_price,
           p.brand_id as product_brand_id,
           p.unit_id as product_unit_id,
           p.unit_sale_id as product_unit_sale_id,
           p.unit_purchase_id as product_unit_purchase_id,
           p.TaxNet as product_tax_net,
           p.tax_method as product_tax_method,
           p.image as product_image,
           p.note as product_note,
           p.stock_alert as product_stock_alert,
           p.is_variant as product_is_variant,
           p.is_imei as product_is_imei,
           p.not_selling as product_not_selling,
           p.is_active as product_is_active,
           p.created_at as product_created_at,
           p.updated_at as product_updated_at,
           p.deleted_at as product_deleted_at,
           pw.id as product_warehouse_id,
           pw.warehouse_id as product_warehouse_id,
           pw.product_variant_id as product_variant_id,
           pw.qte as product_warehouse_quantity,
           pw.manage_stock as product_warehouse_manage_stock,
           pw.created_at as product_warehouse_created_at,
           pw.updated_at as product_warehouse_updated_at,
           pw.deleted_at as product_warehouse_deleted_at
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       LEFT JOIN product_warehouse pw ON p.id = pw.product_id
       WHERE c.deleted_at IS NULL AND p.deleted_at IS NULL AND pw.deleted_at IS NULL;
    `;

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ message: err.message });
            return;
        }

        // Transformar los resultados para agrupar productos bajo sus respectivas categorías
        const categories = {};
        results.forEach(row => {
            if (!categories[row.category_id]) {
                categories[row.category_id] = {
                    id: row.category_id,
                    code: row.category_code,
                    name: row.category_name,
                    created_at: row.category_created_at,
                    updated_at: row.category_updated_at,
                    deleted_at: row.category_deleted_at,
                    products: []
                };
            }
            if (row.product_id) {
                const product = categories[row.category_id].products.find(p => p.id === row.product_id);
                if (!product) {
                    categories[row.category_id].products.push({
                        id: row.product_id,
                        type: row.product_type,
                        code: row.product_code,
                        barcode_type: row.product_barcode_type,
                        name: row.product_name,
                        cost: row.product_cost,
                        price: row.product_price,
                        brand_id: row.product_brand_id,
                        unit_id: row.product_unit_id,
                        unit_sale_id: row.product_unit_sale_id,
                        unit_purchase_id: row.product_unit_purchase_id,
                        tax_net: row.product_tax_net,
                        tax_method: row.product_tax_method,
                        image: row.product_image,
                        note: row.product_note,
                        stock_alert: row.product_stock_alert,
                        is_variant: row.product_is_variant,
                        is_imei: row.product_is_imei,
                        not_selling: row.product_not_selling,
                        is_active: row.product_is_active,
                        created_at: row.product_created_at,
                        updated_at: row.product_updated_at,
                        deleted_at: row.product_deleted_at,
                        warehouses: []
                    });
                }
                categories[row.category_id].products.find(p => p.id === row.product_id).warehouses.push({
                    id: row.product_warehouse_id,
                    warehouse_id: row.product_warehouse_id,
                    product_variant_id: row.product_variant_id,
                    quantity: row.product_warehouse_quantity,
                    manage_stock: row.product_warehouse_manage_stock,
                    created_at: row.product_warehouse_created_at,
                    updated_at: row.product_warehouse_updated_at,
                    deleted_at: row.product_warehouse_deleted_at
                });
            }
        });

        res.status(200).json(Object.values(categories));
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
