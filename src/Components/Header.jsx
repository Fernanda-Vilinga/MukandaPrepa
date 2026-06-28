import { useState } from "react";

export default function Header() {
  const [openPlans, setOpenPlans] = useState(false);
  const [openBlog, setOpenBlog] = useState(false);
  const [openContacts, setOpenContacts] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.logo}>MukandaPrepa</div>
      <nav style={styles.nav}>
        <a href="#" style={styles.link}>Home</a>
        <div style={styles.dropdown}>
          <button onClick={() => setOpenPlans(!openPlans)} style={styles.button}>
            Planos e Preços ▾
          </button>
          {openPlans && (
            <div style={styles.menu}>
              <a href="#">Básico</a>
              <a href="#">Premium</a>
              <a href="#">Empresas</a>
            </div>
          )}
        </div>

        <div style={styles.dropdown}>
          <button onClick={() => setOpenBlog(!openBlog)} style={styles.button}>
            Blog ▾
          </button>
          {openBlog && (
            <div style={styles.menu}>
              <a href="#">Artigos</a>
              <a href="#">Tutoriais</a>
            </div>
          )}
        </div>

        <div style={styles.dropdown}>
          <button onClick={() => setOpenContacts(!openContacts)} style={styles.button}>
            Contactos ▾
          </button>
          {openContacts && (
            <div style={styles.menu}>
              <a href="#">Email</a>
              <a href="#">Suporte</a>
            </div>
          )}
        </div>
      </nav>

      <div style={styles.actions}>
        <button style={styles.login}>Login</button>
        <button style={styles.signup}>Inscrever-me</button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "#b9b8b8",
    color: "black",
    fontFamily: "Arial",
  },
  logo: {

    fontSize: "20px",
    fontWeight: "bold",
  },
  nav: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  link: {
    color: "black",
    textDecoration: "none",
  },
  dropdown: {
    position: "relative",
  },
  button: {
    background: "transparent",
    color: "black",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  menu: {
    position: "absolute",
    top: "25px",
    background: "white",
    color: "black",
    padding: "10px",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    minWidth: "120px",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  login: {
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid white",
    color: "black",
    cursor: "pointer",
  },
  signup: {
    padding: "6px 12px",
    background: "#ff800a",
    border: "none",
    color: "black",
    cursor: "pointer",
  },
};