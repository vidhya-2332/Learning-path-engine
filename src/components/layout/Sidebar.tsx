import { NavLink, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, Compass, ListChecks, Route, TrendingUp, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/intelligence', label: 'Skill Intelligence', icon: Brain },
  { to: '/app/recommendations', label: 'Recommendations', icon: Compass },
  { to: '/app/path', label: 'Learning Path', icon: Route },
  { to: '/app/progress', label: 'Progress', icon: TrendingUp },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-800/80 bg-neutral-950 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Adaptive Learning</div>
            <div className="text-xs text-neutral-500">Recommendation Engine</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-500/10 text-primary-300 border border-primary-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-neutral-800/80 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-500">
          <User className="h-3.5 w-3.5" />
          <span className="truncate">{user?.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-neutral-400 hover:text-error-400 hover:bg-error-500/10 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
