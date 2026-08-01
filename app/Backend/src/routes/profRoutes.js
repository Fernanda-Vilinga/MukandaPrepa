const express = require("express");
const router = express.Router();

const {
    getLiveSessions
} = require("../controllers/profController");

const {
    verificarToken,
    exigirRole
} = require("../middleware/authMiddleware");


router.get(
    "/live-sessions",
    verificarToken,
    exigirRole("professor"),
    getLiveSessions
);


module.exports = router;