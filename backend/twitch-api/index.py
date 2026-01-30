import json
import os
import psycopg2
from datetime import datetime
import hashlib
import random

def handler(event: dict, context) -> dict:
    '''API для управления Twitch аккаунтами и регистрации ботов'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        if method == 'GET' and path == 'list':
            cur.execute(f'''
                SELECT id, username, email, status, 
                       TO_CHAR(created_at, 'YYYY-MM-DD') as created_at,
                       COALESCE(TO_CHAR(last_used, 'YYYY-MM-DD'), '-') as last_used
                FROM {schema}.twitch_accounts
                ORDER BY created_at DESC
            ''')
            accounts = []
            for row in cur.fetchall():
                accounts.append({
                    'id': str(row[0]),
                    'username': row[1],
                    'email': row[2],
                    'status': row[3],
                    'createdAt': row[4],
                    'lastUsed': row[5]
                })
            
            cur.execute(f'SELECT COUNT(*) FROM {schema}.twitch_accounts')
            total = cur.fetchone()[0]
            
            cur.execute(f"SELECT COUNT(*) FROM {schema}.twitch_accounts WHERE status = 'active'")
            active = cur.fetchone()[0]
            
            cur.execute(f"SELECT COUNT(*) FROM {schema}.twitch_accounts WHERE status = 'pending'")
            pending = cur.fetchone()[0]
            
            cur.execute(f"SELECT COUNT(*) FROM {schema}.twitch_accounts WHERE status = 'banned'")
            banned = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'accounts': accounts,
                    'stats': {
                        'total': total,
                        'active': active,
                        'pending': pending,
                        'banned': banned
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'logs':
            cur.execute(f'''
                SELECT id, log_type, message, 
                       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp
                FROM {schema}.registration_logs
                ORDER BY created_at DESC
                LIMIT 50
            ''')
            logs = []
            for row in cur.fetchall():
                logs.append({
                    'id': str(row[0]),
                    'type': row[1],
                    'message': row[2],
                    'timestamp': row[3]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'logs': logs}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'register':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username')
            email = body.get('email')
            password = body.get('password')
            
            if not username or not email or not password:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Username, email и password обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(f'''
                INSERT INTO {schema}.twitch_accounts (username, email, password_hash, status)
                VALUES (%s, %s, %s, 'active')
                RETURNING id
            ''', (username, email, password_hash))
            
            account_id = cur.fetchone()[0]
            
            cur.execute(f'''
                INSERT INTO {schema}.registration_logs (account_id, log_type, message)
                VALUES (%s, 'success', %s)
            ''', (account_id, f'Аккаунт {username} успешно зарегистрирован'))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Аккаунт успешно создан',
                    'accountId': account_id
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'bulk-register':
            body = json.loads(event.get('body', '{}'))
            count = body.get('count', 10)
            prefix = body.get('prefix', 'bot_user_')
            domain = body.get('domain', '@example.com')
            password = body.get('password', 'DefaultPass123')
            
            if count < 1 or count > 100:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Количество должно быть от 1 до 100'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            created_accounts = []
            failed_accounts = []
            
            cur.execute(f'SELECT MAX(CAST(SUBSTRING(username FROM %s) AS INTEGER)) FROM {schema}.twitch_accounts WHERE username LIKE %s', 
                       (f'{len(prefix) + 1}', f'{prefix}%'))
            result = cur.fetchone()[0]
            start_num = (result + 1) if result else 1
            
            for i in range(count):
                username = f'{prefix}{start_num + i:03d}'
                email = f'{username}{domain}'
                
                try:
                    cur.execute(f'''
                        INSERT INTO {schema}.twitch_accounts (username, email, password_hash, status)
                        VALUES (%s, %s, %s, 'active')
                        RETURNING id
                    ''', (username, email, password_hash))
                    
                    account_id = cur.fetchone()[0]
                    created_accounts.append({'id': account_id, 'username': username, 'email': email})
                    
                except psycopg2.IntegrityError:
                    failed_accounts.append({'username': username, 'error': 'Username или email уже существует'})
                    continue
            
            if created_accounts:
                cur.execute(f'''
                    INSERT INTO {schema}.registration_logs (log_type, message)
                    VALUES ('success', %s)
                ''', (f'Массовая регистрация: создано {len(created_accounts)} аккаунтов',))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'created': len(created_accounts),
                    'failed': len(failed_accounts),
                    'accounts': created_accounts,
                    'errors': failed_accounts
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'channels':
            cur.execute(f'''
                SELECT id, channel_name, channel_url, target_viewers, active_bots, status,
                       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
                FROM {schema}.twitch_channels
                ORDER BY created_at DESC
            ''')
            channels = []
            for row in cur.fetchall():
                channels.append({
                    'id': str(row[0]),
                    'channelName': row[1],
                    'channelUrl': row[2],
                    'targetViewers': row[3],
                    'activeBots': row[4],
                    'status': row[5],
                    'createdAt': row[6]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'channels': channels}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'add-channel':
            body = json.loads(event.get('body', '{}'))
            channel_name = body.get('channelName')
            channel_url = body.get('channelUrl')
            target_viewers = body.get('targetViewers', 0)
            
            if not channel_name or not channel_url:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Название канала и URL обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                INSERT INTO {schema}.twitch_channels (channel_name, channel_url, target_viewers, status)
                VALUES (%s, %s, %s, 'active')
                RETURNING id
            ''', (channel_name, channel_url, target_viewers))
            
            channel_id = cur.fetchone()[0]
            
            cur.execute(f'''
                INSERT INTO {schema}.registration_logs (log_type, message)
                VALUES ('info', %s)
            ''', (f'Добавлен канал {channel_name}',))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'channelId': channel_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'assign-bots':
            body = json.loads(event.get('body', '{}'))
            channel_id = body.get('channelId')
            bot_count = body.get('botCount', 0)
            
            if not channel_id or bot_count < 1:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID канала и количество ботов обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                SELECT id FROM {schema}.twitch_accounts 
                WHERE status = 'active' AND (assigned_channel_id IS NULL OR assigned_channel_id = %s)
                LIMIT %s
            ''', (channel_id, bot_count))
            
            available_bots = [row[0] for row in cur.fetchall()]
            
            if not available_bots:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Нет доступных ботов'}),
                    'isBase64Encoded': False
                }
            
            for bot_id in available_bots:
                cur.execute(f'''
                    UPDATE {schema}.twitch_accounts 
                    SET assigned_channel_id = %s, is_active_on_channel = TRUE
                    WHERE id = %s
                ''', (channel_id, bot_id))
            
            cur.execute(f'''
                UPDATE {schema}.twitch_channels 
                SET active_bots = (
                    SELECT COUNT(*) FROM {schema}.twitch_accounts 
                    WHERE assigned_channel_id = %s AND is_active_on_channel = TRUE
                )
                WHERE id = %s
            ''', (channel_id, channel_id))
            
            cur.execute(f'''
                INSERT INTO {schema}.registration_logs (log_type, message)
                VALUES ('success', %s)
            ''', (f'Назначено {len(available_bots)} ботов на канал',))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'assigned': len(available_bots)}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'start-bots':
            body = json.loads(event.get('body', '{}'))
            channel_id = body.get('channelId')
            
            if not channel_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID канала обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                SELECT id, username FROM {schema}.twitch_accounts 
                WHERE assigned_channel_id = %s AND status = 'active' 
                AND (connection_status IS NULL OR connection_status = 'offline')
            ''', (channel_id,))
            
            bots_to_start = cur.fetchall()
            
            if not bots_to_start:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Нет ботов для запуска'}),
                    'isBase64Encoded': False
                }
            
            chat_messages = [
                'Привет всем!', 'Отличный стрим!', 'Круто!', 'Интересно смотреть',
                'Продолжай в том же духе', 'Супер!', 'Классно получается',
                'Поддерживаю!', 'Давай еще!', 'Это огонь!', 'Respect',
                'Лайк!', 'Top!', 'PogChamp', 'Kappa', 'LUL', 'GG', 'Nice',
                'Красавчик!', 'Молодец!', 'Продолжай'
            ]
            
            started_count = 0
            for bot_id, username in bots_to_start:
                cur.execute(f'''
                    UPDATE {schema}.twitch_accounts 
                    SET connection_status = 'online', last_connection_time = NOW()
                    WHERE id = %s
                ''', (bot_id,))
                
                cur.execute(f'''
                    INSERT INTO {schema}.bot_sessions (account_id, channel_id, status)
                    VALUES (%s, %s, 'active')
                    RETURNING id
                ''', (bot_id, channel_id))
                
                session_id = cur.fetchone()[0]
                
                messages_count = random.randint(1, 3)
                for _ in range(messages_count):
                    message = random.choice(chat_messages)
                    cur.execute(f'''
                        INSERT INTO {schema}.chat_messages (account_id, channel_id, session_id, message_text)
                        VALUES (%s, %s, %s, %s)
                    ''', (bot_id, channel_id, session_id, message))
                
                cur.execute(f'''
                    UPDATE {schema}.bot_sessions 
                    SET messages_sent = %s
                    WHERE id = %s
                ''', (messages_count, session_id))
                
                started_count += 1
            
            cur.execute(f'''
                INSERT INTO {schema}.registration_logs (log_type, message)
                VALUES ('success', %s)
            ''', (f'Запущено {started_count} ботов на канале',))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'started': started_count}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'stop-bots':
            body = json.loads(event.get('body', '{}'))
            channel_id = body.get('channelId')
            
            if not channel_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID канала обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                SELECT id FROM {schema}.twitch_accounts 
                WHERE assigned_channel_id = %s AND connection_status = 'online'
            ''', (channel_id,))
            
            bots_to_stop = [row[0] for row in cur.fetchall()]
            
            if not bots_to_stop:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Нет активных ботов'}),
                    'isBase64Encoded': False
                }
            
            for bot_id in bots_to_stop:
                cur.execute(f'''
                    UPDATE {schema}.twitch_accounts 
                    SET connection_status = 'offline'
                    WHERE id = %s
                ''', (bot_id,))
                
                cur.execute(f'''
                    UPDATE {schema}.bot_sessions 
                    SET status = 'stopped', ended_at = NOW()
                    WHERE account_id = %s AND channel_id = %s AND status = 'active'
                ''', (bot_id, channel_id))
            
            cur.execute(f'''
                INSERT INTO {schema}.registration_logs (log_type, message)
                VALUES ('info', %s)
            ''', (f'Остановлено {len(bots_to_stop)} ботов на канале',))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'stopped': len(bots_to_stop)}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'bot-status':
            channel_id = event.get('queryStringParameters', {}).get('channelId')
            
            if not channel_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID канала обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                SELECT COUNT(*) FROM {schema}.twitch_accounts 
                WHERE assigned_channel_id = %s AND connection_status = 'online'
            ''', (channel_id,))
            online_count = cur.fetchone()[0]
            
            cur.execute(f'''
                SELECT COUNT(*) FROM {schema}.twitch_accounts 
                WHERE assigned_channel_id = %s
            ''', (channel_id,))
            total_count = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'online': online_count,
                    'total': total_count,
                    'offline': total_count - online_count
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            account_id = body.get('id')
            
            if not account_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID аккаунта обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'SELECT username FROM {schema}.twitch_accounts WHERE id = %s', (account_id,))
            result = cur.fetchone()
            
            if not result:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Аккаунт не найден'}),
                    'isBase64Encoded': False
                }
            
            username = result[0]
            
            cur.execute(f"UPDATE {schema}.twitch_accounts SET status = 'banned' WHERE id = %s", (account_id,))
            
            cur.execute(f'''
                INSERT INTO {schema}.registration_logs (account_id, log_type, message)
                VALUES (%s, 'info', %s)
            ''', (account_id, f'Аккаунт {username} заблокирован'))
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Аккаунт заблокирован'}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'chat-messages':
            channel_id = event.get('queryStringParameters', {}).get('channelId')
            
            if not channel_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID канала обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'''
                SELECT cm.id, ta.username, cm.message_text, 
                       TO_CHAR(cm.sent_at, 'YYYY-MM-DD HH24:MI:SS') as sent_at,
                       cm.status
                FROM {schema}.chat_messages cm
                JOIN {schema}.twitch_accounts ta ON cm.account_id = ta.id
                WHERE cm.channel_id = %s
                ORDER BY cm.sent_at DESC
                LIMIT 100
            ''', (channel_id,))
            
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': str(row[0]),
                    'username': row[1],
                    'message': row[2],
                    'sentAt': row[3],
                    'status': row[4]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Endpoint не найден'}),
                'isBase64Encoded': False
            }
    
    except psycopg2.IntegrityError as e:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Username или email уже используется'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        cur.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }