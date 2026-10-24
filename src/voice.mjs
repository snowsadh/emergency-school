// Browser-only, half-duplex voice turns: the microphone pauses during caller playback.
// ponytail: silence-based turn boundaries, not production full-duplex interruption handling.
export async function createVoice({ onTurn, onState, onLevel, onError }) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
    throw new Error(
      "This browser cannot record audio. Use Chrome or the text rehearsal.",
    );
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  const context = new AudioContext();
  try {
    await context.resume();
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    throw error;
  }
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  const source = context.createMediaStreamSource(stream);
  source.connect(analyser);
  const data = new Float32Array(analyser.fftSize);
  const mimeType = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ].find((type) => MediaRecorder.isTypeSupported(type));
  if (!mimeType) {
    stream.getTracks().forEach((t) => t.stop());
    await context.close();
    throw new Error(
      "No supported microphone recording format was found. Try Chrome.",
    );
  }
  let recorder = null;
  let timer = null;
  let player = null;
  let muted = false;
  let closed = false;
  let processing = false;
  let playbackGeneration = 0;

  function stopCapture() {
    clearInterval(timer);
    timer = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recorder = null;
    onLevel(0);
  }
  function listen() {
    processing = false;
    if (closed || muted) {
      if (!closed) onState("muted");
      return;
    }
    stopCapture();
    onState("listening");
    let chunks = [];
    let spoke = false;
    let lastSound = 0;
    const start = performance.now();
    const nextRecorder = new MediaRecorder(stream, { mimeType });
    recorder = nextRecorder;
    nextRecorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    nextRecorder.onerror = () => {
      stopCapture();
      onError(
        "Microphone recording stopped. Try toggling the microphone or type your response.",
      );
    };
    nextRecorder.onstop = async () => {
      if (closed || muted || !spoke) return;
      processing = true;
      onState("thinking");
      try {
        const blob = new Blob(chunks, { type: mimeType });
        chunks = [];
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        });
        if (!closed) await onTurn({ audio: base64, mimeType });
      } catch {
        if (!closed) {
          onError(
            "That recording could not be sent. You can type your response instead.",
          );
          listen();
        }
      }
    };
    nextRecorder.start(250);
    timer = setInterval(() => {
      if (closed || muted) return stopCapture();
      analyser.getFloatTimeDomainData(data);
      const rms = Math.sqrt(
        data.reduce((sum, value) => sum + value * value, 0) / data.length,
      );
      onLevel(Math.min(1, rms * 12));
      const now = performance.now();
      if (rms > 0.018) {
        spoke = true;
        lastSound = now;
      }
      if ((spoke && now - lastSound > 1000) || now - start > 30_000) {
        clearInterval(timer);
        timer = null;
        if (nextRecorder.state !== "inactive") nextRecorder.stop();
        if (!spoke) listen();
      }
    }, 80);
  }
  return {
    listen,
    pause() {
      processing = true;
      stopCapture();
    },
    async play(base64, onPlayed) {
      stopCapture();
      const generation = ++playbackGeneration;
      if (player) {
        player.onended = null;
        player.stop();
        player = null;
      }
      if (!base64) {
        listen();
        return;
      }
      processing = true;
      onState("speaking");
      try {
        const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const buffer = await context.decodeAudioData(binary.buffer);
        if (closed || generation !== playbackGeneration) return;
        await context.resume();
        if (closed || generation !== playbackGeneration) return;
        if (context.state !== "running")
          throw new Error("Audio playback is suspended.");
        player = context.createBufferSource();
        player.buffer = buffer;
        player.connect(context.destination);
        processing = false;
        player.onended = () => {
          if (!closed && generation === playbackGeneration) {
            player = null;
            onPlayed?.();
            listen();
          }
        };
        player.start();
      } catch {
        if (!closed && generation === playbackGeneration) {
          onError(
            "Caller audio could not play. Read the transcript and continue, or check your browser’s sound permissions.",
          );
          listen();
        }
      }
    },
    setMuted(value) {
      muted = value;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !value;
      });
      if (value) {
        stopCapture();
        if (!player) onState("muted");
      } else if (!player && !processing) listen();
    },
    close() {
      closed = true;
      playbackGeneration++;
      stopCapture();
      if (player) {
        player.onended = null;
        player.stop();
        player = null;
      }
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      context.close();
    },
  };
}
