
import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from '../../utils/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {!session ? <Login /> : <Dashboard session={session} />}
    </>
  );
}

export default App;
