// Perfil do estudante: ver/modificar dados + actualizar plano.

import { useState } from "react";
import { currentUser, updateProfile, changePassword } from "../services/api.js";
import { Topbar } from "../components/Ui.jsx";
import { ChatFab } from "../components/Chat.jsx";
import { AREAS, PLAN_LABEL, PLAN_ATTEMPTS } from "../data/mock.js";
import { useNavigate } from "react-router-dom";


export default function Profile() {

  const navigate = useNavigate();

  const [user, setUser] = useState(currentUser());

  const [editing, setEditing] = useState(false);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);


  const [form, setForm] = useState({

    name: user?.name || "",
    area: user?.area || "",
    phone: user?.phone || "",

    currentPassword:"",
    password:"",
    confirm:""

  });



  const maxAtt = PLAN_ATTEMPTS[user?.plan || "basic"];



  function handleChange(field){

    return (e)=>{

      setForm({

        ...form,

        [field]: e.target.value

      });

    };

  }



  async function save(){


    setError("");
    setSaved(false);



    if(form.password){


      if(form.password.length < 8){

        setError(
          "A nova senha deve ter pelo menos 8 caracteres."
        );

        return;

      }



      if(!form.currentPassword){

        setError(
          "Informe a senha actual."
        );

        return;

      }



      if(form.password !== form.confirm){

        setError(
          "A confirmação da senha não coincide."
        );

        return;

      }


    }



    try{


      setBusy(true);



      // actualiza nome, contacto e área

      const updated = await updateProfile({

        name:form.name,

        phone:form.phone,

        area:form.area

      });



      // altera senha se necessário

      if(form.password){


        await changePassword(

          form.currentPassword,

          form.password

        );


      }




      setUser(updated);

      setSaved(true);

      setEditing(false);



      setForm({

        name:updated.name,

        area:updated.area,

        phone:updated.phone,

        currentPassword:"",
        password:"",
        confirm:""

      });



    }catch(err){


      setError(
        err.message || "Erro ao guardar alterações."
      );


    }finally{


      setBusy(false);


    }


  }




  function cancel(){


    setEditing(false);

    setError("");

    setForm({

      name:user?.name || "",

      area:user?.area || "",

      phone:user?.phone || "",

      currentPassword:"",
      password:"",
      confirm:""

    });


  }




return (

<>

<Topbar />


<div className="wrap" style={{maxWidth:760}}>


<h1 style={{
fontSize:26,
fontWeight:800,
marginBottom:24
}}>
O meu perfil
</h1>



<div className="card" style={{padding:36}}>



<div style={{
display:"flex",
alignItems:"center",
gap:18,
marginBottom:25
}}>


<div className="avatar">

{user?.name
?.split(" ")
.map(n=>n[0])
.slice(0,2)
.join("")
}

</div>



<div style={{flex:1}}>

<strong>{user?.name}</strong>

<div className="mut sm">

{user?.email}

</div>

</div>



{
!editing &&

<button
className="btn sm ghost"
onClick={()=>setEditing(true)}
>

✏️ Modificar

</button>

}



</div>




<div className="field">

<label className="label">
Nome completo
</label>


<input

className="input"

value={form.name}

disabled={!editing}

onChange={handleChange("name")}

/>

</div>





<div className="row" style={{gap:16}}>


<div className="col field">

<label className="label">
Email
</label>


<input

className="input"

value={user?.email || ""}

disabled

/>

</div>




<div className="col field">

<label className="label">
Contacto
</label>


<input

className="input"

value={form.phone}

disabled={!editing}

onChange={handleChange("phone")}

/>


</div>


</div>





<div className="field">

<label className="label">
Área
</label>


<select

className="input"

value={form.area}

disabled={!editing}

onChange={handleChange("area")}

>


<option value="">
Escolha a área
</option>


{
AREAS.map(area=>(

<option key={area}>
{area}
</option>

))
}


</select>


</div>






{
editing &&


<div style={{
background:"var(--bg)",
padding:20,
borderRadius:12
}}>


<h3>
🔑 Alterar senha
</h3>


<input

className="input"

type="password"

placeholder="Senha actual"

value={form.currentPassword}

onChange={handleChange("currentPassword")}

/>



<br/>


<input

className="input"

type="password"

placeholder="Nova senha"

value={form.password}

onChange={handleChange("password")}

/>



<br/>


<input

className="input"

type="password"

placeholder="Confirmar nova senha"

value={form.confirm}

onChange={handleChange("confirm")}

/>


</div>


}






{
error &&

<p style={{color:"red"}}>

{error}

</p>

}



{
saved &&

<p style={{color:"green"}}>

✓ Perfil actualizado com sucesso.

</p>

}





{
editing &&

<div style={{
display:"flex",
gap:12,
marginTop:20
}}>


<button
className="btn ghost"
onClick={cancel}
>

Cancelar

</button>



<button
className="btn"
disabled={busy}
onClick={save}
>

{
busy
?
"Guardando..."
:
"Guardar alterações"
}


</button>


</div>

}



</div>





<div className="card" style={{marginTop:25,padding:30}}>


<h3>
Plano actual
</h3>


<strong>

{PLAN_LABEL[user?.plan]}

</strong>


<p>

{
maxAtt===Infinity
?
"Tentativas ilimitadas"
:
`${maxAtt} tentativas por maratona`
}

</p>


<button

className="btn blue"

onClick={()=>navigate("/planos")}

>

Actualizar plano

</button>


</div>




</div>



<ChatFab />


</>

);


}