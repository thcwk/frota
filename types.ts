
export enum Theme {
  Light = "light",
  Dark = "dark",
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  sendPasswordResetEmail: (email: string) => Promise<{success: boolean; error?: string}>; // Added for password reset
  userEmailForHelp?: string;
}

export enum VehicleStatus {
  Active = "Ativo",
  Maintenance = "Em Manutenção",
  Sold = "Vendido",
  Inactive = "Inativo", 
  Preparing = "Em Preparação", 
  Disposed = "Baixado", 
}

export enum VehicleType {
  Car = "Carro",
  Motorcycle = "Moto",
  Truck = "Caminhão",
  Van = "Van",
  Bus = "Ônibus",
  Utility = "Utilitário",
  Other = "Outro",
}

export interface Vehicle {
  id: string;
  // Core Info
  numeroFrota?: string; // Nº frota
  plate: string; // PLACA
  brand:string; // MARCA
  model: string; // MODELO
  anoFabricacao?: number; // ANO FAB
  anoModelo?: number; // ANO MOD
  renavam: string; // RENAVAM
  chassis: string; // CHASSIS
  color: string;
  vehicleType: VehicleType;
  category: string; // Ex: Próprio, Alugado
  status: VehicleStatus;
  department?: string;
  axleConfiguration?: string; 

  // Bau Info
  bauTipo?: string; // BAU (e.g., Refrigerado, Sider, Seco)
  bauAno?: number; // ANO BAU
  bauAparelhoMarcaModelo?: string; // APARELHO (e.g., Thermo King SLX-300)

  // Documents & Legal (Specific fields beyond general Documents module)
  crlvAno?: number; // CRLV (year of the document)
  seguroFornecedor?: string; // EXITO/GRANDE OESTE (insurer)
  seguroApolice?: string;
  seguroExpiracao?: string; // date
  seloVerdeNumero?: string; // SELO VERDE (e.g., environmental cert number)
  seloVerdeExpiracao?: string; // date
  licenciamentoSanitarioNumero?: string; // LICENCIAMENTO SANITARIO
  licenciamentoSanitarioExpiracao?: string; // date (for DIAS RESTANTES LICENCIAMENTO)
  tacografoNumeroCertificado?: string; // TACOGRAFO (certificate number)
  tacografoAfericaoExpiracao?: string; // date (for DIAS RESTANTES TACOGRAFO)
  
  // Tracker (already exists, can be augmented by rastreadorDetalhes)
  trackerId?: string;
  trackerType?: string; 
  trackerSupplier?: string;
  trackerInstallDate?: string; // date
  rastreadorDetalhes?: string; // RASTREADOR (descriptive, e.g., "Omnilink + Sascar Híbrido")

  // Tag Pedagio
  tagPedagioNumero?: string; // TAG PEGAGIO (e.g., 'Sem Parar ID')
  tagPedagioFornecedor?: string; // e.g., 'Sem Parar', 'ConectCar'
  
  // Garantia
  garantiaDescricao?: string; // GARANTIA (e.g., 'Motor e Câmbio', 'Total Fábrica')
  garantiaExpiracaoData?: string; // date (TEMPO GARANTIA - data)
  garantiaExpiracaoKm?: number; // (TEMPO GARANTIA - km)

  // Acquisition details
  acquisitionDate?: string; // date
  acquisitionValue?: number;
  supplier?: string; 

  // Sale/Disposal details
  saleDate?: string; // date
  saleValue?: number;
  buyer?: string; 
  disposalReason?: string; 
  disposalNotes?: string;

  // New fields for detailed vehicle management
  dataUltimaRevisao?: string; // date
  proximaRevisaoKm?: number;
  proximaRevisaoData?: string; // date
  observacoesGerais?: string; // General observations for the vehicle
}

export enum DocumentType {
  CRLV = "CRLV",
  InsurancePolicy = "Apólice de Seguro",
  ANTT = "Licença ANTT",
  InspectionReport = "Laudo de Inspeção",
  Tachograph = "Tacógrafo",
  LicenseSanitary = "Licenciamento Sanitário",
  SeloVerde = "Selo Verde",
  Photo = "Foto do Veículo", // Added for vehicle photos
  Other = "Outro",
}

export interface Document {
  id:string;
  vehicleId: string; 
  documentType: DocumentType;
  number: string;
  emissionDate: string; // date
  expiryDate: string; // date - For CRLV, this will represent the end of the CRLV's valid year.
  observations?: string;
  // For PDF attachments
  fileName?: string;
  fileType?: string; // e.g., 'application/pdf'
  fileContent?: string; // base64 encoded string
}

export enum MaintenanceType {
  Preventive = "Preventiva",
  Corrective = "Corretiva",
}

export enum MaintenanceStatus {
  Open = "Aberta",
  InProgress = "Em Andamento",
  WaitingParts = "Aguardando Peças",
  Completed = "Concluída",
  Cancelled = "Cancelada",
  Scheduled = "Agendada", // For future maintenances
}
export interface Maintenance {
  id: string;
  vehicleId: string; 
  maintenanceType: MaintenanceType;
  invoiceNumber: string; // Changed from osNumber
  openDate: string; // date
  closeDate?: string; // date
  description: string;
  cost?: number;
  status: MaintenanceStatus;
  mechanicResponsible?: string;
  notes?: string;
  // For PDF attachments on completed maintenance
  pdfFileName?: string;
  pdfFileType?: string; // e.g., 'application/pdf'
  pdfFileContent?: string; // base64 encoded string

  // New fields for maintenance
  pecasUtilizadas?: string; // Or Array<{nome:string, qtd:number, custo:number}>
  dataAgendamento?: string; // date, for scheduled maintenances
  odometerAtMaintenance?: number;
}

export interface NavItem {
  path: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  action?: () => void; 
  requiresAuth?: boolean; 
  isBeta?: boolean; // For new features
}

// --- TIRE MANAGEMENT TYPES ---
export enum TireStatus {
  InStock = "Em Estoque",
  Mounted = "Montado",
  InRepair = "Em Reforma",
  Scrapped = "Sucateado",
}

export enum TireCondition {
    Novo = "Novo",
    Recapado1 = "1ª Recapagem",
    Recapado2 = "2ª Recapagem",
    Consertado = "Consertado",
    FimVida = "Fim de Vida", // Could be same as Scrapped but used before final decision
}


export type TirePositionKeyType = 
  | "FD" | "FE" | "TDEI" | "TDEE" | "TDDI" | "TDDE"
  | "TTEI" | "TTEE" | "TTDI" | "TTDE" | "T3EI" | "T3EE"
  | "T3DI" | "T3DE" | "T1E" | "T1D" | "Estepe1" | "Estepe2";


export interface Tire {
  id: string;
  fireNumber: string; // Número de fogo/marcação
  brand: string;
  model: string;
  dimensions: string; // e.g., 295/80R22.5
  dot?: string;
  purchaseDate?: string;
  cost?: number;
  status: TireStatus;
  condition: TireCondition; // NEW: Current condition of the tire
  currentVehicleId?: string | null; // ID of the vehicle it's mounted on
  currentPositionKey?: TirePositionKeyType | null; // Position on the vehicle
  lastOdometerReading?: number; // Odometer when this tire was last moved/checked
  notes?: string;
  sulcoMm?: number; // Tread depth in mm
}

export enum TireMovementType {
  StockIn = "Entrada em Estoque", // Initial registration or return from repair
  Mount = "Montagem",
  Dismount = "Desmontagem",
  ToRepair = "Envio para Reforma",
  FromRepair = "Retorno da Reforma", // Different from StockIn
  Scrap = "Sucateamento",
  ConditionChange = "Mudança de Condição", // For internal tracking of condition updates
  TreadMeasurement = "Medição de Sulco", // New movement type for tread
}

export interface TireMovement {
  id: string;
  tireId: string;
  movementType: TireMovementType;
  date: string; // Date of movement
  vehicleId?: string | null; // Vehicle involved (if any)
  odometerReading?: number | null; // Odometer of the vehicle at the time of movement
  fromPositionKey?: TirePositionKeyType | null;
  toPositionKey?: TirePositionKeyType | null;
  fromCondition?: TireCondition | null; // For tracking changes
  toCondition?: TireCondition | null;   // For tracking changes
  notes?: string;
  destination?: string; // e.g., Repair shop name, scrap yard
  cost?: number; // Cost associated with this movement (e.g., repair cost, purchase cost for StockIn)
  sulcoMm?: number; // Record tread depth at this movement
}

// Result summary for vehicle import
export interface VehicleImportResult {
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}
