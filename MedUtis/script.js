import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// 1) CONFIGURAÇÃO DO SEU PROJETO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAmF5FS_ekWW_7-1RUHtGCR71LH6r9fg08",
  authDomain: "medcomvc-ubs.firebaseapp.com",
  projectId: "medcomvc-ubs",
  storageBucket: "medcomvc-ubs.firebasestorage.app",
  messagingSenderId: "313420248004",
  appId: "1:313420248004:web:61e9f199fb852b4cc36a91",
  measurementId: "G-GCDLLVE7SX"
};

// 2) INICIALIZA O FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 3) FUNÇÃO PARA FAZER LOGIN ANÔNIMO
async function autenticarAnonimamente() {
  try {
    await signInAnonymously(auth);
    console.log("✅ Sign-in anônimo bem-sucedido (MedUtis)");
    await loadMedsFromFirestore();
    renderList();
  } catch (error) {
    console.error("❌ Erro ao fazer sign-in anônimo:", error);
  }
}

// ====================================================================
// LÓGICA DO SEU APLICATIVO
// ====================================================================
let meds = [];
let editingIndex = null;
let editingDocId = null;
let prescricaoLista = [];

async function loadMedsFromFirestore() {
  meds = [];
  const querySnapshot = await getDocs(collection(db, "posologias"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    meds.push({
      id: docSnap.id,
      nome: data.nome,
      dose: data.dose,
      via: data.via,
      quantidade: data.quantidade
    });
  });
}

function renderList() {
  const list = document.getElementById("medList");
  const search = document.getElementById("search")?.value.toLowerCase() || "";
  const filtered = meds
    .filter(med => med.nome.toLowerCase().includes(search))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  list.innerHTML = "";

  filtered.forEach((med) => {
    const idxReal = meds.findIndex(m => m.id === med.id);
    const item = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = `${med.nome} - ${med.dose}`;
    textSpan.onclick = () => {
      const viaTexto = med.via || "oral";
      const quantidade = med.quantidade || "30 comp";
      const doseLower = med.dose.toLowerCase();
      const iniciaComVerbo = /^(tomar|administrar|correr|ingerir|inalar|introduzir|aplicar|usar|fazer|instilar|colocar|passar)/.test(doseLower);

      let verbo = "Tomar";
      if (viaTexto.includes("ev") || viaTexto.includes("iv") || viaTexto.includes("endovenosa")) verbo = "Administrar";
      else if (viaTexto.includes("im") || viaTexto.includes("sc") || viaTexto.includes("subcut")) verbo = "Administrar";
      else if (viaTexto.includes("top")) verbo = "Aplicar";
      else if (viaTexto.includes("retal")) verbo = "Introduzir";
      else if (viaTexto.includes("inalat")) verbo = "Inalar";

      const frase = iniciaComVerbo ? med.dose : `${verbo} ${med.dose}`;
      prescricaoLista.push({ nome: med.nome, quantidade, via: viaTexto, frase });

      const agrupado = {};
      prescricaoLista.forEach(item => {
        const label = `Uso ${item.via}`;
        if (!agrupado[label]) agrupado[label] = [];
        agrupado[label].push(item);
      });

      let finalText = "";
      let contador = 1;
      for (const via of Object.keys(agrupado)) {
        finalText += `${via}\n`;
        for (const m of agrupado[via]) {
          finalText += `${contador}. ${m.nome} ----- ${m.quantidade}\n${m.frase}\n\n`;
          contador++;
        }
      }

      document.getElementById("prescriptionBox").value = finalText.trim();
    };

    const icons = document.createElement("div");
    icons.className = "action-icons";
    icons.innerHTML = `
      <span title="Editar" onclick="event.stopPropagation(); editMed(${idxReal})">✎</span>
      <span title="Excluir" onclick="event.stopPropagation(); deleteMed(${idxReal})">✕</span>
    `;

    item.appendChild(icons);
    item.appendChild(textSpan);
    list.appendChild(item);
  });
}

async function addMed() {
  const nome = document.getElementById("medName").value.trim();
  const dose = document.getElementById("medDose").value.trim();
  const via = document.getElementById("medVia").value || "oral";
  const quantidade = document.getElementById("medQuantidade").value.trim() || "30 comp";
  if (!nome || !dose) return;

  const novoMed = { nome, dose, via, quantidade };
  try {
    if (editingIndex !== null && editingDocId) {
      await updateDoc(doc(db, "posologias", editingDocId), novoMed);
    } else {
      await addDoc(collection(db, "posologias"), novoMed);
    }
  } catch (error) {
    console.error("Erro ao salvar posologia no Firestore:", error);
  }

  clearForm();
  await loadMedsFromFirestore();
  renderList();
}

function clearForm() {
  document.getElementById("medName").value = "";
  document.getElementById("medDose").value = "";
  document.getElementById("medVia").value = "";
  document.getElementById("medQuantidade").value = "";
  editingIndex = null;
  editingDocId = null;
  showCancelButton(false);
}

function editMed(index) {
  const med = meds[index];
  showPanel("add");
  editingIndex = index;
  editingDocId = med.id;

  document.getElementById("medName").value = med.nome;
  document.getElementById("medDose").value = med.dose;
  document.getElementById("medVia").value = med.via || "oral";
  document.getElementById("medQuantidade").value = med.quantidade || "30 comp";

  showCancelButton(true);
}

async function deleteMed(index) {
  if (!confirm("Tem certeza que deseja excluir esta posologia?")) return;

  const med = meds[index];
  if (!med || !med.id) return;

  try {
    await deleteDoc(doc(db, "posologias", med.id));
  } catch (error) {
    console.error("Erro ao excluir posologia:", error);
  }

  await loadMedsFromFirestore();
  renderList();
}

function showCancelButton(show) {
  const btn = document.getElementById("cancelEdit");
  btn.style.display = show ? "inline-block" : "none";
}

function showPanel(panel) {
  document.getElementById("addPanel").style.display = panel === "add" ? "block" : "none";
  document.getElementById("prescriptionPanel").style.display = panel === "prescription" ? "block" : "none";
}

function clearPrescription() {
  if (confirm("Deseja limpar toda a prescrição?")) {
    document.getElementById("prescriptionBox").value = "";
    prescricaoLista = [];
  }
}

document.getElementById("search")?.addEventListener("input", () => {
  renderList();
});

// ⏳ FAZ LOGIN ANÔNIMO APENAS APÓS O CARREGAMENTO
window.onload = () => {
  autenticarAnonimamente();
};

// Exportando para HTML
window.addMed = addMed;
window.clearForm = clearForm;
window.editMed = editMed;
window.deleteMed = deleteMed;
window.showPanel = showPanel;
window.clearPrescription = clearPrescription;