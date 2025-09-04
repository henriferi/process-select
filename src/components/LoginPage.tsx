import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginData {
  email: string;
  senha: string;
}

interface LoginErrors {
  email?: string;
  senha?: string;
  general?: string;
}

export default function LoginPage() {
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    senha: '',
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!loginData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    }

    if (!loginData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (loginData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(
        "https://process-select-backend.onrender.com/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Credenciais inválidas" });
        return;
      }

      // Login bem-sucedido → salvar token
      localStorage.setItem("token", data.token);

      // Redirecionar para dashboard
      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error(err);
      setErrors({ general: "Erro ao fazer login. Tente novamente." });
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
          <h1 className="text-2xl font-bold text-azulUnibra-300 mb-2">
            Área Administrativa
          </h1>
          <p className="text-azulUnibra-300 text-sm">
            Faça login para acessar o painel
          </p>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-azulUnibra-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-azulUnibra-300" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="senha"
                name="senha"
                value={loginData.senha}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-azulUnibra-300 focus:border-transparent transition-all duration-200 ${
                  errors.senha ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-azulUnibra-300 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-azulUnibra-300 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.senha && (
              <p className="mt-1 text-sm text-red-600">{errors.senha}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-azulUnibra-300 hover:bg-blue-900 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-azulUnibra-300">
            Acesso restrito a administradores autorizados
          </p>
        </div>
      </div>
    </div>
  );
}
