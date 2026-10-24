// Authored fictional cases, not operational dispatch protocols.
export const domains = [
  { id: "road", name: "Road incidents", icon: "car" },
  { id: "fire", name: "Fire & smoke", icon: "flame" },
  { id: "medical", name: "Medical", icon: "heart" },
  { id: "safety", name: "Personal safety", icon: "shield" },
  { id: "missing", name: "Missing persons", icon: "search" },
  { id: "public", name: "Public disturbance", icon: "megaphone" },
];

export const difficulties = [
  {
    id: "steady",
    name: "Steady",
    subtitle: "Clear caller. Room to think.",
    panic: "low",
    coherence: "clear",
  },
  {
    id: "challenging",
    name: "Challenging",
    subtitle: "Anxious caller. Scattered details.",
    panic: "moderate",
    coherence: "fragmented",
  },
  {
    id: "intense",
    name: "Intense",
    subtitle: "High emotion. Hard-won clarity.",
    panic: "high",
    coherence: "disjointed",
  },
];

export const scenarios = [
  {
    id: "road-01",
    domain: "road",
    title: "Collision near a flyover",
    caller: "Ananya",
    brief:
      "A witness has stopped near a road collision. Establish where they are and what is happening.",
    facts: {
      location:
        "The service road beside Sector 29 flyover, Gurugram. I can see the blue Metro parking sign.",
      situation:
        "A scooter and a car collided. The scooter rider is sitting on the pavement; the car has stopped.",
      safety:
        "I am on the pavement, away from the traffic. Cars are still passing the scooter.",
      people:
        "One rider looks hurt. He is awake and talking. I cannot tell how badly he is injured.",
      callback:
        "My name is Ananya. This is a fictional training call; use the simulated callback number in your notes.",
    },
    opening:
      "There’s been an accident. A scooter, and a car… I’m here but I don’t know what to do.",
    openingHi:
      "यहाँ एक्सीडेंट हुआ है। एक स्कूटर और कार… मैं यहीं हूँ, समझ नहीं आ रहा क्या करूँ।",
    hindi: {
      location:
        "गुरुग्राम में सेक्टर 29 फ्लाईओवर की सर्विस रोड पर। मेट्रो पार्किंग का नीला बोर्ड दिख रहा है।",
      situation:
        "स्कूटर और कार टकराए हैं। स्कूटर वाला फुटपाथ पर बैठा है और कार रुक गई है।",
      safety:
        "मैं ट्रैफिक से दूर फुटपाथ पर हूँ। गाड़ियाँ अभी भी स्कूटर के पास से जा रही हैं।",
      people:
        "एक आदमी को चोट लगी है। वह होश में है और बात कर रहा है। कितनी चोट है, पता नहीं।",
      callback:
        "मेरा नाम अनन्या है। यह काल्पनिक अभ्यास है; नोट्स में अभ्यास का कॉलबैक नंबर लिखिए।",
    },
  },
  {
    id: "fire-01",
    domain: "fire",
    title: "Smoke in an apartment corridor",
    caller: "Kabir",
    brief:
      "A resident reports smoke from a neighbouring apartment. Clarify the location, observations, and immediate exposure.",
    facts: {
      location:
        "Third floor, Block C, Maple Apartments, Sector 47, Gurugram. The gate faces the community park.",
      situation:
        "Smoke is coming from under the door of flat 302. I do not see any flames.",
      safety:
        "I am outside the building now, next to the main gate. I have not gone back inside.",
      people:
        "I do not know whether anyone is inside 302. Two neighbours are here with me.",
      callback:
        "My name is Kabir. This is a fictional training call; use the simulated callback number in your notes.",
    },
    opening:
      "There’s smoke in our building. It’s coming from the flat next door. Can you send someone?",
    openingHi:
      "हमारी बिल्डिंग में धुआँ है। बगल वाले फ्लैट से आ रहा है। आप किसी को भेज सकते हैं?",
    hindi: {
      location:
        "गुरुग्राम, सेक्टर 47, मेपल अपार्टमेंट्स, ब्लॉक सी, तीसरी मंज़िल। गेट पार्क के सामने है।",
      situation:
        "फ्लैट 302 के दरवाज़े के नीचे से धुआँ आ रहा है। आग की लपटें नहीं दिख रहीं।",
      safety:
        "मैं अब बिल्डिंग के बाहर मुख्य गेट के पास हूँ। वापस अंदर नहीं गया हूँ।",
      people: "पता नहीं फ्लैट 302 में कोई है या नहीं। दो पड़ोसी मेरे साथ हैं।",
      callback:
        "मेरा नाम कबीर है। यह अभ्यास कॉल है; अभ्यास का कॉलबैक नंबर इस्तेमाल कीजिए।",
    },
  },
  {
    id: "medical-01",
    domain: "medical",
    title: "An unwell commuter",
    caller: "Meera",
    brief:
      "A bystander is worried about an unwell commuter. Gather observations without making a diagnosis.",
    facts: {
      location:
        "Outside Gate 2 of HUDA City Centre station, Gurugram, beside the auto-rickshaw stand.",
      situation:
        "A man said he felt faint and sat down. I have called because he still looks unwell.",
      safety:
        "We are on the pavement, away from the road. There is room for responders to reach us.",
      people:
        "He is awake and answering me. He appears to be breathing. I do not know his medical history.",
      callback:
        "My name is Meera. This is a fictional training call; use the simulated callback number in your notes.",
    },
    opening:
      "There’s a man outside the station. He says he feels faint. I think he needs help.",
    openingHi:
      "स्टेशन के बाहर एक आदमी है। कह रहा है चक्कर आ रहे हैं। शायद उसे मदद चाहिए।",
    hindi: {
      location:
        "गुरुग्राम में हुडा सिटी सेंटर स्टेशन के गेट 2 के बाहर, ऑटो स्टैंड के पास।",
      situation:
        "एक आदमी ने कहा चक्कर आ रहे हैं और बैठ गया। वह अभी भी ठीक नहीं लग रहा।",
      safety: "हम सड़क से दूर फुटपाथ पर हैं। मदद करने वालों के आने की जगह है।",
      people:
        "वह होश में है और जवाब दे रहा है। साँस लेता दिख रहा है। उसकी मेडिकल हिस्ट्री नहीं पता।",
      callback:
        "मेरा नाम मीरा है। यह अभ्यास है; नोट्स में अभ्यास का कॉलबैक नंबर लिखिए।",
    },
  },
  {
    id: "safety-01",
    domain: "safety",
    title: "A caller being followed",
    caller: "Riya",
    brief:
      "A caller thinks someone is following them. Establish their location and immediate surroundings.",
    facts: {
      location:
        "Inside the pharmacy beside Gate 1 of Sector 14 market, Gurugram. The sign says Green Cross.",
      situation:
        "The same person followed me from the bus stop. I do not know them and they have not spoken to me.",
      safety:
        "I am inside with the shopkeeper now. The person is outside across the street.",
      people:
        "I am alone, but the shopkeeper is here. I have not seen a weapon.",
      callback:
        "My name is Riya. This is a fictional training call; use the simulated callback number in your notes.",
    },
    opening:
      "I think someone is following me. I went into a shop. Please stay on the phone.",
    openingHi:
      "लगता है कोई मेरा पीछा कर रहा है। मैं एक दुकान में आ गई हूँ। प्लीज़ फोन पर रहिए।",
    hindi: {
      location:
        "गुरुग्राम में सेक्टर 14 मार्केट के गेट 1 के पास ग्रीन क्रॉस दवाई की दुकान के अंदर।",
      situation:
        "वही व्यक्ति बस स्टॉप से पीछे आ रहा है। मैं उसे नहीं जानती और उसने बात नहीं की है।",
      safety:
        "अभी दुकानदार के साथ अंदर हूँ। वह व्यक्ति सड़क के दूसरी तरफ बाहर है।",
      people:
        "मैं अकेली आई हूँ, लेकिन दुकानदार यहाँ है। कोई हथियार नहीं देखा है।",
      callback:
        "मेरा नाम रिया है। यह अभ्यास कॉल है; अभ्यास का कॉलबैक नंबर इस्तेमाल कीजिए।",
    },
  },
  {
    id: "missing-01",
    domain: "missing",
    title: "A child missing at a market",
    caller: "Arjun",
    brief:
      "A parent has lost sight of their child in a busy market. Establish when and where the child was last seen.",
    facts: {
      location:
        "Sector 31 market, Gurugram, at the juice stall near the main entrance. That is where I last saw her.",
      situation:
        "I lost sight of my daughter about five minutes ago when I turned to pay at the stall.",
      safety:
        "I am at the entrance with a security guard. I have not left the market.",
      people:
        "She is six, wearing a yellow T-shirt and blue jeans. Her name is Tara. She is not carrying a phone.",
      callback:
        "My name is Arjun. This is a fictional training call; use the simulated callback number in your notes.",
    },
    opening:
      "I can’t find my daughter. She was right here a few minutes ago. It’s so crowded.",
    openingHi:
      "मेरी बेटी नहीं मिल रही। कुछ मिनट पहले यहीं थी। यहाँ बहुत भीड़ है।",
    hindi: {
      location:
        "गुरुग्राम सेक्टर 31 मार्केट, मुख्य गेट के पास जूस की दुकान। उसे आखिरी बार वहीं देखा था।",
      situation:
        "करीब पाँच मिनट पहले पैसे देने के लिए मुड़ा था, तभी वह नज़र से ओझल हो गई।",
      safety:
        "मैं गेट पर सिक्योरिटी गार्ड के साथ हूँ। मार्केट से बाहर नहीं गया हूँ।",
      people:
        "वह छह साल की है। पीली टी-शर्ट और नीली जींस पहनी है। नाम तारा है। उसके पास फोन नहीं है।",
      callback:
        "मेरा नाम अर्जुन है। यह अभ्यास है; अभ्यास का कॉलबैक नंबर इस्तेमाल कीजिए।",
    },
  },
  {
    id: "public-01",
    domain: "public",
    title: "An argument outside a café",
    caller: "Dev",
    brief:
      "A bystander reports an escalating argument. Separate what they have seen from what they assume.",
    facts: {
      location:
        "Outside Cedar Café, at the Sector 23 market entrance in Gurugram.",
      situation:
        "Three people are shouting. One pushed a chair over. I have not seen anyone hit another person.",
      safety:
        "I am inside the café, away from the entrance. The argument is outside.",
      people:
        "There are three people arguing and a few bystanders. I cannot see a weapon or an injured person.",
      callback:
        "My name is Dev. This is a fictional training call; use the simulated callback number in your notes.",
    },
    opening:
      "There’s a fight outside the café. Someone just knocked over a chair. It’s getting louder.",
    openingHi:
      "कैफ़े के बाहर झगड़ा हो रहा है। किसी ने अभी कुर्सी गिरा दी। आवाज़ बढ़ती जा रही है।",
    hindi: {
      location: "गुरुग्राम में सेक्टर 23 मार्केट के गेट पर सीडर कैफ़े के बाहर।",
      situation:
        "तीन लोग चिल्ला रहे हैं। एक ने कुर्सी गिराई है। किसी को मारते हुए नहीं देखा।",
      safety: "मैं कैफ़े के अंदर गेट से दूर हूँ। झगड़ा बाहर है।",
      people:
        "तीन लोग बहस कर रहे हैं और कुछ लोग देख रहे हैं। कोई हथियार या घायल व्यक्ति नहीं दिख रहा।",
      callback:
        "मेरा नाम देव है। यह अभ्यास कॉल है; अभ्यास का कॉलबैक नंबर इस्तेमाल कीजिए।",
    },
  },
];

export function validateSetup(value) {
  const scope = value ?? {};
  if (
    typeof scope !== "object" ||
    Array.isArray(scope) ||
    (scope.mode !== undefined && !["guided", "random"].includes(scope.mode)) ||
    (scope.difficulty !== undefined &&
      scope.difficulty !== "" &&
      !difficulties.some((d) => d.id === scope.difficulty)) ||
    (scope.language !== undefined &&
      scope.language !== "" &&
      !["en", "hi"].includes(scope.language)) ||
    (scope.domains !== undefined &&
      (!Array.isArray(scope.domains) ||
        scope.domains.length > domains.length ||
        scope.domains.some((id) => !domains.some((d) => d.id === id))))
  ) {
    throw new Error("Invalid optional practice preferences.");
  }
  return {
    mode: scope.mode || "random",
    difficulty: scope.difficulty || "",
    language: scope.language || "",
    domains: [...new Set(scope.domains || [])],
  };
}

export function chooseScenario(setup, random = Math.random) {
  const valid = validateSetup(setup);
  const pool = scenarios.filter(
    (s) => !valid.domains.length || valid.domains.includes(s.domain),
  );
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

const questionPatterns = {
  location:
    /\b(where|location|address|landmark|which (road|street|gate)|repeat.*(place|address))\b|कहाँ|पता|जगह|कौन.*(सड़क|गेट)/i,
  safety:
    /\b(safe|danger|traffic|hazard|away|inside|outside)\b|सुरक्षित|खतरा|ट्रैफिक|अंदर|बाहर/i,
  people:
    /\b(injur|hurt|people|anyone|anybody|conscious|awake|breath|old|wear|weapon|daughter|child|name.*child)|चोट|घायल|होश|साँस|बच्च|उम्र|हथियार|पहन/i,
  callback: /\b(your name|call.*back|number|contact)\b|नाम|नंबर|सम्पर्क/i,
  situation:
    /\b(happen|going on|describe|see|tell me|what|when|how)\b|हुआ|क्या|कब|बताइए/i,
};

export function identifyQuestion(text) {
  return (
    Object.keys(questionPatterns).find((key) =>
      questionPatterns[key].test(text),
    ) || null
  );
}

export function rehearsalReply(scenario, setup, text) {
  const topic = identifyQuestion(text);
  if (!topic)
    return setup.language === "hi"
      ? "मैं सुन रहा हूँ। आप मुझसे एक-एक सवाल पूछ सकते हैं?"
      : "Okay, I’m listening. Can you ask me one thing at a time?";
  const answer = (setup.language === "hi" ? scenario.hindi : scenario.facts)[
    topic
  ];
  if (setup.difficulty === "steady") return answer;
  if (setup.language === "hi")
    return `${setup.difficulty === "intense" ? "प्लीज़… मैं बहुत घबराया हुआ हूँ। " : "एक सेकंड… "}${answer}`;
  return `${setup.difficulty === "intense" ? "Please… I’m really shaken. " : "Um, just a second… "}${answer}`;
}

export function formatTime(seconds = 0) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
