/**
 * Netlify serverless function: приём заявки из формы «Обсудить проект».
 * Отправляет заявку в Telegram (если заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID).
 * В Netlify: Site settings → Environment variables — добавьте эти переменные.
 */

function jsonResponse(obj, statusCode = 200) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse({ error: 'Метод не разрешён' }, 405);
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return jsonResponse({ error: 'Некорректный JSON' }, 400);
  }

  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();

  if (!name) {
    return jsonResponse({ error: 'Укажите имя.' }, 400);
  }
  if (!phone) {
    return jsonResponse({ error: 'Укажите номер телефона.' }, 400);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const text = `Новая заявка с сайта:\nИмя: ${name}\nТелефон: ${phone}`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
      const result = await res.json();
      if (!result.ok) {
        console.error('Telegram API error:', result);
        return jsonResponse({
          error: 'Не удалось отправить в Telegram. Попробуйте позже.',
        }, 500);
      }
    } catch (err) {
      console.error('Telegram request failed:', err);
      return jsonResponse({
        error: 'Ошибка отправки. Попробуйте позже или напишите в Telegram.',
      }, 500);
    }
  }
  // Если переменные не заданы — заявку всё равно считаем успешной (для теста деплоя)

  return jsonResponse({ success: true });
};
