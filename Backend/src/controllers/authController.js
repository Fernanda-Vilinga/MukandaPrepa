
const { db } = require("../config/firebase");
const bcrypt = require("bcrypt");
const gerarToken = require("../utils/jwt");



exports.register = async (req, res) => {

    try {

        const { nome, email, senha, plano } = req.body;


        if(!nome || !email || !senha){

            return res.status(400).json({
                mensagem:"Todos os campos são obrigatórios."
            });

        }


        // verificar se email já existe

        const usuarioExistente = await db
            .collection("usuarios")
            .where("email", "==", email)
            .get();



        if(!usuarioExistente.empty){

            return res.status(400).json({
                mensagem:"Este email já está registrado."
            });

        }



        const senhaHash = await bcrypt.hash(senha, 10);



        const novoUsuario = {

            nome,
            email,
            senha: senhaHash,
            plano: plano || "Basic",
            criadoEm: new Date()

        };



        const usuario = await db
            .collection("usuarios")
            .add(novoUsuario);



        res.status(201).json({

            mensagem:"Usuário criado com sucesso.",
            usuarioId: usuario.id

        });



    } catch(error){

        console.error(error);

        res.status(500).json({
            mensagem:"Erro no servidor."
        });

    }

};







exports.login = async (req,res)=>{


    try{

        const {email, senha} = req.body;


        if(!email || !senha){

            return res.status(400).json({
                mensagem:"Email e senha são obrigatórios."
            });

        }



        const resultado = await db
            .collection("usuarios")
            .where("email","==",email)
            .get();



        if(resultado.empty){

            return res.status(404).json({
                mensagem:"Usuário não encontrado."
            });

        }



        const documento = resultado.docs[0];


        const usuario = {

            id: documento.id,
            ...documento.data()

        };



        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );



        if(!senhaValida){

            return res.status(401).json({
                mensagem:"Senha incorreta."
            });

        }



        const token = gerarToken(usuario);



        res.json({

            mensagem:"Login realizado com sucesso.",
            token,

            usuario:{
                id:usuario.id,
                nome:usuario.nome,
                email:usuario.email,
                plano:usuario.plano
            }

        });



    }catch(error){

        console.error(error);

        res.status(500).json({
            mensagem:"Erro no servidor."
        });

    }

};
