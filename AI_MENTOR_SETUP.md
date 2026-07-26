# AI Mentor Setup Guide

Step-by-step guide to enable AI surgical mentor in NeuroSim.

## Prerequisites

- Node.js 18+
- npm 9+
- Anthropic API key

## Installation

### Step 1: Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### Step 2: Environment Configuration

Create `.env` file in project root:

```bash
# Anthropic API Key
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Optional: Configure mentor behavior
VITE_AI_MENTOR_ENABLED=true
VITE_AI_MENTOR_INTERVAL=3000
VITE_AI_MENTOR_STREAMING=true
```

**Getting an API Key**:

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create new key with name "NeuroSim Development"
5. Copy key and add to `.env`

**Security Notes**:

⚠️ **NEVER commit .env file to git**

Add to `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

For production:
- Use backend proxy to hide API key
- Implement rate limiting
- Add user authentication
- Use serverless functions (Vercel, Netlify, AWS Lambda)

### Step 3: Verify Installation

```bash
# Check dependencies
npm list @anthropic-ai/sdk

# Should output:
# simulation-game@1.0.0
# └── @anthropic-ai/sdk@0.x.x
```

Test API key:

```bash
# Create test file
cat > test-api.js << 'EOF'
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

async function test() {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  console.log('✓ API key valid!');
  console.log('Response:', response.content[0].text);
}

test().catch(err => console.error('✗ API key invalid:', err.message));
EOF

# Run test
node test-api.js

# Clean up
rm test-api.js
```

## Integration

### Option 1: Quick Integration (Recommended)

Copy the basic example from `src/examples/AIMentorIntegration.example.tsx`:

```bash
# Backup current App.tsx
cp src/App.tsx src/App.backup.tsx

# Copy example (manually adapt to your App.tsx)
# See src/examples/AIMentorIntegration.example.tsx
```

Key changes to `App.tsx`:

```typescript
// 1. Add imports
import { useAIMentor, createDefaultSimulationState } from './hooks/useAIMentor';
import { MentorOverlay } from './components/ui/MentorOverlay';

// 2. Create simulation state
const simulationState = createDefaultSimulationState(
  level,
  score,
  tipPosition,
  scopeAngle
);

// 3. Initialize mentor
const mentor = useAIMentor(simulationState, {
  enabled: true,
  analysisInterval: 3000,
  useStreaming: true,
});

// 4. Register canvas
useEffect(() => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    mentor.registerCanvas(canvas);
  }
}, [mentor]);

// 5. Add UI
return (
  <div>
    {/* Existing components */}
    <EndoscopeView ... />

    {/* AI Mentor */}
    <MentorOverlay
      response={mentor.response}
      isAnalyzing={mentor.isAnalyzing}
      error={mentor.error}
      isStreaming={mentor.config.useStreaming}
      streamingText={mentor.streamingText}
      position="top-right"
    />
  </div>
);
```

### Option 2: Gradual Integration

Enable mentor with feature flag:

```typescript
const [mentorEnabled, setMentorEnabled] = useState(
  import.meta.env.VITE_AI_MENTOR_ENABLED === 'true'
);

// Add toggle in UI
<button onClick={() => setMentorEnabled(!mentorEnabled)}>
  Toggle AI Mentor
</button>

// Conditional rendering
{mentorEnabled && (
  <MentorOverlay ... />
)}
```

## Testing

### Manual Testing

```bash
# Start dev server
npm run dev

# Open browser
# Navigate to http://localhost:3000

# Check console for:
# ✓ AI Mentor Active
# [ClaudeVision] Service initialized

# Interact with simulation
# - Move endoscope
# - Wait 3 seconds
# - See mentor feedback appear
```

### Automated Testing

```bash
# Run tests with mock API
npm test -- aiMentor

# Expected output:
# ✓ ClaudeVisionService initializes
# ✓ analyze returns valid response
# ✓ caching works correctly
# ✓ streaming provides chunks
```

Create test file:

```typescript
// src/__tests__/AIMentor.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeVisionService } from '../services/ai/ClaudeVisionService';
import {
  MOCK_API_KEY,
  mockSimulationStateLevel1,
  generateMockSnapshot,
} from '../test/aiMentorTestUtils';

describe('AI Mentor Integration', () => {
  let service: ClaudeVisionService;

  beforeEach(() => {
    service = new ClaudeVisionService(MOCK_API_KEY);
  });

  it('should analyze scene successfully', async () => {
    const response = await service.analyze({
      sceneSnapshot: generateMockSnapshot(),
      state: mockSimulationStateLevel1,
    });

    expect(response).toBeDefined();
    expect(response.recommendation).toBeTruthy();
  });
});
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ANTHROPIC_API_KEY` | *required* | Anthropic API key |
| `VITE_AI_MENTOR_ENABLED` | `true` | Enable mentor |
| `VITE_AI_MENTOR_INTERVAL` | `3000` | Analysis interval (ms) |
| `VITE_AI_MENTOR_STREAMING` | `true` | Use streaming mode |
| `VITE_AI_MENTOR_MAX_TOKENS` | `300` | Max response tokens |
| `VITE_AI_MENTOR_TEMPERATURE` | `0.7` | Response creativity |

### Code Configuration

```typescript
// In App.tsx or config file
const mentorConfig = {
  enabled: import.meta.env.VITE_AI_MENTOR_ENABLED !== 'false',
  analysisInterval: Number(import.meta.env.VITE_AI_MENTOR_INTERVAL) || 3000,
  useStreaming: import.meta.env.VITE_AI_MENTOR_STREAMING !== 'false',
  includeHistory: true,
  showConfidence: true,
};

const mentor = useAIMentor(simulationState, mentorConfig);
```

## Troubleshooting

### Issue: "No API key found"

**Symptom**: Error in console: `[ClaudeVision] No API key found. Set VITE_ANTHROPIC_API_KEY.`

**Solution**:

```bash
# Check .env file exists
ls -la .env

# Check key is set
cat .env | grep ANTHROPIC

# Restart dev server
npm run dev
```

### Issue: "API key invalid"

**Symptom**: Error: `401 Unauthorized`

**Solution**:

- Verify key starts with `sk-ant-api03-`
- Check key is active in Anthropic Console
- Ensure no trailing whitespace in `.env`

```bash
# Test key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $VITE_ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

### Issue: High latency (>2s)

**Symptom**: Mentor feedback delayed

**Solutions**:

1. **Enable streaming**:
   ```typescript
   useStreaming: true // Reduces perceived latency
   ```

2. **Reduce image size**:
   ```typescript
   canvas.toDataURL('image/jpeg', 0.6) // Lower quality
   ```

3. **Increase interval**:
   ```typescript
   analysisInterval: 5000 // Analyze less frequently
   ```

4. **Optimize caching**:
   ```typescript
   // Round positions more aggressively
   const pos = Math.round(position * 5) / 5; // 0.2cm precision
   ```

### Issue: High cost

**Symptom**: API bills higher than expected

**Analysis**:

```bash
# Calculate cost per session
# Requests per 15min session at 3s interval: 300 requests
# Cost per request: ~$0.0087
# Without caching: 300 * $0.0087 = $2.61
# With 70% cache: 90 * $0.0087 = $0.78
# With 80% cache: 60 * $0.0087 = $0.52
```

**Solutions**:

1. **Increase interval**: 3s → 5s saves 40%
2. **Improve caching**: Target 80%+ hit rate
3. **Reduce image size**: 512x512 → 384x384
4. **Pause on idle**: Detect when scope not moving
5. **Use cheaper model for routine feedback**:
   ```typescript
   model: 'claude-3-haiku-20241022' // $0.25 per 1M input
   ```

### Issue: Cache not working

**Symptom**: Every request hits API (0% cache rate)

**Debug**:

```typescript
// Add logging
console.log('Cache key:', service.computeCacheKey(request));
console.log('Cache stats:', service.getCacheStats());
```

**Solution**: Verify cache key is consistent

```typescript
// Before (too granular)
const pos = `${position.x},${position.y},${position.z}`;

// After (rounded)
const pos = `${Math.round(position.x * 10)},${Math.round(position.y * 10)},${Math.round(position.z * 10)}`;
```

### Issue: Mentor not appearing

**Symptom**: No overlay visible

**Checklist**:

- [ ] API key set in `.env`
- [ ] `enabled: true` in config
- [ ] Canvas registered: `mentor.registerCanvas(canvas)`
- [ ] No console errors
- [ ] `mentor.isReady === true`

**Debug**:

```typescript
// Add debug overlay
<div style={{ position: 'absolute', top: 0, left: 0, color: 'white' }}>
  Debug:
  <pre>
    {JSON.stringify({
      isReady: mentor.isReady,
      isAnalyzing: mentor.isAnalyzing,
      error: mentor.error,
      response: mentor.response ? 'present' : 'null',
    }, null, 2)}
  </pre>
</div>
```

## Performance Monitoring

### Add Performance Panel

```typescript
// In App.tsx
const [perfStats, setPerfStats] = useState({
  requestCount: 0,
  avgLatency: 0,
  cacheHitRate: 0,
  totalCost: 0,
});

// Track stats
useEffect(() => {
  if (!mentor.isAnalyzing) {
    // Update stats after each analysis
    setPerfStats(prev => ({
      requestCount: prev.requestCount + 1,
      avgLatency: calculateAvgLatency(),
      cacheHitRate: calculateCacheHitRate(),
      totalCost: prev.totalCost + estimateCost(),
    }));
  }
}, [mentor.isAnalyzing]);

// Display stats
<div style={{ position: 'absolute', bottom: 16, right: 16, ... }}>
  <h4>AI Mentor Stats</h4>
  <div>Requests: {perfStats.requestCount}</div>
  <div>Avg Latency: {perfStats.avgLatency.toFixed(0)}ms</div>
  <div>Cache Hit: {(perfStats.cacheHitRate * 100).toFixed(0)}%</div>
  <div>Total Cost: ${perfStats.totalCost.toFixed(3)}</div>
</div>
```

### Logging

Enable detailed logging:

```typescript
// In ClaudeVisionService.ts
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log('[ClaudeVision] Analysis request:', {
    level: state.level,
    position: state.scopePosition,
    cacheKey: this.computeCacheKey(request),
  });
}
```

## Production Deployment

### Backend Proxy (Recommended)

Create API route:

```typescript
// api/analyze.ts (Vercel/Netlify function)
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Verify authentication
  const token = req.headers.authorization;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limiting
  if (await isRateLimited(token)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // Server-side env
  });

  const { sceneSnapshot, state } = req.body;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', data: sceneSnapshot } },
        { type: 'text', text: buildPrompt(state) },
      ],
    }],
  });

  res.json({ response });
}
```

Update frontend:

```typescript
// services/ai/ClaudeVisionService.ts
async performAnalysis(request) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return await response.json();
}
```

### Environment-Specific Configuration

```typescript
// config/mentor.ts
export const mentorConfig = {
  development: {
    enabled: true,
    analysisInterval: 3000,
    useStreaming: true,
    dangerouslyAllowBrowser: true, // OK for dev
  },
  production: {
    enabled: true,
    analysisInterval: 5000, // Less frequent
    useStreaming: true,
    dangerouslyAllowBrowser: false, // Use backend proxy
    endpoint: '/api/analyze',
  },
};

export const config = mentorConfig[import.meta.env.MODE];
```

## Next Steps

1. ✅ Basic integration working
2. 🔄 Test with different scenarios (Level 1-3)
3. 🔄 Monitor performance and cost
4. 🔄 Implement structure highlighting
5. 🔄 Add voice synthesis for warnings
6. 🔄 Deploy backend proxy for production

## Resources

- [AI Mentor Architecture](./AI_MENTOR_ARCHITECTURE.md)
- [Integration Examples](./src/examples/AIMentorIntegration.example.tsx)
- [Test Utilities](./src/test/aiMentorTestUtils.ts)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude Vision Guide](https://docs.anthropic.com/claude/docs/vision)

## Support

Issues? Check:

- [Troubleshooting section](#troubleshooting)
- [GitHub Issues](https://github.com/your-repo/issues)
- [Anthropic Support](https://support.anthropic.com/)

---

Last updated: 2026-01-22
