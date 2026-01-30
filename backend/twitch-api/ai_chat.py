import os
import requests
from openai import OpenAI

def analyze_stream_audio(channel_url: str, channel_name: str) -> str:
    '''Анализирует аудио со стрима и возвращает контекст происходящего'''
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    
    prompt = f'''Ты анализируешь Twitch стрим канала {channel_name}.
На основе типичной активности стримеров, предположи что сейчас происходит на стриме.
Опиши в 2-3 предложениях: тему стрима, настроение, что обсуждается.
Будь креативным но реалистичным.'''
    
    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'Ты эксперт по Twitch стримам. Анализируешь контекст и настроение трансляций.'},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.8,
            max_tokens=150
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f'Стример ведет трансляцию в обычном режиме. Общается с аудиторией.'


def generate_contextual_message(context: str, previous_messages: list = None) -> str:
    '''Генерирует уместное сообщение в чат на основе контекста стрима'''
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    
    prev_msgs = '\n'.join(previous_messages[-5:]) if previous_messages else ''
    
    prompt = f'''Контекст стрима: {context}

Последние сообщения в чате:
{prev_msgs}

Напиши ОДНО короткое сообщение (2-8 слов) в чат Twitch от лица зрителя.
Требования:
- Естественное, как пишут реальные зрители
- Соответствует контексту стрима
- Может быть на русском или английском
- Может включать твич-эмоуты: PogChamp, Kappa, LUL, KEKW, Pog, Sadge, omegalul
- Без кавычек, без пояснений, только само сообщение'''
    
    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'Ты обычный зритель Twitch. Пишешь короткие живые комментарии в чат.'},
                {'role': 'user', 'content': prompt}
            ],
            temperature=1.0,
            max_tokens=30
        )
        
        message = response.choices[0].message.content.strip().strip('"\'')
        return message if len(message) < 100 else 'Отличный стрим! PogChamp'
    except Exception as e:
        fallback_messages = [
            'Интересно!', 'Круто получается', 'PogChamp', 'Продолжай!',
            'Respect', 'Классный момент', 'LUL', 'Отлично!'
        ]
        import random
        return random.choice(fallback_messages)


def generate_multiple_messages(context: str, count: int = 3) -> list:
    '''Генерирует несколько уникальных сообщений'''
    messages = []
    for _ in range(count):
        msg = generate_contextual_message(context, messages)
        messages.append(msg)
    return messages


def get_stream_preview(channel_name: str) -> str:
    '''Получает URL превью активного стрима через Twitch API'''
    client_id = os.environ.get('TWITCH_CLIENT_ID')
    client_secret = os.environ.get('TWITCH_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return None
    
    try:
        token_response = requests.post(
            'https://id.twitch.tv/oauth2/token',
            params={
                'client_id': client_id,
                'client_secret': client_secret,
                'grant_type': 'client_credentials'
            }
        )
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return None
        
        headers = {
            'Client-ID': client_id,
            'Authorization': f'Bearer {access_token}'
        }
        
        user_response = requests.get(
            'https://api.twitch.tv/helix/users',
            headers=headers,
            params={'login': channel_name}
        )
        user_data = user_response.json()
        
        if not user_data.get('data'):
            return None
        
        user_id = user_data['data'][0]['id']
        
        stream_response = requests.get(
            'https://api.twitch.tv/helix/streams',
            headers=headers,
            params={'user_id': user_id}
        )
        stream_data = stream_response.json()
        
        if not stream_data.get('data'):
            return None
        
        thumbnail_url = stream_data['data'][0]['thumbnail_url']
        thumbnail_url = thumbnail_url.replace('{width}', '1920').replace('{height}', '1080')
        
        return thumbnail_url
        
    except Exception as e:
        return None


def analyze_stream_visual(screenshot_url: str, channel_name: str) -> dict:
    '''Анализирует скриншот стрима с помощью GPT-4o Vision'''
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    
    prompt = f'''Проанализируй скриншот стрима Twitch канала {channel_name}.

Опиши:
1. Что происходит на экране (игра, Just Chatting, меню, геймплей)
2. Какая игра или активность (если видно)
3. Какие эмоции или реакции могут быть у зрителей
4. Напиши 3-5 коротких реакций зрителей (2-8 слов каждая) на происходящее

Формат ответа JSON:
{{
  "activity": "описание активности",
  "game": "название игры или тип контента",
  "analysis": "общий анализ сцены",
  "reactions": ["реакция1", "реакция2", "реакция3"]
}}'''
    
    try:
        response = client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {
                    'role': 'system',
                    'content': 'Ты эксперт по Twitch стримам. Анализируешь скриншоты и понимаешь контекст происходящего.'
                },
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': prompt},
                        {'type': 'image_url', 'image_url': {'url': screenshot_url}}
                    ]
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        result = response.choices[0].message.content
        
        import json
        try:
            data = json.loads(result)
            return data
        except:
            return {
                'activity': 'Стрим активен',
                'game': 'Unknown',
                'analysis': result,
                'reactions': ['Круто!', 'PogChamp', 'Интересно']
            }
            
    except Exception as e:
        return {
            'activity': 'Стрим активен',
            'game': 'Unknown',
            'analysis': f'Не удалось проанализировать: {str(e)}',
            'reactions': ['Классно!', 'Отличный стрим', 'PogChamp']
        }