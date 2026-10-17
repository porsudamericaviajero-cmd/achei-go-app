import confetti from 'canvas-confetti';
import { isSupabaseConfigured } from './config/supabase.js';
import {
  calcularDistancia,
  formatarDistancia,
  obterLocalizacaoUsuario,
  BAIRROS_COORDENADAS
} from './services/geoService.js';
import {
  getLojasAtivas,
  registrarCliqueWhatsApp,
  solicitarCadastroLojista
} from './services/storeService.js';
import {
  applyPhoneMask,
  escapeHTML,
  formatPhoneDisplay,
  sanitizeWhatsApp
} from './utils/sanitize.js';

// Estado global do aplicativo
let todasLojas = [];
let bairroAtivo = 'Todos';
let categoriaAtiva = 'Todas';
let apenasAbertos = false;
let userCoords = null;
let deferredPrompt = null;

const BAIRROS = [
  'Todos',
  'Jardim Novo Mundo',
  'Vila Pedroso',
  'Aroeiras',
  'Riviera',
  'Alphaville Flamboyant',
  'Jardim Goiás',
  'Vila Bandeirante',
  'Água Branca'
];

// Inicialização do App
document.addEventListener('DOMContentLoaded', async () => {
  setupPWA();
  renderBairros();
  setupEventListeners();
  checkSupabaseStatus();
  await carregarLojas();
});

// Verifica status do Supabase e avisa o usuário
function checkSupabaseStatus() {
  const toast = document.getElementById('supabaseStatus');
  if (!toast) return;

  if (isSupabaseConfigured()) {
    toast.innerHTML = `
      <div><span class="status-dot"></span> <b>Supabase Conectado:</b> Banco em nuvem PostgreSQL em tempo real.</div>
    `;
  } else {
    toast.innerHTML = `
      <div><span class="status-dot" style="background:#FF6B2B"></span> <b>Modo Demonstração:</b> Conecte suas chaves do Supabase no <code>.env</code> para sincronização global.</div>
      <a href="admin.html" style="color:#FF6B2B;font-weight:700;text-decoration:none">Ver Admin</a>
    `;
  }
}

// Carrega as lojas ativas
async function carregarLojas() {
  const listaEl = document.getElementById('listaLojas');
  listaEl.innerHTML = `<p style="text-align:center;padding:40px;opacity:0.7">Carregando lojas da Região Leste...</p>`;

  try {
    const { data } = await getLojasAtivas();
    todasLojas = data;
    atualizarDistancias();
    renderLojas();
  } catch (error) {
    console.error('Erro ao carregar lojas:', error);
    listaEl.innerHTML = `<p style="text-align:center;color:#EF4444;padding:20px">Erro ao carregar lojas. Tente novamente.</p>`;
  }
}

// Atualiza a distância calculada das lojas se houver GPS ou bairro
function atualizarDistancias() {
  todasLojas.forEach((loja) => {
    if (userCoords && loja.latitude && loja.longitude) {
      loja.distanciaCalculada = calcularDistancia(
        userCoords.lat,
        userCoords.lng,
        loja.latitude,
        loja.longitude
      );
    } else if (BAIRROS_COORDENADAS[loja.bairro]) {
      // Distância de referência pelo bairro
      loja.distanciaCalculada = null;
    }
  });

  // Se o usuário está com GPS ativo, ordena as lojas pela distância mais próxima
  if (userCoords) {
    todasLojas.sort((a, b) => {
      const distA = a.distanciaCalculada ?? 999;
      const distB = b.distanciaCalculada ?? 999;
      return distA - distB;
    });
  }
}

// Renderiza a lista de bairros em formato de pílulas horizontais
function renderBairros() {
  const container = document.getElementById('bairrosContainer');
  if (!container) return;

  container.innerHTML = BAIRROS.map(
    (b) => `
    <button class="pill-btn ${b === bairroAtivo ? 'active' : ''}" data-bairro="${escapeHTML(b)}">
      ${escapeHTML(b)}
    </button>
  `
  ).join('');

  container.querySelectorAll('.pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      bairroAtivo = btn.dataset.bairro;
      renderBairros();
      renderLojas();
    });
  });
}

// Filtra e renderiza as lojas na tela
function renderLojas() {
  const busca = (document.getElementById('inputBusca')?.value || '').toLowerCase().trim();
  const listaEl = document.getElementById('listaLojas');
  const countEl = document.getElementById('countResultados');

  const filtradas = todasLojas.filter((loja) => {
    // Busca por nome, categoria ou produtos em destaque
    const matchBusca =
      !busca ||
      loja.nome.toLowerCase().includes(busca) ||
      loja.categoria.toLowerCase().includes(busca) ||
      (loja.produtos_destaque && loja.produtos_destaque.toLowerCase().includes(busca)) ||
      (loja.bairro && loja.bairro.toLowerCase().includes(busca));

    // Filtro de bairro
    const matchBairro = bairroAtivo === 'Todos' || loja.bairro === bairroAtivo;

    // Filtro de apenas abertos
    const matchAberto = !apenasAbertos || loja.aberto === true;

    return matchBusca && matchBairro && matchAberto;
  });

  // Atualiza contador
  if (countEl) {
    countEl.innerHTML = `Mostrando <b>${filtradas.length}</b> lojas em <b>${escapeHTML(bairroAtivo)}</b> • Região Leste`;
  }

  if (filtradas.length === 0) {
    listaEl.innerHTML = `
      <div style="text-align:center;padding:48px 20px;background:white;color:#0F2D1F;border-radius:18px;">
        <span style="font-size:42px">🔍</span>
        <h3 style="margin-top:12px;font-size:18px;">Nenhuma loja encontrada</h3>
        <p style="opacity:0.7;font-size:14px;margin-top:4px">Tente buscar por outro termo ou mude o filtro de bairro.</p>
      </div>
    `;
    return;
  }

  listaEl.innerHTML = filtradas
    .map((loja) => {
      const distTexto = loja.distanciaCalculada
        ? formatarDistancia(loja.distanciaCalculada)
        : 'Região Leste';

      const zapNumber = sanitizeWhatsApp(loja.whatsapp);
      const zapLink = `https://wa.me/${zapNumber}?text=${encodeURIComponent(
        `Olá! Vi sua loja "${loja.nome}" no Achei Aqui GO e gostaria de informações.`
      )}`;

      return `
      <article class="store-card ${loja.destaque ? 'destaque' : ''}" data-id="${loja.id}">
        <div class="card-top">
          <div class="store-info-left">
            <div class="store-badges">
              ${loja.destaque ? `<span class="tag-badge featured">⭐ Destaque</span>` : ''}
              <span class="tag-badge ${loja.aberto ? 'status-open' : 'status-closed'}">
                ${loja.aberto ? '🟢 Aberto Agora' : '🔴 Fechado'}
              </span>
              <span class="tag-badge distance">📍 ${distTexto}</span>
            </div>
            <h2 class="store-name">${escapeHTML(loja.nome)}</h2>
            <p class="store-meta">${escapeHTML(loja.categoria)} • <b>${escapeHTML(loja.bairro)}</b></p>
          </div>
        </div>

        ${
          loja.produtos_destaque
            ? `<div class="store-products"><b>Em destaque:</b> ${escapeHTML(loja.produtos_destaque)}</div>`
            : ''
        }

        <div class="card-actions">
          <div class="rating-badge">
            ⭐ <span>${loja.avaliacao ? Number(loja.avaliacao).toFixed(1) : '5.0'}</span>
          </div>

          <a 
            href="${zapLink}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn-whatsapp"
            onclick="event.stopPropagation(); window.trackZapClick('${loja.id}', '${escapeHTML(loja.bairro)}')"
          >
            <span>Conversar no WhatsApp</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-1.921-.453-1.464-.616-2.42-2.115-2.493-2.213-.07-.098-.592-.787-.592-1.5 0-.714.372-1.066.505-1.21.133-.145.289-.181.388-.181.097 0 .195.001.28.005.091.004.212-.034.331.253.123.298.423 1.033.46 1.108.037.075.061.163.012.26-.049.098-.073.159-.145.244-.073.085-.153.189-.219.254-.073.073-.149.153-.064.298.085.145.378.625.811 1.011.558.498 1.029.652 1.174.725.145.073.23.061.316-.037.086-.098.368-.429.466-.576.098-.146.195-.122.329-.073.133.049.849.4 1 .475.151.075.251.112.287.175.037.063.037.368-.107.773z"/>
            </svg>
          </a>
        </div>
      </article>
    `;
    })
    .join('');

  // Adiciona evento de clique para abrir detalhes da loja
  listaEl.querySelectorAll('.store-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const loja = todasLojas.find((l) => String(l.id) === String(id));
      if (loja) abrirDetalhesLoja(loja);
    });
  });
}

// Rastreamento global de cliques de WhatsApp
window.trackZapClick = function (lojaId, bairro) {
  registrarCliqueWhatsApp(lojaId, bairro);
};

// Abre o modal com os detalhes completos da loja
function abrirDetalhesLoja(loja) {
  const modal = document.getElementById('modalDetalhesLoja');
  const content = document.getElementById('conteudoDetalhesLoja');
  if (!modal || !content) return;

  const zapNumber = sanitizeWhatsApp(loja.whatsapp);
  const enderecoFormatado = loja.endereco || `Região Leste, ${loja.bairro}, Goiânia - GO`;
  const mapaLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${loja.nome}, ${enderecoFormatado}`
  )}`;

  content.innerHTML = `
    <div class="modal-header">
      <div>
        <h3 class="modal-title">${escapeHTML(loja.nome)}</h3>
        <p class="modal-subtitle">${escapeHTML(loja.categoria)} • ${escapeHTML(loja.bairro)}</p>
      </div>
      <button class="btn-close-modal" onclick="window.fecharModal('modalDetalhesLoja')">&times;</button>
    </div>

    <div style="margin-bottom:16px;">
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <span class="tag-badge ${loja.aberto ? 'status-open' : 'status-closed'}">
          ${loja.aberto ? '🟢 Aberto Agora' : '🔴 Fechado'}
        </span>
        <span class="tag-badge distance">⭐ ${loja.avaliacao ? Number(loja.avaliacao).toFixed(1) : '5.0'}</span>
      </div>

      <div style="background:#F8FAFC;padding:12px;border-radius:12px;margin-bottom:12px;">
        <p style="font-size:13px;color:#64748B;font-weight:700">📍 Endereço:</p>
        <p style="font-size:14px;color:#1E293B;margin-top:2px;">${escapeHTML(enderecoFormatado)}</p>
        <a href="${mapaLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:13px;color:#FF6B2B;font-weight:700;text-decoration:none">
          🗺️ Abrir no Google Maps / Como Chegar →
        </a>
      </div>

      <div style="background:#F8FAFC;padding:12px;border-radius:12px;margin-bottom:12px;">
        <p style="font-size:13px;color:#64748B;font-weight:700">⏰ Horário de Funcionamento:</p>
        <p style="font-size:14px;color:#1E293B;margin-top:2px;">
          ${escapeHTML(loja.horario_funcionamento || 'Seg a Sáb: Horário Comercial')}
        </p>
      </div>

      ${
        loja.produtos_destaque
          ? `
        <div style="background:#F8FAFC;padding:12px;border-radius:12px;margin-bottom:16px;">
          <p style="font-size:13px;color:#64748B;font-weight:700">🏷️ Principais Produtos e Serviços:</p>
          <p style="font-size:14px;color:#1E293B;margin-top:2px;">${escapeHTML(loja.produtos_destaque)}</p>
        </div>
      `
          : ''
      }

      <a 
        href="https://wa.me/${zapNumber}?text=${encodeURIComponent(
    `Olá! Vi a loja "${loja.nome}" no Achei Aqui GO e gostaria de atendimento.`
  )}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="btn-submit-form" 
        style="text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366"
        onclick="window.trackZapClick('${loja.id}', '${escapeHTML(loja.bairro)}')"
      >
        <span>Falar no WhatsApp (${formatPhoneDisplay(zapNumber)})</span>
      </a>
    </div>
  `;

  modal.classList.add('open');
}

// Configura eventos de clique e formulários
function setupEventListeners() {
  // Input de busca com debounce
  const inputBusca = document.getElementById('inputBusca');
  const btnClear = document.getElementById('btnClearBusca');

  if (inputBusca) {
    inputBusca.addEventListener('input', () => {
      if (btnClear) btnClear.style.display = inputBusca.value ? 'block' : 'none';
      renderLojas();
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      inputBusca.value = '';
      btnClear.style.display = 'none';
      renderLojas();
    });
  }

  // Botão de Geolocalização (GPS)
  const btnGPS = document.getElementById('btnGPS');
  if (btnGPS) {
    btnGPS.addEventListener('click', async () => {
      btnGPS.innerHTML = '⏳ Localizando...';
      try {
        userCoords = await obterLocalizacaoUsuario();
        btnGPS.classList.add('active');
        btnGPS.innerHTML = '📍 Perto de Mim (Ativo)';
        atualizarDistancias();
        renderLojas();
      } catch (err) {
        alert('Não foi possível obter sua localização. Verifique a permissão do GPS no seu navegador.');
        btnGPS.innerHTML = '📍 Perto de Mim';
      }
    });
  }

  // Botão de filtro "Apenas Abertos"
  const btnAbertos = document.getElementById('btnAbertos');
  if (btnAbertos) {
    btnAbertos.addEventListener('click', () => {
      apenasAbertos = !apenasAbertos;
      btnAbertos.classList.toggle('active', apenasAbertos);
      renderLojas();
    });
  }

  // Máscara dinâmica de telefone no cadastro
  const inputZapCadastro = document.getElementById('cad_zap');
  if (inputZapCadastro) {
    inputZapCadastro.addEventListener('input', (e) => {
      e.target.value = applyPhoneMask(e.target.value);
      atualizarPreviewCadastro();
    });
  }

  // Preview dinâmico de cadastro do lojista
  ['cad_nome', 'cad_cat', 'cad_bairro', 'cad_prod'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', atualizarPreviewCadastro);
  });

  // Formulário de Cadastro de Lojista
  const formLojista = document.getElementById('formCadastroLojista');
  if (formLojista) {
    formLojista.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processarCadastroLojista();
    });
  }
}

// Atualiza o preview do card enquanto o lojista preenche o cadastro
function atualizarPreviewCadastro() {
  const nome = document.getElementById('cad_nome')?.value || 'Nome da sua Loja';
  const cat = document.getElementById('cad_cat')?.value || 'Categoria';
  const bairro = document.getElementById('cad_bairro')?.value || 'Bairro';
  const zap = document.getElementById('cad_zap')?.value || '(62) 99999-9999';
  const prod = document.getElementById('cad_prod')?.value || 'Seus principais produtos ou serviços';

  const previewNome = document.getElementById('prev_nome');
  const previewMeta = document.getElementById('prev_meta');
  const previewProd = document.getElementById('prev_prod');

  if (previewNome) previewNome.textContent = nome;
  if (previewMeta) previewMeta.textContent = `${cat} • ${bairro}`;
  if (previewProd) previewProd.textContent = prod;
}

// Envio do cadastro de lojista
async function processarCadastroLojista() {
  const nome = document.getElementById('cad_nome').value.trim();
  const categoria = document.getElementById('cad_cat').value;
  const bairro = document.getElementById('cad_bairro').value;
  const endereco = document.getElementById('cad_end').value.trim();
  const whatsapp = document.getElementById('cad_zap').value;
  const produtos = document.getElementById('cad_prod').value.trim();
  const horario = document.getElementById('cad_horario').value.trim();
  const termos = document.getElementById('cad_termos').checked;
  const btnSubmit = document.getElementById('btnSubmitCadastro');

  if (!termos) {
    alert('Por favor, aceite os Termos de Uso e Política de Privacidade para continuar.');
    return;
  }

  const rawDigits = whatsapp.replace(/\D/g, '');
  if (rawDigits.length < 10) {
    alert('Por favor, digite um número de WhatsApp válido com DDD.');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerText = 'Enviando cadastro...';

  try {
    const resultado = await solicitarCadastroLojista({
      nome,
      categoria,
      bairro,
      endereco,
      whatsapp,
      produtos_destaque: produtos,
      horario_funcionamento: horario
    });

    // Lança efeito de confetes na tela
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    window.fecharModal('modalCadastroLojista');

    // Mensagem de sucesso
    alert(
      `🎉 Parabéns! O cadastro da loja "${nome}" foi enviado com sucesso!\n\n` +
      `Ele já foi registrado no banco de dados e está em fase de ativação rápida.`
    );

    // Recarrega as lojas
    await carregarLojas();

    // Reset formulário
    document.getElementById('formCadastroLojista').reset();
  } catch (err) {
    alert('Erro ao enviar cadastro: ' + err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerText = '✅ CADASTRAR E ATIVAR LOJA';
  }
}

// Funções globais de modal
window.abrirModal = function (modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('open');
};

window.fecharModal = function (modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('open');
};

// Configura PWA e banner de instalação
function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Registro de Service Worker falhou:', err);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.add('show');
  });

  const btnInstall = document.getElementById('btnInstallPWA');
  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) banner.classList.remove('show');
      }
      deferredPrompt = null;
    });
  }
}
