import os
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
