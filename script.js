console.log("✅ script.js carregado!");

import {
  doc,
  setDoc,
  getDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { db } from "./firebase-config.js";

function abrirModalNovoPaciente() {
  document.getElementById("modalNovoPaciente").style.display = "flex";
}

function fecharModalNovoPaciente() {
  document.getElementById("modalNovoPaciente").style.display = "none";
}

async function salvarNovoPaciente() {
  const nome = document.getElementById("novo-nome").value.trim();
  const sobrenome = document.getElementById("novo-sobrenome").value.trim();
  const idade = parseInt(document.getElementById("novo-idade").value);
  const cidade = document.getElementById("novo-cidade").value.trim();
  const estado = document.getElementById("novo-estado").value.trim();
  const medicoId = localStorage.getItem("uid");

  if (!nome || !sobrenome || !idade || !cidade || !estado) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    const uidPaciente = crypto.randomUUID(); // gerar UID aleatório, ou use do Firebase Auth se quiser

    // Criar documento do paciente
    await setDoc(doc(db, "pacientes", uidPaciente), {
      criadoEm: new Date().toISOString(),
      identificacao: [{
        nome,
        sobrenome,
        idade,
        cidade,
        estado
      }],
      meusmedicos: [medicoId],
      calendario: [{}],
      documento: [{}],
      exame: [{}],
      prontuario: [{}],
      resumo: [{}],
      tratamento: [{}]
    });

    // Atualizar documento do médico para adicionar esse paciente na lista
    const refMedico = doc(db, "medicos", medicoId);
    const docMedico = await getDoc(refMedico);
    const dados = docMedico.data();
    const pacientesAtuais = dados.meuspacientes || [];
    pacientesAtuais.push(uidPaciente);
    await setDoc(refMedico, { ...dados, meuspacientes: pacientesAtuais });

    alert("Paciente adicionado com sucesso!");
    fecharModalNovoPaciente();

    // Recarregar a lista de pacientes
    if (typeof listarPacientes === "function") {
      listarPacientes();
    }

  } catch (error) {
    console.error("Erro ao salvar novo paciente:", error);
    alert("Erro ao salvar novo paciente.");
  }
}

// função para abrir pastas do paciente
async function abrirPasta(nome) {
  const pacienteId = localStorage.getItem("pacienteSelecionado");
  if (!pacienteId) {
    alert("Paciente não selecionado.");
    return;
  }

  try {
    const ref = doc(db, "pacientes", pacienteId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("Paciente não encontrado.");
      return;
    }

    const dados = snap.data();
    const pasta = dados[nome];

    if (Array.isArray(pasta)) {
      console.log(`📂 Pasta ${nome} tem ${pasta.length} item(ns):`, pasta);
      alert(`Abrindo pasta '${nome}' do paciente ${pacienteId}.`);
    } else {
      alert(`Pasta '${nome}' está vazia ou não existe.`);
    }

  } catch (error) {
    console.error("Erro ao abrir pasta:", error);
    alert("Erro ao abrir pasta.");
  }
}

// função de atalho
function verConsultas() {
  abrirPasta("calendario");
}

function sair() {
  localStorage.removeItem("uid");
  window.location.href = "index.html";
}

// exportar para usar no HTML se quiser
window.abrirModalNovoPaciente = abrirModalNovoPaciente;
window.fecharModalNovoPaciente = fecharModalNovoPaciente;
window.salvarNovoPaciente = salvarNovoPaciente;
window.abrirPasta = abrirPasta;
window.verConsultas = verConsultas;
window.sair = sair;