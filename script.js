console.log("✅ script.js carregado!");

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
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
  const modal = document.getElementById("modalUploadArquivo");
  if (modal) modal.style.display = "none";
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

// ========== UPLOAD DE ARQUIVO EXISTENTE ==========
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
    fecharUpload();
  } catch (error) {
    console.error("Erro ao enviar arquivo:", error);
    alert("Erro ao enviar o arquivo.");
  }
}

// ========== NAVEGAÇÃO ==========
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

// ========== ATALHOS ==========
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

// ─── ClinBot Copilot Integration ───────────────────────────────────────────────

// your backend URLs
const TRANSCRIBE_URL = 'http://127.0.0.1:8000/transcribe/';
const SOAP_URL       = 'http://127.0.0.1:8000/summarize/';

document.addEventListener('DOMContentLoaded', () => {
  // grab the controls you added in criar_doc.html
  const recordBtn     = document.getElementById('record-btn');
  const stopBtn       = document.getElementById('stop-btn');
  const transcribeBtn = document.getElementById('transcribe-btn');
  const statusSpan    = document.getElementById('transcribe-status');
  const soapBtn       = document.getElementById('soap-btn');
  const soapStatus    = document.getElementById('soap-status');

  let mediaRecorder, audioChunks = [];

  // 1) Start recording
  recordBtn.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled   = false;
    statusSpan.textContent = 'Gravando…';
  });

  // 2) Stop recording
  stopBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    recordBtn.disabled     = false;
    stopBtn.disabled       = true;
    transcribeBtn.disabled = false;
    statusSpan.textContent = 'Pronto para transcrever';
  });

  // 3) Send for transcription
  transcribeBtn.addEventListener('click', async () => {
    transcribeBtn.disabled = true;
    statusSpan.textContent = 'Enviando para transcrever…';

    const blob = new Blob(audioChunks, { type: 'audio/wav' });
    const form = new FormData();
    form.append('file', blob, 'recording.wav');

    try {
      const res = await fetch(TRANSCRIBE_URL, { method: 'POST', body: form });
      const { transcript } = await res.json();
      // inject into TinyMCE
      tinymce.get('editor').setContent(
        `<p>${transcript.replace(/\n/g,'<br>')}</p>`
      );
      statusSpan.textContent = 'Transcrição concluída';
    } catch (err) {
      console.error(err);
      statusSpan.textContent = 'Erro na transcrição';
    }
  });

  // 4) Generate SOAP from current content
  soapBtn.addEventListener('click', async () => {
    const transcript = tinymce.get('editor')
      .getContent({ format: 'text' })
      .trim();
    if (!transcript) {
      alert('Nada para gerar SOAP.');
      return;
    }

    soapBtn.disabled = true;
    soapStatus.textContent = 'Gerando nota SOAP…';

    try {
      const res = await fetch(SOAP_URL, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ transcript })
      });
      const { soap } = await res.json();
      // soap vem como string JSON, parseia
      const obj = JSON.parse(soap);
      const html = `
        <h2>Subjectivo</h2><p>${obj.S}</p>
        <h2>Objetivo</h2><p>${obj.O}</p>
        <h2>Avaliação</h2><p>${obj.A}</p>
        <h2>Plano</h2><p>${obj.P}</p>
      `;
      tinymce.get('editor').setContent(html);
      soapStatus.textContent = 'Nota SOAP inserida';
    } catch (err) {
      console.error(err);
      soapStatus.textContent = 'Erro ao gerar SOAP';
    }
  });
});
