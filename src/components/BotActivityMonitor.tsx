import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '@/components/ui/icon';

type ActivityData = {
  timestamp: string;
  messages: number;
  viewers: number;
  activeBots: number;
};

type BotStats = {
  totalMessages: number;
  activeBotsCount: number;
  avgResponseTime: number;
  successRate: number;
};

type MessageDistribution = {
  style: string;
  count: number;
  percentage: number;
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function BotActivityMonitor({ channelId, channelName }: { channelId: string; channelName: string }) {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [botStats, setBotStats] = useState<BotStats>({
    totalMessages: 0,
    activeBotsCount: 0,
    avgResponseTime: 0,
    successRate: 0,
  });
  const [messageDistribution, setMessageDistribution] = useState<MessageDistribution[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    generateMockData();
    
    if (isLive) {
      const interval = setInterval(() => {
        updateLiveData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [channelId, isLive]);

  const generateMockData = () => {
    const now = Date.now();
    const data: ActivityData[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const time = new Date(now - i * 60000);
      data.push({
        timestamp: time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        messages: Math.floor(Math.random() * 30) + 10,
        viewers: Math.floor(Math.random() * 50) + 20,
        activeBots: Math.floor(Math.random() * 15) + 5,
      });
    }
    
    setActivityData(data);
    
    setBotStats({
      totalMessages: 1247,
      activeBotsCount: 12,
      avgResponseTime: 1.8,
      successRate: 98.5,
    });
    
    setMessageDistribution([
      { style: 'Обычные', count: 450, percentage: 36 },
      { style: 'Восторженные', count: 380, percentage: 30 },
      { style: 'Поддержка', count: 280, percentage: 22 },
      { style: 'Вопросы', count: 100, percentage: 8 },
      { style: 'Токсичные', count: 37, percentage: 4 },
    ]);
  };

  const updateLiveData = () => {
    setActivityData(prev => {
      const newData = [...prev.slice(1)];
      const now = new Date();
      newData.push({
        timestamp: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        messages: Math.floor(Math.random() * 30) + 10,
        viewers: Math.floor(Math.random() * 50) + 20,
        activeBots: Math.floor(Math.random() * 15) + 5,
      });
      return newData;
    });
    
    setBotStats(prev => ({
      ...prev,
      totalMessages: prev.totalMessages + Math.floor(Math.random() * 5) + 1,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="Activity" size={20} />
            Мониторинг активности: {channelName}
          </h3>
          <p className="text-sm text-muted-foreground">Аналитика работы ботов в реальном времени</p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLive 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isLive ? (
            <>
              <Icon name="Square" size={16} />
              Остановить
            </>
          ) : (
            <>
              <Icon name="Play" size={16} />
              Запустить LIVE
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Всего сообщений</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botStats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Icon name="TrendingUp" size={12} className="text-green-500" />
              +24% за последний час
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Активных ботов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botStats.activeBotsCount}</div>
            <Progress value={80} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Среднее время</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{botStats.avgResponseTime}с</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Icon name="Zap" size={12} className="text-yellow-500" />
              Отличная скорость
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Успешность</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{botStats.successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Доставлено без ошибок</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Activity" size={16} />
              График активности
              {isLive && (
                <Badge variant="destructive" className="ml-auto animate-pulse">
                  <Icon name="Circle" size={8} className="mr-1 fill-current" />
                  LIVE
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Сообщения и зрители за последние 30 минут</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Сообщения"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="viewers" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Зрители"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Users" size={16} />
              Активность ботов
            </CardTitle>
            <CardDescription>Количество активных ботов по времени</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="activeBots" fill="#8b5cf6" name="Активные боты" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="PieChart" size={16} />
              Распределение стилей
            </CardTitle>
            <CardDescription>Типы сообщений от ботов</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={messageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {messageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {messageDistribution.map((item, index) => (
                <div key={item.style} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.style}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="BarChart3" size={16} />
              Топ производительных ботов
            </CardTitle>
            <CardDescription>Боты с наибольшим количеством сообщений</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'bot_user_42', messages: 156, status: 'active', efficiency: 98 },
                { name: 'bot_user_17', messages: 143, status: 'active', efficiency: 96 },
                { name: 'bot_user_89', messages: 138, status: 'active', efficiency: 95 },
                { name: 'bot_user_31', messages: 127, status: 'active', efficiency: 93 },
                { name: 'bot_user_64', messages: 119, status: 'active', efficiency: 91 },
              ].map((bot, index) => (
                <div key={bot.name} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{bot.name}</span>
                      <span className="text-sm text-muted-foreground">{bot.messages} сообщений</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={bot.efficiency} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-12">{bot.efficiency}%</span>
                    </div>
                  </div>
                  <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                    <Icon name="Circle" size={8} className="mr-1 fill-current" />
                    {bot.status === 'active' ? 'Активен' : 'Ожидание'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            Статус системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Icon name="CheckCircle2" size={24} className="text-green-500" />
              <div>
                <p className="font-medium text-sm">API подключение</p>
                <p className="text-xs text-muted-foreground">Стабильно</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Icon name="Database" size={24} className="text-green-500" />
              <div>
                <p className="font-medium text-sm">База данных</p>
                <p className="text-xs text-muted-foreground">Работает</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Icon name="Bot" size={24} className="text-green-500" />
              <div>
                <p className="font-medium text-sm">AI движок</p>
                <p className="text-xs text-muted-foreground">Онлайн</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
