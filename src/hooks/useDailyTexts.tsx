import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyTexts {
  fase_descricao: string | null;
  dia_descricao: string | null;
}

export const useDailyTexts = (dayNumber: number) => {
  const [texts, setTexts] = useState<DailyTexts>({
    fase_descricao: null,
    dia_descricao: null
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('daily_texts')
          .select('text_type, text_content')
          .eq('day_number', dayNumber)
          .in('text_type', ['fase_descricao', 'dia_descricao']);

        if (error) throw error;

        const faseDescricao = data?.find(item => item.text_type === 'fase_descricao')?.text_content || null;
        const diaDescricao = data?.find(item => item.text_type === 'dia_descricao')?.text_content || null;

        setTexts({
          fase_descricao: faseDescricao,
          dia_descricao: diaDescricao
        });
      } catch (error) {
        console.error('Error fetching daily texts:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar textos do dia",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, [dayNumber, toast]);

  return { texts, loading };
};