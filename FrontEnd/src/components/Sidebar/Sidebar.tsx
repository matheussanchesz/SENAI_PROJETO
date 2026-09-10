import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiArchive,
  FiArrowLeft,
  FiBarChart2,
  FiBell,
  FiChevronLeft,
  FiChevronDown,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMoon,
  FiShoppingCart,
  FiSave,
  FiSend,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import "./Sidebar.css";
import { alternarTema } from "../../services/theme";
import { temPermissao, type Recurso } from "../../services/permissoes";
import { api, obterMensagemErroApi } from "../../services/api";
import { limparProgramaSelecionado } from "../../services/programas";

type Perfil = "Desenvolvedor" | "Admin" | "Coordenador" | "Professor" | "Almoxarife" | "Almoxarifado";

type ItemMenu = {
  icone: React.ReactNode;
  titulo: string;
  caminho: string;
  recurso: Recurso;
};

const SIDEBAR_RECOLHIDA_KEY = "@senai:sidebar-recolhida";

const itensMenu: ItemMenu[] = [
  {
    icone: <FiHome />,
    titulo: "Dashboard",
    caminho: "/dashboard",
    recurso: "dashboard",
  },
  {
    icone: <FiFileText />,
    titulo: "Demandas",
    caminho: "/demandas",
    recurso: "demandas",
  },
  {
    icone: <FiArchive />,
    titulo: "Almoxarifado",
    caminho: "/almoxarifado",
    recurso: "almoxarifado",
  },
  {
    icone: <FiShoppingCart />,
    titulo: "Compras",
    caminho: "/compras",
    recurso: "compras",
  },
  {
    icone: <FiClipboard />,
    titulo: "Checklists",
    caminho: "/checklists",
    recurso: "checklists",
  },
  {
    icone: <FiBarChart2 />,
    titulo: "Relatórios",
    caminho: "/relatorios",
    recurso: "relatorios",
  },
  {
    icone: <FiUsers />,
    titulo: "Usuários",
    caminho: "/usuarios",
    recurso: "usuarios",
  },
  {
    icone: <FiBell />,
    titulo: "Notificações",
    caminho: "/notificacoes",
    recurso: "notificacoes",
  },
  {
    icone: <FiSend />,
    titulo: "Comunicados",
    caminho: "/comunicados-sistema",
    recurso: "comunicadosSistema",
  },
];

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("@senai:user");

  if (!usuarioSalvo) {
    return { nome: "Usuário", matricula: "", perfil: "Coordenador" as Perfil };
  }

  try {
    return JSON.parse(usuarioSalvo) as {
      nome: string;
      matricula: string;
      perfil: Perfil;
    };
  } catch {
    return { nome: "Usuário", matricula: "", perfil: "Coordenador" as Perfil };
  }
}

function gerarIniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(obterUsuarioLogado);
  const [sidebarRecolhida, setSidebarRecolhida] = useState(
    () => localStorage.getItem(SIDEBAR_RECOLHIDA_KEY) === "true",
  );

  const [menuAberto, setMenuAberto] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState("");
  const [perfilForm, setPerfilForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    setor: "",
  });

  const itensPermitidos = itensMenu.filter((item) =>
    temPermissao(usuario.perfil, item.recurso),
  );

  useEffect(() => {
    function abrirMenu() {
      setMenuAberto(true);
    }

    window.addEventListener("abrir-menu-mobile", abrirMenu);

    return () => {
      window.removeEventListener("abrir-menu-mobile", abrirMenu);
    };
  }, []);

  function alternarSidebar() {
    setSidebarRecolhida((estadoAtual) => {
      const novoEstado = !estadoAtual;
      localStorage.setItem(SIDEBAR_RECOLHIDA_KEY, String(novoEstado));
      setMenuUsuarioAberto(false);
      return novoEstado;
    });
  }

  function sairDaConta() {
    localStorage.removeItem("@senai:user");
    localStorage.removeItem("@senai:token");
    limparProgramaSelecionado();
    navigate("/login");
  }

  function alternarModoEscuro() {
    alternarTema();
    setMenuUsuarioAberto(false);
  }

  function trocarPrograma() {
    limparProgramaSelecionado();
    setMenuUsuarioAberto(false);
    navigate("/programas");
  }

  async function abrirEdicaoPerfil() {
    setMenuUsuarioAberto(false);
    setEditandoPerfil(true);
    setCarregandoPerfil(true);
    setErroPerfil("");

    try {
      const response = await api.get("/MeuPerfil");
      const dados = response.data as {
        nome?: string;
        email?: string;
        telefone?: string;
        setor?: string;
      };
      setPerfilForm({
        nome: dados.nome ?? usuario.nome,
        email: dados.email ?? "",
        telefone: dados.telefone ?? "",
        setor: dados.setor ?? "",
      });
    } catch (error) {
      setErroPerfil(obterMensagemErroApi(error, "Não foi possível carregar seus dados."));
    } finally {
      setCarregandoPerfil(false);
    }
  }

  async function salvarMeuPerfil(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setSalvandoPerfil(true);
    setErroPerfil("");

    try {
      const response = await api.put("/MeuPerfil", perfilForm);
      const dados = response.data.usuario as { nome: string };
      const token = response.data.token as string;
      const usuarioAtualizado = { ...usuario, nome: dados.nome };
      localStorage.setItem("@senai:user", JSON.stringify(usuarioAtualizado));
      localStorage.setItem("@senai:token", token);
      setUsuario(usuarioAtualizado);
      setEditandoPerfil(false);
    } catch (error) {
      setErroPerfil(obterMensagemErroApi(error, "Não foi possível atualizar seus dados."));
    } finally {
      setSalvandoPerfil(false);
    }
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${menuAberto ? "show" : ""}`}
        onClick={() => setMenuAberto(false)}
      />

      <aside
        className={`sidebar ${sidebarRecolhida ? "recolhida" : ""} ${
          menuAberto ? "mobile-open" : ""
        }`}
      >
        <div>
          <div className="sidebar-logo-row">
            <div className="sidebar-logo">
              <h1>
                <span className="sidebar-logo-completa">SENAI</span>
              </h1>
            </div>

            <button
              type="button"
              className="sidebar-close"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
            >
              <FiX />
            </button>
          </div>

          <nav className="sidebar-menu">
            {itensPermitidos.map((item) => (
              <NavLink
                key={item.titulo}
                to={item.caminho}
                onClick={() => {
                  setMenuAberto(false);
                  setMenuUsuarioAberto(false);
                }}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? "active" : ""}`
                }
                title={sidebarRecolhida ? item.titulo : undefined}
                aria-label={sidebarRecolhida ? item.titulo : undefined}
              >
                {item.icone}
                <span>{item.titulo}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={alternarSidebar}
          aria-label={sidebarRecolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
          title={sidebarRecolhida ? "Expandir menu" : "Recolher menu"}
          aria-pressed={sidebarRecolhida}
        >
          {sidebarRecolhida ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-programas"
            onClick={trocarPrograma}
            title="Escolher programa"
            aria-label="Voltar para a escolha de programas"
          >
            <FiArrowLeft />
            <span>Voltar</span>
          </button>

          <div className="sidebar-user-wrapper">
            <button
              type="button"
              className="sidebar-user"
              onClick={() => setMenuUsuarioAberto((estadoAtual) => !estadoAtual)}
              aria-expanded={menuUsuarioAberto}
            >
              <div className="avatar">{gerarIniciais(usuario.nome)}</div>

              <div className="sidebar-user-info">
                <strong>{usuario.nome}</strong>
                <span>{usuario.perfil}</span>
              </div>

              <FiChevronDown
                className={`sidebar-user-arrow ${
                  menuUsuarioAberto ? "aberto" : ""
                }`}
              />
            </button>

            {menuUsuarioAberto && (
              <div className="sidebar-user-menu">
                {usuario.perfil !== "Coordenador" && (
                  <button type="button" onClick={() => void abrirEdicaoPerfil()}>
                    <FiUser />
                    Editar meus dados
                  </button>
                )}

                <button type="button" onClick={alternarModoEscuro}>
                  <FiMoon />
                  Modo escuro
                </button>

                <button type="button" className="sair" onClick={sairDaConta}>
                  <FiLogOut />
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {editandoPerfil && (
        <div className="perfil-modal-fundo" onClick={() => setEditandoPerfil(false)}>
          <section className="perfil-modal" onClick={(evento) => evento.stopPropagation()}>
            <header>
              <div>
                <h2>Editar meus dados</h2>
                <p>Matrícula: {usuario.matricula}</p>
              </div>
              <button type="button" className="perfil-modal-fechar" onClick={() => setEditandoPerfil(false)}>
                <FiX />
              </button>
            </header>

            {erroPerfil && <div className="perfil-modal-erro">{erroPerfil}</div>}

            <form onSubmit={salvarMeuPerfil}>
              <label>
                Nome
                <input
                  required
                  disabled={carregandoPerfil}
                  value={perfilForm.nome}
                  onChange={(evento) => setPerfilForm((atual) => ({ ...atual, nome: evento.target.value }))}
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  disabled={carregandoPerfil}
                  value={perfilForm.email}
                  onChange={(evento) => setPerfilForm((atual) => ({ ...atual, email: evento.target.value }))}
                />
              </label>
              <label>
                Telefone
                <input
                  type="tel"
                  disabled={carregandoPerfil}
                  value={perfilForm.telefone}
                  onChange={(evento) => setPerfilForm((atual) => ({ ...atual, telefone: evento.target.value }))}
                />
              </label>
              <label>
                Setor
                <input
                  disabled={carregandoPerfil}
                  value={perfilForm.setor}
                  onChange={(evento) => setPerfilForm((atual) => ({ ...atual, setor: evento.target.value }))}
                />
              </label>

              <div className="perfil-modal-acoes">
                <button type="button" className="cancelar" onClick={() => setEditandoPerfil(false)}>Cancelar</button>
                <button type="submit" className="salvar" disabled={carregandoPerfil || salvandoPerfil}>
                  <FiSave />
                  {salvandoPerfil ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
