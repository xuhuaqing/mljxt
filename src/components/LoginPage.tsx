import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserRole } from '../lib/supabase';
import { login, roleCodeMap } from '../lib/api';

interface RoleOption {
  value: UserRole;
  label: string;
  color: string;
}

const roles: RoleOption[] = [
  { value: 'user', label: '用户', color: 'bg-blue-500' },
  { value: 'teacher', label: '老师', color: 'bg-emerald-500' },
  { value: 'merchant', label: '商家', color: 'bg-orange-500' },
  { value: 'developer', label: '开发', color: 'bg-violet-500' },
];

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userName.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        userName: userName.trim(),
        password,
        role: roleCodeMap[selectedRole],
      });

      if (!result || String(result.code) !== '200') {
        setError(result?.msg || '登录失败');
        return;
      }

      if (result.data === true) {
        onLoginSuccess(selectedRole);
      } else {
        setError(result.msg || '登录失败');
      }
    } catch {
      setError('登录失败，请检查网络或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-white text-center">欢迎登录</h1>
        <p className="text-blue-100 text-sm text-center mt-2">选择身份，开启体验</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 flex flex-col">
        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            您的身份
          </label>
          <div className="grid grid-cols-4 gap-2">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`py-2 px-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedRole === role.value
                    ? `${role.color} text-white shadow-md scale-105`
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 flex-1">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-slate-800 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-slate-800 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-all text-base disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '立即登录'}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 pb-2">
            
          </p>
        </form>
      </div>
    </div>
  );
}
