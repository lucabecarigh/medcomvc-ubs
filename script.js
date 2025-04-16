console.log("Script funcionando!");
function abrirPasta(nome) {
    alert("Abrir pasta: " + nome);
    // futuramente vamos redirecionar para uma página real
  }
  
  function verConsultas() {
    alert("Você tem 2 consultas marcadas esta semana!");
    // futuramente isso vai buscar dados no Firebase
  }
  
  import {
    doc,
    setDoc,
    addDoc,
    collection
  } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
  
  const medicoId = "drjose"; // esse valor pode vir do login futuramente
  
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
  
    if (!nome || !sobrenome || !idade || !cidade || !estado) {
      alert("Preencha todos os campos.");
      return;
    }
  
    const id = (nome + sobrenome).toLowerCase().replace(/\s+/g, '');
  
    const dadosPaciente = {
      nome,
      sobrenome,
      idade,
      cidade,
      estado,
      medicoId
    };
  
    try {
      await setDoc(doc(db, "pacientes", id), dadosPaciente);
  
      const pastas = ['resumo', 'prontuarios', 'exames', 'tratamentos', 'documentos'];
      for (const pasta of pastas) {
        await setDoc(doc(db, "pacientes", id, pasta, "placeholder"), { vazio: true });
      }
  
      await setDoc(doc(db, "medicos", medicoId, "pacientes", id), { pacienteId: id });
  
      fecharModalNovoPaciente();
      alert("Paciente adicionado com sucesso!");
  
      // Forçar reload da lista
      listarPacientes();
    } catch (error) {
      console.error("Erro ao criar paciente:", error);
      alert("Erro ao criar paciente.");
    }
  }