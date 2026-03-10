import { Search, LogOut, ArrowRight, Home, BarChart2, Heart } from "lucide-react";

interface HeaderProps {
  userEmail: string | null;
  currentPage: string;
  setPage: (page: "home" | "analytics" | "favorites") => void;
  favoritesCount: number;
  onLoginClick: () => void;
}

export default function Header({ userEmail, currentPage, setPage, favoritesCount, onLoginClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage("home")}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">ProjectPromoIA</span>
            </div>

            <nav className="hidden md:flex gap-6">
              <button onClick={() => setPage("home")} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentPage === 'home' ? 'text-[#05C71F]' : 'text-gray-400 hover:text-white'}`}>
                <Home className="w-4 h-4"/> Home
              </button>
              <button onClick={() => setPage("analytics")} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentPage === 'analytics' ? 'text-[#05C71F]' : 'text-gray-400 hover:text-white'}`}>
                <BarChart2 className="w-4 h-4"/> Analytics
              </button>
              <button onClick={() => setPage("favorites")} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${currentPage === 'favorites' ? 'text-[#05C71F]' : 'text-gray-400 hover:text-white'}`}>
                <Heart className="w-4 h-4"/> Favoritos ({favoritesCount})
              </button>
            </nav>
          </div>

          {userEmail ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-300 hidden sm:block">Olá, {userEmail.split('@')[0]}</span>
              <button onClick={onLoginClick} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick} className="group inline-flex items-center overflow-hidden h-10 rounded-2xl bg-[#05C71F] border border-black/20 hover:-translate-y-[1px] active:scale-[0.99] transition-all">
              <span className="h-10 w-11 flex items-center justify-center bg-white/10">
                <ArrowRight className="w-5 h-5 text-black" />
              </span>
              <span className="h-10 px-5 flex items-center justify-center font-extrabold text-white">Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}