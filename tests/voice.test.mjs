import test from "node:test";
import assert from "node:assert/strict";
import { createTurnDetector, createVoice } from "../src/voice.mjs";

async function withBrowser(
  run,
  decode = async () => new ArrayBuffer(8),
  options = {},
) {
  const trackEvents = new Map();
  const track = {
    enabled: true,
    stops: 0,
    stop() {
      this.stops++;
    },
    addEventListener: (name, callback) => trackEvents.set(name, callback),
  };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const recorders = [];
  const players = [];
  const contexts = [];
  const contextEvents = new Map();
  const intervals = new Map();
  let microphoneRequests = 0;
  let intervalId = 0;
  let sourceDisconnected = false;
  class Recorder {
    static isTypeSupported(type) {
      return type.startsWith("audio/webm");
    }
    constructor() {
      this.state = "inactive";
      recorders.push(this);
    }
    start() {
      if (options.failStart) throw new Error("Recording failed");
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({
        data: new Blob(["synthetic microphone bytes".repeat(8)]),
      });
      this.onstop?.();
    }
  }
  class Context {
    constructor() {
      this.state = "suspended";
      this.destination = {};
      contexts.push(this);
    }
    async resume() {
      if (this.state === "closed") throw new Error("Context closed");
      this.state = "running";
    }
    addEventListener(name, callback) {
      contextEvents.set(name, callback);
    }
    createAnalyser() {
      return { fftSize: 1024, getFloatTimeDomainData: (data) => data.fill(0) };
    }
    createMediaStreamSource() {
      return {
        connect() {},
        disconnect() {
          sourceDisconnected = true;
        },
      };
    }
    decodeAudioData(buffer) {
      return decode(buffer);
    }
    createBufferSource() {
      const player = {
        starts: 0,
        stops: 0,
        connect() {},
        start() {
          this.starts++;
        },
        stop() {
          this.stops++;
          this.onended?.();
        },
      };
      players.push(player);
      return player;
    }
    async close() {
      this.state = "closed";
    }
  }
  const replacements = {
    navigator: {
      mediaDevices: {
        getUserMedia: async () => {
          microphoneRequests++;
          return stream;
        },
      },
    },
    window: { MediaRecorder: Recorder },
    MediaRecorder: Recorder,
    AudioContext: Context,
    FileReader: class {
      readAsDataURL() {
        queueMicrotask(() => {
          this.result = `data:audio/webm;base64,${Buffer.from("synthetic voice").toString("base64")}`;
          this.onload?.();
        });
      }
    },
    setInterval: (callback) => {
      const id = ++intervalId;
      intervals.set(id, callback);
      return id;
    },
    clearInterval: (id) => intervals.delete(id),
  };
  const originals = Object.fromEntries(
    Object.keys(replacements).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(replacements))
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  const states = [];
  const errors = [];
  const turns = [];
  let voice;
  try {
    voice = await createVoice({
      onTurn: async (payload) => turns.push(payload),
      onState: (state) => states.push(state),
      onLevel() {},
      onError: (error) => errors.push(error),
    });
    await run({
      voice,
      track,
      recorders,
      players,
      contexts,
      intervals,
      states,
      errors,
      turns,
      trackEvents,
      contextEvents,
      microphoneRequests: () => microphoneRequests,
      sourceDisconnected: () => sourceDisconnected,
    });
  } finally {
    if (contexts[0]?.state !== "closed") voice?.close();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test("voice acquires the microphone and releases recording, tracks, and audio on close", async () => {
  await withBrowser(
    async ({
      voice,
      track,
      recorders,
      contexts,
      intervals,
      microphoneRequests,
      sourceDisconnected,
    }) => {
      assert.equal(microphoneRequests(), 1);
      voice.listen();
      assert.equal(recorders[0].state, "recording");
      assert.equal(intervals.size, 1);
      voice.close();
      assert.equal(recorders[0].state, "inactive");
      assert.equal(intervals.size, 0);
      assert.equal(track.stops, 1);
      assert.equal(contexts[0].state, "closed");
      assert.equal(sourceDisconnected(), true);
      voice.listen();
      assert.equal(recorders.length, 1);
    },
  );
});

test("turn detection recognizes quiet speech and submits after a short pause", () => {
  const detect = createTurnDetector(0);
  for (let now = 0; now < 320; now += 80) detect(0.0005, now);
  detect(0.006, 320);
  assert.equal(detect(0.006, 400).heardSpeech, true);
  assert.equal(detect(0.0005, 1040).shouldSend, false);
  assert.equal(detect(0.0005, 1200).shouldSend, true);
});

test("steady background noise does not block the endpoint or count as speech", () => {
  const detect = createTurnDetector(0);
  for (let now = 0; now < 800; now += 80) {
    const result = detect(0.02, now);
    assert.equal(result.heardSpeech, false);
    assert.equal(result.shouldSend, false);
  }
  detect(0.08, 800);
  assert.equal(detect(0.08, 880).heardSpeech, true);
  assert.equal(detect(0.02, 1680).shouldSend, true);
});

test("pre-call room calibration permits speech immediately after caller playback", () => {
  const detect = createTurnDetector(0, 0.0005);
  for (let now = 0; now <= 960; now += 80) detect(0.006, now);
  assert.equal(detect(0.0005, 1760).shouldSend, true);
});

test("unmuting resumes a suspended caller without starting capture over playback", async () => {
  await withBrowser(
    async ({ voice, contexts, players, recorders, states, contextEvents }) => {
      await voice.play("AQID");
      contexts[0].state = "suspended";
      contextEvents.get("statechange")();
      assert.equal(states.at(-1), "error");
      await voice.setMuted(true);
      await voice.setMuted(false);
      assert.equal(contexts[0].state, "running");
      assert.equal(states.at(-1), "speaking");
      assert.equal(recorders.length, 0);
      players[0].onended();
      assert.equal(recorders.length, 1);
      assert.equal(states.at(-1), "listening");
    },
  );
});

test("a single click is not speech and the recording deadline is explicit", () => {
  const detect = createTurnDetector(0);
  for (let now = 0; now < 320; now += 80) detect(0.0005, now);
  detect(0.1, 320);
  assert.equal(detect(0.0005, 400).heardSpeech, false);
  const result = detect(0.0005, 30_000);
  assert.equal(result.expired, true);
  assert.equal(result.shouldSend, false);
});

test("Send voice submits captured audio exactly once without needing volume detection", async () => {
  await withBrowser(async ({ voice, recorders, turns, states, intervals }) => {
    voice.listen();
    assert.equal(voice.sendTurn(), true);
    assert.equal(voice.sendTurn(), false);
    assert.equal(recorders[0].state, "inactive");
    assert.equal(intervals.size, 0);
    assert.equal(states.at(-1), "thinking");
    await new Promise(setImmediate);
    assert.equal(turns.length, 1);
    assert.equal(turns[0].mimeType, "audio/webm;codecs=opus");
    assert.ok(turns[0].audio);
  });
});

test("muting while voice is encoding does not discard a finalized turn", async () => {
  await withBrowser(async ({ voice, turns, track }) => {
    voice.listen();
    voice.sendTurn();
    await voice.setMuted(true);
    await new Promise(setImmediate);
    assert.equal(track.enabled, false);
    assert.equal(turns.length, 1);
  });
});

test("closing while voice is encoding cannot send a stale recording", async () => {
  await withBrowser(async ({ voice, turns }) => {
    voice.listen();
    voice.sendTurn();
    voice.close();
    await new Promise(setImmediate);
    assert.equal(turns.length, 0);
  });
});

test("recorder errors and lost microphones leave listening state explicitly", async () => {
  await withBrowser(
    async ({ voice, recorders, states, errors, intervals, trackEvents }) => {
      voice.listen();
      recorders[0].onerror();
      assert.equal(states.at(-1), "error");
      assert.equal(intervals.size, 0);
      assert.equal(voice.sendTurn(), false);
      assert.match(errors.at(-1), /recording stopped/);
      voice.listen();
      trackEvents.get("ended")();
      assert.equal(states.at(-1), "error");
      assert.equal(intervals.size, 0);
      assert.match(errors.at(-1), /disconnected/);
    },
  );
});

test("recorder start failures are caught and never claim to be listening", async () => {
  await withBrowser(
    async ({ voice, states, errors, intervals }) => {
      assert.doesNotThrow(() => voice.listen());
      assert.equal(states.at(-1), "error");
      assert.ok(!states.includes("listening"));
      assert.equal(intervals.size, 0);
      assert.match(errors.at(-1), /could not start/);
    },
    undefined,
    { failStart: true },
  );
});

test("mute/unmute cannot restart recording while a paused turn is processing", async () => {
  await withBrowser(async ({ voice, track, recorders }) => {
    voice.listen();
    voice.pause();
    voice.setMuted(true);
    assert.equal(track.enabled, false);
    voice.setMuted(false);
    assert.equal(track.enabled, true);
    assert.equal(recorders.length, 1);
    assert.equal(recorders[0].state, "inactive");
    await voice.play(null);
    assert.equal(recorders.length, 2);
    assert.equal(recorders[1].state, "recording");
  });
});

test("new caller playback stops the previous player without confirming that unheard line", async () => {
  await withBrowser(async ({ voice, players, recorders }) => {
    let oldConfirmations = 0;
    let newConfirmations = 0;
    await voice.play("AQID", () => oldConfirmations++);
    assert.equal(players[0].starts, 1);
    await voice.play("BAUG", () => newConfirmations++);
    assert.equal(players[0].stops, 1);
    assert.equal(players[0].onended, null);
    assert.equal(oldConfirmations, 0);
    assert.equal(players[1].starts, 1);
    assert.equal(recorders.length, 0);
    players[1].onended();
    assert.equal(newConfirmations, 1);
    assert.equal(recorders.length, 1);
  });
});

test("audio decoding that completes after close cannot create a player or resume capture", async () => {
  const pendingDecode = Promise.withResolvers();
  await withBrowser(
    async ({ voice, players, recorders, states, errors }) => {
      let confirmations = 0;
      const playback = voice.play("AQID", () => confirmations++);
      voice.close();
      pendingDecode.resolve(new ArrayBuffer(8));
      await playback;
      assert.equal(players.length, 0);
      assert.equal(recorders.length, 0);
      assert.equal(confirmations, 0);
      assert.deepEqual(states, ["speaking"]);
      assert.deepEqual(errors, []);
    },
    () => pendingDecode.promise,
  );
});
