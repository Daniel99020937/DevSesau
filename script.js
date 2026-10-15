const API_URL = 'http://localhost:3000/tarefas';
const formTarefa = document.getElementById('form-tarefa');
const inputTarefa = document.getElementById('input-tarefa');
const listaTarefas = document.getElementById('lista-tarefas');

// Configuração de tempos ideais de UX para inatividade (em milissegundos)
const TIMER_DELETAR = 5000;  // 5 segundos para fechar o alerta de exclusão (clique rápido)
const TIMER_EDITAR  = 12000; // 12 segundos para a edição (tempo para o usuário pensar e digitar)

// SVGs Vetoriais Puros profissionais
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
    
    let textoComparacao = "";
    if (li.dataset.textoOriginal) {
      textoComparacao = li.dataset.textoOriginal;
    } else {
      const spanTexto = li.querySelector('.texto-tarefa');
      if (spanTexto) textoComparacao = spanTexto.innerText;
    }

    if (textoComparacao.trim().toLowerCase() === novaDescricao.toLowerCase()) {
      duplicado = true;
    }
  });
  return duplicado;
}

// Fluxo de cadastro otimista (Não reseta a árvore do DOM ao salvar)
formTarefa.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { val, inputValido } = obterEValidarTexto(inputTarefa);
  if (!inputValido) return;

  if (verificarDuplicidade(val)) {
    mostrarErroNoInput(inputTarefa, `A tarefa "${val}" já existe!`);
    return;
  }

  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: val })
  });

  const novaTarefaBD = await resposta.json();
  inputTarefa.value = ''; 

  const li = document.createElement('li');
  li.className = 'todo-item-wrapper adicionando-tarefa';
  li.id = `tarefa-${novaTarefaBD.id}`;

  renderizarCardPadrao(li, novaTarefaBD.id, novaTarefaBD.descricao);

  if (listaTarefas.firstChild) {
    listaTarefas.insertBefore(li, listaTarefas.firstChild);
  } else {
    listaTarefas.appendChild(li);
  }
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

    renderizarCardPadrao(li, tarefa.id, tarefa.descricao);
    listaTarefas.appendChild(li);
  });
}

function limparTimerInatividade(li) {
  if (li.timerInatividade) {
    clearTimeout(li.timerInatividade);
    li.timerInatividade = null;
  }
}

// 1. Renderiza o Card de Visualização Normal
function renderizarCardPadrao(li, id, descricao) {
  limparTimerInatividade(li);
  delete li.dataset.textoOriginal;

  li.innerHTML = `
    <div class="todo-content-front">
      <span class="texto-tarefa">${descricao}</span>
      <div class="botoes-acao-fixos">
        <button class="edit-btn-fixo" title="Editar">${ICONE_EDITAR}</button>
        <button class="delete-btn-fixo" title="Deletar">${ICONE_DELETAR}</button>
      </div>
    </div>
  `;

  li.querySelector('.edit-btn-fixo').addEventListener('click', () => {
    habilitarEdicaoInline(li, id, descricao);
  });

  li.querySelector('.delete-btn-fixo').addEventListener('click', () => {
    solicitarConfirmacaoDelecao(li, id, descricao);
  });
}

// 2. Renderiza a Interface Inline de Edição com Auto-Reset (12 segundos)
function habilitarEdicaoInline(li, id, descricaoAtual) {
  limparTimerInatividade(li);
  li.dataset.textoOriginal = descricaoAtual;

  li.innerHTML = `
    <div class="todo-content-front">
      <div class="container-input-validacao">
        <input type="text" class="input-edicao" value="${descricaoAtual}" id="input-edit-${id}">
      </div>
      <div class="botoes-edicao-rapida">
        <button class="btn-salvar-inline" title="Salvar">${ICONE_CONFIRMAR}</button>
        <button class="btn-cancelar-inline" title="Cancelar">${ICONE_CANCELAR}</button>
      </div>
    </div>
  `;
  
  const input = document.getElementById(`input-edit-${id}`);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  
  configurarLimpezaDeErro(input);
  
  const reiniciarTimerEdicao = () => {
    limparTimerInatividade(li);
    li.timerInatividade = setTimeout(() => {
      renderizarCardPadrao(li, id, li.dataset.textoOriginal || descricaoAtual);
    }, TIMER_EDITAR);
  };

  reiniciarTimerEdicao();
  input.addEventListener('input', reiniciarTimerEdicao);

  li.querySelector('.btn-salvar-inline').addEventListener('click', () => salvarEdicaoInline(li, id));
  li.querySelector('.btn-cancelar-inline').addEventListener('click', () => renderizarCardPadrao(li, id, descricaoAtual));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') salvarEdicaoInline(li, id);
    if (e.key === 'Escape') renderizarCardPadrao(li, id, descricaoAtual);
  });
}

async function salvarEdicaoInline(li, id) {
  const input = document.getElementById(`input-edit-${id}`);
  const { val, inputValido } = obterEValidarTexto(input);
  if (!inputValido) return;
  
  if (verificarDuplicidade(val, id)) {
    mostrarErroNoInput(input, `Já existe esta tarefa!`);
    return;
  }

  limparTimerInatividade(li);

  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: val })
  });
  
  renderizarCardPadrao(li, id, val);
}

// 3. Renderiza a Interface de Confirmação de Deleção com Auto-Reset Rápido (5 segundos)
function solicitarConfirmacaoDelecao(li, id, descricaoAtual) {
  limparTimerInatividade(li);
  li.dataset.textoOriginal = descricaoAtual;
  
  li.innerHTML = `
    <div class="todo-content-front">
      <span class="aviso-excluir">Excluir tarefa?</span>
      <div class="botoes-edicao-rapida">
        <button class="btn-confirmar-delete" title="Confirmar">${ICONE_CONFIRMAR}</button>
        <button class="btn-cancelar-inline" title="Voltar">${ICONE_CANCELAR}</button>
      </div>
    </div>
  `;

  li.timerInatividade = setTimeout(() => {
    renderizarCardPadrao(li, id, descricaoAtual);
  }, TIMER_DELETAR);

  li.querySelector('.btn-confirmar-delete').addEventListener('click', () => deletarTarefa(li, id));
  li.querySelector('.btn-cancelar-inline').addEventListener('click', () => renderizarCardPadrao(li, id, descricaoAtual));
}

// Fluxo de exclusão cirúrgico para não fechar os outros itens na tela
async function deletarTarefa(li, id) {
  limparTimerInatividade(li);
  li.classList.add('removendo-tarefa');
  await new Promise(resolve => setTimeout(resolve, 250));
  
  li.remove();
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
}
