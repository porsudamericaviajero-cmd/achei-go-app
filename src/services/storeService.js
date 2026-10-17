import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { sanitizeWhatsApp } from '../utils/sanitize.js';

// Base de lojas padrão da Região Leste de Goiânia com dados enriquecidos
export const DEFAULT_LOJAS = [
  {
    id: '1',
    nome: 'Materiais Novo Mundo',
    categoria: 'Materiais de Construção',
    bairro: 'Jardim Novo Mundo',
    endereco: 'Av. New York, Qd. 45, Jardim Novo Mundo, Goiânia - GO',
    produtos_destaque: 'Cimento, areia, tintas e ferramentas',
    whatsapp: '5562996707046',
    avaliacao: 4.8,
    status: 'ativo',
    aberto: true,
    destaque: true,
    latitude: -16.6852,
    longitude: -49.2154,
    horario_funcionamento: 'Seg a Sex: 07:30 às 18:00 | Sáb: 07:30 às 12:30'
  },
  {
    id: '2',
    nome: 'Auto Peças Vila Pedroso',
    categoria: 'Auto Peças',
    bairro: 'Vila Pedroso',
    endereco: 'Av. Anápolis, Vila Pedroso, Goiânia - GO',
    produtos_destaque: 'Pastilhas de freio, óleo de motor, baterias',
    whatsapp: '5562996707046',
    avaliacao: 4.6,
    status: 'ativo',
    aberto: true,
    destaque: false,
    latitude: -16.6698,
    longitude: -49.1823,
    horario_funcionamento: 'Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00'
  },
  {
    id: '3',
    nome: 'Padaria Aroeiras',
    categoria: 'Padaria',
    bairro: 'Aroeiras',
    endereco: 'Rua das Palmeiras, Setor Aroeiras, Goiânia - GO',
    produtos_destaque: 'Pão francês quentinho, roscas, café e frios',
    whatsapp: '5562996707046',
    avaliacao: 4.9,
    status: 'ativo',
    aberto: true,
    destaque: true,
    latitude: -16.6781,
    longitude: -49.1932,
    horario_funcionamento: 'Seg a Dom: 06:00 às 20:30'
  },
  {
    id: '4',
    nome: 'Farmácia Popular Leste',
    categoria: 'Farmácia',
    bairro: 'Jardim Novo Mundo',
    endereco: 'Av. Buenos Aires, Jardim Novo Mundo, Goiânia - GO',
    produtos_destaque: 'Medicamentos, fraldas e genéricos com desconto',
    whatsapp: '5562996707046',
    avaliacao: 4.7,
    status: 'ativo',
    aberto: true,
    destaque: false,
    latitude: -16.6874,
    longitude: -49.2120,
    horario_funcionamento: 'Seg a Sáb: 07:00 às 22:00 | Dom: 08:00 às 14:00'
  },
  {
    id: '5',
    nome: 'Mercadinho Riviera',
    categoria: 'Mercado',
    bairro: 'Riviera',
    endereco: 'Rua R-12, Residencial Riviera, Goiânia - GO',
    produtos_destaque: 'Hortifruti fresco, carnes e bebidas geladas',
    whatsapp: '5562996707046',
    avaliacao: 4.5,
    status: 'ativo',
    aberto: true,
    destaque: false,
    latitude: -16.6991,
    longitude: -49.2015,
    horario_funcionamento: 'Seg a Sáb: 07:30 às 20:00 | Dom: 07:30 às 13:00'
  },
  {
    id: '6',
    nome: 'Bolo da Vó - Alphaville',
    categoria: 'Confeitaria',
    bairro: 'Alphaville Flamboyant',
    endereco: 'Av. Alphaville, Alphaville Flamboyant, Goiânia - GO',
    produtos_destaque: 'Bolo caseiro de cenoura com chocolate, tortas',
    whatsapp: '5562996707046',
    avaliacao: 5.0,
    status: 'ativo',
    aberto: true,
    destaque: true,
    latitude: -16.7112,
    longitude: -49.2189,
    horario_funcionamento: 'Ter a Sáb: 09:00 às 19:00 | Dom: 09:00 às 14:00'
  },
  {
    id: '7',
    nome: 'DELÍCIAS DA ANA',
    categoria: 'Confeitaria',
    bairro: 'Jardim Novo Mundo',
    endereco: 'Rua Bogotá, Jardim Novo Mundo, Goiânia - GO',
    produtos_destaque: 'Bolos no pote, trufas, doces para festa e brownies',
    whatsapp: '5562996707046',
    avaliacao: 5.0,
    status: 'ativo',
    aberto: true,
    destaque: true,
    latitude: -16.6860,
    longitude: -49.2140,
    horario_funcionamento: 'Seg a Sáb: 08:30 às 18:30'
  },
  {
    id: '8',
    nome: 'Barbearia Estilo Leste',
    categoria: 'Barbearia',
    bairro: 'Jardim Goiás',
    endereco: 'Av. Jamel Cecílio, Jardim Goiás, Goiânia - GO',
    produtos_destaque: 'Corte degradê, barba na toalha quente',
    whatsapp: '5562996707046',
    avaliacao: 4.9,
    status: 'ativo',
    aberto: true,
    destaque: false,
    latitude: -16.7025,
    longitude: -49.2341,
    horario_funcionamento: 'Ter a Sáb: 09:00 às 20:00'
  }
];

const LOCAL_STORAGE_KEY = 'achei_aqui_lojas_v2';
const METRICAS_STORAGE_KEY = 'achei_aqui_cliques_v2';

function getLocalLojas() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler cache local de lojas:', e);
  }
  return [...DEFAULT_LOJAS];
}

function saveLocalLojas(lojas) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lojas));
  } catch (e) {
    console.warn('Erro ao salvar cache local:', e);
  }
}

/**
 * Busca lojas ativas para o App do Cliente
 */
export async function getLojasAtivas() {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('status', 'ativo')
        .order('destaque', { ascending: false })
        .order('avaliacao', { ascending: false });

      if (!error && data && data.length > 0) {
        saveLocalLojas(data); // Salva no cache para uso offline
        return { data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Falha na consulta ao Supabase, recorrendo ao cache:', err);
    }
  }

  // Fallback para cache local / lojas padrão
  const locais = getLocalLojas().filter((l) => l.status === 'ativo' || !l.status);
  return { data: locais, source: 'local' };
}

/**
 * Registra clique no botão de WhatsApp para rastreamento de métricas
 */
export async function registrarCliqueWhatsApp(lojaId, bairroCliente = '') {
  // Salva no Supabase se configurado
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('metricas_cliques').insert([
        {
          loja_id: lojaId,
          origem: 'whatsapp_button',
          bairro_cliente: bairroCliente
        }
      ]);
    } catch (err) {
      console.warn('Erro ao registrar clique no Supabase:', err);
    }
  }

  // Registra no armazenamento local para métricas offline
  try {
    const raw = localStorage.getItem(METRICAS_STORAGE_KEY);
    const metricas = raw ? JSON.parse(raw) : {};
    metricas[lojaId] = (metricas[lojaId] || 0) + 1;
    metricas['_total'] = (metricas['_total'] || 0) + 1;
    localStorage.setItem(METRICAS_STORAGE_KEY, JSON.stringify(metricas));
  } catch (e) {
    // Silencioso
  }
}

/**
 * Solicitação de auto-cadastro feita pelo lojista
 */
export async function solicitarCadastroLojista(dados) {
  const whatsappSanitizado = sanitizeWhatsApp(dados.whatsapp);
  
  if (!whatsappSanitizado || whatsappSanitizado.length < 12) {
    throw new Error('Número de WhatsApp inválido. Digite DDD + Número.');
  }

  const novaLoja = {
    nome: dados.nome.trim(),
    categoria: dados.categoria,
    bairro: dados.bairro,
    endereco: dados.endereco ? dados.endereco.trim() : `Região Leste, ${dados.bairro}`,
    produtos_destaque: dados.produtos_destaque ? dados.produtos_destaque.trim() : '',
    whatsapp: whatsappSanitizado,
    avaliacao: 5.0,
    status: 'pendente', // Entra como pendente para aprovação do admin
    aberto: true,
    destaque: false,
    horario_funcionamento: dados.horario_funcionamento || 'Seg a Sáb: Horário Comercial'
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('lojas').insert([novaLoja]).select();
    if (error) throw new Error(error.message);
    return { success: true, data: data[0], source: 'supabase' };
  } else {
    // Modo local / demonstração
    novaLoja.id = 'temp_' + Date.now();
    const lojas = getLocalLojas();
    lojas.push(novaLoja);
    saveLocalLojas(lojas);
    return { success: true, data: novaLoja, source: 'local' };
  }
}

/**
 * OPERAÇÕES ADMINISTRATIVAS
 */

export async function getLojasAdmin() {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Erro ao carregar lojas admin do Supabase:', err);
    }
  }
  return getLocalLojas();
}

export async function aprovarLoja(id) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('lojas')
      .update({ status: 'ativo' })
      .eq('id', id);
    if (error) throw error;
  } else {
    const lojas = getLocalLojas().map((l) => (l.id === id ? { ...l, status: 'ativo' } : l));
    saveLocalLojas(lojas);
  }
}

export async function alternarStatusAberto(id, aberto) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('lojas')
      .update({ aberto })
      .eq('id', id);
    if (error) throw error;
  } else {
    const lojas = getLocalLojas().map((l) => (l.id === id ? { ...l, aberto } : l));
    saveLocalLojas(lojas);
  }
}

export async function alternarDestaque(id, destaque) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('lojas')
      .update({ destaque })
      .eq('id', id);
    if (error) throw error;
  } else {
    const lojas = getLocalLojas().map((l) => (l.id === id ? { ...l, destaque } : l));
    saveLocalLojas(lojas);
  }
}

export async function atualizarLoja(id, dados) {
  const payload = { ...dados };
  if (payload.whatsapp) {
    payload.whatsapp = sanitizeWhatsApp(payload.whatsapp);
  }

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('lojas')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  } else {
    const lojas = getLocalLojas().map((l) => (l.id === id ? { ...l, ...payload } : l));
    saveLocalLojas(lojas);
  }
}

export async function excluirLoja(id) {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('lojas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } else {
    const lojas = getLocalLojas().filter((l) => l.id !== id);
    saveLocalLojas(lojas);
  }
}

export async function restaurarLojasPadrao() {
  if (isSupabaseConfigured() && supabase) {
    // Insere as 8 lojas padrão no Supabase
    for (const loja of DEFAULT_LOJAS) {
      const { id, ...semId } = loja;
      await supabase.from('lojas').upsert(semId, { onConflict: 'nome' });
    }
  }
  saveLocalLojas([...DEFAULT_LOJAS]);
}

export async function getEstatisticasAdmin() {
  const lojas = await getLojasAdmin();
  let totalCliques = 0;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { count } = await supabase
        .from('metricas_cliques')
        .select('*', { count: 'exact', head: true });
      totalCliques = count || 0;
    } catch (e) {
      // Ignora erro
    }
  } else {
    try {
      const raw = localStorage.getItem(METRICAS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        totalCliques = parsed['_total'] || 0;
      }
    } catch (e) {}
  }

  return {
    total: lojas.length,
    ativas: lojas.filter((l) => l.status === 'ativo').length,
    pendentes: lojas.filter((l) => l.status === 'pendente').length,
    totalCliques
  };
}
