import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ErrorLog {
  id: string;
  user_id: string | null;
  error_message: string;
  error_stack: string | null;
  error_context: string | null;
  page_url: string | null;
  platform: string | null;
  created_at: string;
}

const ErrorLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | '24h' | '7d'>('7d');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('app_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filter === '24h') {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', since);
      } else if (filter === '7d') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', since);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [isAdmin, filter]);

  const clearOldLogs = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('app_error_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    if (error) {
      toast({ title: 'Erro ao limpar logs', variant: 'destructive' });
    } else {
      toast({ title: 'Logs antigos removidos' });
      fetchLogs();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Logs de Erros</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-card rounded-lg p-3 text-center border border-border">
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card rounded-lg p-3 text-center border border-border">
            <p className="text-2xl font-bold text-foreground">
              {new Set(logs.map(l => l.error_message)).size}
            </p>
            <p className="text-xs text-muted-foreground">Únicos</p>
          </div>
          <div className="bg-card rounded-lg p-3 text-center border border-border">
            <p className="text-2xl font-bold text-foreground">
              {new Set(logs.filter(l => l.user_id).map(l => l.user_id)).size}
            </p>
            <p className="text-xs text-muted-foreground">Usuários</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(['24h', '7d', 'all'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === '24h' ? '24h' : f === '7d' ? '7 dias' : 'Todos'}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
          </Button>
          <Button size="sm" variant="outline" onClick={clearOldLogs} className="text-destructive">
            <Trash2 className="w-3 h-3 mr-1" /> Limpar +30d
          </Button>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum erro registrado 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground font-medium line-clamp-1 flex-1">
                    {log.error_message}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.platform && (
                      <Badge variant="outline" className="text-[10px]">
                        {log.platform}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                </div>

                {log.page_url && (
                  <p className="text-[10px] text-muted-foreground mt-1">{log.page_url}</p>
                )}

                {expandedId === log.id && (
                  <div className="mt-3 space-y-2">
                    {log.error_context && (
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">Contexto:</p>
                        <p className="text-xs text-foreground">{log.error_context}</p>
                      </div>
                    )}
                    {log.error_stack && (
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">Stack:</p>
                        <pre className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto max-h-40 whitespace-pre-wrap">
                          {log.error_stack}
                        </pre>
                      </div>
                    )}
                    {log.user_id && (
                      <p className="text-[10px] text-muted-foreground">
                        User: {log.user_id.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorLogs;
