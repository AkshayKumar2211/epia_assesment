const express = require("express");
const router = express.Router();
const db = require("../database");

const insertFollowUp = db.prepare(`
  INSERT INTO follow_ups (appointment_id, follow_up_date, status, notes)
  VALUES (?, ?, 'pending', ?)
`);

const getFollowUpById = db.prepare("SELECT * FROM follow_ups WHERE id = ?");

const getPendingFollowUps = db.prepare(
  "SELECT f.*, a.name AS patient_name, a.phone AS patient_phone FROM follow_ups f JOIN appointments a ON f.appointment_id = a.id WHERE f.status = 'pending' ORDER BY f.follow_up_date ASC"
);

const markComplete = db.prepare(
  "UPDATE follow_ups SET status = 'completed' WHERE id = ?"
);

const getAppointmentById = db.prepare(
  "SELECT * FROM appointments WHERE id = ?"
);

router.post("/", (req, res) => {
  const { appointment_id, follow_up_date, notes } = req.body;

  const missing = [];
  if (!appointment_id) missing.push("appointment_id");
  if (!follow_up_date) missing.push("follow_up_date");

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  const appointment = getAppointmentById.get(appointment_id);
  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  try {
    const result = insertFollowUp.run(
      appointment_id,
      follow_up_date,
      notes || null
    );
    const followUp = getFollowUpById.get(result.lastInsertRowid);

    res.status(201).json({
      message: "Follow-up created",
      follow_up: followUp,
    });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        error: "A follow-up already exists for this appointment on that date",
      });
    }
    res.status(500).json({ error: "Failed to create follow-up" });
  }
});

router.get("/pending", (req, res) => {
  const followUps = getPendingFollowUps.all();
  res.json(followUps);
});

router.patch("/:id/complete", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid follow-up ID" });
  }

  const followUp = getFollowUpById.get(id);
  if (!followUp) {
    return res.status(404).json({ error: "Follow-up not found" });
  }

  if (followUp.status === "completed") {
    return res.status(400).json({ error: "Follow-up is already completed" });
  }

  markComplete.run(id);

  res.json({
    message: "Follow-up marked as completed",
    follow_up: { ...followUp, status: "completed" },
  });
});

module.exports = router;
