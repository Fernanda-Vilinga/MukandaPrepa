import api from "./api";


export async function loginUsuario(dados) {

  const response = await api.post(
    "/auth/login",
    dados
  );

  return response.data;

}



export async function registrarUsuario(dados) {

  const response = await api.post(
    "/auth/register",
    dados
  );

  return response.data;

}