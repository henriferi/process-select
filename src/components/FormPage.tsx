import React, { useState } from 'react';
import { Upload, User, Mail, Phone, Linkedin, FileText, CheckCircle, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";


interface FormData {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  selectedJob: string;
  descDaVaga: string; // descrição da vaga
  pdfFile: File | null;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  selectedJob?: string;
  pdfFile?: string;
}

interface Job {
  id: string;
  titulo: string;
  descricao: string;
  ativa: boolean;
  criadoEm: string;
}

export default function FormPage() {
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    selectedJob: '',
    descDaVaga: '',
    pdfFile: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;


  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Nome completo é obrigatório';
    else if (formData.fullName.trim().length < 2) newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Email inválido';

    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    else if (formData.phone.trim().length < 10) newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    else if (!phoneRegex.test(formData.phone)) newErrors.phone = 'Formato de telefone inválido';

    if (formData.linkedin.trim() && !formData.linkedin.includes('linkedin.com')) {
      newErrors.linkedin = 'URL do LinkedIn inválida';
    }

    if (!formData.selectedJob) newErrors.selectedJob = 'Seleção de vaga é obrigatória';

    if (!formData.pdfFile) newErrors.pdfFile = 'Arquivo PDF é obrigatório';
    else if (formData.pdfFile.type !== 'application/pdf') newErrors.pdfFile = 'Apenas arquivos PDF são aceitos';
    else if (formData.pdfFile.size > 10 * 1024 * 1024) newErrors.pdfFile = 'Arquivo deve ter no máximo 10MB';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, pdfFile: file }));
    if (errors.pdfFile) setErrors(prev => ({ ...prev, pdfFile: undefined }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setFormData(prev => ({ ...prev, pdfFile: files[0] }));
      if (errors.pdfFile) setErrors(prev => ({ ...prev, pdfFile: undefined }));
    }
  };

  const handleJobFocus = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch(`${API_URL}/api/vagas/ativas`);
      if (!res.ok) throw new Error('Erro ao buscar vagas ativas');
      const data: Job[] = await res.json();
      setAvailableJobs(data.filter(job => job.ativa));

      {availableJobs.map(job => (
        <option key={job.id} value={job.id}>
          {job.titulo} {/* estava job.title */}
        </option>
      ))}
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
      setAvailableJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedJob = availableJobs.find(job => job.id === selectedId);
    setFormData(prev => ({
      ...prev,
      selectedJob: selectedId,
      descDaVaga: selectedJob?.descricao || '',
    }));
    if (errors.selectedJob) setErrors(prev => ({ ...prev, selectedJob: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (!recaptchaToken) {
      alert("Por favor, confirme o reCAPTCHA antes de enviar.");
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('idle');


    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('linkedin', formData.linkedin);
      formDataToSend.append('selectedJob', formData.selectedJob);

      const selectedJobObj = availableJobs.find(
        job => String(job.id) === String(formData.selectedJob)
      );
      formDataToSend.append('descDaVaga', selectedJobObj?.descricao || '');
      formDataToSend.append('nomeDaVaga', selectedJobObj?.titulo || '');

      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      formDataToSend.append("g-recaptcha-response", recaptchaToken);

      const response = await fetch(`${API_URL}/api/curriculos`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          linkedin: '',
          selectedJob: '',
          descDaVaga: '',
          pdfFile: null,
        });
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorText = await response.text();
        console.error('Erro no backend:', errorText);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-80 mx-auto mb-4">
            <img src="/assets/unibra-blue.png" alt="UNIBRA Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-azulUnibra-300 mb-2">Processo seletivo</h1>
          <p className="text-azulUnibra-300 text-sm">Preencha os dados abaixo para participar</p>
        </div>

        {/* Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Formulário enviado com sucesso!</p>
              <p className="text-green-700 text-sm">Entraremos em contato em breve.</p>
            </div>
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Erro ao enviar formulário</p>
              <p className="text-red-700 text-sm">Tente novamente em alguns instantes.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Nome completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                  errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu nome completo"
              />
            </div>
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu email"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Telefone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="(81) 99999-9999"
              />
            </div>
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* LinkedIn */}
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              LinkedIn <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Linkedin className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                  errors.linkedin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </div>
            {errors.linkedin && <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>}
          </div>

          {/* Job Selection */}
          <div>
            <label htmlFor="selectedJob" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Vaga de interesse
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <select
                id="selectedJob"
                name="selectedJob"
                value={formData.selectedJob}
                onChange={handleJobChange}
                onFocus={handleJobFocus}
                className="appearance-none block w-full pl-10 pr-3 py-2 border rounded-lg"
              >
                <option value="">
                  {loadingJobs ? 'Carregando vagas...' : 'Selecione uma vaga'}
                </option>
                {availableJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.titulo}
                  </option>
                ))}
              </select>
            </div>
            {errors.selectedJob && <p className="mt-1 text-sm text-red-600">{errors.selectedJob}</p>}
            {availableJobs.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">Nenhuma vaga selecionada! </p>
            )}
          </div>

          {/* PDF Upload */}
          <div>
            <label htmlFor="pdfFile" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Arquivo PDF
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                dragActive
                  ? 'border-azulUnibra-300 bg-blue-50'
                  : errors.pdfFile
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="pdfFile"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-azulUnibra-300' : 'text-gray-400'}`} />
                <div className="mt-4">
                  {formData.pdfFile ? (
                    <div>
                      <p className="text-sm font-medium text-azulUnibra-300">{formData.pdfFile.name}</p>
                      <p className="text-xs text-azulUnibra-300">{(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-azulUnibra-300">
                        <span className="font-medium">Clique para selecionar</span> ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-azulUnibra-300 mt-1">Apenas arquivos PDF (máx. 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {errors.pdfFile && <p className="mt-1 text-sm text-red-600">{errors.pdfFile}</p>}
          </div>

        <ReCAPTCHA
          sitekey="6Lfi78wrAAAAABsDR18JSQ1Ifjpr9cxvw3zqzOx6"
          onChange={(token) => setRecaptchaToken(token)}
        />

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-azulUnibra-300 hover:bg-blue-900 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Enviar candidatura</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-azulUnibra-300">
            Ao enviar este formulário, você concorda com nossos termos de uso.
          </p>
        </div>
      </div>
    </div>
  );
}
