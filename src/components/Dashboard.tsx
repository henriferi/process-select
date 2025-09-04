import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase, FileText, Users, LogOut } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  internalDescription: string;
  createdAt: string;
}

interface JobFormData {
  title: string;
  internalDescription: string;
}

interface JobFormErrors {
  title?: string;
  internalDescription?: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData>({
    title: '',
    internalDescription: '',
  });
  const [jobFormErrors, setJobFormErrors] = useState<JobFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load jobs from localStorage on component mount
  useEffect(() => {
    const savedJobs = localStorage.getItem('unibra_jobs');
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    }
  }, []);

  // Save jobs to localStorage whenever jobs change
  useEffect(() => {
    localStorage.setItem('unibra_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const validateJobForm = (): boolean => {
    const newErrors: JobFormErrors = {};

    if (!jobFormData.title.trim()) {
      newErrors.title = 'Título da vaga é obrigatório';
    } else if (jobFormData.title.trim().length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!jobFormData.internalDescription.trim()) {
      newErrors.internalDescription = 'Descrição interna é obrigatória';
    } else if (jobFormData.internalDescription.trim().length < 10) {
      newErrors.internalDescription = 'Descrição deve ter pelo menos 10 caracteres';
    }

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
    
    if (!validateJobForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (editingJob) {
        // Update existing job
        setJobs(prev => prev.map(job => 
          job.id === editingJob.id 
            ? { ...job, title: jobFormData.title, internalDescription: jobFormData.internalDescription }
            : job
        ));
      } else {
        // Create new job
        const newJob: Job = {
          id: Date.now().toString(),
          title: jobFormData.title,
          internalDescription: jobFormData.internalDescription,
          createdAt: new Date().toISOString(),
        };
        setJobs(prev => [...prev, newJob]);
      }

      // Reset form
      setJobFormData({ title: '', internalDescription: '' });
      setShowJobForm(false);
      setEditingJob(null);
    } catch (error) {
      console.error('Erro ao salvar vaga:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      internalDescription: job.internalDescription,
    });
    setShowJobForm(true);
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta vaga?')) {
      setJobs(prev => prev.filter(job => job.id !== jobId));
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      window.location.href = '/';
    }
  };

  const cancelJobForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
    setJobFormData({ title: '', internalDescription: '' });
    setJobFormErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10">
                <img src="/assets/unibra-blue.png" alt="UNIBRA Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-azulUnibra-300">Dashboard Administrativo</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-azulUnibra-300 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-azulUnibra-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vagas Ativas</p>
                <p className="text-2xl font-bold text-azulUnibra-300">{jobs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Candidaturas</p>
                <p className="text-2xl font-bold text-azulUnibra-300">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Formulários</p>
                <p className="text-2xl font-bold text-azulUnibra-300">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-azulUnibra-300">Gerenciar Vagas</h2>
              <button
                onClick={() => setShowJobForm(true)}
                className="bg-azulUnibra-300 hover:bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Vaga</span>
              </button>
            </div>
          </div>

          {/* Job Form */}
          {showJobForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-md font-medium text-azulUnibra-300 mb-4">
                {editingJob ? 'Editar Vaga' : 'Nova Vaga'}
              </h3>
              <form onSubmit={handleJobSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-azulUnibra-300 mb-2">
                    Título da Vaga
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={jobFormData.title}
                    onChange={handleJobFormChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                      jobFormErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Desenvolvedor Frontend"
                  />
                  {jobFormErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{jobFormErrors.title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="internalDescription" className="block text-sm font-medium text-azulUnibra-300 mb-2">
                    Descrição Interna
                  </label>
                  <textarea
                    id="internalDescription"
                    name="internalDescription"
                    value={jobFormData.internalDescription}
                    onChange={handleJobFormChange}
                    rows={3}
                    className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 resize-none ${
                      jobFormErrors.internalDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Descrição interna da vaga (não será exibida publicamente)"
                  />
                  {jobFormErrors.internalDescription && (
                    <p className="mt-1 text-sm text-red-600">{jobFormErrors.internalDescription}</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-azulUnibra-300 hover:bg-blue-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>{editingJob ? 'Atualizar' : 'Criar'} Vaga</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelJobForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Jobs List */}
          <div className="p-6">
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma vaga cadastrada</p>
                <p className="text-sm text-gray-400">Clique em "Nova Vaga" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-azulUnibra-300 mb-2">{job.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{job.internalDescription}</p>
                        <p className="text-xs text-gray-400">
                          Criada em: {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-2 text-azulUnibra-300 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar vaga"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir vaga"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
</parameter>