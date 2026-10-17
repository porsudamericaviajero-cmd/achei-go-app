# 🚀 Achei Aqui GO • App Oficial de Produção (Região Leste)

Aplicativo comercial progressivo (PWA) de alta performance para conectar moradores da **Região Leste de Goiânia** aos melhores comércios locais, com contato direto via WhatsApp e banco em nuvem em tempo real.

---

## 🛠️ Stack Tecnológica de Produção

* **Frontend:** HTML5 semântico, Vanilla CSS com Design System moderno (Emerald & Electric Orange), JavaScript Modular (ES Modules) e Vite 6.
* **Mobile / PWA:** Suporte a Progressive Web App com `manifest.webmanifest`, Service Worker offline (`sw.js`) e ícones SVG de alta definição.
* **Geolocalização:** Cálculo real de distâncias (Haversine) com suporte a GPS e centroides dos bairros da Região Leste.
* **Banco de Dados & Backend:** **Supabase** (PostgreSQL em nuvem, Row Level Security, Triggers e Índices).
* **Segurança:** Sanitização estrita contra ataques XSS, barreira de autenticação administrativa e validação E.164 para WhatsApp internacional (`+55`).
* **Deploy & Hospedagem:** **Vercel** com cabeçalhos de segurança, compressão Gzip e CDN global.
* **Versionamento:** **GitHub**.

---

## 📁 Estrutura do Projeto

```
ACHEI-GO-APP-COMPLETO-ANTIGRAVITY-IDE/
├── dist/                     # Build otimizado para deploy na Vercel
├── public/                   # Recursos estáticos da PWA
│   ├── icons/icon.svg        # Ícone do aplicativo
│   ├── manifest.webmanifest  # Manifesto PWA
│   └── sw.js                 # Service Worker (Cache Offline)
├── src/
│   ├── config/
│   │   └── supabase.js       # Cliente do Supabase com fallback gracioso
│   ├── services/
│   │   ├── geoService.js     # GPS e cálculo de distâncias (Haversine)
│   │   └── storeService.js   # CRUD de lojas, métricas de WhatsApp e admin
│   ├── styles/
│   │   ├── admin.css         # Estilos executivos do Painel Admin
│   │   └── main.css          # Design system do App do Cliente
│   ├── utils/
│   │   └── sanitize.js       # Sanitização anti-XSS e máscaras de telefone
│   ├── admin.js              # Lógica do Painel de Administração
│   └── main.js               # Lógica do App Cliente
├── supabase/
│   └── schema.sql            # Script SQL completo com tabelas, RLS e 8 lojas
├── .env.example              # Exemplo de variáveis de ambiente
├── admin.html                # Página do Painel Administrativo
├── index.html                # Página Principal (App do Cliente)
├── package.json              # Dependências e scripts de build
├── vercel.json               # Configurações de deploy e segurança da Vercel
└── vite.config.js            # Configuração multi-página do Vite
```

---

## ⚙️ Guia Passo a Passo para Colocar 100% em Produção

### 1. Configurar o Banco de Dados no Supabase (Gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta ou faça login.
2. Clique em **"New Project"**, defina o nome (ex.: `achei-aqui-go`) e uma senha para o banco de dados.
3. No menu lateral esquerdo, clique em **SQL Editor** > **New Query**.
4. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo, cole no SQL Editor do Supabase e clique em **Run** (Executar).
   * *Isso criará automaticamente as tabelas `lojas` e `metricas_cliques`, as regras de segurança (RLS), os índices e cadastrará as 8 lojas iniciais da Região Leste!*
5. No menu lateral, acesse **Project Settings** > **API**.
6. Copie a **Project URL** e a chave **Project API Key (anon / public)**.
7. Cole no seu arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   VITE_ADMIN_ACCESS_KEY=sua-senha-admin-segura
   ```

---

### 2. Subir o Projeto para o GitHub

No terminal da pasta do projeto, execute:

```bash
# 1. Inicializar o repositório Git
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar o primeiro commit
git commit -m "feat: app completo para produção com Supabase, PWA e Vite"

# 4. Criar o repositório no seu GitHub (via site github.com ou GitHub CLI)
# 5. Conectar o repositório remoto e fazer push:
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/achei-aqui-go.git
git push -u origin main
```

---

### 3. Deploy Automático na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New..."** > **"Project"**.
3. Selecione o repositório `achei-aqui-go` que acabou de subir.
4. A Vercel detectará o Vite automaticamente:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Em **Environment Variables**, adicione as 3 variáveis:
   * `VITE_SUPABASE_URL` = (sua URL do Supabase)
   * `VITE_SUPABASE_ANON_KEY` = (sua chave anon do Supabase)
   * `VITE_ADMIN_ACCESS_KEY` = (senha que você escolheu para o Admin)
6. Clique em **Deploy**! Em menos de 1 minuto seu app estará no ar com HTTPS gratuito.

---

### 4. Como Usar o Sistema

* **App do Cliente (`/`):**
  * Busca em tempo real por produtos e categorias.
  * Filtro por bairros e botão **"Perto de Mim (GPS)"** com cálculo de distância real.
  * Clique no botão do WhatsApp direciona com o link formatado com DDI `55` e registra a métrica do lojista.
  * Botão de instalação da PWA para adicionar à tela inicial do celular.
  * Cadastro de lojista com máscara dinâmica e prévia em tempo real.
* **Painel Administrativo (`/admin`):**
  * Protegido por senha (definida em `VITE_ADMIN_ACCESS_KEY`).
  * Estatísticas em tempo real: Total de lojas, ativas, pendentes e cliques no WhatsApp.
  * Aprovação rápida de novos cadastros de lojistas com 1 clique.
  * Edição de dados, alternância de status aberto/fechado e destaque no topo.
  * Backup e restauração de dados em formato JSON.
