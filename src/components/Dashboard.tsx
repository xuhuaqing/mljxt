import { LogOut } from 'lucide-react';
import { UserRole } from '../lib/supabase';
import DeveloperWorkbench from './DeveloperWorkbench';
import MerchantWorkbench from './MerchantWorkbench';
import TeacherWorkbench from './TeacherWorkbench';
import UserOrderCenter from './UserOrderCenter';

interface DashboardProps {
  role: UserRole;
  onLogout: () => void;
}

export default function Dashboard({ role, onLogout }: DashboardProps) {
  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-sky-500 to-blue-500 px-4 pt-4 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-sm mb-1">
          ✓
        </div>
        <h1 className="text-base font-semibold text-white">登录成功</h1>
        <p className="text-blue-100 text-xs mt-1">欢迎回来</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 flex flex-col">
        {role === 'user' && <UserOrderCenter />}
        {role === 'teacher' && <TeacherWorkbench />}
        {role === 'merchant' && <MerchantWorkbench />}
        {role === 'developer' && <DeveloperWorkbench />}
        {role !== 'user' && role !== 'teacher' && role !== 'merchant' && role !== 'developer' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-center text-sm mb-8">
              当前身份页面正在建设中
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-3 flex items-center justify-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-800 font-medium rounded-xl transition-all text-sm w-full"
        >
          <LogOut size={16} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
