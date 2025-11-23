// consultas.js
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",     // tu usuario
  password: "postgres", // tu contraseña
  database: "joyas",    // BD que creaste
  port: 5432,
  allowExitOnIdle: true,
});

// Probar conexión
(async () => {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    console.log("✅ Conectado a PostgreSQL:", rows[0].now);
  } catch (error) {
    console.log("❌ Error de conexión:", error.message);
  }
})();

/**
 * Obtener joyas con límite, página y ordenamiento
 * limits: nº por página
 * page: nº de página (1, 2, 3, ...)
 * order_by: ej "stock_ASC", "precio_DESC"
 */
const obtenerJoyas = async ({ limits = 10, page = 1, order_by = "id_ASC" }) => {
  try {
    const [campo, direccionRaw] = order_by.split("_");
    const direccion = direccionRaw?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const camposPermitidos = ["id", "nombre", "categoria", "metal", "precio", "stock"];
    const campoOrden = camposPermitidos.includes(campo) ? campo : "id";

    const limit = Number(limits) || 10;
    const offset = (Number(page) - 1) * limit;

    const consultaTotal = "SELECT COUNT(*) AS total FROM inventario";
    const { rows: totalRows } = await pool.query(consultaTotal);
    const totalJoyas = Number(totalRows[0].total);

    const consulta = `
      SELECT * FROM inventario
      ORDER BY ${campoOrden} ${direccion}
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(consulta, [limit, offset]);
    return { totalJoyas, joyas: rows };
  } catch (error) {
    console.log("Error en obtenerJoyas:", error.message);
    throw error;
  }
};

/**
 * Obtener joyas filtradas (precio_min, precio_max, categoria, metal)
 * Usando consultas parametrizadas (anti SQL Injection)
 */
const obtenerJoyasFiltradas = async ({ precio_min, precio_max, categoria, metal }) => {
  try {
    const filtros = [];
    const values = [];

    if (precio_min) {
      values.push(Number(precio_min));
      filtros.push(`precio >= $${values.length}`);
    }

    if (precio_max) {
      values.push(Number(precio_max));
      filtros.push(`precio <= $${values.length}`);
    }

    if (categoria) {
      values.push(categoria);
      filtros.push(`categoria = $${values.length}`);
    }

    if (metal) {
      values.push(metal);
      filtros.push(`metal = $${values.length}`);
    }

    const whereClause = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const consulta = `
      SELECT * FROM inventario
      ${whereClause}
      ORDER BY id ASC
    `;

    const { rows } = await pool.query(consulta, values);
    return rows;
  } catch (error) {
    console.log("Error en obtenerJoyasFiltradas:", error.message);
    throw error;
  }
};

module.exports = {
  obtenerJoyas,
  obtenerJoyasFiltradas,
};
