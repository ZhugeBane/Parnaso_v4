import React, { useState, useEffect } from 'react';
import { User, WritingSession, Project, UserSettings } from '../types';
import { getAllUsers, toggleUserBlock, deleteUser } from '../services/authService';
import { getUserDataForAdmin, deleteUserData, getGlobalStats } from '../services/sessionService';
import { Card } from './ui/Card';

interface AdminDashboardProps {
  currentUser: User;
  onExit: () => void;
  onInspectUser: (user: User, data: { sessions: WritingSession[], projects: Project[], settings: UserSettings }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onExit, onInspectUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalWords: 0, totalSessions: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
    
    // Calculate global stats
    const userIds = allUsers.map(u => u.id);
    const globalStats = getGlobalStats(userIds);
    setStats(globalStats);
  };

  const handleToggleBlock = (userId: string) => {
    const updatedUsers = toggleUserBlock(userId);
    setUsers(updatedUsers);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Tem certeza? Esta ação removerá permanentemente o usuário e todas as suas produções.")) {
      deleteUser(userId);
      deleteUserData(userId);
      loadData(); // Refresh list and stats
    }
  };

  const handleInspect = (targetUser: User) => {
    const data = getUserDataForAdmin(targetUser.id);
    onInspectUser(targetUser, data);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsersCount = users.filter(u => u.isBlocked && u.role !== 'admin').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel Administrativo</h1>
            <p className="text-slate-500 text-sm">Controle Geral e Moderação</p>
          </div>
        </div>
        <button 
          onClick={onExit}
          className="flex items-center px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Voltar ao Meu Dashboard
        </button>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-indigo-500">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Usuários</span>
           <div className="text-3xl font-bold text-indigo-600 mt-1">{users.length}</div>
        </Card>
        <Card className="border-l-4 border-teal-500">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Palavras na Plataforma</span>
           <div className="text-3xl font-bold text-teal-600 mt-1">{stats.totalWords.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="border-l-4 border-amber-500">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessões Registradas</span>
           <div className="text-3xl font-bold text-amber-600 mt-1">{stats.totalSessions}</div>
        </Card>
        <Card className="border-l-4 border-rose-500">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendentes de Aprovação</span>
           <div className="text-3xl font-bold text-rose-600 mt-1">{pendingUsersCount}</div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-between items-end">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 sm:text-sm"
            placeholder="Buscar usuários por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Função</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'admin' ? 'bg-slate-800' : 'bg-teal-500'}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isBlocked ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-rose-100 text-rose-800">
                      Pendente / Bloqueado
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      Ativo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                   {user.role === 'admin' ? 'Administrador' : 'Escritor'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-3 items-center">
                    <button 
                      onClick={() => handleInspect(user)}
                      className="text-teal-600 hover:text-teal-900 font-medium px-2 py-1 rounded hover:bg-teal-50"
                      title="Ver Produções"
                    >
                      Inspecionar
                    </button>
                    {user.role !== 'admin' && (
                      <>
                        <button 
                          onClick={() => handleToggleBlock(user.id)}
                          className={`px-3 py-1 rounded border transition-colors ${
                             user.isBlocked 
                             ? 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100' 
                             : 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100'
                          }`}
                        >
                          {user.isBlocked ? 'Aprovar' : 'Bloquear'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Excluir Usuário"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-500">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
};