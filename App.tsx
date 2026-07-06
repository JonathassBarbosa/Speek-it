import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { User, StoredText, Recording, View, Sala, UserRole, AnalysisReport } from './types';
import { INITIAL_USERS, SALAS, MOCK_PASSWORDS } from './data/initialData';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { TextManager } from './components/TextManager';
import { Teleprompter } from './components/Teleprompter';
import { AnalysisReportComponent } from './components/AnalysisReport';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { UserDashboard } from './components/UserDashboard';
import { UserDetailView } from './components/UserDetailView';
import { AdminDashboard } from './components/AdminDashboard';


const App: React.FC = () => {
  const [users, setUsers] = useLocalStorage<User[]>('teleprompter_users', INITIAL_USERS);
  const [salas, setSalas] = useLocalStorage<Sala[]>('teleprompter_salas', SALAS);
  const [texts, setTexts] = useLocalStorage<StoredText[]>('teleprompter_texts', []);
  const [recordings, setRecordings] = useLocalStorage<Recording[]>('teleprompter_recordings', []);
  const [mockPasswords, setMockPasswords] = useLocalStorage<{ [email: string]: string }>('teleprompter_passwords', MOCK_PASSWORDS);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');
  const [activeText, setActiveText] = useState<StoredText | null>(null);
  const [activeRecording, setActiveRecording] = useState<Recording | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getHomeView = (): View => {
    if (!currentUser) return 'login';
    switch (currentUser.role) {
      case 'dev': return 'adminDashboard';
      case 'supervisor': return 'supervisorDashboard';
      case 'user': return 'userDashboard';
      default: return 'login';
    }
  };

  const getPreviousView = (): View | undefined => {
      if (view === 'userDetailView') return 'supervisorDashboard';
      if (view === 'analysis' && currentUser?.role === 'supervisor') return 'userDetailView';
      return undefined;
  }

  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && mockPasswords[user.email] === pass) {
      setCurrentUser(user);
      setLoginError(null);
    } else {
      setLoginError('Invalid email or password.');
    }
  };
  
  const handleRegister = (name: string, email: string, pass: string, sala: Sala, role: UserRole) => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setLoginError('A user with this email already exists.');
        return;
    }
    const newUser: User = { id: `user-${Date.now()}`, name, email: email.toLowerCase(), sala, role };
    setUsers(prev => [...prev, newUser]);
    setMockPasswords(prev => ({ ...prev, [newUser.email]: pass }));
    setCurrentUser(newUser);
    setLoginError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  const handleStartTraining = (text: StoredText) => {
    setActiveText(text);
    setView('teleprompter');
  };

  const handleFinishTraining = (recordingData: { textId: string; audioUrl: string; transcript: string; analysis: AnalysisReport }) => {
    const newRecording: Recording = {
      id: `rec-${Date.now()}`,
      userId: currentUser!.id,
      createdAt: Date.now(),
      ...recordingData
    };
    setRecordings(prev => [...prev, newRecording]);
    setTexts(prev => prev.map(t => t.id === recordingData.textId ? { ...t, trainedCount: t.trainedCount + 1 } : t));
    setActiveRecording(newRecording);
    setView('analysis');
  };
  
  const handleViewRecording = (recording: Recording) => {
    setActiveRecording(recording);
    setView('analysis');
  }
  
  const handleSelectUserForDetail = (userId: string) => {
    setSelectedUserId(userId);
    setView('userDetailView');
  };

  useEffect(() => {
    if (currentUser && view === 'login') {
      setView(getHomeView());
    }
  }, [currentUser, view]);


  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} salas={salas} error={loginError} />;
  }

  const renderContent = () => {
    const userTexts = texts.filter(t => t.userId === currentUser.id);
    const userRecordings = recordings.filter(r => r.userId === currentUser.id);

    switch (view) {
      case 'textManager':
        return <TextManager texts={userTexts} setTexts={setTexts} onStartTraining={handleStartTraining} userId={currentUser.id} />;
      case 'teleprompter':
        if (!activeText) { setView(getHomeView()); return null; }
        return <Teleprompter textToRead={activeText} onFinish={handleFinishTraining} onCancel={() => setView('textManager')} />;
      case 'analysis':
        if (!activeRecording) { setView(getHomeView()); return null; }
        const analysisText = texts.find(t => t.id === activeRecording.textId);
        if (!analysisText) { setView(getHomeView()); return null; }
        return <AnalysisReportComponent 
                    report={activeRecording.analysis!} 
                    text={analysisText} 
                    transcript={activeRecording.transcript} 
                    audioUrl={activeRecording.audioUrl} 
                    onTryAgain={() => handleStartTraining(analysisText)} 
                    onBack={() => setView(getPreviousView() || getHomeView())} 
                />;
      case 'supervisorDashboard':
        return <SupervisorDashboard currentUser={currentUser} users={users} recordings={recordings} onSelectUser={handleSelectUserForDetail} setView={setView} />;
      case 'userDashboard':
        return <UserDashboard user={currentUser} recordings={userRecordings} texts={userTexts} setView={setView} onViewRecording={handleViewRecording} onStartTraining={handleStartTraining}/>
      case 'userDetailView':
        if (!selectedUserId) { setView('supervisorDashboard'); return null; }
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (!selectedUser) { setView('supervisorDashboard'); return null; }
        return <UserDetailView user={selectedUser} recordings={recordings.filter(r => r.userId === selectedUserId)} texts={texts} onViewRecording={handleViewRecording} />
      case 'adminDashboard':
        return <AdminDashboard users={users} setUsers={setUsers} salas={salas} setSalas={setSalas} recordings={recordings} setView={setView} setMockPasswords={setMockPasswords} />
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <Header currentUser={currentUser} view={view} setView={setView} onLogout={handleLogout} toggleTheme={toggleTheme} isDarkMode={isDarkMode} getHomeView={getHomeView} getPreviousView={getPreviousView} />
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
