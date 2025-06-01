

import React, { createContext, useState, useEffect, useMemo, useCallback, ReactNode, useContext } from 'react';
import { Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Theme, ThemeContextType, SidebarContextType, AuthContextType, NavItem } from '@/types';
import { NAV_ITEMS, APP_NAME, APP_ABBREVIATION, MoonIcon, SunIcon, DEFAULT_THEME, Bars3Icon, XMarkIcon, LogoutIcon, LOGIN_EMAIL_HELP, ExclamationTriangleIcon } from '@/constants';
import { DashboardPage, VehiclesPage, DocumentsPage, MaintenancePage, SettingsPage, VehicleLifecyclePage, TiresPage, TireHistoryPage, TirePurchasesPage } from '@/pages';
import { Button, Card, Input, Spinner } from '@/ui_components'; // Added Spinner
import { fbAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, FirebaseUser, sendPasswordResetEmail as fbSendPasswordResetEmail } from '@/firebase'; // Firebase imports

// --- CONTEXTS ---

// Theme Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme | null) || (DEFAULT_THEME as Theme));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === Theme.Dark);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(prev => prev === Theme.Light ? Theme.Dark : Theme.Light), []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Sidebar Context
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
};

const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => localStorage.getItem('sidebarOpen') === 'true');
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const value = useMemo(() => ({ isSidebarOpen, toggleSidebar }), [isSidebarOpen, toggleSidebar]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbAuth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(fbAuth, email, pass);
      return true;
    } catch (error) {
      console.error("Firebase login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(fbAuth);
      // No need to navigate here explicitly if ProtectedRoute handles redirection on currentUser change
    } catch (error) {
      console.error("Firebase logout error:", error);
    }
  };
  
  const sendPasswordResetEmail = async (email: string): Promise<{success: boolean; error?: string}> => {
    try {
      await fbSendPasswordResetEmail(fbAuth, email);
      return { success: true };
    } catch (error: any) {
      console.error("Firebase password reset error:", error);
      return { success: false, error: error.message };
    }
  };
  
  const userEmailForHelp = LOGIN_EMAIL_HELP; 
  const isAuthenticated = !!currentUser;

  const value = useMemo(() => ({ 
    isAuthenticated, 
    login, 
    logout, 
    sendPasswordResetEmail,
    userEmailForHelp,
  }), [isAuthenticated, currentUser]); // Added currentUser dependency

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light_bg dark:bg-dark_bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- COMPONENTS ---

// LoginPage Component
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    const success = await auth.login(email, password);
    setIsLoading(false);
    if (success) {
      navigate('/'); 
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!resetEmail) {
      setError("Por favor, informe o e-mail para redefinição.");
      return;
    }
    setIsLoading(true);
    const result = await auth.sendPasswordResetEmail(resetEmail);
    setIsLoading(false);
    if (result.success) {
      setMessage("Link para redefinição de senha enviado para o seu e-mail (se cadastrado). Verifique sua caixa de entrada e spam.");
      setShowResetPassword(false);
      setResetEmail('');
    } else {
      setError(result.error || "Erro ao enviar link de redefinição. Tente novamente.");
    }
  };


  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${theme === Theme.Dark ? 'bg-black' : 'bg-light_bg'} p-4 animate-fade-in`}>
        <div className="absolute top-4 right-4">
            <ThemeToggle />
        </div>
        <Card className="w-full max-w-md animate-slide-up-fade-in">
            <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${theme === Theme.Dark ? 'text-primary-light' : 'text-primary'}`}>{APP_NAME}</h1>
            <p className={`${theme === Theme.Dark ? 'text-dark_text_secondary' : 'text-light_text_secondary'} mt-2`}>Acesso ao Sistema</p>
            </div>

            {showResetPassword ? (
              <form onSubmit={handlePasswordResetRequest} className="space-y-6">
                <p className={`${theme === Theme.Dark ? 'text-dark_text_secondary' : 'text-light_text_secondary'} text-sm`}>
                  Informe seu e-mail para enviarmos um link de redefinição de senha.
                </p>
                <Input 
                    label="Email para Redefinição" 
                    id="reset-email" 
                    type="email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    required 
                    autoFocus
                    placeholder="user@example.com"
                />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                {message && <p className="text-sm text-green-500 text-center">{message}</p>}
                <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" className="mr-2"/> : null}
                    Enviar Link
                </Button>
                <Button variant="ghost" onClick={() => {setShowResetPassword(false); setError(''); setMessage('');}} className="w-full">
                    Voltar para Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                  label="Email" 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  autoFocus
                  placeholder="user@example.com"
              />
              <Input 
                  label="Senha" 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="******"
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              {message && <p className="text-sm text-green-500 text-center">{message}</p>}
              <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" className="mr-2"/> : null}
                  Entrar
              </Button>
               <div className="text-sm text-center">
                <button type="button" onClick={() => {setShowResetPassword(true); setError(''); setMessage('');}} className="font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors duration-150">
                    Esqueci a senha
                </button>
              </div>
              </form>
            )}
        </Card>
         <p className={`mt-8 text-xs ${theme === Theme.Dark ? 'text-slate-500' : 'text-slate-400'}`}>
            © {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.
          </p>
    </div>
  );
};


// Sidebar Component
const Sidebar: React.FC = () => {
  const { theme } = useTheme();
  const { isSidebarOpen } = useSidebar();
  const auth = useAuth();

  const navItemsToDisplay = [...NAV_ITEMS];
  if (auth.isAuthenticated) {
    navItemsToDisplay.push({
      path: '#logout', 
      name: 'Sair',
      icon: LogoutIcon,
      action: auth.logout,
      requiresAuth: true,
    });
  }


  return (
    <aside 
      className={`bg-light_surface dark:bg-dark_surface text-light_text_primary dark:text-dark_text_primary flex flex-col shadow-lg transition-all duration-300 ease-in-out
                  ${isSidebarOpen ? 'w-64' : 'w-20'}`}
    >
      <div className={`p-4 h-16 flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} text-primary ${theme === Theme.Dark ? 'border-b border-slate-700' : 'border-b border-slate-200'}`}>
        {isSidebarOpen ? (
            <span className="text-2xl font-bold">{APP_NAME}</span>
        ) : (
            <span className="text-2xl font-bold">{APP_ABBREVIATION}</span>
        )}
      </div>
      <nav className="flex-grow p-3 space-y-2">
        {navItemsToDisplay.map((item) => (
          item.action ? (
             <button
              key={item.name}
              onClick={item.action}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ease-in-out group
              hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20
              text-light_text_secondary dark:text-dark_text_secondary
              ${isSidebarOpen ? '' : 'justify-center'}`}
              title={isSidebarOpen ? '' : item.name}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {isSidebarOpen && <span className="truncate">{item.name}</span>}
            </button>
          ) : (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ease-in-out group
              hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20
              ${isActive ? 'bg-primary/20 text-primary dark:bg-primary/30 font-semibold shadow-sm' : 'text-light_text_secondary dark:text-dark_text_secondary'}
              ${isSidebarOpen ? '' : 'justify-center'}`
            }
            title={isSidebarOpen ? '' : item.name} 
          >
            <item.icon className="w-6 h-6 flex-shrink-0" />
            {isSidebarOpen && <span className="truncate">{item.name}</span>}
             {item.isBeta && isSidebarOpen && <span className="ml-auto text-xs bg-yellow-400/70 text-yellow-800 px-1.5 py-0.5 rounded-full">Beta</span>}
          </NavLink>
          )
        ))}
      </nav>
      <div className={`p-4 mt-auto ${theme === Theme.Dark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
        {isSidebarOpen && <p className="text-xs text-light_text_secondary dark:text-dark_text_secondary text-center">© {new Date().getFullYear()} {APP_NAME}</p>}
      </div>
    </aside>
  );
};

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
         <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
            aria-label={theme === Theme.Dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
        >
            {theme === Theme.Dark ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-slate-700" />}
        </button>
    );
}

// Header Component
const Header: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const location = useLocation();
  
  const currentNavItem = NAV_ITEMS.find(item => {
    if (item.path === "/") return location.pathname === "/";
    return location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/" && location.pathname.charAt(item.path.length) === '/');
  }) || NAV_ITEMS.find(item => location.pathname.startsWith(item.path) && item.path !== "/"); 

  const pageTitle = currentNavItem ? currentNavItem.name : APP_NAME;


  return (
    <header className="h-16 bg-light_surface dark:bg-dark_surface shadow-md flex items-center justify-between px-6 text-light_text_primary dark:text-dark_text_primary sticky top-0 z-40">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
          aria-label={isSidebarOpen ? "Recolher sidebar" : "Expandir sidebar"}
        >
          {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>
      <ThemeToggle/>
    </header>
  );
};

// Main Layout Component for authenticated users
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-light_bg dark:bg-dark_bg overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto relative">
           <DataPersistenceWarningFirebase />
          {children}
        </main>
      </div>
    </div>
  );
};

const DataPersistenceWarningFirebase: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  // A more robust check would involve trying a small read/write operation if truly needed,
  // but for a UI warning, checking for a placeholder API key is often sufficient.
  // The provided API key "AIzaSyD-OHlN_PjQcd3QDhx6THlxVtsjsMf70QI" is the example key.
  // If it's still this key, Firebase is likely not configured for this specific user's project.
  const isFirebaseLikelyConfigured = fbAuth.app.options.apiKey && 
                                     fbAuth.app.options.apiKey !== "YOUR_API_KEY_PLACEHOLDER" && 
                                     fbAuth.app.options.apiKey !== "AIzaSyD-OHlN_PjQcd3QDhx6THlxVtsjsMf70QI"; // Check against the placeholder from firebase.ts

  if (!isVisible) return null;

  if (isFirebaseLikelyConfigured) {
     return (
        <div className="bg-green-100 dark:bg-green-700/30 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200 p-4 mb-6 rounded-md shadow relative animate-fade-in" role="alert">
            <div className="flex">
                <div className="py-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-500 dark:text-green-400 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></div>
                <div>
                <p className="font-bold">Firebase Conectado</p>
                <p className="text-sm">Os dados estão sendo persistidos no Firebase Firestore.</p>
                </div>
            </div>
            <button 
                onClick={() => setIsVisible(false)} 
                className="absolute top-2 right-2 p-1 text-green-500 dark:text-green-300 hover:text-green-700 dark:hover:text-green-100"
                aria-label="Fechar aviso"
            >
                <XMarkIcon className="w-5 h-5"/>
            </button>
        </div>
     );
  }

  // If Firebase is not likely configured, return null to hide the warning.
  return null; 
};


// Protected Route HOC
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <ProtectedLayout>{children}</ProtectedLayout>;
};


// App Component
const AppRoutes: React.FC = () => {
  return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
        <Route path="/lifecycle" element={<ProtectedRoute><VehicleLifecyclePage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
        <Route path="/tires" element={<ProtectedRoute><TiresPage /></ProtectedRoute>} />
        <Route path="/tire-history" element={<ProtectedRoute><TireHistoryPage /></ProtectedRoute>} />
        <Route path="/tire-purchases" element={<ProtectedRoute><TirePurchasesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>} />
      </Routes>
  );
}


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider> 
        <SidebarProvider> 
          <AppRoutes />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
