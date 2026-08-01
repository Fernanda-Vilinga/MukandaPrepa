const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();


const formatMarathon = (m)=>({

    id:m.id,

    title:m.titulo,

    icon:m.icon || "📚",

    status:m.status,

    durationMinutes:m.duracaoMinutos || 0,

    participants:m.participantes || 0,

    connectedNow:m.connectedNow || 0,

    questionsUploaded:
        (m.questoes || [])
        .filter(q=>q && q.filled)
        .length

});


const dashboard = async (req, res) => {

  try {

    const professorId = req.usuario.id;


    const marathonsSnapshot = await db
      .collection("maratonas")
      .where("professorId", "==", professorId)
      .get();


    const marathons = marathonsSnapshot.docs.map(doc =>
        formatMarathon({
            id:doc.id,
            ...doc.data()
        })
    );


    const submissionsSnapshot = await db
      .collection("submissions")
      .where("professorId", "==", professorId)
      .where("status", "==", "pending")
      .get();



    const chatsSnapshot = await db
      .collection("chats")
      .where("professorId", "==", professorId)
      .where("unread", ">", 0)
      .get();



    const connectedNow = marathons.reduce(
        (total, marathon)=>{
            return total + marathon.connectedNow;
        },0
    );


    res.json({

        marathons,

        connectedNow,

        pendingValidations: submissionsSnapshot.size,

        unreadChats: chatsSnapshot.size

    });


  } catch(error){

    console.error(error);

    res.status(500).json({
        message:"Erro ao carregar dashboard."
    });

  }

};

const getLiveSessions = async (req, res) => {
    // buscar sessões no Firestore
};

module.exports = {
    dashboard,
    getLiveSessions
};
