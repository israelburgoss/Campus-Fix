// =====================================================================
// CampusFix - Base de Datos II - Universidad ECOTEC
// colecciones.js
// Creación de las dos colecciones y sus índices por incidenciaId.
// Ejecutar con: mongosh campusfix database/mongodb/colecciones.js
// =====================================================================

use("campusfix");

db.createCollection("diagnosticos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["incidenciaId", "tecnicoId", "descripcion", "fecha"],
      properties: {
        incidenciaId: {
          bsonType: "int",
          description: "ID de la incidencia en MySQL (obligatorio)"
        },
        tecnicoId: {
          bsonType: "int",
          description: "ID del técnico en MySQL (obligatorio)"
        },
        descripcion: {
          bsonType: "string",
          description: "Descripción del diagnóstico (obligatorio)"
        },
        pruebasRealizadas: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Lista de pruebas realizadas por el técnico"
        },
        causaProbable: {
          bsonType: "string",
          description: "Causa probable de la falla"
        },
        solucionAplicada: {
          bsonType: "string",
          description: "Solución aplicada por el técnico"
        },
        fecha: {
          bsonType: "date",
          description: "Fecha del diagnóstico (obligatorio)"
        }
      }
    }
  },
  validationLevel: "moderate"
});

db.createCollection("evidencias", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["incidenciaId", "tipo", "url", "fecha"],
      properties: {
        incidenciaId: {
          bsonType: "int",
          description: "ID de la incidencia en MySQL (obligatorio)"
        },
        tipo: {
          bsonType: "string",
          enum: ["imagen", "documento", "video"],
          description: "Tipo de evidencia (obligatorio)"
        },
        nombre: {
          bsonType: "string",
          description: "Nombre del archivo de referencia"
        },
        url: {
          bsonType: "string",
          description: "URL o ruta de referencia del archivo (obligatorio)"
        },
        descripcion: {
          bsonType: "string",
          description: "Descripción del contenido de la evidencia"
        },
        fecha: {
          bsonType: "date",
          description: "Fecha de registro de la evidencia (obligatorio)"
        }
      }
    }
  },
  validationLevel: "moderate"
});

// ---------------------------------------------------------------------
// Índices requeridos (sección 10 del enunciado): al menos un índice por
// colección basado en incidenciaId, para acelerar la consulta del
// detalle integrado de una incidencia (GET /api/incidencias/:id) y
// evitar escaneos completos (COLLSCAN) de cada colección.
// ---------------------------------------------------------------------
db.diagnosticos.createIndex({ incidenciaId: 1 }, { name: "idx_diagnosticos_incidenciaId" });
db.evidencias.createIndex({ incidenciaId: 1 }, { name: "idx_evidencias_incidenciaId" });

print("Colecciones 'diagnosticos' y 'evidencias' creadas con sus índices.");