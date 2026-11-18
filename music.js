export function createPlayer(panel, t) {
  const audio = panel.querySelector('audio');
  const button = panel.querySelector('#music-toggle');
  const volume = panel.querySelector('#music-volume');
  const status = panel.querySelector('#music-status');
  let context;
  let gain;
  let unavailable = false;

  function render() {
    panel.setAttribute('aria-label', t('music'));
    button.textContent = t(audio.paused ? 'playMusic' : 'pauseMusic');
    panel.querySelector('label').textContent = t('volume');
    status.textContent = unavailable ? t('musicUnavailable') : '';
  }

  function setVolume() {
    const level = Number(volume.value) / 100;
    if (gain) gain.gain.value = level;
    else audio.volume = level;
  }

  async function play() {
    unavailable = false;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio && !context) {
        context = new Audio();
        const source = context.createMediaElementSource(audio);
        gain = context.createGain();
        source.connect(gain).connect(context.destination);
      }
      setVolume();
      await Promise.all([context?.resume(), audio.play()]);
    } catch {
      audio.pause();
      unavailable = true;
    }
    render();
  }

  button.onclick = () => {
    if (audio.paused) void play();
    else audio.pause();
  };
  volume.oninput = setVolume;
  audio.onplay = audio.onpause = render;
  audio.onerror = () => {
    unavailable = true;
    render();
  };

  return {
    play,
    update(active) {
      panel.hidden = !active;
      if (!active) audio.pause();
      render();
    }
  };
}
