import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase, FileText, Users, LogOut, AlertCircle, CheckCircle } from 'lucide-react';

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

interface JobFormErrors {
  titulo?: string;
  descricao?: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData>({ titulo: '', descricao: '' });
  const [jobFormErrors, setJobFormErrors] = useState<JobFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadingToggleIds, setLoadingToggleIds] = useState<number[]>([]);
  const [loadingDeleteIds, setLoadingDeleteIds] = useState<number[]>([]);

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
        </div>
      </div>
    </div>
  );
}
