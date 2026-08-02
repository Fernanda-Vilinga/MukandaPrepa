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

  // Guarda a mensagem de sucesso, não um sim/não: dizia sempre "Perfil
  // actualizado" mesmo quando o que tinha mudado era a senha.
  const [saved, setSaved] = useState("");


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
    setSaved("");


    // Preencher só a confirmação, ou só a senha actual, era ignorado em
    // silêncio: o utilizador carregava em Guardar, via "sucesso" e ficava
    // convencido de que tinha mudado a senha. Não tinha.
    const querMudarSenha =
      !!(form.password || form.confirm || form.currentPassword);


    if(querMudarSenha){


      if(!form.currentPassword){

        setError(
          "Para mudar a senha, escreve primeiro a tua senha actual."
        );

        return;

      }



      if(!form.password){

        setError(
          "Escreve a nova senha."
        );

        return;

      }



      if(form.password.length < 8){

        setError(
          "A nova senha deve ter pelo menos 8 caracteres."
        );

        return;

      }



      if(form.password !== form.confirm){

        setError(
          "A confirmação da senha não coincide."
        );

        return;

      }



      if(form.password === form.currentPassword){

        setError(
          "A nova senha tem de ser diferente da actual."
        );

        return;

      }


    }



    try{


      setBusy(true);


      // A senha primeiro, de propósito.
      //
      // São dois pedidos ao servidor e não há como desfazer o primeiro se o
      // segundo falhar. A senha é a que falha por um motivo que o utilizador
      // pode corrigir — enganar-se na senha actual. Fazendo-a primeiro, se
      // falhar não se mudou nada e basta tentar de novo. Ao contrário, o perfil
      // ficava gravado e a mensagem de erro falava da senha: o utilizador não
      // sabia o que tinha ficado guardado.

      if(querMudarSenha){


        await changePassword(

          form.currentPassword,

          form.password

        );


      }



      // nome, contacto e área

      const updated = await updateProfile({

        name:form.name,

        phone:form.phone,

        area:form.area

      });



      setUser(updated);

      setSaved(
        querMudarSenha
        ? "Perfil e senha actualizados. A nova senha vale já no próximo início de sessão."
        : "Perfil actualizado com sucesso."
      );

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

    setSaved("");

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


<h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>
🔑 Alterar senha
</h3>


<p className="xs mut" style={{marginBottom:14}}>
Opcional — deixa em branco para manter a senha actual.
</p>


{/* Os campos tinham só placeholder, separados por <br/>: sem etiqueta
    visível, quem apagasse o texto deixava de saber qual era qual, e os
    gestores de senhas do browser não sabiam o que preencher. */}

<div className="field">

<label className="label" htmlFor="pw-actual">
Senha actual
</label>

<input

id="pw-actual"

className="input"

type="password"

autoComplete="current-password"

value={form.currentPassword}

onChange={handleChange("currentPassword")}

/>

</div>


<div className="row" style={{gap:16}}>


<div className="col field">

<label className="label" htmlFor="pw-nova">
Nova senha
</label>

<input

id="pw-nova"

className="input"

type="password"

autoComplete="new-password"

placeholder="Mínimo 8 caracteres"

value={form.password}

onChange={handleChange("password")}

/>

</div>


<div className="col field" style={{marginBottom:0}}>

<label className="label" htmlFor="pw-confirmar">
Confirmar nova senha
</label>

<input

id="pw-confirmar"

className="input"

type="password"

autoComplete="new-password"

value={form.confirm}

onChange={handleChange("confirm")}

/>

</div>


</div>


</div>


}






{
error &&

<p className="sm" style={{
color:"var(--red)",
background:"var(--red-l)",
borderRadius:10,
padding:"10px 14px"
}}>

{error}

</p>

}



{
saved &&

<p className="sm" style={{
color:"var(--green)",
background:"var(--green-l)",
borderRadius:10,
padding:"10px 14px"
}}>

✓ {saved}

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