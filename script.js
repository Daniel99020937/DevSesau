const API_URL = 'http://localhost:3000/tarefas';
const formTarefa = document.getElementById('form-tarefa');
const inputTarefa = document.getElementById('input-tarefa');
const listaTarefas = document.getElementById('lista-tarefas');

// SVGs Vetoriais Puros (Substitutos profissionais para os emojis)
const ICONE_EDITAR = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`;
const ICONE_DELETAR = `<svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>`;
const ICONE_CONFIRMAR = `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`;
const ICONE_CANCELAR = `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

if (inputTarefa && !inputTarefa.parentElement.classList.contains('container-input-validacao')) {
  const wrapper = document.createElement('div');
  wrapper.className = 'container-input-validacao';
  inputTarefa.parentNode.insertBefore(wrapper, inputTarefa);
  wrapper.appendChild(inputTarefa);
}

document.addEventListener('DOMContentLoaded', () => {
  listarTarefas();
  configurarLimpezaDeErro(inputTarefa);
});

function configurarLimpezaDeErro(inputElement) {
  inputElement.addEventListener('input', () => {
    const erroExistente = inputElement.parentElement.querySelector('.balao-erro');
    if (erroExistente) erroExistente.remove();
    inputElement.classList.remove('input-erro-shaking', 'borda-erro-fixa');
  });
}

function mostrarErroNoInput(inputElement, message) {
  const container = inputElement.parentElement;
  const erroExistente = container.querySelector('.balao-erro');
  if (erroExistente) erroExistente.remove();

  inputElement.classList.add('input-erro-shaking', 'borda-erro-fixa');
  setTimeout(() => { inputElement.classList.remove('input-erro-shaking'); }, 400);

  const balao = document.createElement('div');
  balao.className = 'balao-erro';
  balao.innerText = message;
  
  container.appendChild(balao);
  inputElement.focus();
}

function verificarDuplicidade(novaDescricao, idIgnorado = null) {
  const itensAtuais = document.querySelectorAll('.todo-item-wrapper');
  let duplicado = false;

  itensAtuais.forEach(li => {
    if (idIgnorado && li.id === `tarefa-${idIgnorado}`) return;
    const spanTexto = li.querySelector('.texto-tarefa');
    if (!spanTexto) return; 
    if (spanTexto.innerText.trim().toLowerCase() === novaDescricao.toLowerCase()) {
      duplicado = true;
    }
  });
  return duplicado;
}

formTarefa.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { val, inputValido } = obterEValidarTexto(inputTarefa);
  if (!inputValido) return;

  if (verificarDuplicidade(val)) {
    mostrarErroNoInput(inputTarefa, `A tarefa "${val}" já existe!`);
    return;
  }

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: val })
  });

  inputTarefa.value = ''; 
  listarTarefas(true);
});

function obterEValidarTexto(inputElement) {
  const val = inputElement.value.trim();
  if (val === '') {
    mostrarErroNoInput(inputElement, 'Preencha este campo.');
    return { val: '', inputValido: false };
  }
  return { val, inputValido: true };
}

async function listarTarefas(animarNovaTarefa = false) {
  const resposta = await fetch(API_URL);
  const tarefas = await resposta.json();
  listaTarefas.innerHTML = '';
  
  tarefas.forEach((tarefa, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item-wrapper';
    li.id = `tarefa-${tarefa.id}`;

    if (animarNovaTarefa && index === 0) {
      li.classList.add('adicionando-tarefa');
    }

    li.innerHTML = obterHtmlCardPadrao(tarefa.id, tarefa.descricao);
    listaTarefas.appendChild(li);
  });
}

function obterHtmlCardPadrao(id, descricao) {
  return `
    <div class="todo-content-front">
      <span class="texto-tarefa">${descricao}</span>
      <div class="botoes-acao-fixos">
        <button class="edit-btn-fixo" onclick="habilitarEdicaoInline(${id}, '${descricao}')" title="Editar">${ICONE_EDITAR}</button>
        <button class="delete-btn-fixo" onclick="solicitarConfirmacaoDelecao(${id})" title="Deletar">${ICONE_DELETAR}</button>
      </div>
    </div>
  `;
}

function habilitarEdicaoInline(id, descricaoAtual) {
  const li = document.getElementById(`tarefa-${id}`);
  const contentFront = li.querySelector('.todo-content-front');
  const descricaoEscapada = descricaoAtual.replace(/'/g, "\\'");

  contentFront.innerHTML = `
    <div class="container-input-validacao">
      <input type="text" class="input-edicao" value="${descricaoAtual}" id="input-edit-${id}">
    </div>
    <div class="botoes-edicao-rapida">
      <button class="btn-salvar-inline" onclick="salvarEdicaoInline(${id})" title="Salvar">${ICONE_CONFIRMAR}</button>
      <button class="btn-cancelar-inline" onclick="cancelarEdicaoInline(${id}, '${descricaoEscapada}')" title="Cancelar">${ICONE_CANCELAR}</button>
    </div>
  `;
  
  const input = document.getElementById(`input-edit-${id}`);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  
  configurarLimpezaDeErro(input);
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') salvarEdicaoInline(id);
    if (e.key === 'Escape') cancelarEdicaoInline(id, descricaoAtual);
  });
}

function cancelarEdicaoInline(id, descricaoOriginal) {
  const li = document.getElementById(`tarefa-${id}`);
  if (li) {
    li.innerHTML = obterHtmlCardPadrao(id, descricaoOriginal);
  }
}

async function salvarEdicaoInline(id) {
  const input = document.getElementById(`input-edit-${id}`);
  const { val, inputValido } = obterEValidarTexto(input);
  if (!inputValido) return;
  
  if (verificarDuplicidade(val, id)) {
    mostrarErroNoInput(input, `Já existe esta tarefa!`);
    return;
  }

  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: val })
  });
  
  cancelarEdicaoInline(id, val);
}

function solicitarConfirmacaoDelecao(id) {
  const li = document.getElementById(`tarefa-${id}`);
  const contentFront = li.querySelector('.todo-content-front');
  const textoTarefa = li.querySelector('.texto-tarefa').innerText;
  const textoEscapado = textoTarefa.replace(/'/g, "\\'");
  
  contentFront.innerHTML = `
    <span class="aviso-excluir">Excluir tarefa?</span>
    <div class="botoes-edicao-rapida">
      <button class="btn-confirmar-delete" onclick="deletarTarefa(${id})" title="Confirmar">${ICONE_CONFIRMAR}</button>
      <button class="btn-cancelar-inline" onclick="cancelarEdicaoInline(${id}, '${textoEscapado}')" title="Voltar">${ICONE_CANCELAR}</button>
    </div>
  `;
}

async function deletarTarefa(id) {
  const li = document.getElementById(`tarefa-${id}`);
  if (li) {
    li.classList.add('removendo-tarefa');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  listarTarefas();
}
