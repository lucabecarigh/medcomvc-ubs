import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "medcomvc-usb.firebaseapp.com",
  projectId: "medcomvc-usb",
  storageBucket: "medcomvc-usb.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.db = db;

import {
    doc,
    setDoc,
    collection
  } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
  
  async function criarPaciente() {
    const pacienteId = "leonardostarace";
    const medicoId = "drjose";
  
    const dadosPaciente = {
      nome: "Leonardo",
      sobrenome: "Starace",
      idade: 29,
      cidade: "São Paulo",
      estado: "SP",
      medicoId: medicoId
    };
  
    await setDoc(doc(db, "pacientes", pacienteId), dadosPaciente);
  
    // Cria subcoleções vazias (pastas)
    const pastas = ['resumo', 'prontuarios', 'exames', 'tratamentos', 'documentos'];
    for (const pasta of pastas) {
      await setDoc(doc(db, "pacientes", pacienteId, pasta, "placeholder"), { vazio: true });
    }
  
    // Atualiza o médico com esse paciente
    await setDoc(doc(db, "medicos", medicoId, "pacientes", pacienteId), {
      pacienteId: pacienteId
    });
  }

import {
    getDocs,
    collection
  } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
  
  async function listarPacientesDoMedico(medicoId) {
    const querySnapshot = await getDocs(collection(db, "medicos", medicoId, "pacientes"));
    const ids = [];
  
    querySnapshot.forEach((doc) => {
      ids.push(doc.id);
    });
  
    return ids;
  }

import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function adicionarResumo(pacienteId, conteudo) {
  await addDoc(collection(db, "pacientes", pacienteId, "resumo"), {
    data: new Date(),
    texto: conteudo
  });
}