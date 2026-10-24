// Browser-only, half-duplex voice turns: the microphone pauses during caller playback.
// ponytail: silence-based turn boundaries, not production full-duplex interruption handling.
export function createTurnDetector(start, roomFloor = null) {
  const calibration = [];
  let floor = roomFloor ?? 0.001;
  let speechFrames = 0;
  let heardSpeech = false;
  let lastSound = start;
  return (rms, now) => {
    // Calibrate to the room, rather than assuming every microphone has the same gain.
    if (roomFloor === null && now - start < 320) {
      calibration.push(rms);
      const levels = [...calibration].sort((a, b) => a - b);
      floor = levels[Math.floor((levels.length - 1) * 0.2)];
    } else {
      const threshold = heardSpeech
        ? Math.max(0.001, floor * 1.5)
        : Math.max(0.0015, floor * 2.5);
      if (rms > threshold) {
        speechFrames++;
        if (speechFrames >= 2) heardSpeech = true;
        lastSound = now;
      } else {
        speechFrames = 0;
        if (!heardSpeech) floor += (rms - floor) * 0.08;
      }
    }
    return {
      heardSpeech,
      shouldSend: heardSpeech && now - lastSound >= 800,
      expired: now - start >= 30_000,
    };
  };
}

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
  let captureGeneration = 0;
  let finishCapture = null;
  const roomSamples = [];
  function microphoneLevel() {
    analyser.getFloatTimeDomainData(data);
    return Math.sqrt(
      data.reduce((sum, value) => sum + value * value, 0) / data.length,
    );
  }
  // Learn the room while the first caller is being generated, not from the
  // trainee's first words. Stop before caller playback can leak into the mic.
  const roomTimer = setInterval(() => {
    if (context.state === "running") {
      roomSamples.push(microphoneLevel());
      if (roomSamples.length > 50) roomSamples.shift();
    }
  }, 80);

  function stopCapture() {
    clearInterval(roomTimer);
    captureGeneration++;
    finishCapture = null;
    clearInterval(timer);
    timer = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.onerror = null;
      try {
        recorder.stop();
      } catch {
        // A disconnected device may already have invalidated its recorder.
      }
    }
    recorder = null;
    onLevel(0);
  }
  function captureError(message) {
    stopCapture();
    processing = false;
    onState("error");
    onError(message);
  }
  stream.getAudioTracks().forEach((track) => {
    track.addEventListener?.("ended", () => {
      if (!closed)
        captureError(
          "Microphone disconnected. Reconnect it and start a new call, or type your response.",
        );
    });
  });
  context.addEventListener?.("statechange", () => {
    if (!closed && ["suspended", "interrupted"].includes(context.state))
      captureError(
        "Browser audio was paused. Toggle the microphone to resume, or type your response.",
      );
  });
  function listen() {
    processing = false;
    if (closed || muted) {
      if (!closed) onState("muted");
      return;
    }
    stopCapture();
    if (
      context.state !== "running" ||
      stream.getAudioTracks().every((track) => track.readyState === "ended")
    ) {
      captureError(
        "Microphone audio is unavailable. Reconnect it and start a new call, or type your response.",
      );
      return;
    }
    const generation = captureGeneration;
    let chunks = [];
    let spoke = false;
    const start = performance.now();
    const levels = [...roomSamples].sort((a, b) => a - b);
    const roomFloor =
      levels.length >= 3 ? levels[Math.floor((levels.length - 1) * 0.2)] : null;
    const detect = createTurnDetector(start, roomFloor);
    let nextRecorder;
    try {
      nextRecorder = new MediaRecorder(stream, { mimeType });
    } catch {
      captureError(
        "Microphone recording could not start. Toggle the microphone to retry, or type your response.",
      );
      return;
    }
    recorder = nextRecorder;
    nextRecorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    nextRecorder.onerror = () => {
      captureError(
        "Microphone recording stopped. Try toggling the microphone or type your response.",
      );
    };
    nextRecorder.onstop = async () => {
      if (closed || generation !== captureGeneration || !spoke) return;
      try {
        const blob = new Blob(chunks, { type: mimeType });
        chunks = [];
        if (!blob.size) throw new Error("The microphone recording was empty.");
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        });
        if (!closed && generation === captureGeneration)
          await onTurn({ audio: base64, mimeType });
      } catch {
        if (!closed) {
          onError(
            "That recording could not be sent. You can type your response instead.",
          );
          listen();
        }
      }
    };
    finishCapture = () => {
      if (closed || muted || processing || nextRecorder.state !== "recording")
        return false;
      spoke = true;
      processing = true;
      finishCapture = null;
      clearInterval(timer);
      timer = null;
      onLevel(0);
      onState("thinking");
      try {
        nextRecorder.stop();
      } catch {
        captureError(
          "That voice recording could not be finished. Toggle the microphone to retry, or type your response.",
        );
        return false;
      }
      return true;
    };
    try {
      nextRecorder.start(250);
    } catch {
      captureError(
        "Microphone recording could not start. Toggle the microphone to retry, or type your response.",
      );
      return;
    }
    onState("listening");
    timer = setInterval(() => {
      if (closed || muted) return stopCapture();
      const rms = microphoneLevel();
      onLevel(Math.min(1, rms * 12));
      const detection = detect(rms, performance.now());
      spoke = detection.heardSpeech;
      if (detection.shouldSend || (detection.expired && spoke)) {
        finishCapture?.();
      } else if (detection.expired) {
        onError(
          "No speech was detected. Check your microphone, or use Send voice after speaking.",
        );
        listen();
      }
    }, 80);
  }
  return {
    listen,
    sendTurn() {
      return finishCapture?.() || false;
    },
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
    async setMuted(value) {
      muted = value;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !value;
      });
      if (value) {
        // Finalized audio must still be sent if the user mutes while it is encoding.
        if (!processing) stopCapture();
        if (!player && !processing) onState("muted");
      } else {
        try {
          if (context.state !== "running") await context.resume();
          if (!closed && !muted) {
            if (player) onState("speaking");
            else if (!processing) listen();
          }
        } catch {
          if (!closed)
            captureError(
              "Browser audio could not resume. Start a new call or type your response.",
            );
        }
      }
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
