// script.js
console.log("✅ script.js carregado!");

// 1) Firebase (shared) + Firestore / Storage helpers
import { app, db, storage } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// 2) Modal controls
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

// 3) Criar nova ficha de paciente
async function salvarNovoPaciente() {
  const nome      = document.getElementById("novo-nome").value.trim();
  const sobrenome = document.getElementById("novo-sobrenome").value.trim();
  const idade     = parseInt(document.getElementById("novo-idade").value);
  const cidade    = document.getElementById("novo-cidade").value.trim();
  const estado    = document.getElementById("novo-estado").value.trim();
  const medicoId  = localStorage.getItem("uid");

  if (!nome || !sobrenome || !idade || !cidade || !estado) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    const uidPaciente = crypto.randomUUID();
    await setDoc(doc(db, "pacientes", uidPaciente), {
      criadoEm: new Date().toISOString(),
      identificacao: [{ nome, sobrenome, idade, cidade, estado }],
      meusmedicos: [medicoId],
      calendario: [],
      documento: [],
      exame: [],
      prontuario: [],
      resumo: [],
      tratamento: []
    });

    // Atualiza lista de pacientes do médico
    const refMedico = doc(db, "medicos", medicoId);
    const docMedico = await getDoc(refMedico);
    const dados     = docMedico.data() || {};
    const lista     = Array.isArray(dados.meuspacientes) ? dados.meuspacientes : [];
    lista.push(uidPaciente);
    await setDoc(refMedico, { ...dados, meuspacientes: lista });

    alert("Paciente adicionado com sucesso!");
    fecharModalNovoPaciente();
    if (typeof listarPacientes === "function") listarPacientes();

  } catch (err) {
    console.error("Erro ao salvar novo paciente:", err);
    alert("Erro ao salvar novo paciente.");
  }
}

// 4) Upload de arquivo existente
async function uploadArquivo() {
  const tipo      = document.getElementById("tipoArquivo").value;
  const arquivo   = document.getElementById("arquivoInput").files[0];
  const pacienteId = localStorage.getItem("pacienteSelecionado");

  if (!arquivo || !pacienteId || !tipo) {
    alert("Preencha todos os campos e selecione um arquivo.");
    return;
  }

  const timestamp = Date.now();
  const caminho   = `pacientes/${pacienteId}/${tipo}/${arquivo.name}_${timestamp}`;

  try {
    await uploadBytes(ref(storage, caminho), arquivo);
    alert("Arquivo enviado com sucesso!");
    fecharUpload();
  } catch (err) {
    console.error("Erro ao enviar arquivo:", err);
    alert("Erro ao enviar o arquivo.");
  }
}

// 5) Navegação entre pastas
function abrirPasta(nome) {
  const pacienteId = localStorage.getItem("pacienteSelecionado");
  if (!pacienteId) {
    alert("Paciente não selecionado.");
    return;
  }
  localStorage.setItem("pastaSelecionada", nome);
  window.location.href = `${nome}.html`;
}
function verConsultas() { abrirPasta("calendario"); }
function abrirMedutis() {
  const iframe = document.getElementById("iframeMedutis");
  iframe.src = "MedUtis/index.html";
  document.getElementById("medutisModal").style.display = "flex";
}
function fecharMedutis() {
  document.getElementById("iframeMedutis").src = "";
  document.getElementById("medutisModal").style.display = "none";
}

// 6) Atalhos rápidos
function abrirResumo()    { window.location.href = "resumo.html"; }
function abrirDocumento() { window.location.href = "documento.html"; }
function abrirExame()     { window.location.href = "exame.html"; }
function abrirProntuario(){ window.location.href = "prontuario.html"; }
function abrirTratamento(){ window.location.href = "tratamento.html"; }

// 7) Expor para window
window.abrirModalNovoPaciente  = abrirModalNovoPaciente;
window.fecharModalNovoPaciente = fecharModalNovoPaciente;
window.salvarNovoPaciente      = salvarNovoPaciente;
window.abrirPasta              = abrirPasta;
window.verConsultas            = verConsultas;
window.abrirMedutis            = abrirMedutis;
window.fecharMedutis           = fecharMedutis;
window.abrirResumo             = abrirResumo;
window.abrirDocumento          = abrirDocumento;
window.abrirExame              = abrirExame;
window.abrirProntuario         = abrirProntuario;
window.abrirTratamento         = abrirTratamento;
window.uploadArquivo           = uploadArquivo;
window.fecharUpload            = fecharUpload;

// 8) TinyMCE + salvarDocumento / voltar
tinymce.init({
  selector: '#editor',
  height: 500,
  menubar: false,
  plugins: 'lists image',
  toolbar: 'undo redo | bold italic underline | bullist numlist | image',
  branding: false,
  automatic_uploads: true,
  images_upload_handler: async (blobInfo, success, failure) => {
    try {
      const file     = blobInfo.blob();
      const filename = `imagem_${Date.now()}.jpg`;
      const path     = `pacientes/${localStorage.getItem("pacienteSelecionado")}/imagens/${filename}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      success(url);
    } catch (err) {
      console.error("Erro no upload de imagem:", err);
      failure("Erro ao enviar imagem.");
    }
  },
  file_picker_types: 'image',
  file_picker_callback: (callback, value, meta) => {
    if (meta.filetype === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const id       = 'blobid' + Date.now();
          const blobCache = tinymce.activeEditor.editorUpload.blobCache;
          const base64   = reader.result.split(',')[1];
          const blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);
          callback(blobInfo.blobUri(), { title: file.name });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  },
  content_style: `
    body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; padding: 20px; }
    img { max-width: 100%; height: auto; }
  `
});

window.salvarDocumento = async () => {
  const tipo       = document.getElementById("tipo").value;
  const html       = tinymce.get("editor").getContent().trim();
  const plainText  = tinymce.get("editor")
                       .getContent({ format: "text" })
                       .replace(/\s+/g, " ")
                       .trim();
  const pacienteId = localStorage.getItem("pacienteSelecionado");
  const medicoId   = localStorage.getItem("uid");

  if (!pacienteId || !tipo || !html || !medicoId) {
    alert("Preencha o conteúdo e escolha uma pasta.");
    return;
  }

  try {
    const refDoc = doc(db, "pacientes", pacienteId);
    const snap   = await getDoc(refDoc);
    if (!snap.exists()) throw new Error("Paciente não encontrado.");
    const dados   = snap.data();
    const arr     = Array.isArray(dados[tipo]) ? dados[tipo] : [];
    arr.push(plainText);
    await updateDoc(refDoc, { [tipo]: arr });

    // gera PDF e envia
    const now      = new Date();
    const dateStr  = now.toLocaleDateString("pt-BR").replace(/\//g, "-");
    const timeStr  = now.toTimeString().slice(0,5).replace(":", "-");
    const nomePDF  = `${pacienteId}_${tipo}_${dateStr}_${timeStr}_${medicoId}.pdf`;
    const wrapper  = document.createElement("div");
    wrapper.innerHTML = `<h1>Documento (${tipo})</h1>${html}`;

    const opt = {
      margin: 1,
      filename: nomePDF,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };
    const pdfBlob = await html2pdf().from(wrapper).set(opt).outputPdf("blob");
    await uploadBytes(ref(storage, `pacientes/${pacienteId}/${tipo}/${nomePDF}`), pdfBlob);

    alert("Documento salvo com sucesso!");
    window.location.href = "paciente_view.html";

  } catch (err) {
    console.error("Erro ao salvar documento:", err);
    alert("Erro ao salvar.");
  }
};

window.voltar = () => {
  window.location.href = "paciente_view.html";
};

// ─── ClinBot audio → transcription → SOAP ────────────────────────────────────
const TRANSCRIBE_URL = 'http://127.0.0.1:8000/transcribe/';
const SOAP_URL       = 'http://127.0.0.1:8000/summarize/';

document.addEventListener('DOMContentLoaded', () => {
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
      const res    = await fetch(TRANSCRIBE_URL, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { transcript } = await res.json();

      // inject the raw transcript into TinyMCE
      tinymce.get('editor').setContent(
        `<p>${transcript.replace(/\n/g, '<br>')}</p>`
      );
      statusSpan.textContent = 'Transcrição concluída!';
      soapBtn.disabled = false;             // enable SOAP button now that we have text
    } catch (err) {
      console.error('Erro ao transcrever:', err);
      statusSpan.textContent = 'Erro ao transcrever.';
    }
  });

    // 4) Generate SOAP from current editor content
    soapBtn.addEventListener('click', async () => {
      const transcript = tinymce
        .get('editor')
        .getContent({ format: 'text' })
        .trim();
  
      if (!transcript) {
        alert('Nada para gerar SOAP.');
        return;
      }
  
      soapBtn.disabled        = true;
      soapStatus.textContent  = 'Enviando para SOAP…';
  
      try {
        const res = await fetch(SOAP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript })   // <-- must match SummarizeRequest.transcript
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
        const { soap } = await res.json();
  
        // ─── Strip Markdown fences (```json ... ```) ──────────────────────────────────
        const cleaned = soap
          .replace(/```json\s*/g, '')    // remove leading ```json
          .replace(/```/g, '')           // remove trailing ```
          .trim();
  
        const obj = JSON.parse(cleaned);
  
        // ─── Build the HTML fragment ────────────────────────────────────────────────
        const html = `
          <h2>Subjectivo</h2><p>${obj.S || ''}</p>
          <h2>Objetivo</h2><p>${obj.O || ''}</p>
          <h2>Avaliação</h2><p>${obj.A || ''}</p>
          <h2>Plano</h2><p>${obj.P || ''}</p>
        `;
  
        tinymce.get('editor').setContent(html);
        soapStatus.textContent = 'SOAP concluído!';
      } catch (err) {
        console.error('Erro ao gerar SOAP:', err);
        soapStatus.textContent = 'Erro ao gerar SOAP.';
        soapBtn.disabled = false;
      }
    });  
});

