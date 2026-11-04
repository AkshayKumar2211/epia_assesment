const express = require("express");
const router = express.Router();
const db = require("../database");

const insertAppointment = db.prepare(
  "INSERT INTO appointments (name, phone, date) VALUES (?, ?, ?)"
);
const getAppointmentById = db.prepare(
  "SELECT * FROM appointments WHERE id = ?"
);
const getAllAppointments = db.prepare(
  "SELECT * FROM appointments ORDER BY created_at DESC"
);

router.post("/", (req, res) => {
  const { name, phone, date } = req.body;

  const missing = [];
  if (!name) missing.push("name");
  if (!phone) missing.push("phone");
  if (!date) missing.push("date");

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  try {
    const result = insertAppointment.run(name, phone, date);
    const appointment = getAppointmentById.get(result.lastInsertRowid);

    res.status(201).json({
      message: "Appointment created",
      appointment,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

router.get("/", (req, res) => {
  const appointments = getAllAppointments.all();
  res.json(appointments);
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }

  const appointment = getAppointmentById.get(id);

  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  res.json(appointment);
});

module.exports = router;
