import { Router, Request, Response } from 'express';

const router = Router();

router.get('/vk-video', (req: Request, res: Response) => {
  const oid = req.query.oid as string;
  const id = req.query.id as string;
  if (!oid || !id) {
    res.status(400).send('Missing oid or id');
    return;
  }
  res.send(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#000;">
  <iframe
    src="https://vkvideo.ru/embed/${oid}_${id}"
    width="100%"
    height="100%"
    frameborder="0"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;"
  ></iframe>
</body>
</html>
  `);
});

router.get('/rutube-video', (req: Request, res: Response) => {
  const videoId = req.query.id as string;
  if (!videoId) {
    res.status(400).send('Missing video id');
    return;
  }
  res.send(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#000;">
  <iframe
    id="rutube-player"
    src="https://rutube.ru/play/embed/${videoId}/?api=1"
    width="100%"
    height="100%"
    frameborder="0"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;"
  ></iframe>
  <script>
    var player = document.getElementById('rutube-player');

    // 1. Команды от родителя (нашего сайта) → Rutube плееру
    window.addEventListener('message', function(e) {
      if (e.source !== window.parent) return;
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.from !== 'syncvibe') return;

        console.log('[PROXY] Command from parent:', data.type, data.time);

        if (data.type === 'play') {
          player.contentWindow.postMessage(JSON.stringify({ type: 'player:play', data: {} }), '*');
        } else if (data.type === 'pause') {
          player.contentWindow.postMessage(JSON.stringify({ type: 'player:pause', data: {} }), '*');
        } else if (data.type === 'seekTo') {
          player.contentWindow.postMessage(JSON.stringify({ type: 'player:setCurrentTime', data: { time: data.time } }), '*');
        } else if (data.type === 'getDuration') {
          // Ждём событие player:durationChange
          console.log('[PROXY] Waiting for duration...');
        }
      } catch(err) {}
    });

    // 2. События от Rutube плеера → родителю (только нужные)
    window.addEventListener('message', function(e) {
      if (e.source !== player.contentWindow) return;
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        console.log('[PROXY] Message from Rutube:', data.type || data.event);

        // Пересылаем только события, которые нужны нашему плееру
        var allowedTypes = [
          'player:ready',
          'player:init',
          'player:started',
          'player:paused',
          'player:ended',
          'player:durationChange',
          'player:currentTime',
          'player:buffering',
          'player:controlsVisibilityChanged'
        ];

        if (allowedTypes.indexOf(data.type) !== -1) {
          window.parent.postMessage(JSON.stringify(data), '*');
        }

        // Длительность оборачиваем для совместимости
        if (data.type === 'player:durationChange') {
          window.parent.postMessage(JSON.stringify({
            type: 'currentDuration',
            data: { duration: data.data?.duration || data.duration }
          }), '*');
        }
      } catch(err) {}
    });
  </script>
</body>
</html>
  `);
});

export default router;