
import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from '../../utils/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      setSession(session);
      if (session) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (!isMounted) {
          return;
        }
        setSession(refreshed ?? session);
      }
    };
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      setShowLogin(false);
    }
  }, [session]);

  return (
    <>
      {showLogin ? (
        <Login onClose={() => setShowLogin(false)} />
      ) : (
        <Dashboard session={session} onRequestLogin={() => setShowLogin(true)} />
      )}
    </>
  );
}

export default App;
