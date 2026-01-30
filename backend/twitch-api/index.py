import json
import os
import psycopg2
from datetime import datetime
import hashlib

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
