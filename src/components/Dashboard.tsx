import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase, FileText, Users, LogOut, AlertCircle, CheckCircle, Download, Eye, Filter, Calendar, Mail, Phone, Linkedin, PersonStanding } from 'lucide-react';

interface Job {
  id: number;
  titulo: string;
  descricao: string;
  ativa: boolean;
  criadoEm: string;
}

interface JobFormData {
  titulo: string;
  descricao: string;
}

interface Candidate {
  ID: number;
  CPF: string;
  NOME: string;
  EMAIL: string;
  TELEFONE: string;
  LINKEDIN?: string;
  DESCRICAO_DA_VAGA: string;
  VAGA: string;
  ANALISE_DO_CANDIDATO: string;
  MATCH_COM_VAGA: number;
  CURRICULO: string;
  ID_VAGA: number;
  CANDIDATURA: string;
  DATA_ULTIMA_CANDIDATURA: string;  
}
interface JobFormErrors {
  titulo?: string;
  descricao?: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData>({ titulo: '', descricao: '' });
  const [jobFormErrors, setJobFormErrors] = useState<JobFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadingToggleIds, setLoadingToggleIds] = useState<number[]>([]);
  const [loadingDeleteIds, setLoadingDeleteIds] = useState<number[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // ---------- TOKEN & AUTH ----------
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      fetchJobs(token);
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // ---------- API CALLS ----------
  const fetchJobs = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/vagas`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar vagas');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
      alert('Falha ao carregar vagas. Faça login novamente.');
      handleLogout();
    }
  };

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await fetch(`${API_URL}/api/candidatos`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao buscar candidatos');
      const data = await res.json();
      setCandidates(data);
      setFilteredCandidates(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar candidatos');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleTabChange = (tab: 'jobs' | 'candidates') => {
    setActiveTab(tab);
    if (tab === 'candidates' && candidates.length === 0) {
      fetchCandidates();
    }
  };

  const handleJobFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = e.target.value;
    setSelectedJobFilter(jobId);
    
    if (jobId === '') {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(candidate => 
        String(candidate.VAGA) === String(jobId)
      );
      setFilteredCandidates(filtered);
    }
  };

  const handleDownloadCV = async (candidateId: number, fileName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/curriculos/${candidateId}/download`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao baixar currículo');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar currículo');
    }
  };
  const validateJobForm = (): boolean => {
    const newErrors: JobFormErrors = {};

    if (!jobFormData.titulo.trim()) newErrors.titulo = 'Título é obrigatório';
    else if (jobFormData.titulo.trim().length < 3) newErrors.titulo = 'Título deve ter pelo menos 3 caracteres';

    if (!jobFormData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    else if (jobFormData.descricao.trim().length < 5) newErrors.descricao = 'Descrição muito curta';

    setJobFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJobFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobFormData(prev => ({ ...prev, [name]: value }));
    if (jobFormErrors[name as keyof JobFormErrors]) {
      setJobFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateJobForm()) return;

    setIsSubmitting(true);

    try {
      const headers = getAuthHeaders();
      let res;

      if (editingJob) {
        res = await fetch(`${API_URL}/api/vagas/${editingJob.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ titulo: jobFormData.titulo, descricao: jobFormData.descricao }),
        });
      } else {
        res = await fetch(`${API_URL}/api/vagas`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ titulo: jobFormData.titulo, descricao: jobFormData.descricao }),
        });
      }

      if (!res.ok) throw new Error('Erro ao salvar vaga');
      await fetchJobs(localStorage.getItem('token')!);

      setShowJobForm(false);
      setEditingJob(null);
      setJobFormData({ titulo: '', descricao: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar vaga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setJobFormData({ titulo: job.titulo, descricao: job.descricao });
    setShowJobForm(true);
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vaga?')) return;
    setLoadingDeleteIds(prev => [...prev, jobId]);
    try {
      const res = await fetch(`${API_URL}/api/vagas/${jobId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao deletar');
      await fetchJobs(localStorage.getItem('token')!);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir vaga');
    } finally {
      setLoadingDeleteIds(prev => prev.filter(id => id !== jobId));
    }
  };

  const handleToggleJobStatus = async (job: Job) => {
    setLoadingToggleIds(prev => [...prev, job.id]);
    try {
      const res = await fetch(`${API_URL}/api/vagas/${job.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ativa: !job.ativa }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      await fetchJobs(localStorage.getItem('token')!);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status da vaga');
    } finally {
      setLoadingToggleIds(prev => prev.filter(id => id !== job.id));
    }
  };

  const cancelJobForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
    setJobFormData({ titulo: '', descricao: '' });
    setJobFormErrors({});
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  const closeCandidateModal = () => {
    setShowCandidateModal(false);
    setSelectedCandidate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <h1 className="text-xl font-bold text-azulUnibra-300">Dashboard Administrativo</h1>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-azulUnibra-300 hover:text-red-600">
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => handleTabChange('jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'jobs'
                    ? 'border-azulUnibra-300 text-azulUnibra-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Gerenciar Vagas</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('candidates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'candidates'
                    ? 'border-azulUnibra-300 text-azulUnibra-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Banco de Talentos</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Jobs Tab Content */}
          {activeTab === 'jobs' && (
            <>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-azulUnibra-300">Gerenciar Vagas</h2>
            <button
              onClick={() => setShowJobForm(true)}
              className="bg-azulUnibra-300 hover:bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Vaga</span>
            </button>
          </div>

          {/* Job Form */}
          {showJobForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleJobSubmit} className="space-y-4">
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-azulUnibra-300 mb-2">Título da Vaga</label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={jobFormData.titulo}
                    onChange={handleJobFormChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                      jobFormErrors.titulo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Desenvolvedor Frontend"
                  />
                  {jobFormErrors.titulo && <p className="mt-1 text-sm text-red-600">{jobFormErrors.titulo}</p>}
                </div>

                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-azulUnibra-300 mb-2">Descrição Interna</label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    value={jobFormData.descricao}
                    onChange={handleJobFormChange}
                    rows={3}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 resize-none ${
                      jobFormErrors.descricao ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Descrição interna da vaga"
                  />
                  {jobFormErrors.descricao && <p className="mt-1 text-sm text-red-600">{jobFormErrors.descricao}</p>}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-azulUnibra-300 hover:bg-blue-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    {isSubmitting ? 'Salvando...' : editingJob ? 'Atualizar Vaga' : 'Criar Vaga'}
                  </button>
                  <button type="button" onClick={cancelJobForm} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* Jobs List */}
          <div className="p-6">
            {jobs.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhuma vaga cadastrada</p>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => {
                  const isToggleLoading = loadingToggleIds.includes(job.id);
                  const isDeleteLoading = loadingDeleteIds.includes(job.id);

                  return (
                    <div key={job.id} className={`border rounded-lg p-4 flex justify-between items-start ${
                      job.ativa ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={`font-semibold ${job.ativa ? 'text-azulUnibra-300' : 'text-gray-500'}`}>{job.titulo}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${job.ativa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {job.ativa ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{job.descricao}</p>
                        <p className="text-xs text-gray-400">Criada em: {new Date(job.criadoEm).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleJobStatus(job)}
                          disabled={isToggleLoading}
                          className={`p-2 rounded-lg ${job.ativa ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {isToggleLoading ? (
                            <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
                          ) : job.ativa ? (
                            <AlertCircle className="w-4 h-4"/>
                          ) : (
                            <CheckCircle className="w-4 h-4"/>
                          )}
                        </button>

                        {/* Edit */}
                        <button onClick={() => handleEditJob(job)} className="p-2 text-azulUnibra-300 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4"/>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={isDeleteLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          {isDeleteLoading ? (
                            <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4"/>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}

          {/* Candidates Tab Content */}
          {activeTab === 'candidates' && (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-azulUnibra-300">Banco de Talentos</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{filteredCandidates.length} candidato(s)</span>
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-azulUnibra-300" />
                    <label htmlFor="jobFilter" className="text-sm font-medium text-azulUnibra-300">
                      Filtrar por vaga:
                    </label>
                  </div>
                  <select
                    id="jobFilter"
                    value={selectedJobFilter}
                    onChange={handleJobFilterChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent"
                  >
                    <option value="">Todas as vagas</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                {loadingCandidates ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-azulUnibra-300 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-azulUnibra-300">Carregando candidatos...</span>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {selectedJobFilter ? 'Nenhum candidato encontrado para esta vaga' : 'Nenhum candidato cadastrado'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                  {filteredCandidates.map(candidate => {
                    const matchValue = Math.round(parseFloat(String(candidate.MATCH_COM_VAGA)) * 100);

                    return (
                      <div 
                        key={candidate.ID} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:bg-gray-50"
                        onClick={() => handleCandidateClick(candidate)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              {/* Esquerda */}
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-azulUnibra-300 text-lg">{candidate.NOME}</h3>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-azulUnibra-300 rounded-full">
                                  {candidate.VAGA}
                                </span>
                              </div>

                              {/* Direita (Match) */}
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-600">Match:</span>
                                <span
                                  className={`px-3 py-1 text-xs font-semibold rounded-full
                                    ${
                                      matchValue < 50
                                        ? "bg-red-100 text-red-600"
                                        : matchValue === 50
                                        ? "bg-yellow-100 text-yellow-600"
                                        : "bg-green-100 text-green-600"
                                    }`}
                                >
                                  {matchValue}%
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a href={`mailto:${candidate.EMAIL}`} className="text-azulUnibra-300 hover:underline">
                                  {candidate.EMAIL}
                                </a>
                              </div>

                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <p className="text-azulUnibra-300">
                                  {candidate.CPF}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <a href={`tel:${candidate.TELEFONE}`} className="text-azulUnibra-300 hover:underline">
                                  {candidate.TELEFONE}
                                </a>
                              </div>

                              {candidate.LINKEDIN && (
                                <div className="flex items-center space-x-2">
                                  <Linkedin className="w-4 h-4 text-gray-400" />
                                  <a
                                    href={candidate.LINKEDIN}
                                      target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-azulUnibra-300 hover:underline truncate"
                                  >
                                    LinkedIn
                                  </a>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {new Date(candidate.DATA_ULTIMA_CANDIDATURA).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2 ml-4">
                            <a
                              href={candidate.CURRICULO}
                              onClick={(e) => e.stopPropagation()}
                              rel="noopener noreferrer"
                              className="p-2 text-azulUnibra-300 hover:bg-blue-50 transition-colors rounded-lg inline-flex"
                              title="Baixar currículo"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Candidate Details Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-azulUnibra-300 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedCandidate.NOME}</h2>
                <p className="text-blue-100 text-sm">Detalhes do Candidato</p>
              </div>
              <button
                onClick={closeCandidateModal}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-blue-900 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-azulUnibra-300 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Informações Pessoais
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">CPF:</span>
                          <p className="text-azulUnibra-300">{selectedCandidate.CPF}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Email:</span>
                          <a href={`mailto:${selectedCandidate.EMAIL}`} className="text-azulUnibra-300 hover:underline block">
                            {selectedCandidate.EMAIL}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Telefone:</span>
                          <a href={`tel:${selectedCandidate.TELEFONE}`} className="text-azulUnibra-300 hover:underline block">
                            {selectedCandidate.TELEFONE}
                          </a>
                        </div>
                      </div>
                      {selectedCandidate.LINKEDIN && (
                        <div className="flex items-center space-x-3">
                          <Linkedin className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-sm font-medium text-gray-600">LinkedIn:</span>
                            <a
                              href={selectedCandidate.LINKEDIN}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-azulUnibra-300 hover:underline block"
                            >
                              Ver perfil
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-azulUnibra-300 mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Informações da Candidatura
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Vaga:</span>
                        <p className="text-azulUnibra-300 font-medium">{selectedCandidate.VAGA}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Descrição da Vaga:</span>
                        <p className="text-gray-700 text-sm mt-1">{selectedCandidate.DESCRICAO_DA_VAGA}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Match com a Vaga:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[120px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  Math.round(parseFloat(String(selectedCandidate.MATCH_COM_VAGA)) * 100) < 50
                                    ? "bg-red-500"
                                    : Math.round(parseFloat(String(selectedCandidate.MATCH_COM_VAGA)) * 100) === 50
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${Math.round(parseFloat(String(selectedCandidate.MATCH_COM_VAGA)) * 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-semibold ${
                              Math.round(parseFloat(String(selectedCandidate.MATCH_COM_VAGA)) * 100) < 50
                                ? "text-red-600"
                                : Math.round(parseFloat(String(selectedCandidate.MATCH_COM_VAGA)) * 100) === 50
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}>
                              {Math.round(parseFloat(String(selectedCandidate.MATCH_COM_VAGA)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Data da Candidatura:</span>
                          <p className="text-gray-700">{new Date(selectedCandidate.DATA_ULTIMA_CANDIDATURA).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Download className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-600">Currículo:</span>
                          <a
                            href={selectedCandidate.CURRICULO}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-azulUnibra-300 hover:underline block"
                          >
                            Baixar PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - AI Analysis */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-azulUnibra-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Análise da IA
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-blue-100 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedCandidate.ANALISE_DO_CANDIDATO}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600 bg-blue-100 rounded-lg p-2">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Esta análise foi gerada automaticamente por inteligência artificial</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <a
                href={selectedCandidate.CURRICULO}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-azulUnibra-300 hover:bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Currículo</span>
              </a>
              <button
                onClick={closeCandidateModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
