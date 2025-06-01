import React from 'react';
import { NavItem, VehicleType, VehicleStatus, DocumentType, MaintenanceType, MaintenanceStatus, TireStatus, TireMovementType, TirePositionKeyType, TireCondition, Theme } from '@/types';

// --- APP CONFIG ---
export const APP_NAME = "Gestão de Frota";
export const APP_ABBREVIATION = "GDF";
export const DEFAULT_THEME: Theme = Theme.Dark; // Changed to Dark
export const LOGIN_EMAIL_HELP = "suporte@gestaodefrota.com"; // Example, can be changed


// --- ICONS ---
// Existing Icons (HomeIcon, CarIcon, etc.) are assumed to be complete and correct.
// Adding missing/incomplete ones:

export const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

export const CarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 16.94V18a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.06"></path>
    <path d="M14 9L12 2 8 9H2l2.5 5.5L6 20h2"></path>
    <path d="m10 16 1.5-3h3L16 16"></path>
    <path d="M22 9h-6l-2 7h3l2-7Z"></path>
    <path d="M12 2l1.5 3.5L12 9l-1.5-3.5L12 2Z"></path>
  </svg>
);

export const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
  </svg>
);

export const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l3.5-3.5a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0L14.7 6.3z"></path>
    <path d="M9.5 12.5 3 19l-2-2 6.5-6.5"></path>
    <path d="m12.5 9.5 6.5 6.5"></path>
  </svg>
);

export const ArrowsRightLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h18m-7.5-3.75L21 16.5m0 0L16.5 12M21 16.5H3" />
  </svg>
);


export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 .25 1l-.43.18a2 2 0 0 1-1.73 1V14a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2h.18a2 2 0 0 1 1.73 1l.25.43a2 2 0 0 1 0 2l-.08.15a2 2 0 0 0 .73 2.73l.38.22a2 2 0 0 0 2.73-.73l.1-.15a2 2 0 0 1 1-.25h.18a2 2 0 0 1 1.73 1l.43.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-.25-1l.43-.18a2 2 0 0 1 1.73-1V10a2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2h-.18a2 2 0 0 1-1.73-1l-.25-.43a2 2 0 0 1 0-2l.08-.15a2 2 0 0 0-.73-2.73l-.38-.22a2 2 0 0 0-2.73.73l-.1.15a2 2 0 0 1-1 .25V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2"></path>
    <path d="M12 20v2"></path>
    <path d="m4.93 4.93 1.41 1.41"></path>
    <path d="m17.66 17.66 1.41 1.41"></path>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="m6.34 17.66-1.41 1.41"></path>
    <path d="m19.07 4.93-1.41 1.41"></path>
  </svg>
);

export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
  </svg>
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
  </svg>
);

export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

export const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

export const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const TireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6.34 2.93 4.93 4.34"></path>
    <path d="M17.66 2.93 19.07 4.34"></path>
    <path d="M2.93 17.66 4.34 19.07"></path>
    <path d="M17.66 19.07 19.07 17.66"></path>
    <path d="M12 2v4"></path><path d="M12 18v4"></path>
    <path d="M2 12h4"></path><path d="M18 12h4"></path>
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const ShoppingCartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="8" cy="21" r="1"></circle>
    <circle cx="19" cy="21" r="1"></circle>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"></path>
  </svg>
);

export const TireHistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);


// --- NAVIGATION ---
export const NAV_ITEMS: NavItem[] = [
  { path: '/', name: 'Dashboard', icon: HomeIcon, requiresAuth: true },
  { path: '/vehicles', name: 'Veículos', icon: CarIcon, requiresAuth: true },
  { path: '/lifecycle', name: 'Ciclo de Vida', icon: ArrowsRightLeftIcon, requiresAuth: true, isBeta: true },
  { path: '/documents', name: 'Documentos', icon: DocumentIcon, requiresAuth: true },
  { path: '/maintenance', name: 'Manutenções', icon: WrenchIcon, requiresAuth: true },
  { path: '/tires', name: 'Gestão de Pneus', icon: TireIcon, requiresAuth: true },
  { path: '/tire-purchases', name: 'Compras de Pneus', icon: ShoppingCartIcon, requiresAuth: true, isBeta: true },
  { path: '/tire-history', name: 'Histórico Pneus', icon: TireHistoryIcon, requiresAuth: true },
  { path: '/settings', name: 'Configurações', icon: SettingsIcon, requiresAuth: true },
];


// --- SELECT OPTIONS ---
export const VEHICLE_STATUS_OPTIONS = Object.values(VehicleStatus).map(status => ({ value: status, label: status }));
export const VEHICLE_TYPES_OPTIONS = Object.values(VehicleType).map(type => ({ value: type, label: type }));
export const TRACKER_TYPE_OPTIONS = [
    { value: "GPS", label: "GPS Padrão" },
    { value: "Satelital", label: "Satelital" },
    { value: "Hibrido", label: "Híbrido (GPS+Satelital)" },
    { value: "Radiofrequencia", label: "Radiofrequência (RF)" },
    { value: "Telemetria", label: "Com Telemetria Avançada" },
    { value: "Outro", label: "Outro" },
];
export const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType).map(type => ({ value: type, label: type }));
export const MAINTENANCE_TYPE_OPTIONS = Object.values(MaintenanceType).map(type => ({ value: type, label: type }));
export const MAINTENANCE_STATUS_OPTIONS = Object.values(MaintenanceStatus).map(status => ({ value: status, label: status }));
export const DISPOSAL_REASON_OPTIONS = [
    { value: "Venda", label: "Venda" },
    { value: "PerdaTotal", label: "Perda Total (Sinistro)" },
    { value: "FimVidaUtil", label: "Fim da Vida Útil" },
    { value: "Obsolescencia", label: "Obsolescência" },
    { value: "Leilao", label: "Leilão" },
    { value: "Outro", label: "Outro" },
];
export const BAU_TYPE_OPTIONS = [
    { value: "Sider", label: "Sider" },
    { value: "Refrigerado", label: "Refrigerado (Frigorífico)" },
    { value: "Seco", label: "Carga Seca (Furgão)" },
    { value: "Graneleiro", label: "Graneleiro" },
    { value: "Bau", label: "Baú Simples" },
    { value: "Plataforma", label: "Plataforma" },
    { value: "Tanque", label: "Tanque" },
    { value: "Cegonheiro", label: "Cegonheiro" },
    { value: "Outro", label: "Outro" },
];
export const YES_NO_OPTIONS = [
    { value: "true", label: "Sim" },
    { value: "false", label: "Não" },
];
export const GARANTIA_TYPE_OPTIONS = [
    { value: "TotalFabrica", label: "Total de Fábrica" },
    { value: "MotorCambio", label: "Motor e Câmbio" },
    { value: "TremForca", label: "Trem de Força" },
    { value: "Estendida", label: "Estendida (Concessionária)" },
    { value: "Terceiros", label: "Terceiros (Seguradora)" },
    { value: "SemGarantia", label: "Sem Garantia" },
    { value: "Outra", label: "Outra" },
];

export const TIRE_STATUS_OPTIONS = Object.values(TireStatus).map(status => ({ value: status, label: status }));
export const TIRE_CONDITION_OPTIONS = Object.values(TireCondition).map(cond => ({ value: cond, label: cond }));
export const TIRE_MOVEMENT_TYPE_OPTIONS = Object.values(TireMovementType).map(type => ({ value: type, label: type }));

export const TirePositionKey = {
  FE: "Dianteiro Esquerdo",
  FD: "Dianteiro Direito",
  TDEI: "Traseiro Duplo Externo Esquerdo",
  TDEE: "Traseiro Duplo Externo Externo", // This seems like a typo, usually it's TDE and TDI
  TDDI: "Traseiro Duplo Interno Esquerdo", // Usually TIE and TID for Tração Interno/Externo Esquerdo/Direito
  TDDE: "Traseiro Duplo Interno Direito",  // Usually TDE and TDI for Tração Duplo Externo/Interno

  // More standard naming might be:
  // Truck examples (common for "toco" or "truck" 4x2, 6x2, 8x2 etc.)
  // Eixo 1 (Dianteiro)
  // '1LE': '1º Eixo Esquerdo (Dianteiro)',
  // '1LD': '1º Eixo Direito (Dianteiro)',
  // Eixo 2 (Tração)
  // '2LEI': '2º Eixo Esquerdo Interno (Tração)',
  // '2LEE': '2º Eixo Esquerdo Externo (Tração)',
  // '2LDI': '2º Eixo Direito Interno (Tração)',
  // '2LDE': '2º Eixo Direito Externo (Tração)',
  // Eixo 3 (Truck / Apoio)
  // '3LEI': '3º Eixo Esquerdo Interno (Apoio)',
  // '3LEE': '3º Eixo Esquerdo Externo (Apoio)',
  // '3LDI': '3º Eixo Direito Interno (Apoio)',
  // '3LDE': '3º Eixo Direito Externo (Apoio)',

  // Using provided keys from types.ts for consistency now:
  TTEI: "Terceiro Eixo Tração Esquerdo Interno",
  TTEE: "Terceiro Eixo Tração Esquerdo Externo",
  TTDI: "Terceiro Eixo Tração Direito Interno",
  TTDE: "Terceiro Eixo Tração Direito Externo",
  T3EI: "Eixo 3 Esquerdo Interno",
  T3EE: "Eixo 3 Esquerdo Externo",
  T3DI: "Eixo 3 Direito Interno",
  T3DE: "Eixo 3 Direito Externo",
  T1E: "1º Eixo Simples Esquerdo",
  T1D: "1º Eixo Simples Direito",
  Estepe1: "Estepe 1",
  Estepe2: "Estepe 2",
} as const;

export const TIRE_POSITION_OPTIONS = (Object.keys(TirePositionKey) as TirePositionKeyType[]).map(key => ({
  value: key,
  label: TirePositionKey[key]
}));


export const AXLE_CONFIGURATION_OPTIONS = [
  { value: "4x2", label: "4x2 (Cavalo Toco / Caminhão Toco)" }, // 1 dianteiro, 1 tração simples
  { value: "6x2", label: "6x2 (Cavalo Trucado / Caminhão Trucado - Tração em 1 eixo)" }, // 1 dianteiro, 2 traseiros (1 tração, 1 apoio)
  { value: "6x4", label: "6x4 (Cavalo Traçado / Caminhão Traçado - Tração em 2 eixos)" }, // 1 dianteiro, 2 traseiros (ambos tração)
  { value: "8x2", label: "8x2 (Bitruck Direcional ou Fixo)" }, // 2 dianteiros, 2 traseiros (1 tração)
  { value: "8x4", label: "8x4 (Bitruck Traçado)" }, // 2 dianteiros, 2 traseiros (ambos tração)
  { value: "Carreta2Eixos", label: "Carreta 2 Eixos" },
  { value: "Carreta3Eixos", label: "Carreta 3 Eixos (Vanderleia, LS)" },
  { value: "CarretaDist", label: "Carreta Distanciada (Argentina)" },
  { value: "Bitrem7Eixos", label: "Bitrem 7 Eixos" },
  { value: "Rodotrem9Eixos", label: "Rodotrem 9 Eixos" },
  { value: "VanRodSimples", label: "Van/Utilitário (Rodado Simples Traseiro)" },
  { value: "VanRodDuplo", label: "Van/Utilitário (Rodado Duplo Traseiro)" },
  { value: "Carro", label: "Carro de Passeio/SUV" },
  { value: "Moto", label: "Motocicleta" },
  { value: "Outro", label: "Outra Configuração" },
];

// Simplified getAxleLayout - for detailed diagrams, this would be more complex
export const getAxleLayout = (config?: string): { positions: TirePositionKeyType[], spares: TirePositionKeyType[], diagramLabel: string } => {
  const layout = { positions: [] as TirePositionKeyType[], spares: ["Estepe1"] as TirePositionKeyType[], diagramLabel: "Layout Padrão" };
  switch (config) {
    case "4x2": // Caminhão Toco or Cavalo Toco
      layout.positions = ["FE", "FD", "TDEI", "TDEE", "TDDI", "TDDE"]; // Assuming dual rear
      // If single rear: layout.positions = ["FE", "FD", "T1E", "T1D"];
      layout.diagramLabel = "4x2 (Rodagem Dupla Traseira)";
      break;
    case "6x2": // Caminhão Trucado or Cavalo LS
      layout.positions = ["FE", "FD", "TDEI", "TDEE", "TDDI", "TDDE", "T3EI", "T3EE", "T3DI", "T3DE"]; // Trativo + Apoio (ambos duplos)
      layout.diagramLabel = "6x2 (Rodagem Dupla Eixos Traseiros)";
      break;
    case "Carreta3Eixos":
      layout.positions = ["TDEI", "TDEE", "TDDI", "TDDE", "TTEI", "TTEE", "TTDI", "TTDE", "T3EI", "T3EE", "T3DI", "T3DE"]; // Example for 3 dual axles
      layout.diagramLabel = "Carreta 3 Eixos (Rodagem Dupla)";
      break;
    case "Carro":
       layout.positions = ["FE", "FD", "T1E", "T1D"];
       layout.diagramLabel = "Carro de Passeio";
       break;
    // Add more cases as needed
    default:
      // A generic fallback or a more intelligent parser based on 'config' string might be needed.
      // For now, a simple default for anything not explicitly defined:
      layout.positions = ["FE", "FD", "T1E", "T1D"]; // Assuming simple 4 tire vehicle
      layout.diagramLabel = config ? `Layout para ${config}` : "Layout Genérico (4 pneus)";
      break;
  }
  return layout;
};