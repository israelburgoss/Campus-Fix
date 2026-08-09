// =====================================================================
// CampusFix - Base de Datos II - Universidad ECOTEC
// datos_prueba.js
// 20 diagnósticos + 20 evidencias, vinculados a las incidencias 1-20 de
// database/mysql/02_datos.sql (mismo id_tecnico usado en 'asignaciones').
// Ejecutar con: mongosh campusfix database/mongodb/datos_prueba.js
// (después de colecciones.js)
// =====================================================================

use("campusfix");

const diagnosticos = [
  { incidenciaId: 1,  tecnicoId: 3, descripcion: "El proyector del Laboratorio 1 no responde al botón de encendido.", pruebasRealizadas: ["Prueba de cable de poder", "Prueba de bombilla"], causaProbable: "Bombilla quemada", solucionAplicada: "Reemplazo de bombilla", fecha: new Date("2026-08-01T09:00:00Z") },
  { incidenciaId: 2,  tecnicoId: 4, descripcion: "El computador PC-Lab1-01 se apaga durante el arranque.", pruebasRealizadas: ["Prueba de fuente de poder", "Prueba de memoria RAM"], causaProbable: "Módulo de memoria con falla", solucionAplicada: "Limpieza y reasiento del módulo de RAM", fecha: new Date("2026-08-01T10:15:00Z") },
  { incidenciaId: 3,  tecnicoId: 5, descripcion: "La impresora del Laboratorio 2 detiene la cola de impresión por error de tóner.", pruebasRealizadas: ["Revisión de cartucho", "Prueba de página de prueba"], causaProbable: "Cartucho de tóner agotado", solucionAplicada: "Reemplazo de cartucho", fecha: new Date("2026-08-02T08:30:00Z") },
  { incidenciaId: 4,  tecnicoId: 6, descripcion: "El aula 204 no obtiene IP por WiFi.", pruebasRealizadas: ["Prueba de señal", "Reinicio de router"], causaProbable: "Router con firmware desactualizado", solucionAplicada: "Actualización de firmware del router", fecha: new Date("2026-08-02T11:00:00Z") },
  { incidenciaId: 5,  tecnicoId: 3, descripcion: "El proyector del aula 204 proyecta manchas oscuras en la imagen.", pruebasRealizadas: ["Prueba de lente", "Prueba de filtro de aire"], causaProbable: "Filtro de aire sucio", solucionAplicada: "Limpieza del filtro y del lente", fecha: new Date("2026-08-03T09:45:00Z") },
  { incidenciaId: 6,  tecnicoId: 4, descripcion: "El computador docente del aula 305 tarda demasiado en abrir aplicaciones.", pruebasRealizadas: ["Revisión de procesos en segundo plano", "Prueba de espacio en disco"], causaProbable: "Disco casi lleno y programas de inicio excesivos", solucionAplicada: "Liberación de espacio y limpieza de inicio automático", fecha: new Date("2026-08-03T14:20:00Z") },
  { incidenciaId: 7,  tecnicoId: 5, descripcion: "El switch del aula 305 no muestra actividad en ningún puerto.", pruebasRealizadas: ["Prueba de alimentación", "Prueba de cable de red"], causaProbable: "Fuente de alimentación dañada", solucionAplicada: "Reemplazo de la fuente de alimentación", fecha: new Date("2026-08-04T08:10:00Z") },
  { incidenciaId: 8,  tecnicoId: 6, descripcion: "El computador de biblioteca no enciende al presionar el botón de encendido.", pruebasRealizadas: ["Prueba de fuente de poder", "Prueba de botón de encendido"], causaProbable: "Fuente de poder dañada", solucionAplicada: "Reemplazo de fuente de poder", fecha: new Date("2026-08-04T10:50:00Z") },
  { incidenciaId: 9,  tecnicoId: 3, descripcion: "La impresora de biblioteca tiene papel atascado en el rodillo.", pruebasRealizadas: ["Inspección del rodillo", "Prueba de alimentación de papel"], causaProbable: "Rodillo desgastado", solucionAplicada: "Retiro del papel atascado y ajuste del rodillo", fecha: new Date("2026-08-05T09:15:00Z") },
  { incidenciaId: 10, tecnicoId: 4, descripcion: "El router de biblioteca pierde la conexión de forma intermitente.", pruebasRealizadas: ["Prueba de temperatura", "Prueba de canal WiFi"], causaProbable: "Sobrecalentamiento por interferencia de canal", solucionAplicada: "Cambio de canal WiFi y reubicación del router", fecha: new Date("2026-08-05T13:40:00Z") },
  { incidenciaId: 11, tecnicoId: 5, descripcion: "El computador PC-Lab1-02 presenta pantalla azul de forma recurrente.", pruebasRealizadas: ["Prueba de memoria RAM", "Revisión de controladores"], causaProbable: "Controlador de video desactualizado", solucionAplicada: "Actualización de controladores de video", fecha: new Date("2026-08-06T09:00:00Z") },
  { incidenciaId: 12, tecnicoId: 6, descripcion: "El proyector del Laboratorio 1 muestra la imagen solo en escala de grises.", pruebasRealizadas: ["Prueba de cable HDMI", "Prueba de configuración de color"], causaProbable: "Cable HDMI dañado", solucionAplicada: "Reemplazo del cable HDMI", fecha: new Date("2026-08-06T11:30:00Z") },
  { incidenciaId: 13, tecnicoId: 3, descripcion: "El computador PC-Lab2-01 no detecta dispositivos USB conectados.", pruebasRealizadas: ["Prueba de puertos USB", "Revisión de controladores"], causaProbable: "Controlador USB corrupto", solucionAplicada: "Reinstalación del controlador USB", fecha: new Date("2026-08-07T08:45:00Z") },
  { incidenciaId: 14, tecnicoId: 4, descripcion: "El computador PC-Lab2-02 muestra ventanas emergentes sospechosas.", pruebasRealizadas: ["Escaneo antivirus completo", "Revisión de programas instalados"], causaProbable: "Infección por software malicioso", solucionAplicada: "Eliminación del malware y actualización del antivirus", fecha: new Date("2026-08-07T15:10:00Z") },
  { incidenciaId: 15, tecnicoId: 5, descripcion: "La impresora del Laboratorio 2 solo imprime en blanco y negro.", pruebasRealizadas: ["Revisión de cartuchos de color", "Prueba de página de calibración"], causaProbable: "Cartucho de color vacío", solucionAplicada: "Reemplazo del cartucho de color", fecha: new Date("2026-08-08T09:20:00Z") },
  { incidenciaId: 16, tecnicoId: 6, descripcion: "El proyector del aula 204 parpadea de forma constante durante la proyección.", pruebasRealizadas: ["Prueba de lámpara", "Prueba de fuente de poder"], causaProbable: "Lámpara próxima al fin de su vida útil", solucionAplicada: "Reemplazo de la lámpara del proyector", fecha: new Date("2026-08-08T13:00:00Z") },
  { incidenciaId: 17, tecnicoId: 3, descripcion: "El computador docente del aula 204 no reproduce audio.", pruebasRealizadas: ["Prueba de controlador de audio", "Prueba de bocinas"], causaProbable: "Controlador de audio desactualizado", solucionAplicada: "Actualización del controlador de audio", fecha: new Date("2026-08-09T09:30:00Z") },
  { incidenciaId: 18, tecnicoId: 4, descripcion: "La conexión de red del aula 305 se interrumpe con frecuencia.", pruebasRealizadas: ["Prueba de cableado", "Prueba de punto de acceso"], causaProbable: "Cable de red dañado", solucionAplicada: "Reemplazo del cable de red", fecha: new Date("2026-08-09T14:05:00Z") },
  { incidenciaId: 19, tecnicoId: 5, descripcion: "El proyector del aula 305 no detecta señal por el puerto HDMI.", pruebasRealizadas: ["Prueba de cable HDMI", "Prueba de puerto alterno"], causaProbable: "Puerto HDMI dañado", solucionAplicada: "Uso de puerto VGA alterno y solicitud de reparación", fecha: new Date("2026-08-10T08:50:00Z") },
  { incidenciaId: 20, tecnicoId: 6, descripcion: "El computador docente del aula 305 tarda en abrir los programas de clase.", pruebasRealizadas: ["Revisión de procesos en segundo plano", "Prueba de espacio en disco"], causaProbable: "Programas de inicio excesivos", solucionAplicada: "Limpieza del inicio automático", fecha: new Date("2026-08-10T11:15:00Z") }
];

const evidencias = [
  { incidenciaId: 1,  tipo: "imagen", nombre: "proyector_lab1_01.jpg", url: "https://ejemplo.local/evidencias/proyector_lab1_01.jpg", descripcion: "Estado inicial del proyector apagado", fecha: new Date("2026-08-01T08:55:00Z") },
  { incidenciaId: 2,  tipo: "imagen", nombre: "pc_lab1_01.jpg", url: "https://ejemplo.local/evidencias/pc_lab1_01.jpg", descripcion: "Pantalla de error durante el arranque", fecha: new Date("2026-08-01T10:10:00Z") },
  { incidenciaId: 3,  tipo: "imagen", nombre: "impresora_lab2_01.jpg", url: "https://ejemplo.local/evidencias/impresora_lab2_01.jpg", descripcion: "Mensaje de error de tóner en pantalla", fecha: new Date("2026-08-02T08:25:00Z") },
  { incidenciaId: 4,  tipo: "documento", nombre: "reporte_red_aula204.pdf", url: "https://ejemplo.local/evidencias/reporte_red_aula204.pdf", descripcion: "Registro de intentos de conexión fallidos", fecha: new Date("2026-08-02T10:55:00Z") },
  { incidenciaId: 5,  tipo: "imagen", nombre: "proyector_204_manchas.jpg", url: "https://ejemplo.local/evidencias/proyector_204_manchas.jpg", descripcion: "Manchas visibles en la proyección", fecha: new Date("2026-08-03T09:40:00Z") },
  { incidenciaId: 6,  tipo: "imagen", nombre: "pc_docente_305.jpg", url: "https://ejemplo.local/evidencias/pc_docente_305.jpg", descripcion: "Uso de disco al 98%", fecha: new Date("2026-08-03T14:15:00Z") },
  { incidenciaId: 7,  tipo: "imagen", nombre: "switch_305.jpg", url: "https://ejemplo.local/evidencias/switch_305.jpg", descripcion: "Switch sin luces LED encendidas", fecha: new Date("2026-08-04T08:05:00Z") },
  { incidenciaId: 8,  tipo: "imagen", nombre: "pc_biblioteca_01.jpg", url: "https://ejemplo.local/evidencias/pc_biblioteca_01.jpg", descripcion: "Computador sin respuesta al encendido", fecha: new Date("2026-08-04T10:45:00Z") },
  { incidenciaId: 9,  tipo: "imagen", nombre: "impresora_biblioteca_atasco.jpg", url: "https://ejemplo.local/evidencias/impresora_biblioteca_atasco.jpg", descripcion: "Papel atascado en el rodillo", fecha: new Date("2026-08-05T09:10:00Z") },
  { incidenciaId: 10, tipo: "documento", nombre: "log_router_biblioteca.txt", url: "https://ejemplo.local/evidencias/log_router_biblioteca.txt", descripcion: "Registro de desconexiones del router", fecha: new Date("2026-08-05T13:35:00Z") },
  { incidenciaId: 11, tipo: "imagen", nombre: "pc_lab1_02_bsod.jpg", url: "https://ejemplo.local/evidencias/pc_lab1_02_bsod.jpg", descripcion: "Captura de la pantalla azul", fecha: new Date("2026-08-06T08:55:00Z") },
  { incidenciaId: 12, tipo: "imagen", nombre: "proyector_lab1_gris.jpg", url: "https://ejemplo.local/evidencias/proyector_lab1_gris.jpg", descripcion: "Imagen proyectada en escala de grises", fecha: new Date("2026-08-06T11:25:00Z") },
  { incidenciaId: 13, tipo: "imagen", nombre: "pc_lab2_01_usb.jpg", url: "https://ejemplo.local/evidencias/pc_lab2_01_usb.jpg", descripcion: "Puerto USB sin reconocimiento de dispositivo", fecha: new Date("2026-08-07T08:40:00Z") },
  { incidenciaId: 14, tipo: "imagen", nombre: "pc_lab2_02_popup.jpg", url: "https://ejemplo.local/evidencias/pc_lab2_02_popup.jpg", descripcion: "Ventanas emergentes sospechosas en pantalla", fecha: new Date("2026-08-07T15:05:00Z") },
  { incidenciaId: 15, tipo: "imagen", nombre: "impresora_lab2_bn.jpg", url: "https://ejemplo.local/evidencias/impresora_lab2_bn.jpg", descripcion: "Impresión únicamente en blanco y negro", fecha: new Date("2026-08-08T09:15:00Z") },
  { incidenciaId: 16, tipo: "imagen", nombre: "proyector_204_parpadeo.jpg", url: "https://ejemplo.local/evidencias/proyector_204_parpadeo.jpg", descripcion: "Secuencia de parpadeo del proyector", fecha: new Date("2026-08-08T12:55:00Z") },
  { incidenciaId: 17, tipo: "imagen", nombre: "pc_docente_204_audio.jpg", url: "https://ejemplo.local/evidencias/pc_docente_204_audio.jpg", descripcion: "Panel de sonido sin dispositivo detectado", fecha: new Date("2026-08-09T09:25:00Z") },
  { incidenciaId: 18, tipo: "documento", nombre: "log_red_aula305.txt", url: "https://ejemplo.local/evidencias/log_red_aula305.txt", descripcion: "Registro de caídas de conexión", fecha: new Date("2026-08-09T14:00:00Z") },
  { incidenciaId: 19, tipo: "imagen", nombre: "proyector_305_sin_senal.jpg", url: "https://ejemplo.local/evidencias/proyector_305_sin_senal.jpg", descripcion: "Mensaje de 'sin señal' en el proyector", fecha: new Date("2026-08-10T08:45:00Z") },
  { incidenciaId: 20, tipo: "imagen", nombre: "pc_docente_305_lento.jpg", url: "https://ejemplo.local/evidencias/pc_docente_305_lento.jpg", descripcion: "Administrador de tareas con alto uso de CPU", fecha: new Date("2026-08-10T11:10:00Z") }
];

db.diagnosticos.insertMany(diagnosticos);
db.evidencias.insertMany(evidencias);

print("Insertados " + diagnosticos.length + " diagnósticos y " + evidencias.length + " evidencias.");

// ---------------------------------------------------------------------
// Consulta de verificación: detalle integrado de la incidencia 1
// (simula lo que hará el backend en GET /api/incidencias/1)
// ---------------------------------------------------------------------
print("--- Verificación: documentos vinculados a incidenciaId 1 ---");
printjson(db.diagnosticos.find({ incidenciaId: 1 }).toArray());
printjson(db.evidencias.find({ incidenciaId: 1 }).toArray());