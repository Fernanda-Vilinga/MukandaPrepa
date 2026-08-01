const express = require("express");
const router = express.Router();

const { dashboard } = require("../controllers/profController");
const { verificarToken, exigirRole } = require("../middleware/authMiddleware");


router.get(
    "/",
    verificarToken,
    exigirRole("professor"),
    dashboard
);


module.exports = router;