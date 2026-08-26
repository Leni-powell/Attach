/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Attach - Reportabilidad inteligente - Progressive Web App (PWA)
 * Theme: Professional Polish
 * Offline-first, mobile-first & responsive desktop layout.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getStoredInspections,
  saveStoredInspections,
  getStoredSession,
  saveStoredSession,
  getStoredSettings,
  saveStoredSettings,
  resetAllStorageData,
  DEFAULT_USER
} from './utils/storage';
import { AppSettings, Inspection, TabType, ToastMessage, UserSession } from './types';
import { isSuperUser } from './data/users';
import {
  getSupabaseConfig,
  fetchInspectionsFromSupabase,
  saveInspectionToSupabase,
  deleteInspectionFromSupabase,
  getCurrentSupabaseUser,
  onSupabaseAuthStateChange,
  signOutSupabase
} from './lib/supabase';

// Component imports
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { FAB } from './components/FAB';
import { ToastContainer } from './components/Toast';
import { InstallBanner } from './components/InstallBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { InspectionsListView } from './components/InspectionsListView';
import { ReportsView } from './components/ReportsView';
import { ProfileView } from './components/ProfileView';
import { NewInspectionModal } from './components/NewInspectionModal';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { ReportExportModal } from './components/ReportExportModal';

export default function App() {
  // State Initialization
  const [user, setUser] = useState<UserSession>(() => getStoredSession());
  const [inspections, setInspections] = useState<Inspection[]>(() => getStoredInspections());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Real and simulated online state
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // PWA Install prompt handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalInspection, setReportModalInspection] = useState<Inspection | null>(null);

  // Effective online status
  const effectiveOnline = isBrowserOnline && !settings.simulatedOffline;

  // Determine if current user is Super Usuario (Leni)
  const isSuper = useMemo(() => isSuperUser(user), [user]);

  // Current user key identifiers
  const currentEmail = (user?.email || '').toLowerCase().trim();
  const currentUserId = user?.id || user?.userId || `usr-${currentEmail}`;
  const currentUserName = (user?.name || '').toLowerCase();

  // Helper to determine ownership category of any inspection
  const getInspectionOwner = useCallback((insp: Inspection): 'leni' | 'admin1' | 'admin2' | 'other' => {
    if (!insp) return 'other';
    const email = (insp.createdByEmail || '').toLowerCase().trim();
    const name = (insp.createdByName || '').toLowerCase().trim();
    const signer = (insp.signature?.supervisorName || '').toLowerCase().trim();
    const uId = (insp.userId || insp.user_id || '').toLowerCase().trim();

    if (
      email.includes('leni') ||
      name.includes('leni') ||
      signer.includes('leni') ||
      uId.includes('leni')
    ) {
      return 'leni';
    }

    if (
      email.includes('admin2') ||
      email.includes('2admin') ||
      name.includes('admin2') ||
      name.includes('administrador 2') ||
      signer.includes('admin2') ||
      signer.includes('administrador 2') ||
      uId.includes('admin2')
    ) {
      return 'admin2';
    }

    if (
      email.includes('admin1') ||
      email.includes('1admin') ||
      name.includes('admin1') ||
      name.includes('administrador 1') ||
      signer.includes('admin1') ||
      signer.includes('administrador 1') ||
      uId.includes('admin1')
    ) {
      return 'admin1';
    }

    return 'other';
  }, []);

  // Visible inspections based on role:
  // - Super Usuario: has full visibility of all inspections across all supervisors.
  // - Regular Supervisors (admin1, admin2, etc.): ONLY see inspections they created or are assigned to.
  const visibleInspections = useMemo(() => {
    // 1. Super Usuario (Leni) has 360 full visibility
    if (isSuper) {
      return inspections;
    }

    // 2. Admin 1 session (strictly isolated)
    const isCurrentUserAdmin1 =
      currentEmail.includes('admin1') ||
      currentEmail.includes('1admin') ||
      currentUserName.includes('admin1') ||
      currentUserName.includes('administrador 1');

    if (isCurrentUserAdmin1) {
      return inspections.filter((insp) => {
        const owner = getInspectionOwner(insp);
        if (owner === 'admin2' || owner === 'leni') return false;
        if (owner === 'admin1') return true;

        const inspEmail = (insp.createdByEmail || '').toLowerCase().trim();
        const inspUserId = (insp.userId || insp.user_id || '').toLowerCase().trim();
        return inspEmail === currentEmail || inspUserId === currentUserId;
      });
    }

    // 3. Admin 2 session (strictly isolated)
    const isCurrentUserAdmin2 =
      currentEmail.includes('admin2') ||
      currentEmail.includes('2admin') ||
      currentUserName.includes('admin2') ||
      currentUserName.includes('administrador 2');

    if (isCurrentUserAdmin2) {
      return inspections.filter((insp) => {
        const owner = getInspectionOwner(insp);
        if (owner === 'admin1' || owner === 'leni') return false;
        if (owner === 'admin2') return true;

        const inspEmail = (insp.createdByEmail || '').toLowerCase().trim();
        const inspUserId = (insp.userId || insp.user_id || '').toLowerCase().trim();
        return inspEmail === currentEmail || inspUserId === currentUserId;
      });
    }

    // 4. Any other specific supervisor
    return inspections.filter((insp) => {
      const inspEmail = (insp.createdByEmail || '').toLowerCase().trim();
      const inspUserId = (insp.userId || insp.user_id || '').toLowerCase().trim();
      return (inspEmail && inspEmail === currentEmail) || (inspUserId && inspUserId === currentUserId);
    });
  }, [inspections, isSuper, currentEmail, currentUserId, currentUserName, getInspectionOwner]);

  // Global compliance rate calculation for visible scope
  const completedCount = useMemo(() => visibleInspections.filter((i) => i.status === 'completada').length, [visibleInspections]);
  const compliancePct = visibleInspections.length > 0 ? Math.round((completedCount / visibleInspections.length) * 100) : 100;

  // Toast dispatch helper
  const showToast = useCallback((type: ToastMessage['type'], message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
  }, []);

  // System notification helper
  const triggerNotification = useCallback((title: string, body: string) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body,
          icon: '/icon.svg'
        });
      } catch (err) {
        console.warn('Error al lanzar notificación nativa:', err);
      }
    }
  }, []);

  // Dark mode effect on root document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    saveStoredSettings(settings);
  }, [settings]);

  // Online / Offline window events
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      showToast('success', 'Conexión restablecida. Sincronización activa.', 'En línea');
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
      showToast('warning', 'Sin conexión a internet. Modo local habilitado.', 'Sin Red');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // PWA beforeinstallprompt event capture
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Sync state to storage
  const handleSaveInspections = (newInspections: Inspection[]) => {
    setInspections(newInspections);
    saveStoredInspections(newInspections);
  };

  // Initial Supabase auto-pull & auth listener on launch if configured
  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.isConfigured) {
      // 1. Recover active Supabase Auth session if present
      getCurrentSupabaseUser()
        .then((sbUser) => {
          if (sbUser && (!user.isAuthenticated || !user.id)) {
            setUser(sbUser);
            saveStoredSession(sbUser);
          }
        })
        .catch((err) => {
          console.warn('Error fetching Supabase auth session:', err);
        });

      // 2. Listen to real-time auth state changes
      const { unsubscribe } = onSupabaseAuthStateChange((sbUser) => {
        if (sbUser) {
          setUser(sbUser);
          saveStoredSession(sbUser);
        }
      });

      // 3. Fetch inspections from cloud
      fetchInspectionsFromSupabase()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setInspections(res.data);
            saveStoredInspections(res.data);
          }
        })
        .catch((err) => {
          console.warn('Silent Supabase initial fetch failed, using local storage:', err);
        });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  // User authentication
  const handleLoginSuccess = (authenticatedUser: UserSession) => {
    setUser(authenticatedUser);
    saveStoredSession(authenticatedUser);
    showToast('success', `Bienvenido(a), ${authenticatedUser.name}`, 'Sesión Iniciada');
    triggerNotification('Attach • Reportabilidad', 'Sesión iniciada correctamente en terreno.');
  };

  const handleLogout = async () => {
    try {
      await signOutSupabase();
    } catch (err) {
      console.warn('Error during Supabase sign out:', err);
    }
    const loggedOut: UserSession = {
      ...DEFAULT_USER,
      isAuthenticated: false
    };
    setUser(loggedOut);
    saveStoredSession(loggedOut);
    showToast('info', 'Sesión cerrada con éxito.');
  };

  // PWA Install trigger
  const handleInstallPwa = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('success', '¡Attach instalada en tu pantalla principal!');
      }
      setDeferredInstallPrompt(null);
      setShowInstallBanner(false);
    } else {
      showToast('info', 'Para instalar en iOS: presione Compartir y "Agregar a pantalla de inicio".');
    }
  };

  // Inspection Actions with user_id association and async Supabase cloud persistence
  const handleCreateInspection = (newInsp: Inspection) => {
    const finalUserId = user?.id || user?.userId || `usr-${user?.email || 'anon'}`;
    const userEmail = user?.email || '';
    const userName = user?.name || 'Supervisor';
    const inspectionWithUser: Inspection = {
      ...newInsp,
      userId: finalUserId,
      user_id: finalUserId,
      createdByEmail: userEmail,
      createdByName: userName
    };

    const updated = [inspectionWithUser, ...inspections];
    handleSaveInspections(updated);
    showToast('success', `Inspección para ${inspectionWithUser.company} creada exitosamente.`, 'Inspección Creada');
    triggerNotification('Nueva Inspección', `Se registró pauta para ${inspectionWithUser.company} (${inspectionWithUser.type}).`);

    // Asynchronous background cloud save with authenticated user_id
    saveInspectionToSupabase(
      inspectionWithUser,
      finalUserId,
      userEmail,
      userName
    ).catch((err) => console.warn('Supabase async save:', err));
  };

  const handleUpdateInspection = (updatedInsp: Inspection) => {
    const userEmail = user?.email || '';
    const userName = user?.name || 'Supervisor';
    const finalUserId = updatedInsp.userId || updatedInsp.user_id || user?.id || user?.userId || `usr-${userEmail || 'anon'}`;
    const finalCreatedEmail = updatedInsp.createdByEmail || userEmail;
    const finalCreatedName = updatedInsp.createdByName || userName;

    const inspectionToSave: Inspection = {
      ...updatedInsp,
      userId: finalUserId,
      user_id: finalUserId,
      createdByEmail: finalCreatedEmail,
      createdByName: finalCreatedName
    };

    const updatedList = inspections.map((i) => (i.id === inspectionToSave.id ? inspectionToSave : i));
    handleSaveInspections(updatedList);
    setSelectedInspection(inspectionToSave);

    if (inspectionToSave.status === 'completada' && selectedInspection?.status !== 'completada') {
      showToast('success', '¡Inspección completada al 100%!', 'Auditoría Finalizada');
      triggerNotification('Inspección Completada', `${inspectionToSave.company} fue completada y validada.`);
    } else {
      showToast('info', 'Cambios guardados correctamente.');
    }

    // Asynchronous background cloud save with user_id
    saveInspectionToSupabase(
      inspectionToSave,
      finalUserId,
      finalCreatedEmail,
      finalCreatedName
    ).catch((err) => console.warn('Supabase async update:', err));
  };

  const handleDeleteInspection = (id: string) => {
    const updatedList = inspections.filter((i) => i.id !== id);
    handleSaveInspections(updatedList);
    setSelectedInspection(null);
    setIsDetailModalOpen(false);
    showToast('info', 'Inspección eliminada correctamente.');

    // Asynchronous background cloud delete
    deleteInspectionFromSupabase(id).catch((err) => console.warn('Supabase async delete:', err));
  };

  const handleOpenDetail = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailModalOpen(true);
  };

  const handleOpenReport = (inspection?: Inspection) => {
    setReportModalInspection(inspection || null);
    setIsReportModalOpen(true);
  };

  const handleResetAllData = () => {
    const resetList = resetAllStorageData();
    setInspections(resetList);
    showToast('warning', 'Se restauraron los datos iniciales de ejemplo.', 'Datos Restablecidos');
  };

  // If user is not authenticated, render the login view
  if (!user.isAuthenticated) {
    return (
      <div className="min-h-screen">
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Count pending inspections for badge based on visible scope
  const pendingCount = visibleInspections.filter((i) => i.status === 'pendiente').length;

  return (
    <div className="flex h-screen w-full bg-[#F5F7FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* Dynamic Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* 1. Desktop Professional Polish Sidebar (w-64 bg-[#0057B8]) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
        pendingCount={pendingCount}
        user={user}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Top Header Bar */}
        <Header
          isOnline={effectiveOnline}
          user={user}
          darkMode={settings.darkMode}
          onToggleDarkMode={() => setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
          canInstallPwa={!!deferredInstallPrompt}
          onInstallPwa={handleInstallPwa}
          pendingCount={pendingCount}
          activeTab={activeTab}
          globalSearchQuery={globalSearchQuery}
          onGlobalSearchChange={(query) => {
            setGlobalSearchQuery(query);
            if (query && activeTab !== 'inspections') {
              setActiveTab('inspections');
            }
          }}
          onTriggerNotificationClick={() => {
            showToast('info', `Tienes ${pendingCount} inspecciones pendientes por realizar.`);
          }}
        />

        {/* Scrollable Main Views Canvas */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6">
          <div className="max-w-5xl mx-auto">
            {/* Offline Warning Banner */}
            {!effectiveOnline && (
              <OfflineBanner
                isSimulated={settings.simulatedOffline}
                onSync={() => {
                  if (settings.simulatedOffline) {
                    setSettings((s) => ({ ...s, simulatedOffline: false }));
                  }
                  showToast('info', 'Verificando conectividad con servidor...');
                }}
              />
            )}

            {/* PWA Install Banner */}
            {showInstallBanner && (
              <InstallBanner
                onInstall={handleInstallPwa}
                onDismiss={() => setShowInstallBanner(false)}
              />
            )}

            {/* Active Screen Tab Router */}
            {activeTab === 'dashboard' && (
              <DashboardView
                inspections={visibleInspections}
                onSelectInspection={handleOpenDetail}
                onNewInspection={() => setIsNewModalOpen(true)}
                onNavigateToInspections={() => setActiveTab('inspections')}
              />
            )}

            {activeTab === 'inspections' && (
              <InspectionsListView
                inspections={visibleInspections}
                onSelectInspection={handleOpenDetail}
                onNewInspection={() => setIsNewModalOpen(true)}
                onUpdateInspection={handleUpdateInspection}
                initialSearchQuery={globalSearchQuery}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                inspections={visibleInspections}
                onOpenReportModal={() => handleOpenReport()}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                settings={settings}
                inspections={visibleInspections}
                onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
                onResetAllData={handleResetAllData}
                onLogout={handleLogout}
                onTriggerNotificationTest={() => {
                  showToast('success', 'Prueba de notificación emitida.', 'Notificación');
                  triggerNotification('Attach Alerta', 'Reportabilidad inteligente: Prueba de notificación push.');
                }}
                onInspectionsSynced={(syncedList) => {
                  handleSaveInspections(syncedList);
                }}
                onShowToast={(type, message, title) => {
                  showToast(type, message, title);
                }}
              />
            )}
          </div>
        </main>

        {/* Bottom subtle progress line matching the theme */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800 w-full relative shrink-0">
          <div
            className="absolute top-0 left-0 h-full bg-[#CC8B79] transition-all duration-500"
            style={{ width: `${compliancePct}%` }}
          />
        </div>

        {/* Floating Action Button for quick new inspection creation */}
        {activeTab !== 'profile' && (
          <FAB onClick={() => setIsNewModalOpen(true)} />
        )}

        {/* App Shell Bottom Navigation Bar for mobile (md:hidden) */}
        <div className="md:hidden">
          <BottomNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            pendingCount={pendingCount}
          />
        </div>
      </div>

      {/* MODALS */}
      {/* 1. New Inspection Modal */}
      <NewInspectionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateInspection}
      />

      {/* 2. Inspection Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          isOpen={isDetailModalOpen}
          currentUser={user}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInspection(null);
          }}
          onUpdate={handleUpdateInspection}
          onDelete={handleDeleteInspection}
          onExportReport={(insp) => {
            setIsDetailModalOpen(false);
            handleOpenReport(insp);
          }}
        />
      )}

      {/* 3. Export Report Sheet Modal */}
      <ReportExportModal
        isOpen={isReportModalOpen}
        inspection={reportModalInspection}
        inspectionsList={visibleInspections}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportModalInspection(null);
        }}
      />
    </div>
  );
}
