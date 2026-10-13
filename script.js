const API_URL = 'http://localhost:3000/tarefas';
const formTarefa = document.getElementById('form-tarefa');
const inputTarefa = document.getElementById('input-tarefa');
const listaTarefas = document.getElementById('lista-tarefas');
// busca do banco
document.addEventListener('DOMContentLoaded', listarTarefas);
// salvar no banco
formTarefa.addEventListener('submit', async (e) => {
  e.preventDefault();
  const descricao = inputTarefa.value.trim();
  if (descricao === '') return;
  // chamada para salvar 
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao })
  });
  inputTarefa.value = ''; // limpa input
  listarTarefas(); // atualiza lista
});
// busca e imprime na tela
async function listarTarefas() {
  const resposta = await fetch(API_URL);
  const tarefas = await resposta.json();
  listaTarefas.innerHTML = '';
  tarefas.forEach(tarefa => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${tarefa.descricao}</span>
      <div>
        <button onclick="editarTarefa(${tarefa.id}, '${tarefa.descricao}')">Editar</button>
        <button onclick="deletarTarefa(${tarefa.id})">Deletar</button>
      </div>
    `;
    listaTarefas.appendChild(li);
  });
}
// atualiza o banco
async function editarTarefa(id, descricaoAtual) {
  const novaDescricao = prompt("Editar tarefa:", descricaoAtual);
  if (novaDescricao === null || novaDescricao.trim() === "") return;
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: novaDescricao })
  });
  listarTarefas();
}
// remove do banco
async function deletarTarefa(id) {
  if (confirm("Deseja realmente excluir esta tarefa?")) {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    listarTarefas();
  }
}