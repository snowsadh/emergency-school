import test from "node:test";
import assert from "node:assert/strict";
import { createVoice } from "../src/voice.mjs";

async function withBrowser(run, decode = async () => new ArrayBuffer(8)) {
  const track = {
    enabled: true,
    stops: 0,
    stop() {
      this.stops++;
    },
  };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const recorders = [];
  const players = [];
  const contexts = [];
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
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
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
  let voice;
  try {
    voice = await createVoice({
      onTurn: async () => {},
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
