
import React, { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Card, Button, Input, Modal, Select, Table, Spinner, Textarea, TableColumn, StatusBadge, DetailsViewModal, DetailItem } from '@/ui_components';
import { PlusIcon, CarIcon, DocumentIcon, HomeIcon, WrenchIcon, SettingsIcon, ExclamationTriangleIcon, ArrowsRightLeftIcon, EditIcon, TrashIcon, EyeIcon, TireIcon, TireHistoryIcon, ShoppingCartIcon, SunIcon, MoonIcon, LogoutIcon, UploadIcon, DownloadIcon } from '@/constants';
import { 
    Vehicle, VehicleStatus, VehicleType, 
    Document, Maintenance, DocumentType, MaintenanceType, MaintenanceStatus,
    Tire, TireStatus, TirePositionKeyType, TireMovementType, TireMovement, TireCondition,
    VehicleImportResult
} from '@/types';
import { 
    VEHICLE_STATUS_OPTIONS, VEHICLE_TYPES_OPTIONS, TRACKER_TYPE_OPTIONS,
    DOCUMENT_TYPE_OPTIONS, MAINTENANCE_TYPE_OPTIONS, MAINTENANCE_STATUS_OPTIONS,
    DISPOSAL_REASON_OPTIONS, BAU_TYPE_OPTIONS, YES_NO_OPTIONS, GARANTIA_TYPE_OPTIONS,
    TIRE_STATUS_OPTIONS, TIRE_POSITION_OPTIONS, TIRE_MOVEMENT_TYPE_OPTIONS, TIRE_CONDITION_OPTIONS,
    AXLE_CONFIGURATION_OPTIONS, getAxleLayout, TirePositionKey as TirePositionKeyMap
} from '@/constants';
import { useTheme, useAuth } from '@/App';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { 
    db, 
    fbAuth, 
    FirebaseUser,
    Timestamp, 
    serverTimestamp 
} from '@/firebase';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    writeBatch 
} from '@firebase/firestore'; // Changed from 'firebase/firestore'
import type { DocumentData, QuerySnapshot } from '@firebase/firestore'; // Changed from 'firebase/firestore'
import * as XLSX from 'xlsx'; // For Excel Import/Export

// --- COLLECTION NAMES ---
const VEHICLES_COLLECTION = "vehicles";
const DOCUMENTS_COLLECTION = "documents";
const MAINTENANCES_COLLECTION = "maintenances";
const TIRES_COLLECTION = "tires";
const TIRE_MOVEMENTS_COLLECTION = "tireMovements";
const TIRE_PURCHASES_COLLECTION = "tirePurchases";

// --- UTILITY FUNCTIONS ---

const mapDocToData = <T extends { id: string }>(d: DocumentData): T => {
    const data = d.data();
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) { 
            data[key] = (data[key] as typeof Timestamp).toDate().toISOString();
        }
    });
    return { id: d.id, ...data } as T;
};


const formatDate = (dateStr?: string | typeof Timestamp) => {
  if (!dateStr) return 'N/A';
  let date: Date;
  if (dateStr instanceof Timestamp) { 
    date = dateStr.toDate();
  } else { 
    date = new Date(dateStr); 
  }
  if (isNaN(date.getTime())) return 'Data Inválida';
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
};

const formatCurrency = (value?: number) => value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A';
const formatNumber = (value?: number) => value?.toLocaleString('pt-BR') || 'N/A';


export const calculateDaysRemaining = (expiryDate?: string | typeof Timestamp): { days: number; label: string; colorClass: string } => {
  if (!expiryDate) return { days: Infinity, label: 'N/D', colorClass: 'text-slate-500 dark:text-slate-400' };
  
  let expiry: Date;
  if (expiryDate instanceof Timestamp) { 
    expiry = expiryDate.toDate();
  } else { 
    expiry = new Date(expiryDate); 
  }
  if (isNaN(expiry.getTime())) return { days: Infinity, label: 'Data Inválida', colorClass: 'text-orange-500 dark:text-orange-400' };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 
  const expiryUtcDate = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate()));

  const diffTime = expiryUtcDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { days: diffDays, label: `Vencido (${Math.abs(diffDays)} d)`, colorClass: 'text-red-500 dark:text-red-400 font-semibold' };
  if (diffDays === 0) return { days: diffDays, label: 'Vence Hoje', colorClass: 'text-red-500 dark:text-red-400 font-semibold' };
  if (diffDays <= 30) return { days: diffDays, label: `${diffDays} d`, colorClass: 'text-yellow-500 dark:text-yellow-400 font-semibold' };
  return { days: diffDays, label: `${diffDays} d`, colorClass: 'text-green-600 dark:text-green-400' };
};


const getStatusColor = (status: string): string => {
    switch (status) {
        case VehicleStatus.Active: return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case VehicleStatus.Maintenance: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case VehicleStatus.Sold: return 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-300 line-through';
        case VehicleStatus.Inactive:
        case VehicleStatus.Disposed:
             return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
        case MaintenanceStatus.Open: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case MaintenanceStatus.InProgress: return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
        case MaintenanceStatus.WaitingParts: return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300';
        case MaintenanceStatus.Completed: return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case MaintenanceStatus.Cancelled: return 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-300';
        case MaintenanceStatus.Scheduled: return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
        case TireStatus.InStock: return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
        case TireStatus.Mounted: return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case TireStatus.InRepair: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case TireStatus.Scrapped: return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
    }
};

const getTireConditionColor = (condition: TireCondition): string => {
    switch (condition) {
        case TireCondition.Novo: return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case TireCondition.Recapado1: 
        case TireCondition.Recapado2:
            return 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300';
        case TireCondition.Consertado: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case TireCondition.FimVida: return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
    }
}

const viewFile = (base64Content?: string, fileType?: string, fileName?: string) => {
    if (base64Content && fileType) {
      try {
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: fileType});
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        URL.revokeObjectURL(blobUrl); 
      } catch (error) {
        console.error("Error decoding or opening file:", error);
        alert(`Erro ao tentar visualizar o arquivo ${fileName || ''}. O conteúdo pode estar corrompido.`);
      }
    } else {
      alert(`Nenhum arquivo para visualizar ${fileName ? `(${fileName})` : ''}.`);
    }
};

const DevelopmentPlaceholder: React.FC<{ title: string; icon?: React.FC<React.SVGProps<SVGSVGElement>> }> = ({ title, icon: Icon = WrenchIcon }) => (
  <div className="text-center py-10">
    <Icon className="w-16 h-16 mx-auto mb-4 text-primary opacity-70" />
    <h2 className="text-xl font-semibold mb-2 text-light_text_primary dark:text-dark_text_primary">{title}</h2>
    <p className="text-light_text_secondary dark:text-dark_text_secondary">Esta funcionalidade está em desenvolvimento.</p>
  </div>
);

const prepareDataForFirestore = (data: any): DocumentData => {
  const firestoreData: DocumentData = { ...data };
  const dateFields = [
    'acquisitionDate', 'saleDate', 'trackerInstallDate', 'seguroExpiracao', 
    'seloVerdeExpiracao', 'licenciamentoSanitarioExpiracao', 'tacografoAfericaoExpiracao',
    'garantiaExpiracaoData', 'emissionDate', 'expiryDate', 'openDate', 'closeDate',
    'purchaseDate', 'date', 'dataUltimaRevisao', 'proximaRevisaoData', 'dataAgendamento'
  ];

  for (const key in firestoreData) {
    if (dateFields.includes(key) && firestoreData[key] && typeof firestoreData[key] === 'string') {
      // Expect YYYY-MM-DD string from forms/import parsing
      const parts = firestoreData[key].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JS month is 0-indexed
        const day = parseInt(parts[2]);
        const dateValue = new Date(Date.UTC(year, month, day)); // Treat as UTC
        if (!isNaN(dateValue.getTime())) { 
          firestoreData[key] = Timestamp.fromDate(dateValue); 
        } else {
          delete firestoreData[key]; 
          console.warn(`Invalid date string for field ${key}: ${firestoreData[key]}`);
        }
      } else {
         delete firestoreData[key]; 
         console.warn(`Invalid date string format for field ${key}: ${firestoreData[key]}. Expected YYYY-MM-DD.`);
      }
    }
    if (firestoreData[key] === undefined) {
        delete firestoreData[key];
    }
  }
  delete firestoreData.id; 
  return firestoreData;
};

const exportToExcel = (data: any[], fileName: string, sheetName: string = "Dados") => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert("Ocorreu um erro ao exportar os dados para Excel.");
  }
};

const FormSectionTitle: React.FC<{title: string, className?: string}> = ({ title, className }) => (
    <h4 className={`col-span-full text-md font-semibold mt-3 mb-2 text-primary dark:text-primary-light ${className || ''}`}>{title}</h4>
);
const FormDivider: React.FC<{className?: string}> = ({className}) => (
    <div className={`col-span-full mt-2 mb-3 ${className || ''}`}><hr className="dark:border-slate-700"/></div>
);


// --- PAGE COMPONENTS ---

// Dashboard Page
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([]);
  const [documentsData, setDocumentsData] = useState<Document[]>([]);
  const [maintenancesData, setMaintenancesData] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vehiclesSnap, documentsSnap, maintenancesSnap] = await Promise.all([
          getDocs(collection(db, VEHICLES_COLLECTION)),
          getDocs(collection(db, DOCUMENTS_COLLECTION)),
          getDocs(collection(db, MAINTENANCES_COLLECTION))
        ]);
        setVehiclesData(vehiclesSnap.docs.map(d => mapDocToData<Vehicle>(d)));
        setDocumentsData(documentsSnap.docs.map(d => mapDocToData<Document>(d)));
        setMaintenancesData(maintenancesSnap.docs.map(d => mapDocToData<Maintenance>(d)));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);


  const summaryCards = useMemo(() => {
    const activeVehicles = vehiclesData.filter(v => v.status !== VehicleStatus.Sold && v.status !== VehicleStatus.Disposed);
    return [
      { title: "Total de Veículos Ativos", value: activeVehicles.length, icon: CarIcon, color: "blue", path: "/vehicles" },
      { title: "Em Manutenção", value: vehiclesData.filter(v => v.status === VehicleStatus.Maintenance).length, icon: WrenchIcon, color: "yellow", path: `/maintenance?status=${encodeURIComponent(VehicleStatus.Maintenance)}` },
      { title: "Docs Próx. Venc.", value: documentsData.filter(d => { const rem = calculateDaysRemaining(d.expiryDate); return rem.days >=0 && rem.days <= 30;}).length, icon: DocumentIcon, color: "red", path: "/documents" },
      { title: "Manut. Abertas/Agendadas", value: maintenancesData.filter(m => m.status === MaintenanceStatus.Open || m.status === MaintenanceStatus.InProgress || m.status === MaintenanceStatus.Scheduled).length, icon: WrenchIcon, color: "purple", path: `/maintenance?status=${encodeURIComponent(MaintenanceStatus.Open)}` },
    ];
  }, [vehiclesData, documentsData, maintenancesData]);

   const expiringItemsColumns: TableColumn<{id: string, name: string, type: string, expiryDate: string | typeof Timestamp, daysLeft: number, vehiclePlate?: string, path: string}>[] = [
    { header: 'Item', accessor: 'name', cellClassName: 'font-semibold' },
    { header: 'Tipo', accessor: 'type' },
    { header: 'Veículo', accessor: 'vehiclePlate', render: item => item.vehiclePlate || <span className="italic text-slate-500">N/A</span> },
    { header: 'Vencimento', accessor: 'expiryDate', render: item => formatDate(item.expiryDate)},
    { header: 'Status', accessor: 'daysLeft', render: item => <StatusBadge text={calculateDaysRemaining(item.expiryDate).label} colorClass={calculateDaysRemaining(item.expiryDate).colorClass} size="xs"/>}
  ];

  const expiringItemsData = useMemo(() => {
    const items: {id: string, name: string, type: string, expiryDate: string | typeof Timestamp, daysLeft: number, vehiclePlate?: string, path: string}[] = [];
    const today = new Date(); today.setUTCHours(0,0,0,0);
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    vehiclesData.forEach(v => {
        if (v.status === VehicleStatus.Sold || v.status === VehicleStatus.Disposed) return; // Skip sold/disposed

        const crlvExpiryDate = v.crlvAno ? new Date(Date.UTC(v.crlvAno, 11, 31)) : null; 
        if (crlvExpiryDate) {
            const crlvDays = calculateDaysRemaining(crlvExpiryDate.toISOString());
             if (crlvExpiryDate <= sixtyDaysFromNow && crlvDays.days >=0) { 
                 items.push({ id: `crlv-${v.id}`, name: `CRLV ${v.crlvAno}`, type: 'CRLV Veículo', expiryDate: crlvExpiryDate.toISOString(), daysLeft: crlvDays.days, vehiclePlate: v.plate, path: `/vehicles?openDetails=${v.id}` });
            }
        }
        const checkAndPush = (idPrefix: string, name: string, type: string, expiryDateStr?: string, pathIdSuffix?: string) => {
            if(expiryDateStr) {
                const days = calculateDaysRemaining(expiryDateStr);
                const expiryD = new Date(expiryDateStr); 
                if (expiryD <= sixtyDaysFromNow && days.days >= 0) items.push({ id: `${idPrefix}-${v.id}${pathIdSuffix||''}`, name, type, expiryDate: expiryDateStr, daysLeft: days.days, vehiclePlate: v.plate, path: `/vehicles?openDetails=${v.id}${pathIdSuffix||''}` });
            }
        };
        checkAndPush('seg', `Seguro (${v.seguroFornecedor || 'N/D'})`, 'Seguro Veículo', v.seguroExpiracao);
        checkAndPush('sv', 'Selo Verde', 'Lic. Ambiental', v.seloVerdeExpiracao);
        checkAndPush('ls', 'Lic. Sanitária', 'Lic. Sanitária', v.licenciamentoSanitarioExpiracao);
        checkAndPush('tac', 'Aferição Tacógrafo', 'Tacógrafo', v.tacografoAfericaoExpiracao);
        checkAndPush('proxrevdata', 'Próxima Revisão (Data)', 'Revisão Veículo', v.proximaRevisaoData);
        if(v.garantiaExpiracaoData) { 
             const days = calculateDaysRemaining(v.garantiaExpiracaoData);
             const expiryD = new Date(v.garantiaExpiracaoData);
             if (expiryD <= sixtyDaysFromNow && days.days >=0) {
                items.push({ id: `gar-${v.id}`, name: `Garantia (${v.garantiaDescricao || 'N/D'})`, type: 'Garantia Veículo', expiryDate: v.garantiaExpiracaoData, daysLeft: days.days, vehiclePlate: v.plate, path: `/vehicles?openDetails=${v.id}` });
            }
        }
    });
    documentsData.forEach(d => {
        const vehicle = vehiclesData.find(v => v.id === d.vehicleId);
        if (vehicle && (vehicle.status === VehicleStatus.Sold || vehicle.status === VehicleStatus.Disposed)) return; // Skip docs of sold/disposed vehicles

        const days = calculateDaysRemaining(d.expiryDate);
        const expiryD = new Date(d.expiryDate);
        if (expiryD <= sixtyDaysFromNow && days.days >=0) {
             items.push({ id: `doc-${d.id}`, name: d.documentType, type: 'Documento Geral', expiryDate: d.expiryDate, daysLeft: days.days, vehiclePlate: vehicle?.plate, path: `/documents?openDetails=${d.id}` });
        }
    });
    maintenancesData.forEach(m => {
        const vehicle = vehiclesData.find(v => v.id === m.vehicleId);
         if (vehicle && (vehicle.status === VehicleStatus.Sold || vehicle.status === VehicleStatus.Disposed)) return;
        if (m.status === MaintenanceStatus.Scheduled && m.dataAgendamento) {
            const days = calculateDaysRemaining(m.dataAgendamento);
            const scheduleD = new Date(m.dataAgendamento as string);
            if (scheduleD <= sixtyDaysFromNow && days.days >=0) {
                 items.push({id: `maint-${m.id}`, name: `Manut. Agendada: ${m.description.substring(0,20)}...`, type:'Manutenção Agendada', expiryDate: m.dataAgendamento, daysLeft: days.days, vehiclePlate: vehicle?.plate, path: `/maintenance?openDetails=${m.id}`})
            }
        }
    });
    return items.sort((a,b) => a.daysLeft - b.daysLeft);
  }, [vehiclesData, documentsData, maintenancesData]);


  const QuickActionCard: React.FC<{title: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, onClick: () => void, color?: string}> = ({ title, icon: Icon, onClick, color = 'primary' }) => (
    <Card 
        onClick={onClick}
        className={`text-center !p-4 group bg-light_surface dark:bg-dark_surface hover:!bg-primary/10 dark:hover:!bg-primary/20 border-transparent hover:border-primary dark:hover:border-primary border-2`}
        hoverEffect
    >
        <Icon className={`w-8 h-8 mx-auto mb-2 text-primary dark:text-primary-light group-hover:text-primary-dark dark:group-hover:text-primary transition-colors`} />
        <h3 className={`text-sm font-semibold text-light_text_primary dark:text-dark_text_primary group-hover:text-primary-dark dark:group-hover:text-primary transition-colors`}>{title}</h3>
    </Card>
  );
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg"/></div>;
  }

  return (
    <div className="space-y-6 animate-gentle-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map(card => (
          <Card key={card.title} className={`!p-5 border-l-4 border-${card.color}-500`} onClick={() => navigate(card.path)} hoverEffect>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold text-${card.color}-600 dark:text-${card.color}-400 uppercase tracking-wider`}>{card.title}</p>
                <p className="text-3xl font-bold text-light_text_primary dark:text-dark_text_primary mt-1">{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 text-${card.color}-500 dark:text-${card.color}-400 opacity-60`} />
            </div>
          </Card>
        ))}
      </div>

      <Card title="Ações Rápidas">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard title="Novo Veículo" icon={PlusIcon} onClick={() => navigate('/vehicles?action=new')} />
          <QuickActionCard title="Nova Manutenção" icon={WrenchIcon} onClick={() => navigate('/maintenance?action=new')} />
          <QuickActionCard title="Novo Documento" icon={DocumentIcon} onClick={() => navigate('/documents?action=new')} />
          <QuickActionCard title="Movimentar Pneu" icon={TireIcon} onClick={() => navigate('/tires?action=move')} />
        </div>
      </Card>

      <Card title="Alertas e Próximos Vencimentos (Próximos 60 dias)">
        <Table 
            columns={expiringItemsColumns} 
            data={expiringItemsData} 
            onRowClick={(item) => navigate(item.path)}
            isLoading={isLoading}
        />
      </Card>
    </div>
  );
};


// Vehicles Page
export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formState, setFormState] = useState<Partial<Vehicle>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<VehicleImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, VEHICLES_COLLECTION), orderBy("plate")); 
      const querySnapshot = await getDocs(q);
      setVehicles(querySnapshot.docs.map(d => mapDocToData<Vehicle>(d)));
    } catch (error) {
      console.error("Error fetching vehicles: ", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);


  const clearUrlParams = useCallback(() => {
    navigate('/vehicles', { replace: true });
  }, [navigate]);

  const handleOpenEditModal = useCallback((vehicle?: Vehicle) => {
    setEditingVehicle(vehicle || null);
    setFormState(vehicle ? { ...vehicle } : { vehicleType: VehicleType.Car, status: VehicleStatus.Active, acquisitionDate: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
    if (isDetailsModalOpen) setIsDetailsModalOpen(false);
  }, [isDetailsModalOpen]);

  const handleOpenDetailsModal = useCallback((vehicle: Vehicle) => {
    setSelectedVehicleForDetails(vehicle);
    setIsDetailsModalOpen(true);
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const openId = params.get('open');
    const openDetailsId = params.get('openDetails');

    if (action === 'new' && vehicles.length > 0) { 
      handleOpenEditModal();
      clearUrlParams();
    } else if (openId && vehicles.length > 0) {
      const vehicleToEdit = vehicles.find(v => v.id === openId);
      if (vehicleToEdit) handleOpenEditModal(vehicleToEdit);
      clearUrlParams();
    } else if (openDetailsId && vehicles.length > 0) {
      const vehicleToView = vehicles.find(v => v.id === openDetailsId);
      if (vehicleToView) handleOpenDetailsModal(vehicleToView);
      clearUrlParams();
    }
     if (action === 'new' && vehicles.length === 0 && !isLoading) { 
        const timeoutId = setTimeout(() => { 
            if (vehicles.length > 0) handleOpenEditModal(); 
            else if(!isLoading) handleOpenEditModal(); 
            clearUrlParams();
        }, 500);
        return () => clearTimeout(timeoutId);
    }

    const urlStatus = params.get('status');
    if (urlStatus && Object.values(VehicleStatus).includes(urlStatus as VehicleStatus)) {
        setFilterStatus(urlStatus);
    }
  }, [location.search, handleOpenEditModal, handleOpenDetailsModal, clearUrlParams, vehicles, isLoading]);


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setFormState({});
  };
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedVehicleForDetails(null);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numberFields = ['anoFabricacao', 'anoModelo', 'acquisitionValue', 'saleValue', 'garantiaExpiracaoKm', 'crlvAno', 'bauAno', 'proximaRevisaoKm'];
    
    if (numberFields.includes(name)) {
      setFormState(prev => ({ ...prev, [name]: value ? (name.includes('Value') ? parseFloat(value) : parseInt(value,10)) : undefined }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.plate || !formState.chassis || !formState.renavam) {
        alert("Placa, Chassi e Renavam são obrigatórios.");
        return;
    }
    setIsLoading(true);
    const dataToSave = prepareDataForFirestore(formState);

    try {
      if (editingVehicle) {
        await updateDoc(doc(db, VEHICLES_COLLECTION, editingVehicle.id), dataToSave);
      } else {
        await addDoc(collection(db, VEHICLES_COLLECTION), dataToSave);
      }
      fetchVehicles(); 
      handleCloseModal();
    } catch (error) {
      console.error("Error saving vehicle: ", error);
      alert("Erro ao salvar veículo. Verifique o console para detalhes.");
    }
    setIsLoading(false);
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (window.confirm(`Tem certeza que deseja excluir o veículo ${vehicle.plate}? Esta ação NÃO PODE ser desfeita e removerá dados associados (documentos, manutenções, histórico de pneus).`)) {
      setIsLoading(true);
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, VEHICLES_COLLECTION, vehicle.id));

        const docsQuery = query(collection(db, DOCUMENTS_COLLECTION), where("vehicleId", "==", vehicle.id));
        const docsSnap = await getDocs(docsQuery);
        docsSnap.forEach(d => batch.delete(d.ref));

        const maintsQuery = query(collection(db, MAINTENANCES_COLLECTION), where("vehicleId", "==", vehicle.id));
        const maintsSnap = await getDocs(maintsQuery);
        maintsSnap.forEach(m => batch.delete(m.ref));
        
        const tiresQuery = query(collection(db, TIRES_COLLECTION), where("currentVehicleId", "==", vehicle.id));
        const tiresSnap = await getDocs(tiresQuery);
        tiresSnap.forEach(tireDoc => {
            const tireData = tireDoc.data() as Tire; 
            batch.update(tireDoc.ref, {
                currentVehicleId: null,
                currentPositionKey: null,
                status: TireStatus.InStock, 
                lastOdometerReading: tireData.lastOdometerReading 
            });
            const dismountMovementData = {
                tireId: tireDoc.id,
                movementType: TireMovementType.Dismount,
                date: new Date().toISOString(), 
                fromPositionKey: tireData.currentPositionKey,
                fromCondition: tireData.condition, 
                toCondition: tireData.condition, 
                notes: `Veículo ${vehicle.plate} excluído. Pneu retornado ao estoque.`,
                vehicleId: vehicle.id, 
                odometerReading: tireData.lastOdometerReading 
            };
            const newMovementRef = doc(collection(db, TIRE_MOVEMENTS_COLLECTION));
            batch.set(newMovementRef, prepareDataForFirestore(dismountMovementData));
        });

        await batch.commit();
        fetchVehicles(); 
        if (isDetailsModalOpen && selectedVehicleForDetails?.id === vehicle.id) {
            handleCloseDetailsModal();
        }
      } catch (error) {
        console.error("Error deleting vehicle and associated data: ", error);
        alert("Erro ao excluir veículo. Verifique o console para detalhes.");
      }
      setIsLoading(false);
    }
  };
  
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        vehicle.plate.toLowerCase().includes(searchLower) ||
        (vehicle.numeroFrota && vehicle.numeroFrota.toLowerCase().includes(searchLower)) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.brand.toLowerCase().includes(searchLower) ||
        vehicle.renavam.toLowerCase().includes(searchLower) ||
        vehicle.chassis.toLowerCase().includes(searchLower)
      );
      const matchesStatus = filterStatus ? vehicle.status === filterStatus : true;
      return matchesSearch && matchesStatus;
    }).sort((a,b) => (a.numeroFrota || a.plate).localeCompare(b.numeroFrota || b.plate));
  }, [vehicles, searchTerm, filterStatus]);

  const columns: TableColumn<Vehicle>[] = [
    { header: 'Nº Frota', accessor: 'numeroFrota', cellClassName: 'font-medium' },
    { header: 'Placa', accessor: 'plate', render: item => <span className="font-bold text-primary dark:text-primary-light">{item.plate}</span> },
    { header: 'Marca/Modelo', accessor: item => `${item.brand} ${item.model}` },
    { header: 'Tipo', accessor: 'vehicleType' },
    { header: 'Status', accessor: 'status', render: item => <StatusBadge text={item.status} colorClass={getStatusColor(item.status)} size="xs"/> },
    { header: 'Departamento', accessor: 'department'},
    { header: 'CRLV', accessor: 'crlvAno', render: item => {
        const expiryDate = item.crlvAno ? new Date(Date.UTC(item.crlvAno, 11, 31)).toISOString() : undefined;
        const {label, colorClass} = calculateDaysRemaining(expiryDate);
        return <StatusBadge text={item.crlvAno ? `${item.crlvAno} (${label})` : 'N/A'} colorClass={colorClass} dot size="xs"/>
    }},
    { header: 'Próx. Seguro', accessor: 'seguroExpiracao', render: item => {
        if (!item.seguroExpiracao) return <span className="italic text-slate-500">N/A</span>;
        const {label, colorClass} = calculateDaysRemaining(item.seguroExpiracao);
        return <StatusBadge text={`${formatDate(item.seguroExpiracao)} (${label})`} colorClass={colorClass} dot size="xs"/>
    }},
  ];

  const vehicleDetailsConfig: DetailItem<Vehicle>[] = [
    { key: 'numeroFrota', label: 'Nº Frota' }, { key: 'plate', label: 'Placa' },
    { key: 'brand', label: 'Marca' }, { key: 'model', label: 'Modelo' },
    { key: 'anoFabricacao', label: 'Ano Fabricação' }, { key: 'anoModelo', label: 'Ano Modelo' },
    { key: 'renavam', label: 'Renavam' }, { key: 'chassis', label: 'Chassis' },
    { key: 'color', label: 'Cor' },
    { key: 'vehicleType', label: 'Tipo Veículo', render: (v) => v ? VehicleType[v as keyof typeof VehicleType] : 'N/A' },
    { key: 'category', label: 'Categoria' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge text={v as VehicleStatus} colorClass={getStatusColor(v as VehicleStatus)} size="sm"/> },
    { key: 'department', label: 'Departamento' },
    { key: 'axleConfiguration', label: 'Config. Eixos', render: v => AXLE_CONFIGURATION_OPTIONS.find(opt => opt.value === v)?.label || v },
    { key: 'crlvAno', label: 'CRLV (Ano)' },
    { key: 'acquisitionDate', label: 'Data Aquisição', render: v => formatDate(v) },
    { key: 'acquisitionValue', label: 'Valor Aquisição', render: v => formatCurrency(v) },
    { key: 'supplier', label: 'Fornecedor (Aquisição)' },
    { key: 'dataUltimaRevisao', label: 'Data Última Revisão', render: v => formatDate(v) },
    { key: 'proximaRevisaoKm', label: 'Próxima Revisão (KM)', render: v => formatNumber(v) },
    { key: 'proximaRevisaoData', label: 'Próxima Revisão (Data)', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    { key: 'observacoesGerais', label: 'Observações Gerais', isFullWidth: true },
    { key: 'bauTipo', label: 'Tipo Baú', render: v => BAU_TYPE_OPTIONS.find(opt => opt.value === v)?.label || v },
    { key: 'bauAno', label: 'Ano Baú' },
    { key: 'bauAparelhoMarcaModelo', label: 'Aparelho Refrigeração' },
    { key: 'trackerId', label: 'ID Rastreador' }, { key: 'trackerType', label: 'Tipo Rastreador', render: v => TRACKER_TYPE_OPTIONS.find(o => o.value === v)?.label || v },
    { key: 'trackerSupplier', label: 'Fornecedor Rastreador' }, { key: 'trackerInstallDate', label: 'Data Inst. Rastreador', render: v => formatDate(v) },
    { key: 'rastreadorDetalhes', label: 'Detalhes Rastreador', isFullWidth: true },
    { key: 'tagPedagioNumero', label: 'Número Tag Pedágio' }, { key: 'tagPedagioFornecedor', label: 'Fornecedor Tag Pedágio' },
    { key: 'seguroFornecedor', label: 'Fornecedor Seguro' }, { key: 'seguroApolice', label: 'Apólice Seguro' },
    { key: 'seguroExpiracao', label: 'Expiração Seguro', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    { key: 'garantiaDescricao', label: 'Tipo Garantia', render: v => GARANTIA_TYPE_OPTIONS.find(o => o.value ===v)?.label || v },
    { key: 'garantiaExpiracaoData', label: 'Expiração Garantia (Data)', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    { key: 'garantiaExpiracaoKm', label: 'Expiração Garantia (KM)', render: v => formatNumber(v) },
    { key: 'seloVerdeNumero', label: 'Número Selo Verde' }, { key: 'seloVerdeExpiracao', label: 'Expiração Selo Verde', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    { key: 'licenciamentoSanitarioNumero', label: 'Número Lic. Sanitária' }, { key: 'licenciamentoSanitarioExpiracao', label: 'Expiração Lic. Sanitária', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    { key: 'tacografoNumeroCertificado', label: 'Nº Cert. Tacógrafo' }, { key: 'tacografoAfericaoExpiracao', label: 'Expiração Aferição Tacógrafo', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    ...((selectedVehicleForDetails?.status === VehicleStatus.Sold || selectedVehicleForDetails?.status === VehicleStatus.Disposed) ? [
        { key: 'saleDate', label: 'Data Venda/Baixa', render: (v:string | typeof Timestamp) => formatDate(v) },
        { key: 'saleValue', label: 'Valor Venda', render: (v:number) => formatCurrency(v) },
        { key: 'buyer', label: 'Comprador/Destino' },
        { key: 'disposalReason', label: 'Motivo Baixa', render: (v:string) => DISPOSAL_REASON_OPTIONS.find(o => o.value === v)?.label || v },
        { key: 'disposalNotes', label: 'Observações Venda/Baixa', isFullWidth: true },
    ] : []),
  ];
  
  const handleExcelImport = async () => {
    if (!importFile) {
      alert("Por favor, selecione um arquivo Excel.");
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    
    const reader = new FileReader();

    reader.onload = async (e) => {
      let jsonData: any[] = []; 
      let successCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      try {
        const dataBuffer = e.target?.result;
        if (!dataBuffer) {
          throw new Error("Falha ao ler o arquivo.");
        }
        const workbook = XLSX.read(dataBuffer, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error("Nenhuma planilha encontrada no arquivo Excel.");
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
           throw new Error(`Planilha "${sheetName}" não encontrada ou está vazia.`);
        }
        jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        const batch = writeBatch(db);

        const columnMapping: { [key: string]: keyof Vehicle } = {
          'Nº FROTA': 'numeroFrota',
          'PLACA': 'plate',
          'CHASSI': 'chassis',
          'RENAVAM': 'renavam',
          'MARCA': 'brand',
          'MODELO': 'model',
          'ANO FABRICAÇÃO': 'anoFabricacao',
          'ANO MODELO': 'anoModelo',
          'COR': 'color',
          'TIPO VEÍCULO': 'vehicleType', 
          'CATEGORIA': 'category',
          'STATUS': 'status', 
          'DEPARTAMENTO': 'department',
          'CONFIG EIXOS': 'axleConfiguration',
          'DATA AQUISIÇÃO': 'acquisitionDate',
          'VALOR AQUISIÇÃO': 'acquisitionValue',
        };
        
        const existingVehiclesSnap = await getDocs(collection(db, VEHICLES_COLLECTION));
        const existingFleetNumbers = new Set(existingVehiclesSnap.docs.map(d => d.data().numeroFrota).filter(Boolean));
        const existingChassis = new Set(existingVehiclesSnap.docs.map(d => d.data().chassis).filter(Boolean));

        for (const [index, row] of jsonData.entries()) {
          const vehicleData: Partial<Vehicle> = {};
          for (const excelHeader in columnMapping) {
            const vehicleFieldKey = columnMapping[excelHeader];
            if (row[excelHeader] !== undefined) {
              let value: any = row[excelHeader];

              if (vehicleFieldKey === 'acquisitionDate') {
                if (value instanceof Date) {
                    const year = value.getUTCFullYear();
                    const month = ('0' + (value.getUTCMonth() + 1)).slice(-2);
                    const day = ('0' + value.getUTCDate()).slice(-2);
                    vehicleData.acquisitionDate = `${year}-${month}-${day}`;
                } else if (typeof value === 'number') { // Excel date serial
                    const dateObj = XLSX.SSF.parse_date_code(value);
                    if (dateObj) {
                        const year = dateObj.y;
                        const month = ('0' + dateObj.m).slice(-2);
                        const day = ('0' + dateObj.d).slice(-2);
                        vehicleData.acquisitionDate = `${year}-${month}-${day}`;
                    } else {
                        errors.push(`Linha ${index + 2}: Data de aquisição numérica inválida "${value}".`);
                        vehicleData.acquisitionDate = undefined;
                    }
                } else if (typeof value === 'string') {
                    const dateObj = new Date(value); // Try to parse common string formats
                    if (!isNaN(dateObj.getTime())) {
                         const year = dateObj.getUTCFullYear();
                         const month = ('0' + (dateObj.getUTCMonth() + 1)).slice(-2);
                         const day = ('0' + dateObj.getUTCDate()).slice(-2);
                         vehicleData.acquisitionDate = `${year}-${month}-${day}`;
                    } else {
                        errors.push(`Linha ${index + 2}: Formato de data de aquisição inválido "${value}". Use YYYY-MM-DD.`);
                        vehicleData.acquisitionDate = undefined;
                    }
                } else {
                     errors.push(`Linha ${index + 2}: Tipo de data de aquisição inesperado para "${value}".`);
                     vehicleData.acquisitionDate = undefined;
                }
              } else if (vehicleFieldKey === 'vehicleType' && typeof value === 'string' && !Object.values(VehicleType).includes(value as VehicleType)) {
                  errors.push(`Linha ${index + 2}: Tipo de Veículo inválido "${value}". Usando "Outro".`);
                  vehicleData.vehicleType = VehicleType.Other;
              } else if (vehicleFieldKey === 'status' && typeof value === 'string' && !Object.values(VehicleStatus).includes(value as VehicleStatus)) {
                  errors.push(`Linha ${index + 2}: Status inválido "${value}". Usando "Ativo".`);
                  vehicleData.status = VehicleStatus.Active;
              } else if ((vehicleFieldKey === 'anoFabricacao' || vehicleFieldKey === 'anoModelo' || vehicleFieldKey === 'acquisitionValue') && (typeof value === 'string' || typeof value === 'number')) {
                  const numValue = parseFloat(String(value));
                  vehicleData[vehicleFieldKey] = isNaN(numValue) ? undefined : numValue;
              } else {
                vehicleData[vehicleFieldKey] = value;
              }
            }
          }
          
          if (!vehicleData.plate || !vehicleData.chassis || !vehicleData.renavam) {
            errors.push(`Linha ${index + 2}: Placa, Chassi e Renavam são obrigatórios. Linha ignorada.`);
            errorCount++;
            continue;
          }
          if (vehicleData.acquisitionDate === undefined && row['DATA AQUISIÇÃO'] !== undefined) { // If parsing failed but was present
            errors.push(`Linha ${index + 2}: Data de aquisição para "${vehicleData.plate}" não pôde ser processada. Linha ignorada.`);
            errorCount++;
            continue;
          }

          if ((vehicleData.numeroFrota && existingFleetNumbers.has(vehicleData.numeroFrota)) || (vehicleData.chassis && existingChassis.has(vehicleData.chassis))) {
            skippedCount++;
            continue;
          }
          
          const newVehicleRef = doc(collection(db, VEHICLES_COLLECTION));
          batch.set(newVehicleRef, prepareDataForFirestore(vehicleData));
          successCount++;
          if (vehicleData.numeroFrota) existingFleetNumbers.add(vehicleData.numeroFrota);
          if (vehicleData.chassis) existingChassis.add(vehicleData.chassis);
        }

        await batch.commit();
        setImportResult({ successCount, skippedCount, errorCount, errors });
        if(successCount > 0) fetchVehicles(); 
      } catch (err) {
        console.error("Error processing imported vehicles:", err);
        errorCount = Array.isArray(jsonData) ? jsonData.length - successCount - skippedCount : 0;
        errors.push(`Erro geral ao processar arquivo: ${(err as Error).message}`);
        setImportResult({ successCount, skippedCount, errorCount, errors });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = (errorEvent) => {
        console.error("Error reading file:", errorEvent);
        setImportResult({ successCount: 0, skippedCount: 0, errorCount: 0, errors: ["Erro ao ler o arquivo selecionado."] });
        setIsImporting(false);
    };
    reader.readAsArrayBuffer(importFile);
  };

  const handleExportVehicles = (active: boolean) => {
    const dataToExport = vehicles
        .filter(v => active ? (v.status !== VehicleStatus.Sold && v.status !== VehicleStatus.Disposed) : (v.status === VehicleStatus.Sold || v.status === VehicleStatus.Disposed))
        .map(v => ({ 
            "Nº Frota": v.numeroFrota,
            "Placa": v.plate,
            "Marca": v.brand,
            "Modelo": v.model,
            "Ano Fab.": v.anoFabricacao,
            "Ano Mod.": v.anoModelo,
            "Renavam": v.renavam,
            "Chassi": v.chassis,
            "Cor": v.color,
            "Tipo": v.vehicleType,
            "Categoria": v.category,
            "Status": v.status,
            "Departamento": v.department,
            "Config. Eixos": v.axleConfiguration,
            "Data Aquisição": v.acquisitionDate ? formatDate(v.acquisitionDate) : '',
            "Valor Aquisição": v.acquisitionValue,
            "Fornecedor Aquisição": v.supplier,
            "Data Últ. Revisão": v.dataUltimaRevisao ? formatDate(v.dataUltimaRevisao) : '',
            "Próx. Revisão KM": v.proximaRevisaoKm,
            "Próx. Revisão Data": v.proximaRevisaoData ? formatDate(v.proximaRevisaoData) : '',
            "Obs. Gerais": v.observacoesGerais,
            "Data Venda/Baixa": v.saleDate ? formatDate(v.saleDate) : '',
            "Valor Venda": v.saleValue,
            "Comprador/Destino": v.buyer,
            "Motivo Baixa": v.disposalReason,
        }));
    exportToExcel(dataToExport, active ? "Veiculos_Ativos" : "Veiculos_Vendidos_Baixados");
  };


  return (
    <div className="space-y-6 animate-gentle-slide-up">
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <Input 
                placeholder="Buscar por Placa, Frota, Modelo, Renavam, Chassi..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:flex-grow"
                wrapperClassName="flex-grow w-full md:w-auto mb-0"
            />
            <Select
                options={[{value: '', label: 'Todos os Status'}, ...VEHICLE_STATUS_OPTIONS]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-auto md:min-w-[200px]"
                wrapperClassName="w-full md:w-auto mb-0"
            />
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button onClick={() => handleOpenEditModal()} leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto whitespace-nowrap">
                    Novo Veículo
                </Button>
                <Button onClick={() => setIsImportModalOpen(true)} leftIcon={<UploadIcon className="w-5 h-5"/>} variant="secondary" className="w-full sm:w-auto whitespace-nowrap">
                    Importar
                </Button>
            </div>
        </div>
        <div className="flex gap-2 mb-4">
            <Button onClick={() => handleExportVehicles(true)} leftIcon={<DownloadIcon className="w-4 h-4"/>} size="sm" variant="ghost">Exportar Ativos</Button>
            <Button onClick={() => handleExportVehicles(false)} leftIcon={<DownloadIcon className="w-4 h-4"/>} size="sm" variant="ghost">Exportar Vendidos/Baixados</Button>
        </div>
        <Table 
            columns={columns} 
            data={filteredVehicles} 
            onEdit={handleOpenEditModal} 
            onDelete={handleDelete}
            onRowClick={handleOpenDetailsModal} 
            isLoading={isLoading}
        />
      </Card>

      <DetailsViewModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Detalhes do Veículo: ${selectedVehicleForDetails?.plate || ''}`}
        itemData={selectedVehicleForDetails}
        displayConfig={vehicleDetailsConfig}
        onEdit={() => selectedVehicleForDetails && handleOpenEditModal(selectedVehicleForDetails)}
        size="5xl"
      />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingVehicle ? `Editar Veículo: ${editingVehicle.plate}` : 'Adicionar Novo Veículo'} size="7xl" contentClassName="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3"> {/* Form itself does not need max-h or overflow */}
          {/* Column 1 - Core Info */}
          <div className="flex flex-col">
            <FormSectionTitle title="Informações Principais" className="md:col-span-1 lg:col-span-1 !mt-0" />
            <Input label="Nº Frota" name="numeroFrota" value={formState.numeroFrota || ''} onChange={handleChange} />
            <Input label="Placa *" name="plate" value={formState.plate || ''} onChange={handleChange} required />
            <Input label="Marca" name="brand" value={formState.brand || ''} onChange={handleChange} />
            <Input label="Modelo" name="model" value={formState.model || ''} onChange={handleChange} />
            <Input label="Ano Fabricação" name="anoFabricacao" type="number" value={formState.anoFabricacao || ''} onChange={handleChange} />
            <Input label="Ano Modelo" name="anoModelo" type="number" value={formState.anoModelo || ''} onChange={handleChange} />
            <Input label="Renavam *" name="renavam" value={formState.renavam || ''} onChange={handleChange} required/>
            <Input label="Chassis *" name="chassis" value={formState.chassis || ''} onChange={handleChange} required/>
          </div>
          {/* Column 2 - Classification & Status */}
          <div className="flex flex-col">
            <FormSectionTitle title="Classificação e Status" className="md:col-span-1 lg:col-span-1 !mt-0" />
            <Input label="Cor" name="color" value={formState.color || ''} onChange={handleChange} />
            <Select label="Tipo de Veículo" name="vehicleType" options={VEHICLE_TYPES_OPTIONS} value={formState.vehicleType || ''} onChange={handleChange} />
            <Input label="Categoria (Ex: Próprio)" name="category" value={formState.category || ''} onChange={handleChange} />
            <Select label="Status" name="status" options={VEHICLE_STATUS_OPTIONS} value={formState.status || ''} onChange={handleChange} />
            <Input label="Departamento" name="department" value={formState.department || ''} onChange={handleChange} />
            <Select label="Config. Eixos" name="axleConfiguration" options={AXLE_CONFIGURATION_OPTIONS} value={formState.axleConfiguration || ''} onChange={handleChange} />
            <Input label="CRLV (Ano)" name="crlvAno" type="number" value={formState.crlvAno || ''} onChange={handleChange} />
            <Textarea label="Observações Gerais" name="observacoesGerais" value={formState.observacoesGerais || ''} onChange={handleChange} rows={2}/>
          </div>
          {/* Column 3 - Acquisition & Revision & Baú */}
          <div className="flex flex-col">
             <FormSectionTitle title="Aquisição e Revisão" className="md:col-span-1 lg:col-span-1 !mt-0" />
            <Input label="Data Aquisição" name="acquisitionDate" type="date" value={formState.acquisitionDate || ''} onChange={handleChange} />
            <Input label="Valor Aquisição" name="acquisitionValue" type="number" step="0.01" value={formState.acquisitionValue || ''} onChange={handleChange} />
            <Input label="Fornecedor (Aquisição)" name="supplier" value={formState.supplier || ''} onChange={handleChange} />
            <Input label="Data Última Revisão" name="dataUltimaRevisao" type="date" value={formState.dataUltimaRevisao || ''} onChange={handleChange} />
            <Input label="Próxima Revisão (KM)" name="proximaRevisaoKm" type="number" value={formState.proximaRevisaoKm || ''} onChange={handleChange} />
            <Input label="Próxima Revisão (Data)" name="proximaRevisaoData" type="date" value={formState.proximaRevisaoData || ''} onChange={handleChange} />
           
            <FormSectionTitle title="Informações do Baú" className="!mt-4" />
            <Select label="Tipo Baú" name="bauTipo" options={BAU_TYPE_OPTIONS} value={formState.bauTipo || ''} onChange={handleChange} wrapperClassName="mb-2"/>
            <Input label="Ano Baú" name="bauAno" type="number" value={formState.bauAno || ''} onChange={handleChange} wrapperClassName="mb-2"/>
            <Input label="Aparelho Refrig." name="bauAparelhoMarcaModelo" value={formState.bauAparelhoMarcaModelo || ''} onChange={handleChange} wrapperClassName="mb-2"/>
          </div>

          <FormDivider />
          <FormSectionTitle title="Detalhes Adicionais (Rastreador, Tag, Seguro)" />
          
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <div className="flex flex-col">
                <h5 className="text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Rastreador</h5>
                <Input label="ID Rastreador" name="trackerId" value={formState.trackerId || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                <Select label="Tipo Rastreador" name="trackerType" options={TRACKER_TYPE_OPTIONS} value={formState.trackerType || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                <Input label="Fornecedor Rastreador" name="trackerSupplier" value={formState.trackerSupplier || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                <Input label="Data Inst. Rastreador" name="trackerInstallDate" type="date" value={formState.trackerInstallDate || ''} onChange={handleChange} wrapperClassName="mb-2"/>
            </div>
            <div className="flex flex-col">
                <h5 className="text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Tag Pedágio</h5>
                <Input label="Número Tag" name="tagPedagioNumero" value={formState.tagPedagioNumero || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                <Input label="Fornecedor Tag" name="tagPedagioFornecedor" value={formState.tagPedagioFornecedor || ''} onChange={handleChange} wrapperClassName="mb-2"/>
            </div>
            <div className="flex flex-col">
                <h5 className="text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Seguro</h5>
                <Input label="Fornecedor Seguro" name="seguroFornecedor" value={formState.seguroFornecedor || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                <Input label="Apólice Seguro" name="seguroApolice" value={formState.seguroApolice || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                <Input label="Expiração Seguro" name="seguroExpiracao" type="date" value={formState.seguroExpiracao || ''} onChange={handleChange} wrapperClassName="mb-2"/>
            </div>
            <Textarea label="Detalhes Adicionais Rastreador" name="rastreadorDetalhes" value={formState.rastreadorDetalhes || ''} onChange={handleChange} rows={2} className="md:col-span-full lg:col-span-3" wrapperClassName="mb-2"/>
          </div>
          
          <FormDivider />
          <FormSectionTitle title="Garantia, Licenças e Certificados" />
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                <div className="flex flex-col">
                    <h5 className="text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Garantia</h5>
                    <Select label="Tipo Garantia" name="garantiaDescricao" options={GARANTIA_TYPE_OPTIONS} value={formState.garantiaDescricao || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Expiração Garantia (Data)" name="garantiaExpiracaoData" type="date" value={formState.garantiaExpiracaoData || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Expiração Garantia (KM)" name="garantiaExpiracaoKm" type="number" value={formState.garantiaExpiracaoKm || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                </div>
                 <div className="flex flex-col">
                    <h5 className="text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Licenças e Certificados</h5>
                    <Input label="Número Selo Verde" name="seloVerdeNumero" value={formState.seloVerdeNumero || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Expiração Selo Verde" name="seloVerdeExpiracao" type="date" value={formState.seloVerdeExpiracao || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Número Lic. Sanitária" name="licenciamentoSanitarioNumero" value={formState.licenciamentoSanitarioNumero || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Expiração Lic. Sanitária" name="licenciamentoSanitarioExpiracao" type="date" value={formState.licenciamentoSanitarioExpiracao || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                </div>
                 <div className="flex flex-col">
                     <h5 className="text-sm font-semibold mb-1 text-slate-600 dark:text-slate-300">Tacógrafo</h5>
                    <Input label="Nº Cert. Tacógrafo" name="tacografoNumeroCertificado" value={formState.tacografoNumeroCertificado || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Expiração Aferição Tacógrafo" name="tacografoAfericaoExpiracao" type="date" value={formState.tacografoAfericaoExpiracao || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                </div>
           </div>

            { (formState.status === VehicleStatus.Sold || formState.status === VehicleStatus.Disposed || formState.status === VehicleStatus.Inactive ) && (
            <>
                <FormDivider />
                <FormSectionTitle title="Informações de Venda/Baixa" />
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                    <Input label="Data Venda/Baixa" name="saleDate" type="date" value={formState.saleDate || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Valor Venda" name="saleValue" type="number" step="0.01" value={formState.saleValue || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Input label="Comprador/Destino" name="buyer" value={formState.buyer || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Select label="Motivo Baixa" name="disposalReason" options={DISPOSAL_REASON_OPTIONS} value={formState.disposalReason || ''} onChange={handleChange} wrapperClassName="mb-2"/>
                    <Textarea label="Observações Venda/Baixa" name="disposalNotes" value={formState.disposalNotes || ''} onChange={handleChange} rows={2} className="md:col-span-full lg:col-span-3" wrapperClassName="mb-2"/>
                </div>
            </>
            )}

          <div className="col-span-full flex justify-end space-x-3 mt-4"> 
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isLoading || isImporting}>{isLoading || isImporting ? <Spinner size="sm" /> : (editingVehicle ? 'Salvar Alterações' : 'Adicionar Veículo')}</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => {setIsImportModalOpen(false); setImportFile(null); setImportResult(null);}} 
        title="Importar Veículos de Excel (.xls, .xlsx)" 
        contentClassName="p-6"
        footer={
            <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => {setIsImportModalOpen(false); setImportFile(null); setImportResult(null);}}>Fechar</Button>
                <Button variant="primary" onClick={handleExcelImport} disabled={!importFile || isImporting}>
                    {isImporting ? <Spinner size="sm" className="mr-2"/> : null}
                    Importar Arquivo
                </Button>
            </div>
        }
      >
        <div className="space-y-4">
            <p className="text-sm text-light_text_secondary dark:text-dark_text_secondary">
                Selecione um arquivo Excel. As colunas esperadas são: Nº FROTA, PLACA, CHASSI, RENAVAM, MARCA, MODELO, ANO FABRICAÇÃO, ANO MODELO, COR, TIPO VEÍCULO, CATEGORIA, STATUS, DEPARTAMENTO, CONFIG EIXOS, DATA AQUISIÇÃO, VALOR AQUISIÇÃO.
            </p>
            <Input 
                type="file" 
                accept=".xls,.xlsx" 
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                wrapperClassName="mb-0"
            />
            {isImporting && <div className="flex items-center space-x-2"><Spinner size="sm" /><p>Importando, por favor aguarde...</p></div>}
            {importResult && (
                <Card className="!p-3 !shadow-sm bg-slate-50 dark:bg-slate-800">
                    <p className="font-semibold text-sm mb-1">Resultado da Importação:</p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                        <li className="text-green-700 dark:text-green-400">Veículos importados com sucesso: {importResult.successCount}</li>
                        <li className="text-yellow-700 dark:text-yellow-400">Veículos ignorados (duplicados): {importResult.skippedCount}</li>
                        <li className="text-red-700 dark:text-red-400">Linhas com erros / não importadas: {importResult.errorCount}</li>
                    </ul>
                    {importResult.errors.length > 0 && (
                        <div className="mt-2">
                            <p className="font-semibold text-xs">Detalhes dos Erros/Alertas:</p>
                            <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto scrollbar-thin pr-2">
                                {importResult.errors.map((err, i) => <li key={i} className="text-slate-600 dark:text-slate-300">{err}</li>)}
                            </ul>
                        </div>
                    )}
                </Card>
            )}
        </div>
      </Modal>
    </div>
  );
};


// Vehicle Lifecycle Page
export interface LifecycleEvent {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  type: 'Aquisição' | 'Venda' | 'Baixa';
  date: string | typeof Timestamp; 
  details: string;
  value?: number;
  partner?: string; 
  notes?: string;
}
export const VehicleLifecyclePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<LifecycleEvent | null>(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      setIsLoading(true);
      try {
        const vehiclesSnap = await getDocs(collection(db, VEHICLES_COLLECTION));
        const fetchedVehicles = vehiclesSnap.docs.map(d => mapDocToData<Vehicle>(d));
        setVehicles(fetchedVehicles);

        const events: LifecycleEvent[] = [];
        fetchedVehicles.forEach(v => {
          if (v.acquisitionDate) { 
            events.push({ 
              id: `acq-${v.id}`, 
              vehicleId: v.id, 
              vehiclePlate: v.plate, 
              type: 'Aquisição', 
              date: v.acquisitionDate, 
              details: `Veículo ${v.brand} ${v.model} adquirido.`,
              value: v.acquisitionValue,
              partner: v.supplier,
              notes: `Categoria: ${v.category}`
            });
          }
          if (v.saleDate && (v.status === VehicleStatus.Sold || v.status === VehicleStatus.Disposed)) { 
            events.push({ 
              id: `sale-${v.id}`, 
              vehicleId: v.id, 
              vehiclePlate: v.plate, 
              type: v.status === VehicleStatus.Sold ? 'Venda' : 'Baixa', 
              date: v.saleDate, 
              details: `Veículo ${v.brand} ${v.model} ${v.status === VehicleStatus.Sold ? 'vendido' : 'baixado'}.`,
              value: v.saleValue,
              partner: v.buyer,
              notes: `Motivo: ${v.disposalReason || 'N/A'}. ${v.disposalNotes || ''}`.trim()
            });
          }
        });
        setLifecycleEvents(events.sort((a,b) => {
            const dateAValue = a.date instanceof Timestamp ? a.date.toMillis() : new Date(a.date as string).getTime();
            const dateBValue = b.date instanceof Timestamp ? b.date.toMillis() : new Date(b.date as string).getTime();
            return dateBValue - dateAValue;
        }));
      } catch (error) {
        console.error("Error fetching lifecycle data:", error);
      }
      setIsLoading(false);
    };
    fetchVehicleData();
  }, []);

  const handleOpenDetailsModal = (event: LifecycleEvent) => {
    setSelectedEventForDetails(event);
    setIsDetailsModalOpen(true);
  };
  const handleCloseDetailsModal = () => {
    setSelectedEventForDetails(null);
    setIsDetailsModalOpen(false);
  };

  const lifecycleColumns: TableColumn<LifecycleEvent>[] = [
    { header: 'Data', accessor: 'date', render: item => formatDate(item.date), cellClassName:'w-32' },
    { header: 'Veículo (Placa)', accessor: 'vehiclePlate', render: item => <span className="font-semibold text-primary dark:text-primary-light">{item.vehiclePlate}</span>, cellClassName:'w-40' },
    { header: 'Tipo de Evento', accessor: 'type', render: item => <StatusBadge text={item.type} colorClass={item.type === 'Aquisição' ? getStatusColor(VehicleStatus.Active) : getStatusColor(VehicleStatus.Sold)} size="xs"/>, cellClassName:'w-40'},
    { header: 'Detalhes Principais', accessor: 'details', className: 'text-sm', cellClassName: 'whitespace-normal break-words max-w-md' },
  ];

  const lifecycleDetailsConfig: DetailItem<LifecycleEvent>[] = [
    { key: 'date', label: 'Data do Evento', render: v => formatDate(v) },
    { key: 'vehiclePlate', label: 'Veículo (Placa)' },
    { key: 'type', label: 'Tipo de Evento', render: v => <StatusBadge text={v as 'Aquisição' | 'Venda' | 'Baixa'} colorClass={v === 'Aquisição' ? getStatusColor(VehicleStatus.Active) : getStatusColor(VehicleStatus.Sold)} size="sm"/> },
    { key: 'details', label: 'Descrição Curta', isFullWidth: true },
    { key: 'value', label: 'Valor Associado', render: v => formatCurrency(v) },
    { key: 'partner', label: 'Fornecedor/Comprador' },
    { key: 'notes', label: 'Observações Adicionais', isFullWidth: true },
  ];

  return (
    <div className="space-y-6 animate-gentle-slide-up">
      <Card title="Histórico de Entradas e Saídas de Veículos">
        <Table columns={lifecycleColumns} data={lifecycleEvents} onRowClick={handleOpenDetailsModal} isLoading={isLoading}/>
      </Card>
      <DetailsViewModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Detalhes do Evento: ${selectedEventForDetails?.type || ''} - ${selectedEventForDetails?.vehiclePlate || ''}`}
        itemData={selectedEventForDetails}
        displayConfig={lifecycleDetailsConfig}
        size="2xl"
      />
      <Card title="Visualização Gráfica">
        <DevelopmentPlaceholder title="Gráfico de Linha do Tempo da Frota"/>
      </Card>
    </div>
  );
};


// Documents Page
export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formState, setFormState] = useState<Partial<Document>>({});
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDocType, setFilterDocType] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDocumentForDetails, setSelectedDocumentForDetails] = useState<Document | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docsSnap, vehiclesSnap] = await Promise.all([
        getDocs(query(collection(db, DOCUMENTS_COLLECTION), orderBy("expiryDate"))),
        getDocs(query(collection(db, VEHICLES_COLLECTION), orderBy("plate")))
      ]);
      setDocuments(docsSnap.docs.map(d => mapDocToData<Document>(d)));
      setVehicles(vehiclesSnap.docs.map(d => mapDocToData<Vehicle>(d)));
    } catch (error) {
      console.error("Error fetching documents page data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const clearUrlParams = useCallback(() => {
    navigate('/documents', { replace: true });
  }, [navigate]);

  const handleOpenEditModal = useCallback((doc?: Document) => {
    setEditingDocument(doc || null);
    setFormState(doc ? { ...doc } : { documentType: DocumentType.Other, emissionDate: new Date().toISOString().split('T')[0]});
    setIsModalOpen(true);
    if(isDetailsModalOpen) setIsDetailsModalOpen(false);
  }, [isDetailsModalOpen]);
  
  const handleOpenDetailsModal = useCallback((doc: Document) => {
    setSelectedDocumentForDetails(doc);
    setIsDetailsModalOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const openId = params.get('open');
    const openDetailsId = params.get('openDetails');

    const checkDataAndOpen = () => {
        if (action === 'new') {
            handleOpenEditModal();
            clearUrlParams();
        } else if (openId) {
            const docToEdit = documents.find(d => d.id === openId);
            if (docToEdit) handleOpenEditModal(docToEdit);
            clearUrlParams();
        } else if (openDetailsId) {
            const docToView = documents.find(d => d.id === openDetailsId);
            if (docToView) handleOpenDetailsModal(docToView);
            clearUrlParams();
        }
    };
    
    if (!isLoading && (vehicles.length > 0 || action === 'new')) { 
        checkDataAndOpen();
    } else if (action || openId || openDetailsId) { 
        const timeoutId = setTimeout(() => {
             if(!isLoading && (vehicles.length > 0 || action === 'new')) checkDataAndOpen();
        }, 500);
        return () => clearTimeout(timeoutId);
    }

  }, [location.search, handleOpenEditModal, handleOpenDetailsModal, clearUrlParams, documents, vehicles, isLoading]);


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDocument(null);
    setFormState({});
  };
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedDocumentForDetails(null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1) { 
        alert("O arquivo é muito grande. O limite é 1MB para anexo direto. Considere usar um link externo.");
        e.target.value = ''; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({
          ...prev,
          fileName: file.name,
          fileType: file.type,
          fileContent: (reader.result as string).split(',')[1] 
        }));
      };
      reader.readAsDataURL(file);
    } else {
       setFormState(prev => ({ ...prev, fileName: undefined, fileType: undefined, fileContent: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!formState.vehicleId || !formState.documentType || !formState.number || !formState.emissionDate || !formState.expiryDate) {
        alert("Veículo, Tipo, Número, Data de Emissão e Data de Vencimento são obrigatórios.");
        return;
    }
    setIsLoading(true);
    const dataToSave = prepareDataForFirestore(formState);
    try {
      if (editingDocument) {
        await updateDoc(doc(db, DOCUMENTS_COLLECTION, editingDocument.id), dataToSave);
      } else {
        await addDoc(collection(db, DOCUMENTS_COLLECTION), dataToSave);
      }
      fetchPageData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Erro ao salvar documento.");
    }
    setIsLoading(false);
  };

  const handleDelete = async (docToDelete: Document) => {
    if (window.confirm(`Tem certeza que deseja excluir o documento ${docToDelete.number} (${docToDelete.documentType})?`)) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, DOCUMENTS_COLLECTION, docToDelete.id));
        fetchPageData();
        if (isDetailsModalOpen && selectedDocumentForDetails?.id === docToDelete.id) {
          handleCloseDetailsModal();
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Erro ao excluir documento.");
      }
      setIsLoading(false);
    }
  };
  
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesVehicle = filterVehicleId ? doc.vehicleId === filterVehicleId : true;
      const matchesDocType = filterDocType ? doc.documentType === filterDocType : true;
      return matchesVehicle && matchesDocType;
    }).sort((a,b) => {
        const daysA = calculateDaysRemaining(a.expiryDate).days;
        const daysB = calculateDaysRemaining(b.expiryDate).days;
        return daysA - daysB;
    });
  }, [documents, filterVehicleId, filterDocType]);

  const vehicleOptions = useMemo(() => 
    [{ value: '', label: 'Todos os Veículos' }, ...vehicles.map(v => ({ value: v.id, label: `${v.plate} (${v.numeroFrota || v.model})` }))]
  , [vehicles]);
  
  const docTypeOptions = useMemo(() => 
    [{ value: '', label: 'Todos os Tipos' }, ...DOCUMENT_TYPE_OPTIONS]
  , []);


  const columns: TableColumn<Document>[] = [
    { header: 'Veículo', accessor: 'vehicleId', render: item => vehicles.find(v => v.id === item.vehicleId)?.plate || 'N/A', cellClassName:"font-medium" },
    { header: 'Tipo Documento', accessor: 'documentType' },
    { header: 'Número', accessor: 'number', cellClassName:"font-semibold" },
    { header: 'Emissão', accessor: 'emissionDate', render: item => formatDate(item.emissionDate) },
    { header: 'Vencimento', accessor: 'expiryDate', render: item => {
        const {label, colorClass} = calculateDaysRemaining(item.expiryDate);
        return <StatusBadge text={`${formatDate(item.expiryDate)} (${label})`} colorClass={colorClass} dot size="xs"/>
    }},
    { header: 'Arquivo', accessor: 'fileName', render: item => item.fileName ? 
        <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); viewFile(item.fileContent, item.fileType, item.fileName)}} leftIcon={<EyeIcon className="w-3.5 h-3.5"/>}>
            {item.fileName.substring(0,15)}{item.fileName.length > 15 ? '...' : ''}
        </Button> 
        : <span className="italic text-slate-500">Nenhum</span> },
  ];

  const documentDetailsConfig: DetailItem<Document>[] = [
    { key: 'vehicleId', label: 'Veículo', render: (vId) => vehicles.find(v => v.id === vId)?.plate || 'N/A' },
    { key: 'documentType', label: 'Tipo de Documento' },
    { key: 'number', label: 'Número do Documento' },
    { key: 'emissionDate', label: 'Data de Emissão', render: v => formatDate(v) },
    { key: 'expiryDate', label: 'Data de Vencimento', render: (v) => { const {label, colorClass} = calculateDaysRemaining(v); return <StatusBadge text={`${formatDate(v)} (${label})`} colorClass={colorClass} size="sm"/> } },
    { key: 'observations', label: 'Observações', isFullWidth: true },
    { key: 'fileName', label: 'Arquivo Anexado', render: (v, item) => item.fileName ? 
        <Button variant="ghost" size="sm" onClick={() => viewFile(item.fileContent, item.fileType, item.fileName)} leftIcon={<EyeIcon className="w-4 h-4"/>}>
            {item.fileName}
        </Button> 
        : <span className="italic text-slate-500">Nenhum arquivo</span>
    },
  ];

  return (
    <div className="space-y-6 animate-gentle-slide-up">
      <Card>
         <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <Select 
                options={vehicleOptions}
                value={filterVehicleId}
                onChange={(e) => setFilterVehicleId(e.target.value)}
                label="Filtrar por Veículo"
                className="w-full md:w-auto md:min-w-[200px]"
                wrapperClassName="w-full md:w-auto mb-0 md:mb-1"
            />
            <Select
                options={docTypeOptions}
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                label="Filtrar por Tipo"
                className="w-full md:w-auto md:min-w-[200px]"
                wrapperClassName="w-full md:w-auto mb-0 md:mb-1"
            />
             <Button onClick={() => handleOpenEditModal()} leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full md:w-auto self-end md:mt-0 whitespace-nowrap">
                Novo Documento
             </Button>
        </div>
        <Table 
            columns={columns} 
            data={filteredDocuments} 
            onEdit={handleOpenEditModal} 
            onDelete={handleDelete}
            onRowClick={handleOpenDetailsModal} 
            isLoading={isLoading}
        />
      </Card>

      <DetailsViewModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Detalhes do Documento: ${selectedDocumentForDetails?.number || ''}`}
        itemData={selectedDocumentForDetails}
        displayConfig={documentDetailsConfig}
        onEdit={() => selectedDocumentForDetails && handleOpenEditModal(selectedDocumentForDetails)}
        size="2xl"
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingDocument ? `Editar Documento: ${editingDocument.number}` : 'Adicionar Novo Documento'} 
        size="2xl" 
        contentClassName="p-6"
        footer={
            <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={isLoading}
                    onClick={(e) => {
                        const form = (e.target as HTMLElement).closest('div.fixed')?.querySelector('form');
                        if(form) form.requestSubmit();
                    }}
                >
                    {isLoading ? <Spinner size="sm"/> : (editingDocument ? 'Salvar Alterações' : 'Adicionar Documento')}
                </Button>
            </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select 
            label="Veículo *" 
            name="vehicleId" 
            options={vehicles.map(v => ({ value: v.id, label: `${v.plate} (${v.model})`}))}
            value={formState.vehicleId || ''} 
            onChange={handleChange} 
            required 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <Select 
                label="Tipo de Documento *" 
                name="documentType" 
                options={DOCUMENT_TYPE_OPTIONS} 
                value={formState.documentType || ''} 
                onChange={handleChange} 
                required 
            />
            <Input label="Número do Documento *" name="number" value={formState.number || ''} onChange={handleChange} required />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <Input label="Data de Emissão *" name="emissionDate" type="date" value={formState.emissionDate || ''} onChange={handleChange} required />
            <Input label="Data de Vencimento *" name="expiryDate" type="date" value={formState.expiryDate || ''} onChange={handleChange} required />
          </div>
          <Textarea label="Observações" name="observations" value={formState.observations || ''} onChange={handleChange} rows={3}/>
          <div>
            <label className="block text-sm font-medium text-light_text_secondary dark:text-dark_text_secondary mb-1">Anexar Arquivo (PDF, Imagem - max 1MB)</label>
            <input 
              type="file" 
              accept="application/pdf,image/*" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-slate-500 dark:text-slate-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary/10 file:text-primary dark:file:bg-primary/70 dark:file:text-white
                         hover:file:bg-primary/20 dark:hover:file:bg-primary transition-colors"
            />
            {formState.fileName && <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">Selecionado: {formState.fileName}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Maintenance Page
export const MaintenancePage: React.FC = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [formState, setFormState] = useState<Partial<Maintenance>>({});

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMaintenanceForDetails, setSelectedMaintenanceForDetails] = useState<Maintenance | null>(null);

  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [maintsSnap, vehiclesSnap] = await Promise.all([
            getDocs(query(collection(db, MAINTENANCES_COLLECTION), orderBy("openDate", "desc"))),
            getDocs(query(collection(db, VEHICLES_COLLECTION), orderBy("plate")))
        ]);
        setMaintenances(maintsSnap.docs.map(d => mapDocToData<Maintenance>(d)));
        setVehicles(vehiclesSnap.docs.map(d => mapDocToData<Vehicle>(d)));
    } catch (error) {
        console.error("Error fetching maintenance page data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const clearUrlParams = useCallback(() => {
    navigate('/maintenance', { replace: true });
  }, [navigate]);

  const handleOpenEditModal = useCallback((maint?: Maintenance) => {
    setEditingMaintenance(maint || null);
    setFormState(maint ? { ...maint } : { maintenanceType: MaintenanceType.Preventive, status: MaintenanceStatus.Open, openDate: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
    if (isDetailsModalOpen) setIsDetailsModalOpen(false);
  }, [isDetailsModalOpen]);

  const handleOpenDetailsModal = useCallback((maint: Maintenance) => {
    setSelectedMaintenanceForDetails(maint);
    setIsDetailsModalOpen(true);
  }, []);

 useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const openId = params.get('open');
    const openDetailsId = params.get('openDetails');
    
    const checkDataAndOpen = () => {
        if (action === 'new') {
            handleOpenEditModal();
            clearUrlParams();
        } else if (openId) {
            const maintToEdit = maintenances.find(m => m.id === openId);
            if (maintToEdit) handleOpenEditModal(maintToEdit);
            clearUrlParams();
        } else if (openDetailsId) {
            const maintToView = maintenances.find(m => m.id === openDetailsId);
            if (maintToView) handleOpenDetailsModal(maintToView);
            clearUrlParams();
        }
    };

    if (!isLoading && (vehicles.length > 0 || action === 'new')) {
        checkDataAndOpen();
    } else if (action || openId || openDetailsId) {
        const timeoutId = setTimeout(() => {
            if(!isLoading && (vehicles.length > 0 || action === 'new')) checkDataAndOpen();
        }, 500);
        return () => clearTimeout(timeoutId);
    }
    
    const urlStatus = params.get('status');
    if (urlStatus && Object.values(MaintenanceStatus).includes(urlStatus as MaintenanceStatus)) {
        setFilterStatus(urlStatus);
    }
  }, [location.search, handleOpenEditModal, handleOpenDetailsModal, clearUrlParams, maintenances, vehicles, isLoading]);


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMaintenance(null);
    setFormState({});
  };
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMaintenanceForDetails(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numberFields = ["cost", "odometerAtMaintenance"];
     if (numberFields.includes(name)) {
      setFormState(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       if (file.size > 1024 * 1024 * 1) { 
        alert("O arquivo é muito grande. O limite é 1MB.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({
          ...prev,
          pdfFileName: file.name,
          pdfFileType: file.type,
          pdfFileContent: (reader.result as string).split(',')[1] 
        }));
      };
      reader.readAsDataURL(file);
    } else {
       setFormState(prev => ({ ...prev, pdfFileName: undefined, pdfFileType: undefined, pdfFileContent: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.vehicleId || !formState.description || !formState.openDate || !formState.maintenanceType || !formState.status || !formState.invoiceNumber) {
        alert("Veículo, Nº Fatura/OS, Descrição, Data de Abertura, Tipo e Status são obrigatórios.");
        return;
    }
    setIsLoading(true);
    const dataToSave = prepareDataForFirestore(formState);
    try {
      if (editingMaintenance) {
        await updateDoc(doc(db, MAINTENANCES_COLLECTION, editingMaintenance.id), dataToSave);
      } else {
        await addDoc(collection(db, MAINTENANCES_COLLECTION), dataToSave);
      }
      fetchPageData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving maintenance:", error);
      alert("Erro ao salvar manutenção.");
    }
    setIsLoading(false);
  };

  const handleDelete = async (maint: Maintenance) => {
    if (window.confirm(`Tem certeza que deseja excluir a manutenção ${maint.invoiceNumber} para o veículo ${vehicles.find(v=>v.id === maint.vehicleId)?.plate || 'N/A'}?`)) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, MAINTENANCES_COLLECTION, maint.id));
        fetchPageData();
        if (isDetailsModalOpen && selectedMaintenanceForDetails?.id === maint.id) {
            handleCloseDetailsModal();
        }
      } catch (error) {
        console.error("Error deleting maintenance:", error);
        alert("Erro ao excluir manutenção.");
      }
      setIsLoading(false);
    }
  };

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter(maint => {
      const matchesVehicle = filterVehicleId ? maint.vehicleId === filterVehicleId : true;
      const matchesStatus = filterStatus ? maint.status === filterStatus : true;
      return matchesVehicle && matchesStatus;
    }).sort((a,b) => {
        const dateA = new Date(a.openDate as string).getTime();
        const dateB = new Date(b.openDate as string).getTime();
        return dateB - dateA;
    });
  }, [maintenances, filterVehicleId, filterStatus]);

  const vehicleOptions = useMemo(() => 
    [{ value: '', label: 'Todos os Veículos' }, ...vehicles.map(v => ({ value: v.id, label: `${v.plate} (${v.numeroFrota || v.model})` }))]
  , [vehicles]);
  
  const statusOptions = useMemo(() => 
    [{ value: '', label: 'Todos os Status' }, ...MAINTENANCE_STATUS_OPTIONS]
  , []);

  const columns: TableColumn<Maintenance>[] = [
    { header: 'Veículo', accessor: 'vehicleId', render: item => vehicles.find(v => v.id === item.vehicleId)?.plate || 'N/A', cellClassName:"font-medium" },
    { header: 'Nº Fatura/OS', accessor: 'invoiceNumber', cellClassName:"font-semibold"},
    { header: 'Tipo', accessor: 'maintenanceType' },
    { header: 'Data Abertura/Agend.', accessor: item => item.status === MaintenanceStatus.Scheduled ? formatDate(item.dataAgendamento) : formatDate(item.openDate) },
    { header: 'Data Fech.', accessor: 'closeDate', render: item => item.closeDate ? formatDate(item.closeDate) : (item.status !== MaintenanceStatus.Scheduled ? <span className="italic text-slate-500">Em Aberto</span> : 'N/A') },
    { header: 'Descrição', accessor: 'description', cellClassName: 'whitespace-normal break-words max-w-xs text-sm' },
    { header: 'Custo', accessor: 'cost', render: item => item.cost ? formatCurrency(item.cost) : 'N/A' },
    { header: 'Status', accessor: 'status', render: item => <StatusBadge text={item.status} colorClass={getStatusColor(item.status)} size="xs"/>},
    { header: 'Anexo NF', accessor: 'pdfFileName', render: item => item.pdfFileName ? 
        <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); viewFile(item.pdfFileContent, item.pdfFileType, item.pdfFileName)}} leftIcon={<EyeIcon className="w-3.5 h-3.5"/>}>
            {item.pdfFileName.substring(0,15)}{item.pdfFileName.length > 15 ? '...' : ''}
        </Button> 
        : <span className="italic text-slate-500">Nenhum</span> },
  ];

  const maintenanceDetailsConfig: DetailItem<Maintenance>[] = [
    { key: 'vehicleId', label: 'Veículo', render: (vId) => vehicles.find(v => v.id === vId)?.plate || 'N/A' },
    { key: 'invoiceNumber', label: 'Nº Fatura/OS' },
    { key: 'maintenanceType', label: 'Tipo de Manutenção' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge text={v as MaintenanceStatus} colorClass={getStatusColor(v as MaintenanceStatus)} size="sm"/> },
    { key: 'openDate', label: 'Data de Abertura', render: v => formatDate(v) },
    { key: 'dataAgendamento', label: 'Data Agendamento', render: v => formatDate(v) },
    { key: 'closeDate', label: 'Data de Fechamento', render: v => v ? formatDate(v) : 'Em Aberto' },
    { key: 'cost', label: 'Custo', render: v => formatCurrency(v) },
    { key: 'odometerAtMaintenance', label: 'Hodômetro na Manutenção', render: v => formatNumber(v)},
    { key: 'mechanicResponsible', label: 'Mecânico Responsável' },
    { key: 'description', label: 'Descrição dos Serviços', isFullWidth: true },
    { key: 'pecasUtilizadas', label: 'Peças Utilizadas', isFullWidth: true },
    { key: 'notes', label: 'Observações Adicionais', isFullWidth: true },
    { key: 'pdfFileName', label: 'Nota Fiscal Anexada', render: (v, item) => item.pdfFileName ? 
        <Button variant="ghost" size="sm" onClick={() => viewFile(item.pdfFileContent, item.pdfFileType, item.pdfFileName)} leftIcon={<EyeIcon className="w-4 h-4"/>}>
            {item.pdfFileName}
        </Button> 
        : <span className="italic text-slate-500">Nenhum arquivo</span>
    },
  ];
  
  const handleExportMaintenances = () => {
    const dataToExport = filteredMaintenances.map(m => ({
        "Veículo (Placa)": vehicles.find(v => v.id === m.vehicleId)?.plate || 'N/A',
        "Nº Fatura/OS": m.invoiceNumber,
        "Tipo": m.maintenanceType,
        "Status": m.status,
        "Data Abertura": m.openDate ? formatDate(m.openDate) : '',
        "Data Agendamento": m.dataAgendamento ? formatDate(m.dataAgendamento) : '',
        "Data Fechamento": m.closeDate ? formatDate(m.closeDate) : '',
        "Custo (R$)": m.cost,
        "Hodômetro": m.odometerAtMaintenance,
        "Mecânico": m.mechanicResponsible,
        "Descrição": m.description,
        "Peças": m.pecasUtilizadas,
        "Obs": m.notes,
    }));
    exportToExcel(dataToExport, "Manutencoes");
  };

  return (
    <div className="space-y-6 animate-gentle-slide-up">
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <Select 
                options={vehicleOptions}
                value={filterVehicleId}
                onChange={(e) => setFilterVehicleId(e.target.value)}
                label="Filtrar por Veículo"
                className="w-full md:w-auto md:min-w-[200px]"
                wrapperClassName="w-full md:w-auto mb-0 md:mb-1"
            />
            <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filtrar por Status"
                className="w-full md:w-auto md:min-w-[200px]"
                wrapperClassName="w-full md:w-auto mb-0 md:mb-1"
            />
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button onClick={() => handleOpenEditModal()} leftIcon={<PlusIcon className="w-5 h-5"/>} className="w-full sm:w-auto whitespace-nowrap">
                    Nova Manutenção
                </Button>
                 <Button onClick={handleExportMaintenances} leftIcon={<DownloadIcon className="w-4 h-4"/>} variant="secondary" className="w-full sm:w-auto whitespace-nowrap">
                    Exportar
                </Button>
            </div>
        </div>
        <Table 
            columns={columns} 
            data={filteredMaintenances} 
            onEdit={handleOpenEditModal} 
            onDelete={handleDelete}
            onRowClick={handleOpenDetailsModal}
            isLoading={isLoading}
        />
      </Card>

      <DetailsViewModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Detalhes da Manutenção: ${selectedMaintenanceForDetails?.invoiceNumber || ''}`}
        itemData={selectedMaintenanceForDetails}
        displayConfig={maintenanceDetailsConfig}
        onEdit={() => selectedMaintenanceForDetails && handleOpenEditModal(selectedMaintenanceForDetails)}
        size="3xl"
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingMaintenance ? `Editar Manutenção: ${editingMaintenance.invoiceNumber}` : 'Adicionar Nova Manutenção'} 
        size="3xl" 
        contentClassName="p-6"
        footer={
            <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                 <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={isLoading}
                    onClick={(e) => {
                        const form = (e.target as HTMLElement).closest('div.fixed')?.querySelector('form');
                        if(form) form.requestSubmit();
                    }}
                >
                    {isLoading ? <Spinner size="sm"/> : (editingMaintenance ? 'Salvar Alterações' : 'Adicionar Manutenção')}
                </Button>
            </div>
        }
        >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <Select label="Veículo *" name="vehicleId" options={vehicles.map(v => ({ value: v.id, label: `${v.plate} (${v.model})`}))} value={formState.vehicleId || ''} onChange={handleChange} required wrapperClassName="md:col-span-2"/>
          
          <FormSectionTitle title="Informações Principais" className="md:col-span-2 !mt-0"/>
          <Input label="Nº Fatura/OS *" name="invoiceNumber" value={formState.invoiceNumber || ''} onChange={handleChange} required />
          <Select label="Tipo de Manutenção *" name="maintenanceType" options={MAINTENANCE_TYPE_OPTIONS} value={formState.maintenanceType || ''} onChange={handleChange} required />
          
          <Select label="Status *" name="status" options={MAINTENANCE_STATUS_OPTIONS} value={formState.status || ''} onChange={handleChange} required />
          {formState.status === MaintenanceStatus.Scheduled ? (
            <Input label="Data Agendamento *" name="dataAgendamento" type="date" value={formState.dataAgendamento || ''} onChange={handleChange} required />
          ) : (
            <Input label="Data de Abertura *" name="openDate" type="date" value={formState.openDate || ''} onChange={handleChange} required />
          )}
          
          {formState.status !== MaintenanceStatus.Scheduled && (
            <Input label="Data de Fechamento" name="closeDate" type="date" value={formState.closeDate || ''} onChange={handleChange} />
          )}
          <Textarea label="Descrição dos Serviços *" name="description" value={formState.description || ''} onChange={handleChange} rows={3} required className="md:col-span-2"/>

          <FormDivider className="md:col-span-2"/>
          <FormSectionTitle title="Custos e Detalhes" className="md:col-span-2"/>
          <Input label="Custo (R$)" name="cost" type="number" step="0.01" value={formState.cost || ''} onChange={handleChange} />
          <Input label="Hodômetro na Manutenção" name="odometerAtMaintenance" type="number" value={formState.odometerAtMaintenance || ''} onChange={handleChange} />
          <Input label="Mecânico Responsável" name="mechanicResponsible" value={formState.mechanicResponsible || ''} onChange={handleChange} className="md:col-span-2"/>
          <Textarea label="Peças Utilizadas" name="pecasUtilizadas" value={formState.pecasUtilizadas || ''} onChange={handleChange} rows={2} className="md:col-span-2"/>
          <Textarea label="Observações Adicionais" name="notes" value={formState.notes || ''} onChange={handleChange} rows={2} className="md:col-span-2"/>
           <div className="md:col-span-2">
            <label className="block text-sm font-medium text-light_text_secondary dark:text-dark_text_secondary mb-1">Anexar NF (PDF, max 1MB)</label>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange} 
              className="block w-full text-sm text-slate-500 dark:text-slate-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary/10 file:text-primary dark:file:bg-primary/70 dark:file:text-white
                         hover:file:bg-primary/20 dark:hover:file:bg-primary transition-colors"
            />
            {formState.pdfFileName && <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">Selecionado: {formState.pdfFileName}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
};


// Settings Page
export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const authHook = useAuth(); 
  const [userEmail, setUserEmail] = useState(authHook.userEmailForHelp || "Não disponível"); 

  useEffect(() => {
    const authUser = fbAuth.currentUser; 
    if (authUser && authUser.email) {
      setUserEmail(authUser.email);
    } else if (!authHook.isAuthenticated && authHook.userEmailForHelp) { 
        setUserEmail(authHook.userEmailForHelp);
    }
  }, [fbAuth.currentUser, authHook.isAuthenticated, authHook.userEmailForHelp]);


  return (
    <div className="space-y-6 animate-gentle-slide-up max-w-3xl mx-auto">
      <Card title="Preferências de Tema" hoverEffect>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {theme === 'dark' ? <MoonIcon className="w-6 h-6 mr-2 text-primary-light"/> : <SunIcon className="w-6 h-6 mr-2 text-primary"/>}
            <p>Tema Atual: <span className="font-semibold">{theme === 'dark' ? 'Escuro' : 'Claro'}</span></p>
          </div>
          <Button onClick={toggleTheme} variant="secondary" size="sm" leftIcon={theme === 'dark' ? <SunIcon className="w-4 h-4"/> : <MoonIcon className="w-4 h-4"/>}>
            Mudar para Tema {theme === 'dark' ? 'Claro' : 'Escuro'}
          </Button>
        </div>
      </Card>
      <Card title="Informações da Conta" hoverEffect>
        <p>Você está logado como: <span className="font-semibold">{userEmail}</span></p>
        {authHook.isAuthenticated && (
            <Button onClick={authHook.logout} variant="danger" className="mt-4" size="sm" leftIcon={<LogoutIcon className="w-4 h-4"/>}>
            Sair da Conta
            </Button>
        )}
      </Card>
       <Card title="Sobre o Sistema" hoverEffect>
        <p className="text-light_text_secondary dark:text-dark_text_secondary">
          Gestão de Frota - Versão 1.2.0 (Excel Features)
        </p>
        <p className="mt-2 text-sm text-light_text_secondary dark:text-dark_text_secondary">
          Este sistema de gerenciamento de frotas utiliza Firebase Firestore para persistência de dados.
        </p>
      </Card>
       <Card title="Relatório de Problemas" hoverEffect>
        <p className="text-light_text_secondary dark:text-dark_text_secondary">
            Encontrou algum problema ou tem alguma sugestão? Contate o administrador em:
            <a href={`mailto:${authHook.userEmailForHelp}`} className="text-primary hover:underline ml-1">{authHook.userEmailForHelp}</a>.
        </p>
      </Card>
    </div>
  );
};

// Tires Main Page (Gestão de Pneus)
export const TiresPage: React.FC = () => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isTireModalOpen, setIsTireModalOpen] = useState(false); 
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingTire, setEditingTire] = useState<Tire | null>(null);
  const [tireFormState, setTireFormState] = useState<Partial<Tire>>({});
  const [movementFormState, setMovementFormState] = useState<Partial<TireMovement>>({});
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTireForDetails, setSelectedTireForDetails] = useState<Tire | null>(null);
  
  const [selectedVehicleForLayout, setSelectedVehicleForLayout] = useState<Vehicle | null>(null);
  const [draggedTire, setDraggedTire] = useState<Tire | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [tiresSnap, vehiclesSnap] = await Promise.all([
            getDocs(query(collection(db, TIRES_COLLECTION), orderBy("fireNumber"))),
            getDocs(query(collection(db, VEHICLES_COLLECTION), orderBy("plate")))
        ]);
        setTires(tiresSnap.docs.map(d => mapDocToData<Tire>(d)));
        const fetchedVehicles = vehiclesSnap.docs.map(d => mapDocToData<Vehicle>(d));
        setVehicles(fetchedVehicles);
        if (fetchedVehicles.length > 0 && !selectedVehicleForLayout) {
            setSelectedVehicleForLayout(fetchedVehicles[0]);
        } else if (fetchedVehicles.length === 0) {
            setSelectedVehicleForLayout(null); 
        }
    } catch (error) {
        console.error("Error fetching tires page data:", error);
    }
    setIsLoading(false);
  }, [selectedVehicleForLayout]); // selectedVehicleForLayout dependency could be removed if not intended to refetch on its change

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);


  const clearUrlParams = useCallback(() => {
    navigate('/tires', { replace: true });
  }, [navigate]);

  const handleOpenTireEditModal = useCallback((tire?: Tire) => {
    setEditingTire(tire || null);
    setTireFormState(tire ? { ...tire } : { status: TireStatus.InStock, condition: TireCondition.Novo, purchaseDate: new Date().toISOString().split('T')[0] });
    setIsTireModalOpen(true);
    if(isDetailsModalOpen) setIsDetailsModalOpen(false);
  },[isDetailsModalOpen]);

  const handleOpenDetailsModal = useCallback((tire: Tire) => {
    setSelectedTireForDetails(tire);
    setIsDetailsModalOpen(true);
  }, []);

  const handleOpenMovementModal = useCallback((tire?: Tire, movementType?: TireMovementType, targetPosition?: TirePositionKeyType, targetVehicleId?: string) => {
    let initialOdometer: number | undefined = tire?.lastOdometerReading;
    
    setMovementFormState({
        tireId: tire?.id || '',
        movementType: movementType || TireMovementType.Mount,
        date: new Date().toISOString().split('T')[0],
        fromCondition: tire?.condition, 
        toCondition: tire?.condition,
        fromPositionKey: tire?.currentPositionKey,
        vehicleId: targetVehicleId || tire?.currentVehicleId || '',
        toPositionKey: targetPosition || undefined,
        odometerReading: initialOdometer,
        sulcoMm: tire?.sulcoMm 
    });
    setIsMovementModalOpen(true);
  }, []); // Removed vehicles dependency as it's fetched and available in the component scope

   useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const openTireId = params.get('open_tire');
    const openDetailsId = params.get('openDetails_tire');

    const checkDataAndOpen = () => {
        if (action === 'new_tire') {
            handleOpenTireEditModal();
            clearUrlParams();
        } else if (action === 'move') {
            handleOpenMovementModal(); 
            clearUrlParams();
        } else if (openTireId) {
            const tireToEdit = tires.find(t => t.id === openTireId);
            if (tireToEdit) handleOpenTireEditModal(tireToEdit);
            clearUrlParams();
        } else if (openDetailsId) {
            const tireToView = tires.find(t => t.id === openDetailsId);
            if (tireToView) handleOpenDetailsModal(tireToView);
            clearUrlParams();
        }
    };
    if(!isLoading && (tires.length > 0 || action)) { 
        checkDataAndOpen();
    } else if (action || openTireId || openDetailsId) {
        const timeoutId = setTimeout(() => {
            if(!isLoading && (tires.length > 0 || action)) checkDataAndOpen();
        }, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [location.search, handleOpenTireEditModal, handleOpenMovementModal, handleOpenDetailsModal, clearUrlParams, tires, isLoading]);


  const handleCloseTireModal = () => {setIsTireModalOpen(false); setEditingTire(null); setTireFormState({});};
  const handleCloseDetailsModal = () => {setIsDetailsModalOpen(false); setSelectedTireForDetails(null);};

  const handleTireChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numberFields = ["cost", "lastOdometerReading", "sulcoMm"];
    if (numberFields.includes(name)) {
      setTireFormState(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    } else {
      setTireFormState(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleTireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tireFormState.fireNumber || !tireFormState.brand || !tireFormState.dimensions) {
      alert("Nº Fogo, Marca e Dimensões são obrigatórios.");
      return;
    }
    setIsLoading(true);
    
    const dataToSaveInternal: Partial<Tire> = {...tireFormState}; 
    if (dataToSaveInternal.status !== TireStatus.Mounted) {
        dataToSaveInternal.currentVehicleId = null;
        dataToSaveInternal.currentPositionKey = null;
    }
    const dataToSave = prepareDataForFirestore(dataToSaveInternal);


    try {
        if (editingTire) {
            await updateDoc(doc(db, TIRES_COLLECTION, editingTire.id), dataToSave);
            if (tireFormState.condition && tireFormState.condition !== editingTire.condition) {
                const conditionChangeMovement = prepareDataForFirestore({
                    tireId: editingTire.id,
                    movementType: TireMovementType.ConditionChange,
                    date: new Date().toISOString(),
                    fromCondition: editingTire.condition,
                    toCondition: tireFormState.condition,
                    notes: `Condição alterada de ${editingTire.condition} para ${tireFormState.condition}.`,
                    vehicleId: editingTire.currentVehicleId, 
                    odometerReading: editingTire.lastOdometerReading
                });
                await addDoc(collection(db, TIRE_MOVEMENTS_COLLECTION), conditionChangeMovement);
            }
        } else {
            const newTireRef = await addDoc(collection(db, TIRES_COLLECTION), dataToSave);
            const stockInMovement = prepareDataForFirestore({
                tireId: newTireRef.id,
                movementType: TireMovementType.StockIn,
                date: tireFormState.purchaseDate || new Date().toISOString(),
                toCondition: tireFormState.condition,
                cost: tireFormState.cost,
                notes: `Registro inicial do pneu ${tireFormState.fireNumber}.`,
                sulcoMm: tireFormState.sulcoMm,
            });
            await addDoc(collection(db, TIRE_MOVEMENTS_COLLECTION), stockInMovement);
        }
        fetchPageData();
        handleCloseTireModal();
    } catch (error) {
        console.error("Error saving tire:", error);
        alert("Erro ao salvar pneu.");
    }
    setIsLoading(false);
  };

  const handleTireDelete = async (tire: Tire) => {
     if (window.confirm(`Tem certeza que deseja excluir o pneu ${tire.fireNumber}? Isso também removerá seu histórico de movimentações.`)) {
        setIsLoading(true);
        try {
            const batchOp = writeBatch(db);
            batchOp.delete(doc(db, TIRES_COLLECTION, tire.id));
            
            const movementsQuery = query(collection(db, TIRE_MOVEMENTS_COLLECTION), where("tireId", "==", tire.id));
            const movementsSnap = await getDocs(movementsQuery);
            movementsSnap.forEach(mDoc => batchOp.delete(mDoc.ref));

            await batchOp.commit();
            fetchPageData();
            if(isDetailsModalOpen && selectedTireForDetails?.id === tire.id) handleCloseDetailsModal();
        } catch (error) {
            console.error("Error deleting tire:", error);
            alert("Erro ao excluir pneu.");
        }
        setIsLoading(false);
     }
  };
  
  const handleCloseMovementModal = () => {setIsMovementModalOpen(false); setMovementFormState({});};

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { tireId, movementType, date, vehicleId, toPositionKey, odometerReading, toCondition, cost, notes, destination, sulcoMm } = movementFormState;

    if (!tireId || !movementType || !date) {
        alert("Pneu, Tipo de Movimentação e Data são obrigatórios.");
        return;
    }
    
    const tireToUpdate = tires.find(t => t.id === tireId);
    if (!tireToUpdate) { alert("Pneu não encontrado!"); setIsLoading(false); return; } 

    setIsLoading(true);
    const tireDocRef = doc(db, TIRES_COLLECTION, tireToUpdate.id);
    
    const updatedTireData: Partial<Tire> = { 
      condition: toCondition || tireToUpdate.condition, 
      lastOdometerReading: odometerReading !== undefined && odometerReading !== null ? odometerReading : tireToUpdate.lastOdometerReading,
      sulcoMm: sulcoMm !== undefined ? sulcoMm : tireToUpdate.sulcoMm,
    };

    const newMovementDataInternal = {
        ...movementFormState,
        fromPositionKey: tireToUpdate.currentPositionKey, 
        fromCondition: tireToUpdate.condition, 
    };
    const newMovementData = prepareDataForFirestore(newMovementDataInternal);


    try {
        const batchOp = writeBatch(db);

        switch (movementType) {
            case TireMovementType.Mount:
                if (!vehicleId || !toPositionKey) { alert("Veículo e Posição de Destino são obrigatórios para montagem."); setIsLoading(false); return; }
                const occupyingTire = tires.find(t => t.currentVehicleId === vehicleId && t.currentPositionKey === toPositionKey && t.id !== tireToUpdate.id);
                if (occupyingTire) {
                    alert(`Posição ${TirePositionKeyMap[toPositionKey as TirePositionKeyType]} no veículo ${vehicles.find(v=>v.id === vehicleId)?.plate} já está ocupada pelo pneu ${occupyingTire.fireNumber}. Desmonte-o primeiro.`);
                    setIsLoading(false); return;
                }
                updatedTireData.status = TireStatus.Mounted;
                updatedTireData.currentVehicleId = vehicleId;
                updatedTireData.currentPositionKey = toPositionKey;
                break;
            case TireMovementType.Dismount:
                updatedTireData.status = TireStatus.InStock; 
                updatedTireData.currentVehicleId = null;
                updatedTireData.currentPositionKey = null;
                break;
            case TireMovementType.ToRepair:
                updatedTireData.status = TireStatus.InRepair;
                updatedTireData.currentVehicleId = null; 
                updatedTireData.currentPositionKey = null;
                break;
            case TireMovementType.FromRepair:
                updatedTireData.status = TireStatus.InStock; 
                break;
            case TireMovementType.Scrap:
                updatedTireData.status = TireStatus.Scrapped;
                updatedTireData.currentVehicleId = null; 
                updatedTireData.currentPositionKey = null;
                break;
            case TireMovementType.StockIn: 
                 updatedTireData.status = TireStatus.InStock;
                 break;
            case TireMovementType.ConditionChange: 
                 break;
            case TireMovementType.TreadMeasurement:
                // Only sulcoMm and lastOdometerReading are updated, status might not change.
                break;
        }
        
        batchOp.update(tireDocRef, prepareDataForFirestore(updatedTireData)); 
        
        const newMovementRef = doc(collection(db, TIRE_MOVEMENTS_COLLECTION)); 
        batchOp.set(newMovementRef, newMovementData);


        await batchOp.commit();
        fetchPageData();
        handleCloseMovementModal();
    } catch (error) {
        console.error("Error saving tire movement:", error);
        alert("Erro ao salvar movimentação do pneu.");
    }
    setIsLoading(false);
  };
  
  const handleTireDragStart = (e: React.DragEvent<HTMLDivElement>, tire: Tire) => {
    if (tire.status !== TireStatus.InStock) { e.preventDefault(); return; }
    setDraggedTire(tire);
    e.dataTransfer.setData('tireId', tire.id);
    e.currentTarget.classList.add('dragging-tire');
  };

  const handleTireDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedTire(null);
    e.currentTarget.classList.remove('dragging-tire');
    document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement | HTMLButtonElement>) => {
    e.preventDefault(); 
    if (draggedTire && draggedTire.status === TireStatus.InStock) {
      e.currentTarget.classList.add('drag-over-active');
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement | HTMLButtonElement>) => {
    e.currentTarget.classList.remove('drag-over-active');
  };

  const handleDropOnPosition = (e: React.DragEvent<HTMLDivElement | HTMLButtonElement>, positionKey: TirePositionKeyType) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over-active');
    const tireId = e.dataTransfer.getData('tireId');
    const tire = tires.find(t => t.id === tireId);

    if (tire && selectedVehicleForLayout && tire.status === TireStatus.InStock) {
        const occupyingTire = tires.find(t => t.currentVehicleId === selectedVehicleForLayout!.id && t.currentPositionKey === positionKey);
        if (occupyingTire) {
            alert(`Posição ${TirePositionKeyMap[positionKey]} já está ocupada pelo pneu ${occupyingTire.fireNumber}. Desmonte-o primeiro.`);
            return;
        }
        handleOpenMovementModal(tire, TireMovementType.Mount, positionKey, selectedVehicleForLayout.id);
    }
    setDraggedTire(null);
  };
  
  const handleDismountTire = (tireOnVehicle: Tire) => {
    if (!tireOnVehicle || tireOnVehicle.status !== TireStatus.Mounted) return;
    handleOpenMovementModal(tireOnVehicle, TireMovementType.Dismount);
  };

  const stockTires = useMemo(() => tires.filter(t => t.status === TireStatus.InStock).sort((a,b) => a.fireNumber.localeCompare(b.fireNumber)), [tires]);
  const mountedTires = useMemo(() => tires.filter(t => t.status === TireStatus.Mounted).sort((a,b) => a.fireNumber.localeCompare(b.fireNumber)), [tires]);
  const otherStatusTires = useMemo(() => tires.filter(t => t.status !== TireStatus.InStock && t.status !== TireStatus.Mounted).sort((a,b) => a.fireNumber.localeCompare(b.fireNumber)), [tires]);

  const tireSummaryStats = useMemo(() => ({
    total: tires.length,
    inStock: stockTires.length,
    mounted: mountedTires.length,
    inRepair: tires.filter(t => t.status === TireStatus.InRepair).length,
    scrapped: tires.filter(t => t.status === TireStatus.Scrapped).length,
  }), [tires, stockTires, mountedTires]);

  const tireTableColumns: TableColumn<Tire>[] = [
    { header: 'Nº Fogo', accessor: 'fireNumber', render: t => <span className="font-bold text-primary dark:text-primary-light">{t.fireNumber}</span> },
    { header: 'Marca/Modelo', accessor: t => `${t.brand} ${t.model}` },
    { header: 'Dimensões', accessor: 'dimensions' },
    { header: 'Condição', accessor: 'condition', render: t => <StatusBadge text={t.condition} colorClass={getTireConditionColor(t.condition)} size="xs"/> },
    { header: 'Status', accessor: 'status', render: t => <StatusBadge text={t.status} colorClass={getStatusColor(t.status)} size="xs"/>},
    { header: 'Veículo (Pos.)', accessor: t => t.currentVehicleId && t.currentPositionKey ? `${vehicles.find(v=>v.id === t.currentVehicleId)?.plate || 'N/A'} (${TirePositionKeyMap[t.currentPositionKey as TirePositionKeyType]})` : <span className="italic text-slate-500">N/A</span> },
    { header: 'Sulco (mm)', accessor: 'sulcoMm', render: t => t.sulcoMm ? `${t.sulcoMm}mm` : 'N/A' },
    { header: 'Hod. Últ. Mov.', accessor: 'lastOdometerReading', render: t => t.lastOdometerReading ? `${formatNumber(t.lastOdometerReading)} km` : 'N/A' }
  ];
  
  const vehicleLayout = useMemo(() => {
    if (!selectedVehicleForLayout) return { positions: [], spares: [], diagramLabel: "Selecione um veículo para ver o layout" };
    return getAxleLayout(selectedVehicleForLayout.axleConfiguration);
  }, [selectedVehicleForLayout]);

  const tireDetailsConfig: DetailItem<Tire>[] = [
    { key: 'fireNumber', label: 'Nº Fogo/Marcação' },
    { key: 'brand', label: 'Marca' }, { key: 'model', label: 'Modelo' },
    { key: 'dimensions', label: 'Dimensões' }, { key: 'dot', label: 'DOT' },
    { key: 'purchaseDate', label: 'Data da Compra', render: v => formatDate(v) },
    { key: 'cost', label: 'Custo de Aquisição', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status Atual', render: (v) => <StatusBadge text={v as TireStatus} colorClass={getStatusColor(v as TireStatus)} size="sm"/> },
    { key: 'condition', label: 'Condição Atual', render: (v) => <StatusBadge text={v as TireCondition} colorClass={getTireConditionColor(v as TireCondition)} size="sm"/> },
    { key: 'sulcoMm', label: 'Sulco Atual (mm)', render: v => v ? `${v} mm` : 'N/A'},
    { key: 'currentVehicleId', label: 'Montado no Veículo', render: (vId) => vId ? vehicles.find(v => v.id === vId)?.plate || 'N/A' : 'N/A'},
    { key: 'currentPositionKey', label: 'Posição no Veículo', render: (v) => v ? TirePositionKeyMap[v as TirePositionKeyType] : 'N/A' },
    { key: 'lastOdometerReading', label: 'Hodômetro Últ. Movimentação', render: v => v ? `${formatNumber(v)} km` : 'N/A' },
    { key: 'notes', label: 'Observações', isFullWidth: true },
  ];
  
  const handleExportTires = () => {
    const dataToExport = tires.map(t => ({
        "Nº Fogo": t.fireNumber,
        "Marca": t.brand,
        "Modelo": t.model,
        "Dimensões": t.dimensions,
        "DOT": t.dot,
        "Data Compra": t.purchaseDate ? formatDate(t.purchaseDate) : '',
        "Custo (R$)": t.cost,
        "Status": t.status,
        "Condição": t.condition,
        "Sulco (mm)": t.sulcoMm,
        "Veículo Atual": t.currentVehicleId ? vehicles.find(v => v.id === t.currentVehicleId)?.plate : '',
        "Posição Atual": t.currentPositionKey ? TirePositionKeyMap[t.currentPositionKey as TirePositionKeyType] : '',
        "Hod. Últ. Mov.": t.lastOdometerReading,
        "Notas": t.notes,
    }));
    exportToExcel(dataToExport, "Lista_Pneus");
  };

  return (
    <div className="space-y-6 animate-gentle-slide-up">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="!p-4 text-center" hoverEffect>
            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Total Pneus</p>
            <p className="text-2xl font-bold text-light_text_primary dark:text-dark_text_primary">{isLoading ? <Spinner size="sm"/> : tireSummaryStats.total}</p>
        </Card>
        <Card className="!p-4 text-center" hoverEffect onClick={() => document.getElementById('stock-tires-section')?.scrollIntoView({behavior:'smooth'})}>
            <p className="text-xs font-semibold uppercase text-blue-500 dark:text-blue-400">Em Estoque</p>
            <p className="text-2xl font-bold text-light_text_primary dark:text-dark_text_primary">{isLoading ? <Spinner size="sm"/> : tireSummaryStats.inStock}</p>
        </Card>
        <Card className="!p-4 text-center" hoverEffect onClick={() => document.getElementById('mounted-tires-section')?.scrollIntoView({behavior:'smooth'})}>
            <p className="text-xs font-semibold uppercase text-green-500 dark:text-green-400">Montados</p>
            <p className="text-2xl font-bold text-light_text_primary dark:text-dark_text_primary">{isLoading ? <Spinner size="sm"/> : tireSummaryStats.mounted}</p>
        </Card>
        <Card className="!p-4 text-center" hoverEffect onClick={() => document.getElementById('other-status-tires-section')?.scrollIntoView({behavior:'smooth'})}>
            <p className="text-xs font-semibold uppercase text-yellow-500 dark:text-yellow-400">Em Reforma</p>
            <p className="text-2xl font-bold text-light_text_primary dark:text-dark_text_primary">{isLoading ? <Spinner size="sm"/> : tireSummaryStats.inRepair}</p>
        </Card>
        <Card className="!p-4 text-center" hoverEffect onClick={() => document.getElementById('other-status-tires-section')?.scrollIntoView({behavior:'smooth'})}>
            <p className="text-xs font-semibold uppercase text-red-500 dark:text-red-400">Sucateados</p>
            <p className="text-2xl font-bold text-light_text_primary dark:text-dark_text_primary">{isLoading ? <Spinner size="sm"/> : tireSummaryStats.scrapped}</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <Button onClick={() => handleOpenTireEditModal()} leftIcon={<PlusIcon className="w-4 h-4"/>} size="md" variant='primary' className="w-full md:w-auto">Novo Pneu</Button>
        <Button onClick={() => handleOpenMovementModal()} leftIcon={<ArrowsRightLeftIcon className="w-4 h-4"/>} size="md" variant='secondary' className="w-full md:w-auto">Registrar Movimentação</Button>
        <Button onClick={handleExportTires} leftIcon={<DownloadIcon className="w-4 h-4"/>} size="md" variant="ghost" className="w-full md:w-auto">Exportar Lista de Pneus</Button>
        <Button onClick={() => navigate("/tire-history")} leftIcon={<TireHistoryIcon className="w-4 h-4"/>} size="md" variant="ghost" className="w-full md:w-auto ml-auto">Histórico Completo</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 space-y-6">
            <Card title="Layout de Pneus do Veículo">
                 <div className="mb-4">
                    <Select
                        label="Selecione um Veículo para Visualizar/Montar Pneus"
                        options={[{value: '', label: 'Selecione...'}, ...vehicles.map(v => ({ value: v.id, label: `${v.plate} - ${v.model} (${v.numeroFrota || ''})`}))]}
                        value={selectedVehicleForLayout?.id || ''}
                        onChange={(e) => setSelectedVehicleForLayout(vehicles.find(v => v.id === e.target.value) || null)}
                        wrapperClassName="mb-0"
                    />
                </div>
                {selectedVehicleForLayout ? (
                    <div className="border dark:border-slate-700 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 min-h-[200px]">
                        <p className="text-center font-semibold mb-4 text-primary dark:text-primary-light">{vehicleLayout.diagramLabel} ({selectedVehicleForLayout.plate})</p>
                        {isLoading && !tires.length ? <div className="flex justify-center"><Spinner/></div> :
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch justify-center">
                            {vehicleLayout.positions.map(posKey => {
                                const tireOnPosition = tires.find(t => t.currentVehicleId === selectedVehicleForLayout!.id && t.currentPositionKey === posKey);
                                return (
                                    <div 
                                        key={posKey}
                                        onDrop={(e) => handleDropOnPosition(e, posKey)}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        className="p-2 border border-dashed dark:border-slate-600 rounded-md min-h-[100px] flex flex-col items-center justify-between text-center transition-all duration-150 bg-light_surface dark:bg-dark_surface hover:shadow-md"
                                        title={TirePositionKeyMap[posKey]}
                                    >
                                        <span className="text-xs font-medium text-light_text_secondary dark:text-dark_text_secondary block mb-1">{TirePositionKeyMap[posKey]}</span>
                                        {tireOnPosition ? (
                                            <div className="mt-1 p-1.5 bg-green-50 dark:bg-green-700/30 rounded text-xs w-full flex flex-col items-center">
                                                <p className="font-bold text-green-700 dark:text-green-300 text-sm cursor-pointer hover:underline" onClick={() => handleOpenDetailsModal(tireOnPosition)}>{tireOnPosition.fireNumber}</p>
                                                <p className="text-slate-600 dark:text-slate-300 text-[0.7rem]">{tireOnPosition.dimensions}</p>
                                                <StatusBadge text={tireOnPosition.condition} colorClass={getTireConditionColor(tireOnPosition.condition)} size="xs" />
                                                <Button variant="danger" size="xs" onClick={(e)=>{e.stopPropagation(); handleDismountTire(tireOnPosition)}} className="mt-1.5 !py-0.5 !px-1.5 h-auto">
                                                    Desmontar
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-500 flex-grow flex items-center justify-center">(Vazio)</span>
                                        )}
                                    </div>
                                );
                            })}
                             {vehicleLayout.spares.map(posKey => { 
                                const tireOnPosition = tires.find(t => t.currentVehicleId === selectedVehicleForLayout!.id && t.currentPositionKey === posKey);
                                return (
                                    <div 
                                        key={posKey}
                                        onDrop={(e) => handleDropOnPosition(e, posKey)}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        className="p-2 border border-dashed border-blue-400 dark:border-blue-600 rounded-md min-h-[100px] flex flex-col items-center justify-between text-center transition-all duration-150 bg-light_surface dark:bg-dark_surface hover:shadow-md md:col-span-2" 
                                        title={TirePositionKeyMap[posKey]}
                                    >
                                        <span className="text-xs font-medium text-light_text_secondary dark:text-dark_text_secondary block mb-1">{TirePositionKeyMap[posKey]}</span>
                                        {tireOnPosition ? (
                                            <div className="mt-1 p-1.5 bg-blue-50 dark:bg-blue-700/30 rounded text-xs w-full flex flex-col items-center">
                                                <p className="font-bold text-blue-700 dark:text-blue-300 text-sm cursor-pointer hover:underline" onClick={() => handleOpenDetailsModal(tireOnPosition)}>{tireOnPosition.fireNumber}</p>
                                                <p className="text-slate-600 dark:text-slate-300 text-[0.7rem]">{tireOnPosition.dimensions}</p>
                                                <StatusBadge text={tireOnPosition.condition} colorClass={getTireConditionColor(tireOnPosition.condition)} size="xs" />
                                                 <Button variant="danger" size="xs" onClick={(e)=>{e.stopPropagation(); handleDismountTire(tireOnPosition)}} className="mt-1.5 !py-0.5 !px-1.5 h-auto">
                                                    Desmontar
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 dark:text-slate-500 flex-grow flex items-center justify-center">(Vazio)</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        }
                    </div>
                ): <p className="text-center py-4 text-light_text_secondary dark:text-dark_text_secondary italic">Selecione um veículo acima.</p>}
            </Card>
        </div>

        <div className="lg:col-span-3 space-y-6" id="stock-tires-section">
          <Card title="Pneus em Estoque">
             <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {isLoading && !stockTires.length ? <div className="flex justify-center"><Spinner/></div> : 
                 stockTires.length > 0 ? stockTires.map(tire => (
                    <div 
                        key={tire.id} 
                        draggable 
                        onClick={() => handleOpenDetailsModal(tire)}
                        onDragStart={(e) => handleTireDragStart(e, tire)}
                        onDragEnd={handleTireDragEnd}
                        className="p-3 border dark:border-slate-700 rounded-lg cursor-grab hover:shadow-lg bg-light_surface dark:bg-dark_surface transition-shadow duration-150 flex justify-between items-center"
                        title="Arraste para uma posição no veículo ou clique para ver detalhes/editar"
                    >
                        <div>
                            <p className="font-bold text-primary dark:text-primary-light">{tire.fireNumber} <StatusBadge text={tire.condition} colorClass={getTireConditionColor(tire.condition)} size="xs" /></p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{tire.brand} {tire.model}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{tire.dimensions} {tire.sulcoMm ? `(${tire.sulcoMm}mm)` : ''}</p>
                        </div>
                        <div className="flex flex-col space-y-1 items-end">
                            <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenTireEditModal(tire)}} title="Editar Pneu"><EditIcon className="w-3.5 h-3.5"/></Button>
                            <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenMovementModal(tire, TireMovementType.Mount)}} title="Montar Pneu"><CarIcon className="w-3.5 h-3.5"/></Button>
                            <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenMovementModal(tire, TireMovementType.ToRepair)}} title="Enviar p/ Reforma" className="text-yellow-600 dark:text-yellow-400"><WrenchIcon className="w-3.5 h-3.5"/></Button>
                            <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenMovementModal(tire, TireMovementType.Scrap)}} className="text-red-500 hover:text-red-700 dark:hover:text-red-400" title="Sucatear Pneu"><TrashIcon className="w-3.5 h-3.5"/></Button>
                        </div>
                    </div>
                )) : <p className="text-sm text-center py-4 text-light_text_secondary dark:text-dark_text_secondary italic">Nenhum pneu em estoque.</p>}
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pneus Montados Atualmente" id="mounted-tires-section">
            <Table 
                columns={tireTableColumns} 
                data={mountedTires} 
                onEdit={(tire) => handleOpenTireEditModal(tire)} 
                onDelete={handleTireDelete} 
                onRowClick={(tire) => handleOpenDetailsModal(tire)}
                isLoading={isLoading && !mountedTires.length}
                customActions={(tire) => (
                    <>
                        <Button variant="warning" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenMovementModal(tire, TireMovementType.Dismount)}} title="Desmontar">DM</Button>
                        <Button variant="ghost" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenMovementModal(tire, TireMovementType.ToRepair)}} title="Enviar p/ Reforma" className="text-yellow-600 dark:text-yellow-400">REF</Button>
                    </>
                )}
            />
        </Card>
        <Card title="Outros Status (Reforma, Sucateado)" id="other-status-tires-section">
            <Table 
                columns={tireTableColumns.filter(col => col.header !== 'Veículo (Pos.)')} 
                data={otherStatusTires} 
                onEdit={(tire) => handleOpenTireEditModal(tire)} 
                onDelete={handleTireDelete}
                onRowClick={(tire) => handleOpenDetailsModal(tire)}
                isLoading={isLoading && !otherStatusTires.length}
                 customActions={(tire) => (
                    <>
                       {tire.status === TireStatus.InRepair && <Button variant="primary" size="xs" onClick={(e) => {e.stopPropagation(); handleOpenMovementModal(tire, TireMovementType.FromRepair)}} title="Retornar da Reforma">RET</Button>}
                    </>
                )}
            />
          </Card>
      </div>

      <DetailsViewModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title={`Detalhes do Pneu: ${selectedTireForDetails?.fireNumber || ''}`}
        itemData={selectedTireForDetails}
        displayConfig={tireDetailsConfig}
        onEdit={() => selectedTireForDetails && handleOpenTireEditModal(selectedTireForDetails)}
        size="3xl"
      />

      <Modal 
        isOpen={isTireModalOpen} 
        onClose={handleCloseTireModal} 
        title={editingTire ? `Editar Pneu: ${editingTire.fireNumber}` : "Registrar Novo Pneu"} 
        size="xl" 
        contentClassName="p-6"
        footer={
             <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={handleCloseTireModal}>Cancelar</Button>
                <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={isLoading}
                     onClick={(e) => {
                        const form = (e.target as HTMLElement).closest('div.fixed')?.querySelector('form');
                        if(form) form.requestSubmit();
                    }}
                >
                    {isLoading ? <Spinner size="sm"/> : (editingTire ? "Salvar Alterações" : "Adicionar Pneu")}
                </Button>
            </div>
        }
        >
        <form onSubmit={handleTireSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <Input label="Nº Fogo/Marcação *" name="fireNumber" value={tireFormState.fireNumber || ''} onChange={handleTireChange} required/>
          <Input label="Marca *" name="brand" value={tireFormState.brand || ''} onChange={handleTireChange} required/>
          <Input label="Modelo" name="model" value={tireFormState.model || ''} onChange={handleTireChange} />
          <Input label="Dimensões (Ex: 295/80R22.5) *" name="dimensions" value={tireFormState.dimensions || ''} onChange={handleTireChange} required/>
          <Input label="DOT" name="dot" value={tireFormState.dot || ''} onChange={handleTireChange} />
          <Input label="Data da Compra" name="purchaseDate" type="date" value={tireFormState.purchaseDate || ''} onChange={handleTireChange} />
          <Input label="Custo (R$)" name="cost" type="number" step="0.01" value={tireFormState.cost || ''} onChange={handleTireChange} />
          <Select 
            label="Status Inicial *" 
            name="status" 
            options={TIRE_STATUS_OPTIONS} 
            value={tireFormState.status || ''} 
            onChange={(e) => setTireFormState(prev => ({...prev, status: e.target.value as TireStatus}))} 
            required 
            disabled={!!editingTire && editingTire.status !== TireStatus.InStock && tireFormState.status !== TireStatus.InStock} 
            title={editingTire ? "Status é alterado por movimentações. Só editável aqui se for 'Em Estoque'." : ""}
          />
          <Select label="Condição Inicial *" name="condition" options={TIRE_CONDITION_OPTIONS} value={tireFormState.condition || ''} onChange={(e) => setTireFormState(prev => ({...prev, condition: e.target.value as TireCondition}))} required/>
          <Input label="Sulco (mm)" name="sulcoMm" type="number" step="0.1" value={tireFormState.sulcoMm || ''} onChange={handleTireChange} />
          <Input label="Hod. Últ. Movimentação" name="lastOdometerReading" type="number" value={tireFormState.lastOdometerReading || ''} onChange={handleTireChange} />
          <Textarea label="Notas" name="notes" value={tireFormState.notes || ''} onChange={handleTireChange} rows={3} className="md:col-span-2"/>
        </form>
      </Modal>

       <Modal 
        isOpen={isMovementModalOpen} 
        onClose={handleCloseMovementModal} 
        title="Registrar Movimentação de Pneu" 
        size="2xl" 
        contentClassName="p-6"
        footer={
            <div className="flex justify-end space-x-3">
                <Button type="button" variant="secondary" onClick={handleCloseMovementModal}>Cancelar</Button>
                <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={isLoading}
                     onClick={(e) => {
                        const form = (e.target as HTMLElement).closest('div.fixed')?.querySelector('form');
                        if(form) form.requestSubmit();
                    }}
                >
                    {isLoading ? <Spinner size="sm"/> : "Salvar Movimentação"}
                </Button>
            </div>
        }
        >
        <form onSubmit={handleMovementSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <Select 
            label="Pneu *" 
            name="tireId" 
            options={tires.map(t => ({value: t.id, label: `${t.fireNumber} (${t.brand} ${t.dimensions}) - ${t.status}`}))} 
            value={movementFormState.tireId || ''} 
            onChange={(e) => {
                const selectedTire = tires.find(t=>t.id === e.target.value);
                setMovementFormState(prev => ({
                    ...prev, 
                    tireId: e.target.value, 
                    fromCondition: selectedTire?.condition,
                    toCondition: selectedTire?.condition, 
                    vehicleId: selectedTire?.currentVehicleId || '',
                    fromPositionKey: selectedTire?.currentPositionKey,
                    odometerReading: selectedTire?.lastOdometerReading,
                    sulcoMm: selectedTire?.sulcoMm,
                }));
            }} 
            required
            wrapperClassName="md:col-span-2"
          />
          <Select 
            label="Tipo de Movimentação *" 
            name="movementType" 
            options={TIRE_MOVEMENT_TYPE_OPTIONS} 
            value={movementFormState.movementType || ''} 
            onChange={(e) => setMovementFormState(prev => ({...prev, movementType: e.target.value as TireMovementType}))} 
            required
          />
          <Input label="Data *" name="date" type="date" value={movementFormState.date || ''} onChange={(e) => setMovementFormState(prev => ({...prev, date: e.target.value}))} required/>
          
          {(movementFormState.movementType === TireMovementType.Mount || movementFormState.movementType === TireMovementType.Dismount) && (
            <Select 
              label={movementFormState.movementType === TireMovementType.Mount ? "Veículo de Destino *" : "Veículo de Origem"}
              name="vehicleId" 
              options={[{value: '', label: 'Nenhum'}, ...vehicles.map(v => ({value: v.id, label: `${v.plate} (${v.model})`}))]} 
              value={movementFormState.vehicleId || ''} 
              onChange={(e) => setMovementFormState(prev => ({...prev, vehicleId: e.target.value || undefined}))} 
              required={movementFormState.movementType === TireMovementType.Mount}
            />
          )}

          {movementFormState.movementType === TireMovementType.Mount && movementFormState.vehicleId && (
            <Select 
                label="Posição de Destino *" 
                name="toPositionKey"
                options={getAxleLayout(vehicles.find(v=>v.id === movementFormState.vehicleId)?.axleConfiguration).positions
                    .concat(getAxleLayout(vehicles.find(v=>v.id === movementFormState.vehicleId)?.axleConfiguration).spares)
                    .map(pk => ({value: pk, label: TirePositionKeyMap[pk]}))}
                value={movementFormState.toPositionKey || ''}
                onChange={(e) => setMovementFormState(prev => ({...prev, toPositionKey: e.target.value as TirePositionKeyType}))}
                required
            />
          )}
           {(movementFormState.movementType === TireMovementType.Mount || movementFormState.movementType === TireMovementType.Dismount || movementFormState.movementType === TireMovementType.TreadMeasurement) && (
            <Input label="Hodômetro do Veículo" name="odometerReading" type="number" value={movementFormState.odometerReading || ''} onChange={(e) => setMovementFormState(prev => ({...prev, odometerReading: parseInt(e.target.value) || undefined}))} />
          )}
          
          <Select 
            label="Condição Final do Pneu *" 
            name="toCondition" 
            options={TIRE_CONDITION_OPTIONS} 
            value={movementFormState.toCondition || ''} 
            onChange={(e) => setMovementFormState(prev => ({...prev, toCondition: e.target.value as TireCondition}))} 
            required
          />
          {(movementFormState.movementType === TireMovementType.TreadMeasurement || movementFormState.movementType === TireMovementType.Mount || movementFormState.movementType === TireMovementType.StockIn) && (
            <Input label="Sulco (mm)" name="sulcoMm" type="number" step="0.1" value={movementFormState.sulcoMm || ''} onChange={(e) => setMovementFormState(prev => ({...prev, sulcoMm: parseFloat(e.target.value) || undefined}))} />
          )}
          <Input label="Custo da Movimentação (R$)" name="cost" type="number" step="0.01" value={movementFormState.cost || ''} onChange={(e) => setMovementFormState(prev => ({...prev, cost: parseFloat(e.target.value) || undefined}))} />


          {(movementFormState.movementType === TireMovementType.ToRepair || movementFormState.movementType === TireMovementType.Scrap || movementFormState.movementType === TireMovementType.FromRepair) && (
             <Input label="Destino/Fornecedor (Ex: Borracharia)" name="destination" value={movementFormState.destination || ''} onChange={(e) => setMovementFormState(prev => ({...prev, destination: e.target.value}))} wrapperClassName="md:col-span-2"/>
          )}
          <Textarea label="Notas" name="notes" value={movementFormState.notes || ''} onChange={(e) => setMovementFormState(prev => ({...prev, notes: e.target.value}))} rows={2} className="md:col-span-2"/>
        </form>
      </Modal>
    </div>
  );
};


// Tire History Page
export const TireHistoryPage: React.FC = () => {
  const [movements, setMovements] = useState<TireMovement[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMovementForDetails, setSelectedMovementForDetails] = useState<TireMovement | null>(null);

  const [filterTireId, setFilterTireId] = useState('');
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterMovementType, setFilterMovementType] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [movementsSnap, tiresSnap, vehiclesSnap] = await Promise.all([
            getDocs(query(collection(db, TIRE_MOVEMENTS_COLLECTION), orderBy("date", "desc"))),
            getDocs(query(collection(db, TIRES_COLLECTION), orderBy("fireNumber"))),
            getDocs(query(collection(db, VEHICLES_COLLECTION), orderBy("plate")))
        ]);
        setMovements(movementsSnap.docs.map(d => mapDocToData<TireMovement>(d)));
        setTires(tiresSnap.docs.map(d => mapDocToData<Tire>(d)));
        setVehicles(vehiclesSnap.docs.map(d => mapDocToData<Vehicle>(d)));
    } catch(error) {
        console.error("Error fetching tire history page data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleOpenDetailsModal = (movement: TireMovement) => {
    setSelectedMovementForDetails(movement);
    setIsDetailsModalOpen(true);
  };
  const handleCloseDetailsModal = () => {
    setSelectedMovementForDetails(null);
    setIsDetailsModalOpen(false);
  };


  const movementColumns: TableColumn<TireMovement>[] = [
    { header: 'Data', accessor: 'date', render: item => formatDate(item.date), cellClassName:'w-28' },
    { header: 'Pneu (Nº Fogo)', accessor: 'tireId', render: item => <span className="font-semibold text-primary dark:text-primary-light">{tires.find(t => t.id === item.tireId)?.fireNumber || 'N/A'}</span>, cellClassName:'w-36' },
    { header: 'Tipo Mov.', accessor: 'movementType', render: item => <StatusBadge text={item.movementType} colorClass="bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300" size="xs"/>, cellClassName:'w-40' },
    { header: 'Veículo', accessor: 'vehicleId', render: item => item.vehicleId ? (vehicles.find(v => v.id === item.vehicleId)?.plate || 'N/A') : <span className="italic text-slate-500">N/A</span>, cellClassName:'w-32' },
    { header: 'Pos. Origem', accessor: 'fromPositionKey', render: item => item.fromPositionKey ? TirePositionKeyMap[item.fromPositionKey as TirePositionKeyType] : 'N/A', cellClassName:'w-40' },
    { header: 'Pos. Destino', accessor: 'toPositionKey', render: item => item.toPositionKey ? TirePositionKeyMap[item.toPositionKey as TirePositionKeyType] : 'N/A', cellClassName:'w-40' },
    { header: 'Hodômetro', accessor: 'odometerReading', render: item => item.odometerReading ? `${formatNumber(item.odometerReading)} km` : 'N/A', cellClassName:'w-32'},
    { header: 'Sulco (mm)', accessor: 'sulcoMm', render: item => item.sulcoMm ? `${item.sulcoMm}mm` : 'N/A', cellClassName:'w-28'},
    { header: 'Cond. Ant.', accessor: 'fromCondition', render: item => item.fromCondition ? <StatusBadge text={item.fromCondition} colorClass={getTireConditionColor(item.fromCondition)} size="xs"/> : 'N/A', cellClassName:'w-36'},
    { header: 'Cond. Nova', accessor: 'toCondition', render: item => item.toCondition ? <StatusBadge text={item.toCondition} colorClass={getTireConditionColor(item.toCondition)} size="xs"/> : 'N/A', cellClassName:'w-36'},
    { header: 'Custo', accessor: 'cost', render: item => item.cost ? formatCurrency(item.cost) : 'N/A', cellClassName:'w-28' },
    { header: 'Obs./Destino', accessor: 'notes', render: item => item.notes || item.destination || <span className="italic text-slate-500">N/A</span>, cellClassName: 'whitespace-normal break-words max-w-xs text-sm' },
  ];

  const filteredMovements = useMemo(() => {
    return movements
      .filter(m => {
        const movementDate = m.date ? new Date(m.date) : null; // m.date is string here
        return (
            (!filterTireId || m.tireId === filterTireId) &&
            (!filterVehicleId || m.vehicleId === filterVehicleId) &&
            (!filterMovementType || m.movementType === filterMovementType) &&
            (!filterDateStart || (movementDate && movementDate >= new Date(filterDateStart))) &&
            (!filterDateEnd || (movementDate && movementDate <= new Date(new Date(filterDateEnd).setHours(23,59,59,999))))
        );
      })
      .sort((a, b) => {
          const dateAValue = new Date(a.date).getTime(); // a.date is string
          const dateBValue = new Date(b.date).getTime(); // b.date is string
          
          if (isNaN(dateAValue) && isNaN(dateBValue)) return 0;
          if (isNaN(dateAValue)) return 1; 
          if (isNaN(dateBValue)) return -1;

          if (dateBValue !== dateAValue) return dateBValue - dateAValue; 
          return (a.id || '').localeCompare(b.id || ''); 
      }); 
  }, [movements, filterTireId, filterVehicleId, filterMovementType, filterDateStart, filterDateEnd]);

  const tireOptions = useMemo(() => 
    [{ value: '', label: 'Todos os Pneus' }, ...tires.map(t => ({ value: t.id, label: `${t.fireNumber} (${t.brand})` }))]
  , [tires]);

  const vehicleOptions = useMemo(() => 
    [{ value: '', label: 'Todos os Veículos' }, ...vehicles.map(v => ({ value: v.id, label: `${v.plate} (${v.model})` }))]
  , [vehicles]);

  const movementTypeOptions = useMemo(() =>
    [{value: '', label: 'Todos os Tipos'}, ...TIRE_MOVEMENT_TYPE_OPTIONS]
  , []);

  const tireMovementDetailsConfig: DetailItem<TireMovement>[] = [
    { key: 'date', label: 'Data', render: v => formatDate(v) },
    { key: 'tireId', label: 'Pneu (Nº Fogo)', render: v => tires.find(t => t.id === v)?.fireNumber || 'N/A' },
    { key: 'movementType', label: 'Tipo de Movimentação', render: v => <StatusBadge text={v as TireMovementType} colorClass="bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300" size="sm"/> },
    { key: 'vehicleId', label: 'Veículo', render: v => v ? vehicles.find(veh => veh.id === v)?.plate || 'N/A' : 'N/A' },
    { key: 'odometerReading', label: 'Hodômetro do Veículo', render: v => v ? `${formatNumber(v)} km` : 'N/A' },
    { key: 'sulcoMm', label: 'Sulco (mm)', render: v => v ? `${v} mm` : 'N/A' },
    { key: 'fromPositionKey', label: 'Posição de Origem', render: v => v ? TirePositionKeyMap[v as TirePositionKeyType] : 'N/A' },
    { key: 'toPositionKey', label: 'Posição de Destino', render: v => v ? TirePositionKeyMap[v as TirePositionKeyType] : 'N/A' },
    { key: 'fromCondition', label: 'Condição Anterior', render: v => v ? <StatusBadge text={v as TireCondition} colorClass={getTireConditionColor(v as TireCondition)} size="sm"/> : 'N/A' },
    { key: 'toCondition', label: 'Nova Condição', render: v => v ? <StatusBadge text={v as TireCondition} colorClass={getTireConditionColor(v as TireCondition)} size="sm"/> : 'N/A' },
    { key: 'cost', label: 'Custo Associado', render: v => formatCurrency(v) },
    { key: 'destination', label: 'Destino/Fornecedor' },
    { key: 'notes', label: 'Observações', isFullWidth: true },
  ];
  
  const handleExportHistory = () => {
    const dataToExport = filteredMovements.map(m => ({
        "Data": m.date ? formatDate(m.date) : '',
        "Pneu (Nº Fogo)": tires.find(t => t.id === m.tireId)?.fireNumber || 'N/A',
        "Tipo Mov.": m.movementType,
        "Veículo": m.vehicleId ? vehicles.find(v => v.id === m.vehicleId)?.plate : 'N/A',
        "Pos. Origem": m.fromPositionKey ? TirePositionKeyMap[m.fromPositionKey as TirePositionKeyType] : 'N/A',
        "Pos. Destino": m.toPositionKey ? TirePositionKeyMap[m.toPositionKey as TirePositionKeyType] : 'N/A',
        "Hodômetro": m.odometerReading,
        "Sulco (mm)": m.sulcoMm,
        "Cond. Ant.": m.fromCondition,
        "Cond. Nova": m.toCondition,
        "Custo (R$)": m.cost,
        "Destino/Obs.": m.notes || m.destination,
    }));
    exportToExcel(dataToExport, "Historico_Pneus");
  };


  return (
    <div className="space-y-6 animate-gentle-slide-up">
        <Card title="Filtrar Histórico de Movimentações de Pneus">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 items-end">
                <Select label="Pneu Específico" options={tireOptions} value={filterTireId} onChange={e => setFilterTireId(e.target.value)} wrapperClassName="mb-0"/>
                <Select label="Veículo Específico" options={vehicleOptions} value={filterVehicleId} onChange={e => setFilterVehicleId(e.target.value)} wrapperClassName="mb-0"/>
                <Select label="Tipo de Movimentação" options={movementTypeOptions} value={filterMovementType} onChange={e => setFilterMovementType(e.target.value)} wrapperClassName="mb-0"/>
                <Input label="Data Inicial" type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} wrapperClassName="mb-0"/>
                <Input label="Data Final" type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} wrapperClassName="mb-0"/>
                <Button onClick={handleExportHistory} leftIcon={<DownloadIcon className="w-4 h-4"/>} variant="secondary" className="w-full whitespace-nowrap">
                    Exportar Filtrados
                </Button>
            </div>
        </Card>
        <Card>
            <Table 
                columns={movementColumns} 
                data={filteredMovements} 
                onRowClick={handleOpenDetailsModal}
                isLoading={isLoading}
            />
        </Card>
         <DetailsViewModal
            isOpen={isDetailsModalOpen}
            onClose={handleCloseDetailsModal}
            title={`Detalhes da Movimentação: Pneu ${tires.find(t=>t.id === selectedMovementForDetails?.tireId)?.fireNumber || 'N/A'} em ${formatDate(selectedMovementForDetails?.date)}`}
            itemData={selectedMovementForDetails}
            displayConfig={tireMovementDetailsConfig}
            size="3xl"
        />
    </div>
  );
};

// Tire Purchases Page (Placeholder)
export const TirePurchasesPage: React.FC = () => {
  return (
    <DevelopmentPlaceholder title="Compras de Pneus" icon={ShoppingCartIcon} />
  );
};
