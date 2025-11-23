// index.js
const express = require("express");
const cors = require("cors");

const { obtenerJoyas, obtenerJoyasFiltradas } = require("./consultas");

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// Middleware de reporte (requerimiento 3)
const reportMiddleware = (req, res, next) => {
  const time = new Date().toISOString();
  console.log(`📝 ${time} - Consulta a ruta ${req.method} ${req.url}`);
  next();
};

app.use(reportMiddleware);

// Función para armar estructura HATEOAS
const prepararHATEOAS = (joyas, totalJoyas) => {
  const results = joyas.map((j) => ({
    name: j.nombre,
    href: `/joyas/${j.id}`,
  }));

  return {
    totalJoyas,
    results,
  };
};

// Ruta GET /joyas  (requerimiento 1)
app.get("/joyas", async (req, res) => {
  try {
    const { limits, page, order_by } = req.query;

    const { totalJoyas, joyas } = await obtenerJoyas({ limits, page, order_by });

    const hateoas = prepararHATEOAS(joyas, totalJoyas);

    res.json(hateoas);
  } catch (error) {
    console.log("GET /joyas error:", error.message);
    res.status(500).json({ error: "Error al obtener las joyas" });
  }
});

// Ruta GET /joyas/filtros  (requerimiento 2 + 5)
app.get("/joyas/filtros", async (req, res) => {
  try {
    const { precio_min, precio_max, categoria, metal } = req.query;

    const joyas = await obtenerJoyasFiltradas({
      precio_min,
      precio_max,
      categoria,
      metal,
    });

    res.json(joyas);
  } catch (error) {
    console.log("GET /joyas/filtros error:", error.message);
    res.status(500).json({ error: "Error al filtrar las joyas" });
  }
});

// Levantar servidor
app.listen(3000, () => {
  console.log("🚀 SERVIDOR ENCENDIDO en puerto 3000");
});
