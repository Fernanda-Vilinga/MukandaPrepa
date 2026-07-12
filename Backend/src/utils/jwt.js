const jwt = require("jsonwebtoken");


function gerarToken(usuario){

    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn:"7d"
        }
    );

}


module.exports = gerarToken;