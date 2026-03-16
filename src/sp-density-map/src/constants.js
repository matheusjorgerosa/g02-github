
export const T = {
  pt: {
    dashboard: 'Dashboard', campaigns: 'Campanhas', settings: 'Ajustes', logout: 'Sair',
    hello: 'Olá, André!', dashboardTitle: 'Dashboard VENUS',
    loading: 'Carregando VENUS...',
    totalAudience: 'Público Total', flow24h: 'Fluxo 24h',
    estimatedPeak: 'Pico Estimado', districtDist: 'Distribuição por Bairro (Endereço)',
    socialClass: 'Classe Social', gender: 'Gênero', impact: 'Impacto',
    publicFilters: 'Filtros de Público', onlyRelevant: 'Apenas Bins Relevantes',
    ageRange: 'Faixa Etária:', genderLabel: 'Gênero:', socialClassLabel: 'Classe Social:', hoursLabel: 'Horários (24h):',
    male: 'Masculino', female: 'Feminino',
    settingsTitle: 'Configurações de Acessibilidade',
    colorblindMode: 'Modo Daltônico', colorblindNone: 'Desativado',
    colorblindDeutan: 'Deuteranopia (daltonismo verde)', colorblindProtan: 'Protanopia (daltonismo vermelho)', colorblindTritan: 'Tritanopia (daltonismo azul)',
    highContrast: 'Alto Contraste',
    fontSize: 'Tamanho da Fonte', fontSmall: 'Pequena', fontMedium: 'Média', fontLarge: 'Grande', fontXLarge: 'Extra Grande',
    fontFamily: 'Família de Fonte', fontInter: 'Inter (padrão)', fontOpenDys: 'OpenDyslexic', fontMono: 'Monoespaçada', fontSerif: 'Serifada',
    reducedMotion: 'Reduzir Animações', language: 'Idioma', resetSettings: 'Restaurar Padrões',
    skipToContent: 'Pular para o conteúdo',
    expandMap: 'Expandir mapa para tela cheia', minimizeMap: 'Minimizar mapa',
    view2D: 'Alternar para visão 2D', view3D: 'Alternar para visão 3D',
    navDashboard: 'Ir para Dashboard', navCampaigns: 'Ir para Campanhas',
    navSettings: 'Abrir Configurações', navLogout: 'Sair do sistema',
    campaignsTitle: 'Visualize as suas campanhas.',
    darkMode: 'Modo Escuro',
    loginTitle: 'Que bom te ver novamente!',
    loginEmail: 'E-mail',
    loginEmailPlaceholder: 'seuemail@email.com',
    loginPassword: 'Senha',
    loginPasswordPlaceholder: 'Digite sua senha',
    loginButton: 'Entrar',
    loginLoading: 'Entrando...',
    loginForgot: 'Esqueceu a senha?',
    loginOr: 'ou',
    loginGoogle: 'Entrar com Google',
    loginNoAccount: 'Não possui uma conta?',
    loginSignup: 'Cadastre-se agora',
    signupTitle: 'Crie sua conta',
    signupName: 'Nome',
    signupNamePlaceholder: 'Seu nome completo',
    signupEmail: 'E-mail',
    signupEmailPlaceholder: 'seuemail@email.com',
    signupPassword: 'Senha',
    signupPasswordPlaceholder: 'Mínimo 6 caracteres',
    signupButton: 'Cadastrar',
    signupLoading: 'Cadastrando...',
    signupHasAccount: 'Já possui uma conta?',
    signupLogin: 'Faça login',
  },
};


export const DEFAULT_SETTINGS = {
  colorblindMode: 'none',
  darkMode: false,
  highContrast: false,
  fontSize: 'large',
  fontFamily: 'inter',
  reducedMotion: false,
  language: 'pt',
};


export const COLOR_RANGES = {
  none:   [[255,230,210],[255,180,130],[255,130,60],[255,85,0],[200,65,0],[150,45,0]],
  deutan: [[255,247,188],[254,227,145],[254,196,79],[236,112,20],[204,76,2],[140,45,4]],
  protan: [[255,255,178],[254,217,118],[254,178,76],[253,141,60],[240,59,32],[189,0,38]],
  tritan: [[237,248,251],[178,226,226],[102,194,164],[44,162,95],[0,109,44],[0,68,27]],
};

export const CHART_COLORS = {
  none:   { primary: '#FF5500', secondary: '#FFBB99' },
  deutan: { primary: '#EC7014', secondary: '#FEC44F' },
  protan: { primary: '#FD8D3C', secondary: '#FED976' },
  tritan: { primary: '#2CA25F', secondary: '#99D8C9' },
};


export const FILTER_CONFIG = {
  idade: ['18-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'],
  genero: [{ id: 'M', label: 'Masculino' }, { id: 'F', label: 'Feminino' }],
  classe_social: ['A', 'B1', 'B2', 'C1', 'C2', 'DE'],
  horario: Array.from({ length: 24 }, (_, i) => i),
};

export const INITIAL_FILTERS = {
  idade: [...FILTER_CONFIG.idade],
  genero: ['M', 'F'],
  classe_social: [...FILTER_CONFIG.classe_social],
  horario: [...FILTER_CONFIG.horario],
};

export const INITIAL_VIEW_STATE = { longitude: -46.6333, latitude: -23.5505, zoom: 11, pitch: 45, bearing: 0 };

// ─── Helpers ───────────────────────────────────────────────────────────────────
export const formatNumber = (val) => Math.floor(val).toLocaleString('pt-BR');
export const renderPieLabel = ({ name, percent }) => `${name} (${Math.floor(percent * 100)}%)`;
export const parseTarget = (str) => { if (!str) return null; try { return JSON.parse(str.replace(/'/g, '"')); } catch { return null; } };
