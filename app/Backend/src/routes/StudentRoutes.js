const express = require("express");
const router = express.Router();

const { verificarToken } = require("../middleware/authMiddleware");
const { db } = require("../config/firebase");


// actualizar perfil
router.put("/me", verificarToken, async (req, res) => {

    try {

        const userId = req.usuario.id;

        const { nome, contacto, area } = req.body;


        await db.collection("usuarios")
            .doc(userId)
            .update({
                nome,
                contacto,
                area
            });


        const userDoc = await db.collection("usuarios")
            .doc(userId)
            .get();


        res.json({
            mensagem: "Perfil actualizado com sucesso",
            usuario:{
                id:userDoc.id,
                ...userDoc.data()
            }
        });


    } catch(error){

        console.error(error);

        res.status(500).json({
            mensagem:"Erro ao actualizar perfil"
        });

    }

});


module.exports = router;