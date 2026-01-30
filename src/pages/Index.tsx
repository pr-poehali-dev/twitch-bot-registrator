import { useState } from 'react';
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

export default function Index() {
  const [accounts] = useState<Account[]>([
    { id: '1', username: 'bot_user_001', email: 'bot001@example.com', status: 'active', createdAt: '2026-01-29', lastUsed: '2026-01-30' },
    { id: '2', username: 'bot_user_002', email: 'bot002@example.com', status: 'active', createdAt: '2026-01-29', lastUsed: '2026-01-30' },
    { id: '3', username: 'bot_user_003', email: 'bot003@example.com', status: 'pending', createdAt: '2026-01-30', lastUsed: '-' },
    { id: '4', username: 'bot_user_004', email: 'bot004@example.com', status: 'active', createdAt: '2026-01-28', lastUsed: '2026-01-30' },
    { id: '5', username: 'bot_user_005', email: 'bot005@example.com', status: 'banned', createdAt: '2026-01-27', lastUsed: '2026-01-29' },
  ]);

  const [logs] = useState<Log[]>([
    { id: '1', type: 'success', message: 'Аккаунт bot_user_004 успешно зарегистрирован', timestamp: '2026-01-30 14:32:15' },
    { id: '2', type: 'info', message: 'OAuth токен обновлен для bot_user_001', timestamp: '2026-01-30 14:28:42' },
    { id: '3', type: 'error', message: 'Ошибка регистрации: Email уже используется', timestamp: '2026-01-30 14:15:33' },
    { id: '4', type: 'success', message: 'Аккаунт bot_user_002 добавлен в очередь ботов', timestamp: '2026-01-30 14:10:21' },
    { id: '5', type: 'info', message: 'Система запущена, инициализация завершена', timestamp: '2026-01-30 14:00:00' },
  ]);

  const stats = {
    total: 142,
    active: 128,
    pending: 9,
    banned: 5,
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
          <TabsList className="grid w-full grid-cols-4 h-12 bg-card/50">
            <TabsTrigger value="accounts" className="gap-2 data-[state=active]:bg-primary/20">
              <Icon name="Users" size={18} />
              Аккаунты
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
                      {accounts.map((account) => (
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
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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
                    <Input id="username" placeholder="bot_user_006" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="bot006@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input id="password" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>OAuth Token (опционально)</Label>
                    <Input placeholder="Будет сгенерирован автоматически" className="font-mono text-sm" />
                  </div>
                  <Button className="w-full gap-2" size="lg">
                    <Icon name="Zap" size={20} />
                    Зарегистрировать аккаунт
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
                    <Input id="count" type="number" placeholder="10" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Префикс username</Label>
                    <Input id="prefix" placeholder="bot_user_" className="font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Email домен</Label>
                    <Input id="domain" placeholder="@example.com" />
                  </div>
                  <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Прогресс регистрации</span>
                        <span className="font-mono">7/10</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                  </div>
                  <Button className="w-full gap-2" size="lg" variant="secondary">
                    <Icon name="Rocket" size={20} />
                    Запустить массовую регистрацию
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
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3 items-start p-3 rounded-lg bg-card/50 border border-border/20 hover:bg-card/70 transition-colors">
                        <Icon name={getLogIcon(log.type)} className={getLogColor(log.type)} size={20} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground font-mono">{log.timestamp}</p>
                        </div>
                      </div>
                    ))}
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
