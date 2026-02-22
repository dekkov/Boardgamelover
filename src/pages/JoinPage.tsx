import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { getTable, joinTable } from '../api/tables';
import { toast } from 'sonner';

export function JoinPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'error' | 'joining'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAuthModalOpen(true);
      setStatus('error');
      return;
    }

    if (!tableId || !token) {
      setErrorMessage('Invalid invite link.');
      setStatus('error');
      return;
    }

    const tryJoin = async () => {
      setStatus('joining');
      try {
        const table = await getTable(tableId);
        if (!table) {
          setErrorMessage('This table no longer exists.');
          setStatus('error');
          return;
        }
        if (table.status === 'in_game' || table.status === 'finished') {
          setErrorMessage('This game has already started. You cannot join.');
          setStatus('error');
          return;
        }
        if (table.visibility === 'private' && token !== table.invite_code) {
          setErrorMessage('This invite link is invalid or has expired.');
          setStatus('error');
          return;
        }
        // Already a member — just navigate to the lobby
        const isAlreadyMember = table.players.some(p => p.user_id === user.id);
        if (!isAlreadyMember) {
          await joinTable(tableId);
        }
        navigate(`/table/${tableId}`, { replace: true });
      } catch (err: any) {
        toast.error(err.message || 'Failed to join table');
        setErrorMessage(err.message || 'Failed to join table');
        setStatus('error');
      }
    };

    tryJoin();
  }, [user, authLoading, tableId, token]);

  // After user signs in via modal, re-run the join attempt
  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    setStatus('loading');
  };

  if (authLoading || status === 'joining' || (status === 'loading' && user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500">Joining table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 w-full max-w-sm space-y-6 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <Lock size={28} className="text-slate-600" />
        </div>
        {errorMessage ? (
          <>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Join</h2>
              <p className="text-sm text-slate-500">{errorMessage}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Go Home
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800">Sign in to Join</h2>
            <p className="text-sm text-slate-500">You need an account to join this table.</p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Sign In / Sign Up
            </button>
          </>
        )}
      </div>
      <AuthModal
        open={authModalOpen}
        onOpenChange={(open) => {
          setAuthModalOpen(open);
          if (!open && user) handleAuthSuccess();
        }}
      />
    </div>
  );
}
