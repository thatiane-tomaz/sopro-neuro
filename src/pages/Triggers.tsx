import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MediaPlayer from '@/components/MediaPlayer';

const triggers = [
  {
    id: 'cafe',
    title: 'Gatilho: Café',
    description: 'Para momentos após o café ou refeições',
    duration: '8min',
    color: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50/50',
  },
  {
    id: 'estresse',
    title: 'Gatilho: Estresse',
    description: 'Para situações de pressão ou ansiedade',
    duration: '10min',
    color: 'from-red-500/10 to-pink-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50/50',
  },
  {
    id: 'social',
    title: 'Gatilho: Social',
    description: 'Para encontros sociais e momentos com amigos',
    duration: '9min',
    color: 'from-blue-500/10 to-indigo-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50/50',
  },
  {
    id: 'tedio',
    title: 'Gatilho: Tédio',
    description: 'Para momentos de ociosidade e falta de atividade',
    duration: '7min',
    color: 'from-gray-500/10 to-slate-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50/50',
  },
  {
    id: 'bebida',
    title: 'Gatilho: Bebida Alcoólica',
    description: 'Para situações com consumo de álcool',
    duration: '8min',
    color: 'from-purple-500/10 to-violet-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50/50',
  },
  {
    id: 'trabalho',
    title: 'Gatilho: Pausa no Trabalho',
    description: 'Para intervalos e pausas durante o expediente',
    duration: '6min',
    color: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50/50',
  },
];

const Triggers = () => {
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    fileUrl: string;
    contentType: 'hypnosis';
  } | null>(null);

  const getMediaUrl = (triggerId: string) => {
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/gatilho_${triggerId}.mp3`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Hipnoses para Gatilhos
            </h1>
            <p className="text-lg text-muted-foreground">
              Áudios especializados para momentos de desejo intenso. Use quando sentir vontade de fumar em situações específicas.
            </p>
          </div>

          <Card className="bg-accent/5 border-accent/20 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Headphones className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Como usar</h3>
                <p className="text-sm text-muted-foreground">
                  Quando sentir vontade de fumar em uma situação específica, encontre o áudio correspondente ao gatilho e ouça com fones de ouvido em um local tranquilo. Respire fundo e deixe-se guiar pela hipnose.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Triggers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {triggers.map((trigger) => (
            <Card
              key={trigger.id}
              className={`overflow-hidden border-2 ${trigger.borderColor} bg-gradient-to-br ${trigger.color} hover:shadow-xl transition-all duration-300`}
            >
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${trigger.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Headphones className={`h-6 w-6 ${trigger.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {trigger.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {trigger.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    Duração: {trigger.duration}
                  </span>
                  <Button
                    size="sm"
                    className={`${trigger.bgColor} hover:${trigger.bgColor} ${trigger.textColor} border ${trigger.borderColor}`}
                    variant="outline"
                    onClick={() =>
                      setSelectedMedia({
                        title: trigger.title,
                        fileUrl: getMediaUrl(trigger.id),
                        contentType: 'hypnosis',
                      })
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Ouvir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20 p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">
            💡 Dicas para melhor resultado
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use fones de ouvido para melhor imersão</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Encontre um local tranquilo onde não será interrompido</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Ouça quantas vezes precisar durante o dia</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Identifique seus gatilhos principais e tenha os áudios sempre disponíveis</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Media Player */}
      {selectedMedia && (
        <MediaPlayer
          title={selectedMedia.title}
          fileUrl={selectedMedia.fileUrl}
          contentType={selectedMedia.contentType}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
};

export default Triggers;
