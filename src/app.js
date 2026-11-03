const express = require("express");
const app = express();

app.use(express.json());

const appointmentsRouter = require("./routes/appointments");
const whatsappRouter = require("./routes/whatsapp");
const followUpsRouter = require("./routes/followups");

app.use("/appointments", appointmentsRouter);
app.use("/whatsapp", whatsappRouter);
app.use("/follow-ups", followUpsRouter);

app.get("/", (req, res) => {
  res.json({
    service: "EPIA CRM API",
    endpoints: {
      appointments: {
        "POST /appointments": "Create an appointment",
        "GET /appointments": "List all appointments",
        "GET /appointments/:id": "Get appointment by ID",
      },
      whatsapp: {
        "POST /whatsapp/send-reminder": "Send appointment reminder via WhatsApp",
        "GET /whatsapp/messages/:appointment_id": "Get message log for appointment",
      },
      followUps: {
        "POST /follow-ups": "Create a follow-up",
        "GET /follow-ups/pending": "List pending follow-ups",
        "PATCH /follow-ups/:id/complete": "Mark follow-up as completed",
      },
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EPIA CRM API running on http://localhost:${PORT}`);
});

module.exports = app;
