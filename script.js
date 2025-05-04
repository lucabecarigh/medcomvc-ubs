console.log("✅ script.js carregado!");

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// Firebase config personalizado
import { app, db } from "./firebase-config.js";
const storage = getStorage(app, "gs://medcomvc-ubs.firebasestorage.app");

// ========== MODAIS ==========
function abrirModalNovoPaciente() {
  document.getElementById("modalNovoPaciente").style.display = "flex";
}

function fecharModalNovoPaciente() {
  document.getElementById("modalNovoPaciente").style.display = "none";
}

function fecharUpload() {
  document.getElementById("modalUploadArquivo").style.display = "none";
  window.location.href = "paciente_view.html";
}

// ========== SALVAR NOVO PACIENTE ==========
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
    const uidPaciente = crypto.randomUUID();

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
      calendario: [],
      documento: [],
      exame: [],
      prontuario: [],
      resumo: [],
      tratamento: []
    });

    const refMedico = doc(db, "medicos", medicoId);
    const docMedico = await getDoc(refMedico);
    const dados = docMedico.data();
    const pacientesAtuais = dados.meuspacientes || [];
    pacientesAtuais.push(uidPaciente);
    await setDoc(refMedico, { ...dados, meuspacientes: pacientesAtuais });

    alert("Paciente adicionado com sucesso!");
    fecharModalNovoPaciente();

    if (typeof listarPacientes === "function") {
      listarPacientes();
    }

  } catch (error) {
    console.error("Erro ao salvar novo paciente:", error);
    alert("Erro ao salvar novo paciente.");
  }
}

// ========== UPLOAD DE ARQUIVO ==========
async function uploadArquivo() {
  const tipo = document.getElementById("tipoArquivo").value;
  const arquivo = document.getElementById("arquivoInput").files[0];
  const pacienteId = localStorage.getItem("pacienteSelecionado");

  if (!arquivo || !pacienteId || !tipo) {
    alert("Preencha todos os campos e selecione um arquivo.");
    return;
  }

  const timestamp = new Date().getTime();
  const caminho = `pacientes/${pacienteId}/${tipo}/${arquivo.name}_${timestamp}`;

  try {
    const storageRef = ref(storage, caminho);
    await uploadBytes(storageRef, arquivo);
    alert("Arquivo enviado com sucesso!");
    fecharUpload(); // fecha modal e volta ao paciente_view
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    alert("Erro ao enviar o arquivo.");
  }
}

// ========== FUNÇÕES DE NAVEGAÇÃO ==========
function abrirPasta(nome) {
  const pacienteId = localStorage.getItem("pacienteSelecionado");
  if (!pacienteId) {
    alert("Paciente não selecionado.");
    return;
  }
  localStorage.setItem("pastaSelecionada", nome);
  window.location.href = `${nome}.html`;
}

function verConsultas() {
  abrirPasta("calendario");
}

function abrirMedutis() {
  const iframe = document.getElementById("iframeMedutis");
  iframe.src = "MedUtis/index.html";
  document.getElementById("medutisModal").style.display = "flex";
}

function fecharMedutis() {
  document.getElementById("iframeMedutis").src = "";
  document.getElementById("medutisModal").style.display = "none";
}

// ========== LINKS DIRETOS ==========
function abrirResumo() { window.location.href = "resumo.html"; }
function abrirDocumento() { window.location.href = "documento.html"; }
function abrirExame() { window.location.href = "exame.html"; }
function abrirProntuario() { window.location.href = "prontuario.html"; }
function abrirTratamento() { window.location.href = "tratamento.html"; }

// ========== EXPORTAR PARA HTML ==========
window.abrirModalNovoPaciente = abrirModalNovoPaciente;
window.fecharModalNovoPaciente = fecharModalNovoPaciente;
window.salvarNovoPaciente = salvarNovoPaciente;
window.abrirPasta = abrirPasta;
window.verConsultas = verConsultas;
window.abrirMedutis = abrirMedutis;
window.fecharMedutis = fecharMedutis;
window.abrirResumo = abrirResumo;
window.abrirDocumento = abrirDocumento;
window.abrirExame = abrirExame;
window.abrirProntuario = abrirProntuario;
window.abrirTratamento = abrirTratamento;
window.uploadArquivo = uploadArquivo;
window.fecharUpload = fecharUpload;