import React, { useState } from 'react';
import { Upload, User, Mail, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  pdfFile: File | null;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  pdfFile?: string;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    pdfFile: null
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validate PDF file
    if (!formData.pdfFile) {
      newErrors.pdfFile = 'Arquivo PDF é obrigatório';
    } else if (formData.pdfFile.type !== 'application/pdf') {
      newErrors.pdfFile = 'Apenas arquivos PDF são aceitos';
    } else if (formData.pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
      newErrors.pdfFile = 'Arquivo deve ter no máximo 10MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, pdfFile: file }));
    
    if (errors.pdfFile) {
      setErrors(prev => ({ ...prev, pdfFile: undefined }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setFormData(prev => ({ ...prev, pdfFile: files[0] }));
      if (errors.pdfFile) {
        setErrors(prev => ({ ...prev, pdfFile: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch('https://n8n.grupounibra.com/webhook/ae8584ba-a951-4d37-bd0a-e5a314c5a56d', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          pdfFile: null
        });
        // Reset file input
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
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
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">  
            <FileText className="w-8 h-16 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">
            Processo seletivo UNIBRA
          </h1>
          <p className="text-gray-500 text-sm">
            Preencha os dados abaixo para participar
          </p>
        </div>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Formulário enviado com sucesso!</p>
              <p className="text-green-700 text-sm">Entraremos em contato em breve.</p>
            </div>
          </div>
        )}

        {/* Error Message */}
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
          {/* Full Name Field */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent transition-all duration-200 ${
                  errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu nome completo"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* PDF File Upload */}
          <div>
            <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo PDF
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                dragActive 
                  ? 'border-gray-700 bg-gray-50' 
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
                <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-gray-700' : 'text-gray-400'}`} />
                <div className="mt-4">
                  {formData.pdfFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {formData.pdfFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Clique para selecionar</span> ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas arquivos PDF (máx. 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {errors.pdfFile && (
              <p className="mt-1 text-sm text-red-600">{errors.pdfFile}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
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
          <p className="text-xs text-gray-500">
            Ao enviar este formulário, você concorda com nossos termos de uso.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;