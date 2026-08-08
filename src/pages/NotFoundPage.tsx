import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg mb-6">
          <Compass className="w-10 h-10 text-white" />
        </div>
        <p className="text-7xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/" className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Go back</Link>
          <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Home</Link>
        </div>
      </div>
    </div>
  );
}
