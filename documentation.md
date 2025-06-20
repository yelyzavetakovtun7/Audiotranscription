# Система перетворення голосових повідомлень у текст з можливістю корпусної розмітки

## Анотація

У даній магістерській роботі розроблено систему для перетворення голосових повідомлень у текст з використанням технології Whisper. Система забезпечує високу точність розпізнавання мови, підтримує українську мову та надає інструменти для створення корпусної розмітки. Розробка включає як серверну частину на базі Python та FastAPI, так і клієнтський інтерфейс, реалізований за допомогою React та TypeScript.

## Обґрунтування вибору формату зберігання даних

Для зберігання даних у системі було обрано формат JSON (JavaScript Object Notation). Цей вибір обумовлений специфікою нашого проекту та особливостями даних, які необхідно зберігати. JSON є легким текстовим форматом для обміну даними, який забезпечує зручне представлення структурованих даних у вигляді пар "ключ-значення". У нашому випадку це дозволяє ефективно зберігати як текст транскрипції, так і метадані, пов'язані з аудіозаписом.

Порівняно з XML, JSON має ряд переваг для нашого проекту. По-перше, JSON має простіший синтаксис та менший розмір файлів, що важливо при роботі з великими об'ємами даних транскрипцій. По-друге, JSON нативно підтримується JavaScript, що спрощує роботу з даними на стороні клієнта, оскільки наш фронтенд написаний на React. По-третє, JSON краще підходить для зберігання масивів даних, що критично важливо для нашого проекту, де ми працюємо з сегментами аудіо та їх часовою розміткою.

У нашій системі JSON використовується для зберігання розширеної структури даних, яка включає:
- Унікальний ідентифікатор запису
- Назву аудіофайлу
- Дату та час створення
- Оригінальний текст транскрипції
- Відредагований текст
- Масив сегментів з часовою розміткою
- Технічні параметри розпізнавання мови

Кожен сегмент містить детальну інформацію про часові межі, текст, токени та метрики якості розпізнавання. Така структура дозволяє не тільки зберігати текст, але й підтримувати синхронізацію між аудіо та текстом, що є ключовою функцією нашої системи. Додатково, JSON формат дозволяє легко розширювати структуру даних, додаючи нові поля без необхідності зміни схеми, що важливо для майбутнього розвитку системи.

## Зміст

1. [Вступ](#вступ)
2. [Огляд літератури](#огляд-літератури)
3. [Методологія](#методологія)
4. [Архітектура системи](#архітектура-системи)
5. [Реалізація](#реалізація)
6. [Результати та обговорення](#результати-та-обговорення)
7. [Висновки](#висновки)
8. [Список використаних джерел](#список-використаних-джерел)

## Вступ

### Актуальність теми

Розпізнавання мови є критично важливим напрямком у сучасній обробці природньої мови. Особливо це актуально для української мови, де існує необхідність у створенні якісних інструментів для автоматизації процесів транскрибації та аналізу мовлення.

### Мета роботи

Розробка та впровадження системи для перетворення голосових повідомлень у текст з підтримкою української мови та можливістю створення корпусної розмітки.

### Завдання дослідження

1. Провести аналіз існуючих рішень для розпізнавання мови
2. Розробити архітектуру системи
3. Реалізувати серверну частину з використанням Whisper
4. Створити клієнтський інтерфейс для роботи з системою
5. Реалізувати функціонал корпусної розмітки
6. Провести тестування та оцінку ефективності системи

## Огляд літератури

### Існуючі рішення для розпізнавання мови

1. **Google Cloud Speech-to-Text**
   - Підтримка понад 125 мов
   - Висока швидкість обробки
   - Недоліки: висока вартість, проблеми з акцентами

2. **Amazon Transcribe**
   - Розширені функції розпізнавання
   - Інтеграція з AWS
   - Недоліки: складна настройка, обмежена підтримка мов

3. **OpenAI Whisper**
   - Відкритий код
   - Найвища точність
   - Підтримка 98 мов
   - Можливість локального використання

### Теоретичні основи

1. **Обробка природньої мови**
   - Методи розпізнавання мови
   - Трансформаційні моделі
   - Обробка аудіо сигналів

2. **Корпусна лінгвістика**
   - Методи розмітки тексту
   - Аналіз мовних корпусів
   - Інструменти для роботи з корпусами

## Методологія

### Вибір технологій

1. **Backend**
   - Python 3.8+
   - FastAPI для REST API
   - Whisper для розпізнавання мови
   - PyTorch для обробки даних

2. **Frontend**
   - React для UI
   - TypeScript для типізації
   - Material-UI для компонентів

### Методи дослідження

1. Порівняльний аналіз існуючих рішень
2. Експериментальне тестування
3. Оцінка точності розпізнавання
4. Аналіз продуктивності

## Архітектура системи

### Загальна структура

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   └── services/
│   ├── audio_files/
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   └── public/
```

### Компоненти системи

1. **Серверна частина**
   - API для обробки запитів
   - Сервіс розпізнавання мови
   - Система збереження даних

2. **Клієнтська частина**
   - Інтерфейс користувача
   - Аудіоплеєр з синхронізацією
   - Редактор корпусної розмітки

## Реалізація

### Backend

1. **API Endpoints**
   - Завантаження аудіо
   - Транскрибація
   - Збереження розмітки

2. **Сервіси**
   - Обробка аудіо
   - Розпізнавання мови
   - Управління даними

### Frontend

1. **Компоненти**
   - Аудіоплеєр
   - Текстовий редактор
   - Інструменти розмітки

2. **Функціонал**
   - Синхронізація аудіо та тексту
   - Редагування транскрипції
   - Створення розмітки

## Результати та обговорення

### Технічні характеристики

1. **Продуктивність**
   - Швидкість обробки
   - Точність розпізнавання
   - Використання ресурсів

2. **Якість розпізнавання**
   - WER (Word Error Rate)
   - Обробка шумів
   - Підтримка акцентів

### Практичне застосування

1. **Сценарії використання**
   - Транскрибація інтерв'ю
   - Створення мовних корпусів
   - Аналіз мовлення

2. **Обмеження та перспективи**
   - Поточні обмеження
   - Напрямки розвитку
   - Потенційні покращення

## Висновки

1. **Досягнуті результати**
   - Розроблено функціональну систему
   - Забезпечено високу точність
   - Реалізовано корпусну розмітку

2. **Наукова новизна**
   - Інтеграція Whisper з українською мовою
   - Розробка інструментів розмітки
   - Оптимізація продуктивності

3. **Практична цінність**
   - Готове рішення для використання
   - Масштабованість системи
   - Простота інтеграції

## Список використаних джерел

1. Radford, A., et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision.
2. Vaswani, A., et al. (2017). Attention Is All You Need.
3. [Додаткові джерела...]

## Додатки

### Додаток А
- Інструкція з встановлення
- Налаштування системи

### Додаток Б
- Приклади використання
- Тестові дані

### Додаток В
- Результати тестування
- Метрики продуктивності 