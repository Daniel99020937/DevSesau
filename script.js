const API_URL = 'http://localhost:3000/tarefas';
const formTarefa = document.getElementById('form-tarefa');
const inputTarefa = document.getElementById('input-tarefa');
const listaTarefas = document.getElementById('lista-tarefas');

document.addEventListener('DOMContentLoaded', () => listarTarefas());

// 1. SALVAR NO BANCO (MANTIDO SEU FETCH ORIGINAL)
formTarefa.addEventListener('submit', async (e) => {
  e.preventDefault();
  const descricao = inputTarefa.value.trim();
  if (descricao === '') return;

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao })
  });

  inputTarefa.value = ''; 
  listarTarefas(true); // Ativa animação nítida no topo
});

// 2. BUSCA DO BANCO E IMPRIME EM CAMADAS PARA O SWIPE
async function listarTarefas(animarNovaTarefa = false) {
  const resposta = await fetch(API_URL);
  const tarefas = await resposta.json();
  listaTarefas.innerHTML = '';
  
  tarefas.forEach((tarefa, index) => {
    const li = document.createElement('li');
    li.className = 'todo-item-wrapper';
    li.id = `tarefa-${tarefa.id}`;

    // Ativa animação apenas no elemento recém-criado no topo
    if (animarNovaTarefa && index === 0) {
      li.classList.add('adicionando-tarefa');
    }

    // MONTAGEM DO DOM EM CAMADAS SEPARADAS
    li.innerHTML = `
      <div class="todo-actions-behind">
        <button class="edit-btn" onclick="habilitarEdicaoInline(${tarefa.id}, '${tarefa.descricao}')">Editar</button>
        <button class="delete-btn" onclick="solicitarConfirmacaoDelecao(${tarefa.id})">Deletar</button>
      </div>
      <div class="todo-content-front">
        <span class="texto-tarefa">${tarefa.descricao}</span>
      </div>
    `;
    
    // Liga os sensores de arrastar do dedo na camada branca da frente
    setupSwipe(li.querySelector('.todo-content-front'));
    listaTarefas.appendChild(li);
  });
}

// 3. CAPTURA DE GESTOS (MOBILE SWIPE)
function setupSwipe(element) {
  let startX = 0;
  let currentX = 0;
  const maxSwipe = -140; // Espaço exato ocupado pelos botões de trás (70px + 70px)

  element.addEventListener('touchstart', (e) => {
    startX = e.touches.clientX;
    element.style.transition = 'none';
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    currentX = e.touches.clientX - startX;
    if (currentX > 0) currentX = 0; // Impede puxar para a direita
    if (currentX < maxSwipe) currentX = maxSwipe; // Limita o puxão na esquerda
    element.style.transform = `translateX(${currentX}px)`;
  }, { passive: true });

  element.addEventListener('touchend', () => {
    element.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
    // Se arrastou mais que a metade do caminho, segura aberto, senão fecha
    if (currentX < maxSwipe / 2) {
      element.style.transform = `translateX(${maxSwipe}px)`;
    } else {
      element.style.transform = 'translateX(0px)';
    }
  });
}

// 4. MODO EDIÇÃO INLINE (MUTA APENAS O CARD SELECIONADO)
function habilitarEdicaoInline(id, descricaoAtual) {
  const li = document.getElementById(`tarefa-${id}`);
  const contentFront = li.querySelector('.todo-content-front');
  
  // Fecha o swipe para o input ocupar toda a área de forma limpa
  contentFront.style.transform = 'translateX(0px)';
  
  contentFront.innerHTML = `
    <input type="text" class="input-edicao" value="${descricaoAtual}" id="input-edit-${id}">
    <div class="botoes-edicao-rapida">
      <button class="btn-salvar-inline" onclick="salvarEdicaoInline(${id})">✔</button>
      <button class="btn-cancelar-inline" onclick="listarTarefas()">✖</button>
    </div>
  `;
  
  const input = document.getElementById(`input-edit-${id}`);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') salvarEdicaoInline(id);
    if (e.key === 'Escape') listarTarefas();
  });
}

async function salvarEdicaoInline(id) {
  const input = document.getElementById(`input-edit-${id}`);
  const novaDescricao = input.value.trim();
  if (novaDescricao === "") return;
  
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: novaDescricao })
  });
  listarTarefas();
}

// 5. FLUXO DE EXCLUSÃO CUSTOMIZADA
function solicitarConfirmacaoDelecao(id) {
  const li = document.getElementById(`tarefa-${id}`);
  const contentFront = li.querySelector('.todo-content-front');
  
  contentFront.style.transform = 'translateX(0px)';
  contentFront.innerHTML = `
    <span class="aviso-excluir">Excluir?</span>
    <div class="botoes-edicao-rapida">
      <button class="btn-confirmar-delete" onclick="deletarTarefa(${id})">Sim</button>
      <button class="btn-cancelar-inline" onclick="listarTarefas()">Não</button>
    </div>
  `;
}

async function deletarTarefa(id) {
  const li = document.getElementById(`tarefa-${id}`);
  if (li) {
    li.classList.add('removendo-tarefa');
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  listarTarefas();
}
