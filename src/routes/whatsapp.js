const express = require("express");
const router = express.Router();
const db = require("../database");

function simulateWhatsAppAPI(phone, message) {
  const rand = Math.random();

  if (rand < 0.6) {
    return {
      ok: true,
      data: {
        messaging_product: "whatsapp",
        contacts: [{ wa_id: phone }],
        messages: [{ id: `wamid_${Date.now()}` }],
      },
    };
  }

  if (rand < 0.75) {
    return {
      ok: false,
      data: {
        error: {
          message: "Invalid OAuth access token",
          type: "OAuthException",
          code: 190,
        },
      },
    };
  }

  if (rand < 0.9) {
    return {
      ok: false,
      data: {
        error: {
          message: "Rate limit reached",
          type: "OAuthException",
          code: 4,
        },
      },
    };
  }

  return {
    ok: false,
    data: {
      error: {
        message: "Recipient phone number not on WhatsApp",
        type: "OAuthException",
        code: 131030,
      },
    },
  };
}

const insertMessage = db.prepare(`
  INSERT INTO messages (appointment_id, recipient_phone, message_text, status, error_message)
  VALUES (?, ?, ?, ?, ?)
`);

const getMessagesByAppointment = db.prepare(
  "SELECT * FROM messages WHERE appointment_id = ? ORDER BY sent_at DESC"
);

const getAppointmentById = db.prepare(
  "SELECT * FROM appointments WHERE id = ?"
);

router.post("/send-reminder", (req, res) => {
  const { appointment_id } = req.body;

  if (!appointment_id) {
    return res.status(400).json({ error: "Missing required field: appointment_id" });
  }

  const appointment = getAppointmentById.get(appointment_id);
  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  const messageText = `Reminder: You have an appointment scheduled on ${appointment.date}. Please arrive 10 minutes early.`;

  try {
    const apiResponse = simulateWhatsAppAPI(appointment.phone, messageText);

    if (apiResponse.ok) {
      insertMessage.run(
        appointment.id,
        appointment.phone,
        messageText,
        "sent",
        null
      );

      return res.json({
        message: "Reminder sent successfully",
        whatsapp_message_id: apiResponse.data.messages[0].id,
      });
    }

    const errorCode = apiResponse.data.error.code;
    const errorType = apiResponse.data.error.type;
    const errorMsg = apiResponse.data.error.message;

    console.error(
      `WhatsApp API error — code: ${errorCode}, type: ${errorType}, message: ${errorMsg}`
    );

    insertMessage.run(
      appointment.id,
      appointment.phone,
      messageText,
      "failed",
      `Code ${errorCode}: ${errorMsg}`
    );

    const statusCode = errorCode === 190 ? 401 : 502;
    return res.status(statusCode).json({
      error: "Failed to send WhatsApp reminder",
      detail: errorMsg,
      code: errorCode,
    });
  } catch (err) {
    console.error("Unexpected error in WhatsApp send:", err.message);

    insertMessage.run(
      appointment.id,
      appointment.phone,
      messageText,
      "error",
      err.message
    );

    return res.status(500).json({
      error: "Internal error while sending reminder",
    });
  }
});

router.get("/messages/:appointment_id", (req, res) => {
  const appointmentId = Number(req.params.appointment_id);

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ error: "Invalid appointment ID" });
  }

  const messages = getMessagesByAppointment.all(appointmentId);
  res.json(messages);
});

module.exports = router;
