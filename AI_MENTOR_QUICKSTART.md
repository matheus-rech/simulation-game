# AI Mentor Quick Start

Get AI surgical mentor running in 5 minutes.

## 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

## 2. Get API Key

Visit [Anthropic Console](https://console.anthropic.com/) → API Keys → Create Key

## 3. Configure Environment

Create `.env` in project root:

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

## 4. Test API Key

```bash
# Quick test
node << 'EOF'
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 50,
  messages: [{ role: 'user', content: 'Test: Say "API working"' }],
});

console.log('✓ API Key Valid!');
console.log('Response:', response.content[0].text);
EOF
```

Expected output:
```
✓ API Key Valid!
Response: API working
```

## 5. Integrate into App

**Option A: Copy Example (Easiest)**

```bash
# Backup current App.tsx
cp src/App.tsx src/App.backup.tsx

# Open example file
cat src/examples/AIMentorIntegration.example.tsx

# Copy the "AppWithBasicMentor" function
# Paste into your App.tsx (replace or adapt existing code)
```

**Option B: Manual Integration (More Control)**

Add to `src/App.tsx`:

```typescript
// 1. Add imports at top
import { useAIMentor, createDefaultSimulationState } from './hooks/useAIMentor';
import { MentorOverlay } from './components/ui/MentorOverlay';

// 2. Inside your App component, after existing state:
export default function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(100);
  const [tipPosition, setTipPosition] = useState({...});
  const [scopeAngle, setScopeAngle] = useState({...});
  // ... other existing state

  // ADD THIS: Create simulation state
  const simulationState = createDefaultSimulationState(
    level,
    score,
    tipPosition,
    scopeAngle
  );

  // ADD THIS: Initialize AI mentor
  const mentor = useAIMentor(simulationState, {
    enabled: true,
    analysisInterval: 3000, // Analyze every 3 seconds
    useStreaming: true,     // Lower latency
  });

  // ADD THIS: Register canvas for scene capture
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      mentor.registerCanvas(canvas);
    }
  }, [mentor]);

  // 3. In your return JSX, add mentor overlay:
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f0a0a' }}>
      {/* Your existing components */}
      <EndoscopeView ... />

      {/* ADD THIS: AI Mentor Overlay */}
      <MentorOverlay
        response={mentor.response}
        isAnalyzing={mentor.isAnalyzing}
        error={mentor.error}
        isStreaming={mentor.config.useStreaming}
        streamingText={mentor.streamingText}
        showConfidence={true}
        position="top-right"
      />

      {/* ADD THIS: Ready indicator */}
      {mentor.isReady && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          color: '#4CAF50',
          fontSize: '0.8rem',
        }}>
          ✓ AI Mentor Active
        </div>
      )}
    </div>
  );
}
```

## 6. Run & Test

```bash
# Start dev server
npm run dev

# Open browser at http://localhost:3000
```

**Expected Behavior**:

1. Bottom left: "✓ AI Mentor Active" (green)
2. Top right: Mentor overlay appears after ~3 seconds
3. Mentor avatar shows current mood (😊🤔⚠️)
4. Safety badge shows assessment (SAFE/CAUTION/DANGER/CRITICAL)
5. Recommendation text streams in (word by word if streaming enabled)
6. As you move endoscope, mentor updates feedback

**Console Output** (normal):
```
[ClaudeVision] Service initialized
[ClaudeVision] Analyzing scene...
[ClaudeVision] Response received (confidence: 0.92)
```

## 7. Verify It Works

**Test Scenario 1: Safe Navigation (Level 1)**

1. Start simulation
2. Wait 3 seconds
3. Check mentor says something like:
   - "Excellent approach! Continue toward sphenoid ostium."
   - Safety: SAFE
   - Tone: Encouraging 😊

**Test Scenario 2: Proximity Warning (Level 2-3)**

1. Advance to Level 2 or 3
2. Move close to ICA (side walls)
3. Check mentor warns:
   - "CAUTION: Approaching carotid artery..."
   - Safety: DANGER or CRITICAL
   - Tone: Urgent ⚠️

**Test Scenario 3: Collision Response**

1. Collide with structure (move into wall)
2. Mentor should analyze and suggest correction
3. Safety level should reflect severity

## Troubleshooting

### Issue: "No API key found"

**Fix**:
```bash
# Verify .env exists
cat .env

# Should show:
# VITE_ANTHROPIC_API_KEY=sk-ant-api03-...

# Restart dev server
npm run dev
```

### Issue: Mentor overlay not appearing

**Debug checklist**:

```typescript
// Add debug panel temporarily
<div style={{ position: 'absolute', top: 0, left: 0, color: 'white', background: 'black', padding: 10, zIndex: 9999 }}>
  <pre>
    {JSON.stringify({
      isReady: mentor.isReady,
      isAnalyzing: mentor.isAnalyzing,
      hasError: !!mentor.error,
      hasResponse: !!mentor.response,
      error: mentor.error,
    }, null, 2)}
  </pre>
</div>
```

Expected after 3 seconds:
```json
{
  "isReady": true,
  "isAnalyzing": false,
  "hasError": false,
  "hasResponse": true,
  "error": null
}
```

### Issue: High latency (>2 seconds)

**Fix**:

1. Enable streaming:
   ```typescript
   useStreaming: true
   ```

2. Reduce image quality:
   ```typescript
   // In ClaudeVisionService.ts, captureSceneSnapshot():
   canvas.toDataURL('image/jpeg', 0.6) // Lower from 0.8 to 0.6
   ```

3. Increase interval:
   ```typescript
   analysisInterval: 5000 // Less frequent analysis
   ```

### Issue: API errors (401, 429, 500)

**401 Unauthorized**:
- Invalid API key
- Check key starts with `sk-ant-api03-`
- Verify in [Anthropic Console](https://console.anthropic.com/)

**429 Rate Limited**:
- Too many requests
- Increase `analysisInterval`
- Check you're not making duplicate calls

**500 Server Error**:
- Anthropic API issue (rare)
- Check [Anthropic Status](https://status.anthropic.com/)
- Retry automatically happens after 5 seconds

## Next Steps

**Once basic version works**:

1. ✅ Test at all levels (1, 2, 3)
2. ✅ Test collision scenarios
3. ✅ Test crisis events (ICA injury)
4. 🔄 Add performance monitoring (see examples)
5. 🔄 Customize mentor behavior (interval, streaming)
6. 🔄 Implement structure highlighting
7. 🔄 Add voice synthesis for warnings

## Configuration

**Adjust mentor behavior**:

```typescript
const mentor = useAIMentor(simulationState, {
  enabled: true,           // Toggle on/off
  analysisInterval: 3000,  // 2000-10000ms (how often)
  useStreaming: true,      // true = lower latency
  includeHistory: true,    // Remember past interactions
  showConfidence: true,    // Display confidence scores
});
```

**Adjust UI position**:

```typescript
<MentorOverlay
  position="top-right"  // top-left, top-right, bottom-left, bottom-right
  ...
/>
```

## Performance Tips

**For development**:
- Interval: 3000ms (responsive)
- Streaming: true (low latency)
- Image quality: 0.8 (good detail)

**For production** (cost-optimized):
- Interval: 5000ms (less frequent)
- Streaming: true (still good UX)
- Image quality: 0.6 (acceptable)
- Backend proxy (hide API key)

## Resources

- **Full Documentation**: [AI_MENTOR_ARCHITECTURE.md](./AI_MENTOR_ARCHITECTURE.md)
- **Setup Guide**: [AI_MENTOR_SETUP.md](./AI_MENTOR_SETUP.md)
- **Integration Examples**: [src/examples/AIMentorIntegration.example.tsx](./src/examples/AIMentorIntegration.example.tsx)
- **Test Utilities**: [src/test/aiMentorTestUtils.ts](./src/test/aiMentorTestUtils.ts)

## Support

Questions? Check:

1. [Setup Guide troubleshooting](./AI_MENTOR_SETUP.md#troubleshooting)
2. [Implementation Summary FAQ](./AI_MENTOR_IMPLEMENTATION_SUMMARY.md#questions--answers)
3. Console errors (press F12 in browser)
4. [Anthropic API Docs](https://docs.anthropic.com/)

---

**Total Time**: ~5 minutes
**Difficulty**: Easy
**Result**: Real-time AI surgical mentor ✨

Enjoy your AI-powered training experience!
