import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

type Account = {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'pending' | 'banned';
  createdAt: string;
  lastUsed: string;
};

type Log = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: string;
};

type Stats = {
  total: number;
  active: number;
  pending: number;
  banned: number;
};

type Channel = {
  id: string;
  channelName: string;
  channelUrl: string;
  targetViewers: number;
  activeBots: number;
  status: string;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  sentAt: string;
  status: string;
  isAiGenerated?: boolean;
  contextUsed?: string;
};

const API_URL = 'https://functions.poehali.dev/cb3eb127-fcf9-4bb9-8d92-4c8186b1a52a';

export default function Index() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    pending: 0,
    banned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPrefix, setBulkPrefix] = useState('bot_user_');
  const [bulkDomain, setBulkDomain] = useState('@example.com');
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [targetViewers, setTargetViewers] = useState(10);
  const [channelSubmitting, setChannelSubmitting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}?action=list`);
      const data = await response.json();
      setAccounts(data.accounts);
      setStats(data.stats);
    } catch (error) {
      console.error('Ошибка загрузки аккаунтов:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}?action=logs`);
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Ошибка загрузки логов:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${API_URL}?action=channels`);
      const data = await response.json();
      setChannels(data.channels);
    } catch (error) {
      console.error('Ошибка загрузки каналов:', error);
    }
  };

  const fetchChatMessages = async (channelId: string) => {
    try {
      const response = await fetch(`${API_URL}?action=chat-messages&channelId=${channelId}`);
      const data = await response.json();
      setChatMessages(data.messages);
      setSelectedChannelId(channelId);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAccounts(), fetchLogs(), fetchChannels()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      alert('Заполните все поля');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Аккаунт успешно создан!');
        setUsername('');
        setEmail('');
        setPassword('');
        await loadData();
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Заблокировать аккаунт ${username}?`)) return;

    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    }
  };

  const handleBulkRegister = async () => {
    if (bulkCount < 1 || bulkCount > 100) {
      alert('Количество должно быть от 1 до 100');
      return;
    }

    setBulkSubmitting(true);
    setBulkProgress(0);
    setBulkTotal(bulkCount);

    try {
      const response = await fetch(`${API_URL}?action=bulk-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: bulkCount,
          prefix: bulkPrefix,
          domain: bulkDomain,
          password: 'DefaultPass123'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBulkProgress(data.created);
        alert(`Создано: ${data.created} аккаунтов\nОшибок: ${data.failed}`);
        await loadData();
      } else {
        alert(data.error || 'Ошибка массовой регистрации');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleAddChannel = async () => {
    if (!channelName || !channelUrl) {
      alert('Заполните название и URL канала');
      return;
    }

    setChannelSubmitting(true);
    try {
      const response = await fetch(`${API_URL}?action=add-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          channelUrl,
          targetViewers
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Канал успешно добавлен!');
        setChannelName('');
        setChannelUrl('');
        setTargetViewers(10);
        await loadData();
      } else {
        alert(data.error || 'Ошибка добавления канала');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    } finally {
      setChannelSubmitting(false);
    }
  };

  const handleAssignBots = async (channelId: string, botCount: number) => {
    try {
      const response = await fetch(`${API_URL}?action=assign-bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          botCount
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Назначено ${data.assigned} ботов на канал`);
        await loadData();
      } else {
        alert(data.error || 'Ошибка назначения ботов');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    }
  };

  const handleStartBots = async (channelId: string) => {
    try {
      const response = await fetch(`${API_URL}?action=start-bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Запущено ${data.started} ботов! Сообщения отправлены в чат.`);
        await loadData();
        await fetchChatMessages(channelId);
      } else {
        alert(data.error || 'Ошибка запуска ботов');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    }
  };

  const handleStopBots = async (channelId: string) => {
    try {
      const response = await fetch(`${API_URL}?action=stop-bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Остановлено ${data.stopped} ботов`);
        await loadData();
      } else {
        alert(data.error || 'Ошибка остановки ботов');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'banned': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return 'CheckCircle2';
      case 'error': return 'XCircle';
      case 'info': return 'Info';
      default: return 'Circle';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Icon name="Twitch" className="text-primary" size={40} />
              Twitch Bot Manager
            </h1>
            <p className="text-muted-foreground">Автоматическая регистрация и управление Twitch аккаунтами</p>
          </div>
          <Button size="lg" className="gap-2">
            <Icon name="Plus" size={20} />
            Создать аккаунт
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего аккаунтов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.total}</div>
                <Icon name="Users" className="text-primary" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активные</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-400">{stats.active}</div>
                <Icon name="CheckCircle2" className="text-green-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">В ожидании</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
                <Icon name="Clock" className="text-yellow-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Заблокированные</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-400">{stats.banned}</div>
                <Icon name="Ban" className="text-red-400" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-card/50">
            <TabsTrigger value="accounts" className="gap-2 data-[state=active]:bg-primary/20">
              <Icon name="Users" size={18} />
              Аккаунты
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2 data-[state=active]:bg-primary/20">
              <Icon name="Radio" size={18} />
              Каналы
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2 data-[state=active]:bg-primary/20">
              <Icon name="UserPlus" size={18} />
              Регистрация
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-primary/20">
              <Icon name="ScrollText" size={18} />
              Логи
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary/20">
              <Icon name="Settings" size={18} />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4 mt-6">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Users" size={24} />
                  Управление аккаунтами
                </CardTitle>
                <CardDescription>Список всех зарегистрированных Twitch аккаунтов</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input placeholder="Поиск по username или email..." className="max-w-md" />
                </div>
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Создан</TableHead>
                        <TableHead>Последнее использование</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Загрузка...
                          </TableCell>
                        </TableRow>
                      ) : accounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Нет аккаунтов
                          </TableCell>
                        </TableRow>
                      ) : (
                        accounts.map((account) => (
                          <TableRow key={account.id} className="border-border/40 hover:bg-muted/30">
                            <TableCell className="font-mono font-medium">{account.username}</TableCell>
                            <TableCell className="text-muted-foreground">{account.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(account.status)}>
                                {account.status === 'active' && 'Активен'}
                                {account.status === 'pending' && 'Ожидание'}
                                {account.status === 'banned' && 'Заблокирован'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{account.createdAt}</TableCell>
                            <TableCell className="text-muted-foreground">{account.lastUsed}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Icon name="Eye" size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Icon name="Edit" size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                  onClick={() => handleDelete(account.id, account.username)}
                                >
                                  <Icon name="Trash2" size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Radio" size={24} />
                    Добавить канал
                  </CardTitle>
                  <CardDescription>Укажите Twitch канал для направления ботов</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="channelName">Название канала</Label>
                    <Input 
                      id="channelName" 
                      placeholder="example_streamer"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channelUrl">URL канала</Label>
                    <Input 
                      id="channelUrl" 
                      placeholder="https://twitch.tv/example_streamer"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetViewers">Целевое количество зрителей</Label>
                    <Input 
                      id="targetViewers" 
                      type="number"
                      placeholder="10"
                      value={targetViewers}
                      onChange={(e) => setTargetViewers(parseInt(e.target.value) || 10)}
                      min="1"
                    />
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={handleAddChannel}
                    disabled={channelSubmitting}
                  >
                    <Icon name="Plus" size={20} />
                    {channelSubmitting ? 'Добавление...' : 'Добавить канал'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="List" size={24} />
                    Активные каналы
                  </CardTitle>
                  <CardDescription>Управление каналами и ботами</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
                      ) : channels.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Нет каналов</div>
                      ) : (
                        channels.map((channel) => (
                          <Card key={channel.id} className="bg-muted/20 border-border/40">
                            <CardContent className="pt-6 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-lg">{channel.channelName}</h3>
                                  <a 
                                    href={channel.channelUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Icon name="ExternalLink" size={14} />
                                    {channel.channelUrl}
                                  </a>
                                </div>
                                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                                  {channel.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Целевые зрители</p>
                                  <p className="font-mono font-semibold">{channel.targetViewers}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Активных ботов</p>
                                  <p className="font-mono font-semibold text-primary">{channel.activeBots}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <Button 
                                    className="gap-2" 
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      const count = prompt('Сколько ботов назначить на канал?', channel.targetViewers.toString());
                                      if (count) handleAssignBots(channel.id, parseInt(count));
                                    }}
                                  >
                                    <Icon name="Users" size={16} />
                                    Назначить
                                  </Button>
                                  <Button 
                                    className="gap-2" 
                                    size="sm"
                                    onClick={() => handleStartBots(channel.id)}
                                  >
                                    <Icon name="Play" size={16} />
                                    Запустить
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20">
                                  <Icon name="Sparkles" className="text-primary" size={16} />
                                  <span className="text-xs text-primary font-medium">AI контекст активен</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  className="gap-2" 
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStopBots(channel.id)}
                                >
                                  <Icon name="Square" size={16} />
                                  Остановить
                                </Button>
                                <Button 
                                  className="gap-2" 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fetchChatMessages(channel.id)}
                                >
                                  <Icon name="MessageCircle" size={16} />
                                  Чат
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {selectedChannelId && (
                <Card className="border-border/40 lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="MessageCircle" size={24} />
                        Активность в чате
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedChannelId(null)}
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    </div>
                    <CardDescription>Сообщения отправленные ботами на канале</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">Нет сообщений</div>
                        ) : (
                          chatMessages.map((msg) => (
                            <div key={msg.id} className="flex gap-3 items-start p-3 rounded-lg bg-card/50 border border-border/20 hover:bg-card/70 transition-colors">
                              {msg.isAiGenerated ? (
                                <Icon name="Sparkles" className="text-primary" size={20} />
                              ) : (
                                <Icon name="Bot" className="text-muted-foreground" size={20} />
                              )}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{msg.username}</span>
                                  {msg.isAiGenerated && (
                                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 text-xs">
                                      AI
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground font-mono">{msg.sentAt}</span>
                                </div>
                                <p className="text-sm">{msg.message}</p>
                                {msg.contextUsed && (
                                  <p className="text-xs text-muted-foreground italic mt-1">
                                    Контекст: {msg.contextUsed.substring(0, 60)}...
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                {msg.status}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="UserPlus" size={24} />
                    Регистрация нового аккаунта
                  </CardTitle>
                  <CardDescription>Автоматическое создание Twitch аккаунта для бота</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="bot_user_006" 
                      className="font-mono"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="bot006@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OAuth Token (опционально)</Label>
                    <Input placeholder="Будет сгенерирован автоматически" className="font-mono text-sm" disabled />
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    size="lg"
                    onClick={handleRegister}
                    disabled={submitting}
                  >
                    <Icon name="Zap" size={20} />
                    {submitting ? 'Регистрация...' : 'Зарегистрировать аккаунт'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Layers" size={24} />
                    Массовая регистрация
                  </CardTitle>
                  <CardDescription>Создание нескольких аккаунтов одновременно</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">Количество аккаунтов</Label>
                    <Input 
                      id="count" 
                      type="number" 
                      placeholder="10" 
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 10)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Префикс username</Label>
                    <Input 
                      id="prefix" 
                      placeholder="bot_user_" 
                      className="font-mono"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Email домен</Label>
                    <Input 
                      id="domain" 
                      placeholder="@example.com"
                      value={bulkDomain}
                      onChange={(e) => setBulkDomain(e.target.value)}
                    />
                  </div>
                  {bulkSubmitting && (
                    <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Прогресс регистрации</span>
                          <span className="font-mono">{bulkProgress}/{bulkTotal}</span>
                        </div>
                        <Progress value={(bulkProgress / bulkTotal) * 100} className="h-2" />
                      </div>
                    </div>
                  )}
                  <Button 
                    className="w-full gap-2" 
                    size="lg" 
                    variant="secondary"
                    onClick={handleBulkRegister}
                    disabled={bulkSubmitting}
                  >
                    <Icon name="Rocket" size={20} />
                    {bulkSubmitting ? 'Регистрация...' : 'Запустить массовую регистрацию'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-6">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="ScrollText" size={24} />
                  Логи системы
                </CardTitle>
                <CardDescription>Отслеживание всех операций и событий</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] rounded-lg border border-border/40 p-4 bg-muted/10">
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Нет логов</div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="flex gap-3 items-start p-3 rounded-lg bg-card/50 border border-border/20 hover:bg-card/70 transition-colors">
                          <Icon name={getLogIcon(log.type)} className={getLogColor(log.type)} size={20} />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm">{log.message}</p>
                            <p className="text-xs text-muted-foreground font-mono">{log.timestamp}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Settings" size={24} />
                  Настройки интеграции
                </CardTitle>
                <CardDescription>Конфигурация OAuth и параметров регистрации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="Key" size={20} />
                    OAuth Credentials
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Client ID</Label>
                    <Input id="client_id" placeholder="your_twitch_client_id" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_secret">Client Secret</Label>
                    <Input id="client_secret" type="password" placeholder="••••••••••••••••" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redirect_uri">Redirect URI</Label>
                    <Input id="redirect_uri" placeholder="http://localhost:3000/callback" className="font-mono" />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon name="Sliders" size={20} />
                    Параметры регистрации
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="delay">Задержка между регистрациями (секунды)</Label>
                    <Input id="delay" type="number" placeholder="5" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_attempts">Максимум попыток при ошибке</Label>
                    <Input id="max_attempts" type="number" placeholder="3" defaultValue="3" />
                  </div>
                </div>

                <Button className="w-full gap-2" size="lg">
                  <Icon name="Save" size={20} />
                  Сохранить настройки
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}