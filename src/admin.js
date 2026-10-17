import { isSupabaseConfigured, ADMIN_ACCESS_KEY } from './config/supabase.js';
import {
  alternarDestaque,
  alternarStatusAberto,
  aprovarLoja,
  atualizarLoja,
  excluirLoja,
  getEstatisticasAdmin,
  getLojasAdmin,
  restaurarLojasPadrao,
  solicitarCadastroLojista
} from './services/storeService.js';
import {
  applyPhoneMask,
  escapeHTML,
  formatPhoneDisplay,
  sanitizeWhatsApp
} from './utils/sanitize.js';

let editandoId = null;
let abaAtiva = 'todas';
let todasLojas = [];

document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  setupAdminListeners();
});

// Verifica se o administrador já fez login nesta sessão
function verificarAutenticacao() {
  const autenticado = sessionStorage.getItem('achei_admin_logged');
  const gateEl = document.getElementById('authGate');

  if (autenticado === 'true') {
    if (gateEl) gateEl.style.display = 'none';
    carregarDashboard();
  } else {
    if (gateEl) gateEl.style.display = 'flex';
  }
}

// Processa o login do administrador
window.tentarLoginAdmin = function () {
  const pass = document.getElementById('adminPasswordInput')?.value;
  const erroEl = document.getElementById('authErrorMsg');

  if (pass === ADMIN_ACCESS_KEY) {
    sessionStorage.setItem('achei_admin_logged', 'true');
    document.getElementById('authGate').style.display = 'none';
    carregarDashboard();
  } else {
    if (erroEl) {
      erroEl.style.display = 'block';
      erroEl.innerText = 'Senha incorreta. Tente novamente.';
    }
  }
};

window.fazerLogoutAdmin = function () {
  sessionStorage.removeItem('achei_admin_logged');
  window.location.reload();
};

// Carrega os dados do painel
async function carregarDashboard() {
  await atualizarEstatisticas();
  await carregarLojasLista();
}

// Atualiza os cartões de estatísticas
async function atualizarEstatisticas() {
  const stats = await getEstatisticasAdmin();
  document.getElementById('statTotal').innerText = stats.total;
  document.getElementById('statAtivas').innerText = stats.ativas;
  document.getElementById('statPendentes').innerText = stats.pendentes;
  document.getElementById('statCliques').innerText = stats.totalCliques;

  // Atualiza badge da aba pendentes
  const badgePendentes = document.getElementById('badgePendentes');
  if (badgePendentes) {
    badgePendentes.innerText = stats.pendentes;
    badgePendentes.style.display = stats.pendentes > 0 ? 'inline-block' : 'none';
  }
}

// Carrega e lista as lojas
async function carregarLojasLista() {
  todasLojas = await getLojasAdmin();
  renderizarTabelaLojas();
}

function renderizarTabelaLojas() {
  const container = document.getElementById('listaLojasAdmin');
  if (!container) return;

  const lojasExibidas = todasLojas.filter((l) => {
    if (abaAtiva === 'pendentes') return l.status === 'pendente';
    if (abaAtiva === 'ativas') return l.status === 'ativo';
    return true;
  });

  if (lojasExibidas.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:32px;color:#64748B;">
        <p>Nenhuma loja encontrada nesta categoria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lojasExibidas
    .map((loja) => {
      const isPendente = loja.status === 'pendente';
      const zapNum = sanitizeWhatsApp(loja.whatsapp);

      return `
      <div class="loja-admin-item" style="${isPendente ? 'background:#FFF7ED;border-left:4px solid #FF6B2B;padding-left:12px;border-radius:8px;' : ''}">
        <div class="loja-admin-info" style="flex:1;">
          <div>
            <b>${escapeHTML(loja.nome)}</b>
            ${isPendente ? '<span style="background:#FF6B2B;color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:6px;">AGUARDANDO APROVAÇÃO</span>' : ''}
            ${loja.destaque ? '<span style="background:#FFF0E8;color:#FF6B2B;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:6px;">DESTAQUE</span>' : ''}
          </div>
          <div class="loja-admin-meta">
            ${escapeHTML(loja.categoria)} • <b>${escapeHTML(loja.bairro)}</b> • WhatsApp: ${formatPhoneDisplay(zapNum)}
          </div>
        </div>

        <div class="loja-admin-actions">
          ${
            isPendente
              ? `<button class="btn-admin-action btn-approve" onclick="window.acaoAprovarLoja('${loja.id}')">✅ Aprovar Loja</button>`
              : `
              <button class="btn-admin-action" style="background:${loja.aberto ? '#E8FAF0' : '#FEEBEB'};color:${loja.aberto ? '#0E8345' : '#C52222'};" onclick="window.acaoToggleAberto('${loja.id}', ${!loja.aberto})">
                ${loja.aberto ? '🟢 Aberto' : '🔴 Fechado'}
              </button>
              <button class="btn-admin-action" style="background:#F1F5F9;color:#334155;" onclick="window.acaoToggleDestaque('${loja.id}', ${!loja.destaque})">
                ${loja.destaque ? '⭐ Destacada' : '☆ Destacar'}
              </button>
            `
          }

          <button class="btn-admin-action btn-edit" onclick="window.acaoEditarLoja('${loja.id}')">
            ✏️ Editar
          </button>

          <button class="btn-admin-action btn-delete" onclick="window.acaoExcluirLoja('${loja.id}')">
            🗑️ Excluir
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

// Ações Globais
window.mudarAba = function (aba) {
  abaAtiva = aba;
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById(`tab_${aba}`)?.classList.add('active');

  const cardForm = document.getElementById('cardFormLoja');
  const cardLista = document.getElementById('cardListaLojas');

  if (aba === 'nova') {
    if (cardForm) cardForm.style.display = 'block';
    if (cardLista) cardLista.style.display = 'none';
    window.limparFormularioEdicao();
  } else {
    if (cardForm) cardForm.style.display = 'none';
    if (cardLista) cardLista.style.display = 'block';
    renderizarTabelaLojas();
  }
};

window.acaoAprovarLoja = async function (id) {
  try {
    await aprovarLoja(id);
    alert('✅ Loja aprovada com sucesso! Ela agora está visível no App para todos os clientes.');
    await carregarDashboard();
  } catch (e) {
    alert('Erro ao aprovar loja: ' + e.message);
  }
};

window.acaoToggleAberto = async function (id, novoStatus) {
  try {
    await alternarStatusAberto(id, novoStatus);
    await carregarDashboard();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
};

window.acaoToggleDestaque = async function (id, novoDestaque) {
  try {
    await alternarDestaque(id, novoDestaque);
    await carregarDashboard();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
};

window.acaoExcluirLoja = async function (id) {
  if (!confirm('Tem certeza de que deseja excluir permanentemente esta loja?')) return;
  try {
    await excluirLoja(id);
    await carregarDashboard();
  } catch (e) {
    alert('Erro ao excluir loja: ' + e.message);
  }
};

window.acaoEditarLoja = function (id) {
  const loja = todasLojas.find((l) => String(l.id) === String(id));
  if (!loja) return;

  editandoId = id;
  document.getElementById('formTitulo').innerText = `✏️ Editando: ${loja.nome}`;
  document.getElementById('input_nome').value = loja.nome || '';
  document.getElementById('input_cat').value = loja.categoria || 'Outros';
  document.getElementById('input_bairro').value = loja.bairro || 'Jardim Novo Mundo';
  document.getElementById('input_end').value = loja.endereco || '';
  document.getElementById('input_zap').value = formatPhoneDisplay(loja.whatsapp);
  document.getElementById('input_aval').value = loja.avaliacao || '5.0';
  document.getElementById('input_prod').value = loja.produtos_destaque || '';
  document.getElementById('input_horario').value = loja.horario_funcionamento || '';
  document.getElementById('input_aberto').value = String(loja.aberto);
  document.getElementById('input_destaque').value = String(loja.destaque);

  document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
  document.getElementById('btnSalvarLoja').innerText = '💾 ATUALIZAR LOJA';

  // Abre o formulário
  document.getElementById('cardFormLoja').style.display = 'block';
  document.getElementById('cardListaLojas').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.limparFormularioEdicao = function () {
  editandoId = null;
  document.getElementById('formTitulo').innerText = '➕ Cadastrar Nova Loja';
  document.getElementById('formLojaAdmin').reset();
  document.getElementById('btnCancelarEdicao').style.display = 'none';
  document.getElementById('btnSalvarLoja').innerText = '✅ SALVAR LOJA';
};

function setupAdminListeners() {
  // Input máscara telefone
  const zapInput = document.getElementById('input_zap');
  if (zapInput) {
    zapInput.addEventListener('input', (e) => {
      e.target.value = applyPhoneMask(e.target.value);
    });
  }

  // Submit do formulário de loja
  const form = document.getElementById('formLojaAdmin');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await salvarLojaAdmin();
    });
  }
}

async function salvarLojaAdmin() {
  const nome = document.getElementById('input_nome').value.trim();
  const categoria = document.getElementById('input_cat').value;
  const bairro = document.getElementById('input_bairro').value;
  const endereco = document.getElementById('input_end').value.trim();
  const whatsapp = document.getElementById('input_zap').value;
  const avaliacao = parseFloat(document.getElementById('input_aval').value) || 5.0;
  const produtos_destaque = document.getElementById('input_prod').value.trim();
  const horario_funcionamento = document.getElementById('input_horario').value.trim();
  const aberto = document.getElementById('input_aberto').value === 'true';
  const destaque = document.getElementById('input_destaque').value === 'true';

  if (!nome || !whatsapp) {
    alert('Preencha o Nome e o WhatsApp da loja!');
    return;
  }

  const dados = {
    nome,
    categoria,
    bairro,
    endereco,
    whatsapp,
    avaliacao,
    produtos_destaque,
    horario_funcionamento,
    aberto,
    destaque,
    status: 'ativo'
  };

  try {
    if (editandoId) {
      await atualizarLoja(editandoId, dados);
      alert('✅ Loja atualizada com sucesso!');
    } else {
      await solicitarCadastroLojista(dados);
      alert('✅ Nova loja cadastrada com sucesso!');
    }
    window.limparFormularioEdicao();
    window.mudarAba('todas');
    await carregarDashboard();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
}

// Restauração das 8 lojas padrão
window.restaurarPadrao = async function () {
  if (!confirm('Deseja restaurar as 8 lojas padrão no banco de dados?')) return;
  try {
    await restaurarLojasPadrao();
    alert('♻️ Lojas padrão restauradas!');
    await carregarDashboard();
  } catch (e) {
    alert('Erro ao restaurar: ' + e.message);
  }
};

// Exportar backup JSON
window.exportarBackupJSON = function () {
  const blob = new Blob([JSON.stringify(todasLojas, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-lojas-achei-aqui-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
};
