const express = require("express");
const router = express.Router();

// דמו של שיעורים
let lessons = [
  { id: 1, subject: "היסטוריה", content: "שיעור 1 על היסטוריה" },
  { id: 2, subject: "מתמטיקה", content: "שיעור 1 על מתמטיקה" },
];

// קבלת כל השיעורים
router.get("/", (req, res) => {
  res.json(lessons);
});

module.exports = router;
