# LoLLMs Mobile 🧠

A React Native app that runs small LLMs **100% locally** on your Android device using [llama.rn](https://github.com/mybigday/llama.rn) (llama.cpp bindings).

No cloud. No subscription. No data sent anywhere.

---

## Features

- 🔒 **Fully offline** — all inference runs on-device
- 📦 **5 pre-configured models** (Qwen, SmolLM2, Gemma, Phi-3)
- ⬇️ **In-app model downloader** with progress tracking
- 💬 **Conversation history** with timestamps & token stats
- ⚙️ **Configurable** system prompt, temperature, max tokens
- 📱 **Dark UI** optimized for OLED screens
- 🚫 **No ads, no tracking, no account required**

---

## Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- Expo account (free): https://expo.dev
- Android device or emulator (Android 8.0+, 4GB+ RAM recommended)

---

## Quick Start

### 1. Install dependencies

```bash
cd mobile_lollms
npm install
```

### 2. Configure EAS

```bash
eas login
eas init
```

Update `app.json` → replace `"your-eas-project-id"` with the ID from `eas init`.

### 3. Build development APK

```bash
# Build a dev APK (includes dev menu, needed for llama.rn native code)
eas build --platform android --profile development
```

This takes ~5-10 minutes in the cloud. Download the `.apk` and install on your device.

### 4. Start the dev server

```bash
npx expo start --dev-client
```

Scan the QR code with your device (the dev build must be installed first).

---

## Build for Production (Google Play)

```bash
# Build signed AAB for Play Store
eas build --platform android --profile production
```

Then upload the `.aab` to [Google Play Console](https://play.google.com/console).

**Play Store requirements:**
- $25 one-time developer registration fee
- Privacy policy URL
- App icon (512×512 PNG)
- At least 2 screenshots
- Target API 34+ (Android 14)

---

## Project Structure

```
mobile_lollms/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # Tab navigation
│   ├── index.tsx             # Chat screen
│   ├── models.tsx            # Model manager
│   ├── history.tsx           # Conversation history
│   └── settings.tsx          # Settings
├── src/
│   ├── components/
│   │   ├── ChatBubble.tsx    # Message bubble
│   │   └── ModelCard.tsx     # Model list card
│   ├── constants/
│   │   ├── models.ts         # Model registry + prompt templates
│   │   └── theme.ts          # Design tokens
│   ├── hooks/
│   │   ├── useLlama.ts       # LLM inference engine
│   │   └── useModelDownload.ts # Download manager
│   └── store/
│       ├── chatStore.ts      # Conversation state (Zustand)
│       └── modelStore.ts     # Model state (Zustand)
├── app.json                  # Expo config
├── eas.json                  # EAS Build config
└── package.json
```

---

## Supported Models

| Model | Size | RAM | Speed |
|---|---|---|---|
| Qwen 2.5 0.5B | 0.4 GB | 1 GB | ⚡ Very fast |
| SmolLM2 1.7B | 1.1 GB | 2.5 GB | ⚡ Fast |
| Gemma 2 2B | 1.6 GB | 3.5 GB | 🔥 Good |
| Phi-3 Mini 3.8B | 2.2 GB | 4.5 GB | 🧠 Best quality |
| Qwen 2.5 1.5B | 1.0 GB | 2.2 GB | ⚡ Fast + multilingual |

All models are downloaded in **GGUF Q4_K_M** format from HuggingFace.

---

## Adding Custom Models

To add more models, edit `src/constants/models.ts` and add entries to the `MODELS` array:

```typescript
{
  id: 'my-model',
  name: 'My Model',
  family: 'MyFamily',
  description: 'A great model',
  sizeGB: 1.5,
  ramRequiredGB: 3.0,
  filename: 'my-model-q4_k_m.gguf',
  downloadUrl: 'https://huggingface.co/.../.../resolve/main/my-model.gguf',
  contextLength: 4096,
  tags: ['custom'],
  chatTemplate: 'chatml', // or 'gemma', 'phi3', 'llama2'
}
```

---

## GPU Acceleration (Optional)

For Vulkan-capable Android devices, edit `src/hooks/useLlama.ts`:

```typescript
// Change from:
n_gpu_layers: 0,
// To:
n_gpu_layers: 32, // or higher
```

This can give 2-4x speedup on supported devices.

---

## Privacy

- No network requests are made during inference
- Model files are stored in the app's private document directory
- Conversation history is stored in-memory only (not persisted between app restarts in this version)
- No analytics, no crash reporting, no telemetry

---

## License

MIT
