import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/cb3eb127-fcf9-4bb9-8d92-4c8186b1a52a';

type BotConfig = {
  channelId: string;
  messageFrequency: number;
  activityLevel: 'low' | 'medium' | 'high';
  messageStyle: 'casual' | 'enthusiastic' | 'toxic' | 'supportive';
  useContextAnalysis: boolean;
  enabled: boolean;
};

type Props = {
  channelId: string;
  channelName: string;
  onClose: () => void;
};

export default function BotControlPanel({ channelId, channelName, onClose }: Props) {
  const { toast } = useToast();
  const [config, setConfig] = useState<BotConfig>({
    channelId,
    messageFrequency: 5,
    activityLevel: 'medium',
    messageStyle: 'casual',
    useContextAnalysis: true,
    enabled: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}?action=bot-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast({
          title: 'Настройки сохранены',
          description: 'Конфигурация ботов обновлена',
        });
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getFrequencyLabel = (value: number) => {
    if (value <= 3) return 'Редко (1-2 сообщения/мин)';
    if (value <= 7) return 'Средне (3-5 сообщений/мин)';
    return 'Часто (6-10 сообщений/мин)';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Settings" size={24} />
                Настройка накрутки
              </CardTitle>
              <CardDescription>Канал: {channelName}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Включить накрутку</Label>
              <p className="text-sm text-muted-foreground">
                Активировать ботов для этого канала
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Частота сообщений</Label>
              <p className="text-sm text-muted-foreground mb-4">
                {getFrequencyLabel(config.messageFrequency)}
              </p>
              <Slider
                value={[config.messageFrequency]}
                onValueChange={([value]) => setConfig({ ...config, messageFrequency: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Уровень активности</Label>
              <Select
                value={config.activityLevel}
                onValueChange={(value) =>
                  setConfig({ ...config, activityLevel: value as BotConfig['activityLevel'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Icon name="TrendingDown" size={16} />
                      Низкий — редкие сообщения, минимум взаимодействия
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Icon name="Activity" size={16} />
                      Средний — естественная активность
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Icon name="TrendingUp" size={16} />
                      Высокий — активный чат, частые реакции
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Стиль сообщений</Label>
              <Select
                value={config.messageStyle}
                onValueChange={(value) =>
                  setConfig({ ...config, messageStyle: value as BotConfig['messageStyle'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">
                    <div className="flex items-center gap-2">
                      <Icon name="MessageCircle" size={16} />
                      Обычный — нейтральные комментарии
                    </div>
                  </SelectItem>
                  <SelectItem value="enthusiastic">
                    <div className="flex items-center gap-2">
                      <Icon name="Zap" size={16} />
                      Восторженный — поддержка, хайп, эмоции
                    </div>
                  </SelectItem>
                  <SelectItem value="toxic">
                    <div className="flex items-center gap-2">
                      <Icon name="Flame" size={16} />
                      Токсичный — троллинг, провокации
                    </div>
                  </SelectItem>
                  <SelectItem value="supportive">
                    <div className="flex items-center gap-2">
                      <Icon name="Heart" size={16} />
                      Поддерживающий — позитив, советы, помощь
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Умные боты (AI)</Label>
                <p className="text-sm text-muted-foreground">
                  Анализ экрана стрима и контекстные сообщения
                </p>
              </div>
              <Switch
                checked={config.useContextAnalysis}
                onCheckedChange={(useContextAnalysis) =>
                  setConfig({ ...config, useContextAnalysis })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить настройки
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>

          {config.useContextAnalysis && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Icon name="Sparkles" size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Умные боты используют GPT-4o Vision
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Боты будут делать скриншоты стрима, анализировать что происходит на экране и писать
                    релевантные комментарии. Например: реакции на игровые моменты, советы, обсуждение
                    происходящего.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
