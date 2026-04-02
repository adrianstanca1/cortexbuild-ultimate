# Phase 1 Development Tasks: PWA + Document AI

**Created:** 2026-04-02
**Phase:** 1 of 3
**Budget:** £20K
**Timeline:** 4-6 weeks
**Focus:** Enhanced PWA + Document Processing AI

---

## Executive Summary

Phase 1 delivers immediate value through two strategic initiatives:

1. **Enhanced PWA** (2-3 weeks) - Improved offline support, install prompts, push notifications
2. **Document Processing AI** (2-3 weeks) - Invoice OCR, auto-population, 80%+ accuracy

**Expected ROI:** 3x through time savings (15 min/invoice) + improved mobile adoption (50%+ target)

---

## Current State Analysis

### ✅ What's Already in Place

**PWA Infrastructure:**
- `public/manifest.json` - Complete with icons, shortcuts, screenshots
- `public/sw.js` - Service worker with cache strategies (static, API, data)
- `src/hooks/usePWA.ts` - Online/offline detection, IndexedDB pending queue
- `public/offline.html` - Offline fallback page
- App icons (72x72 to 512x512)

**AI Infrastructure:**
- Ollama integration (`server/routes/ai.js`, `src/services/ai.ts`)
- 9 local models available (qwen3.5:4b, ministral-3:14b, etc.)
- Streaming support implemented
- Conversation history with summarization
- Existing AI agents: RFI analyzer, Safety agent, Change-order agent, Daily-report agent

**Document Upload:**
- `server/routes/upload.js` - Multer-based file upload (50MB limit)
- `src/components/modules/Documents.tsx` - Full document management UI
- Database tables: `documents`, `document_versions`
- Support for PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, DWG, ZIP

**Invoice Management:**
- `src/components/modules/Invoicing.tsx` - Complete invoicing UI (1281 lines)
- Database table: `invoices`
- Status tracking: draft, sent, paid, overdue, disputed

### ❌ What's Missing

**PWA Gaps:**
- No "Add to Home Screen" install prompt
- Push notifications not wired up (no backend endpoint)
- IndexedDB queue exists but sync is incomplete
- No background sync registration
- Service worker not registered via vite-plugin-pwa

**Document AI Gaps:**
- No OCR integration (Tesseract.js or AWS Textract)
- No document type classification
- No data extraction from invoices
- No form auto-population
- AI exists but not connected to document processing

---

## Task Breakdown

### Track 1: Enhanced PWA (Week 1-3)

#### Task 1.1: Install Prompt Component
**Priority:** P0 (Critical)
**Effort:** 0.5 days
**Dependencies:** None

**Files to Create:**
- `src/components/ui/InstallPrompt.tsx` - Install banner component
- `src/hooks/useInstallPrompt.ts` - Install prompt logic

**Files to Modify:**
- `src/App.tsx` - Add InstallPrompt to root

**Implementation:**
```typescript
// useInstallPrompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { isInstalled, canInstall: !!deferredPrompt, promptInstall };
}
```

**Acceptance Criteria:**
- [ ] Banner shows when user can install (not already installed)
- [ ] "Install App" button triggers native install dialog
- [ ] Banner dismisses permanently after install or dismissal
- [ ] Works on Chrome (Android + Desktop), Edge
- [ ] iOS shows custom "Add to Home Screen" instructions

---

#### Task 1.2: Push Notification Backend
**Priority:** P0 (Critical)
**Effort:** 1 day
**Dependencies:** None

**Files to Create:**
- `server/routes/push-notification.js` - Web Push API endpoint
- `server/lib/web-push.js` - Push notification utilities

**Files to Modify:**
- `server/index.js` - Register push notification routes

**Dependencies to Install:**
```bash
npm install web-push
```

**Implementation:**
```javascript
// server/lib/web-push.js
const webPush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webPush.setVapidDetails(
  'mailto:notifications@cortexbuildpro.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = {
  async subscribeUser(subscription) {
    // Store subscription in database
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, subscription, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, (subscription->>'endpoint')) DO UPDATE
       SET subscription = $2, updated_at = NOW()`,
      [subscription.userId, JSON.stringify(subscription.subscription)]
    );
  },

  async sendNotification(userId, payload) {
    const { rows } = await pool.query(
      `SELECT subscription FROM push_subscriptions WHERE user_id = $1`,
      [userId]
    );

    const promises = rows.map(async (row) => {
      try {
        await webPush.sendNotification(
          JSON.parse(row.subscription),
          JSON.stringify(payload)
        );
      } catch (error) {
        console.error('Push notification failed:', error);
        // Remove invalid subscription
        if (error.statusCode === 410) {
          await pool.query(
            `DELETE FROM push_subscriptions WHERE subscription = $1`,
            [row.subscription]
          );
        }
      }
    });

    await Promise.all(promises);
  }
};
```

**Acceptance Criteria:**
- [ ] VAPID keys generated and configured
- [ ] POST /api/push/subscribe endpoint works
- [ ] POST /api/push/send endpoint works
- [ ] Subscriptions stored in database
- [ ] Invalid subscriptions cleaned up automatically

---

#### Task 1.3: Push Notification Frontend
**Priority:** P0 (Critical)
**Effort:** 1 day
**Dependencies:** Task 1.2

**Files to Create:**
- `src/hooks/usePushNotifications.ts` - Push notification subscription
- `src/components/ui/NotificationPermission.tsx` - Permission prompt

**Files to Modify:**
- `src/App.tsx` - Initialize push notifications
- `public/sw.js` - Enhance push event handler (already exists)

**Implementation:**
```typescript
// usePushNotifications.ts
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;

    // Generate VAPID key (from env)
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const convertedKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    // Send to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });
  };

  return { permission, requestPermission, subscribe };
}
```

**Acceptance Criteria:**
- [ ] Permission prompt shows on user action (not auto)
- [ ] Subscription sent to backend
- [ ] Service worker receives push events
- [ ] Notifications display with correct title/body/icon
- [ ] Clicking notification opens app to relevant URL

---

#### Task 1.4: Background Sync Enhancement
**Priority:** P1 (High)
**Effort:** 1.5 days
**Dependencies:** Task 1.1

**Files to Create:**
- `src/lib/offlineQueue.ts` - Typed offline queue operations
- `src/lib/syncEngine.ts` - Sync queue processor

**Files to Modify:**
- `public/sw.js` - Add sync event handlers (already has basic sync)
- `src/hooks/usePWA.ts` - Integrate sync engine

**Database Migration:**
```sql
-- server/migrations/022_add_push_subscriptions.sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, (subscription->>'endpoint'))
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
```

**Implementation:**
```typescript
// lib/offlineQueue.ts
interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'cortexbuild-offline-v2';
const STORE_NAME = 'pending-operations';

export async function addToQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedOperations() {
  const db = await openDB();
  return new Promise<OfflineOperation[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

**Acceptance Criteria:**
- [ ] Operations queued when offline
- [ ] Background sync triggered when online
- [ ] Retry logic with exponential backoff
- [ ] Conflicts detected and flagged for manual resolution
- [ ] User notified of sync status

---

#### Task 1.5: Image Compression Utility
**Priority:** P1 (High)
**Effort:** 0.5 days
**Dependencies:** None

**Files to Create:**
- `src/lib/imageCompression.ts` - Client-side image compression

**Implementation:**
```typescript
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/webp';
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'image/jpeg',
  } = options;

  const bitmap = await createImageBitmap(file);

  // Calculate new dimensions
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  }

  // Create canvas and compress
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return await canvas.convertToBlob({
    type: format,
    quality,
  });
}
```

**Acceptance Criteria:**
- [ ] Images compressed to max 1920x1920
- [ ] Quality set to 80% (configurable)
- [ ] 5MB image → ~500KB (90% reduction)
- [ ] EXIF orientation preserved
- [ ] Works in web worker (non-blocking)

---

#### Task 1.6: PWA Performance Optimization
**Priority:** P2 (Medium)
**Effort:** 1 day
**Dependencies:** None

**Files to Modify:**
- `vite.config.ts` - Add vite-plugin-pwa
- `public/sw.js` - Optimize cache strategies
- `src/main.tsx` - Register service worker properly

**Dependencies to Install:**
```bash
npm install -D vite-plugin-pwa
```

**Implementation:**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      manifest: {
        name: 'CortexBuild Ultimate',
        short_name: 'CortexBuild',
        // ... existing manifest
      },
    }),
  ],
});
```

**Acceptance Criteria:**
- [ ] Lighthouse PWA score: 100
- [ ] Service worker auto-updates
- [ ] Cache strategies optimized (NetworkFirst for API, CacheFirst for static)
- [ ] Offline page loads instantly
- [ ] No console errors

---

### Track 2: Document Processing AI (Week 2-4)

#### Task 2.1: OCR Integration (Tesseract.js)
**Priority:** P0 (Critical)
**Effort:** 1 day
**Dependencies:** None

**Files to Create:**
- `src/lib/ocr/tesseract.ts` - Tesseract.js OCR wrapper
- `server/routes/ocr.js` - Server-side OCR endpoint

**Dependencies to Install:**
```bash
npm install tesseract.js  # Frontend
npm install tesseract.js  # Backend (or use frontend-only)
```

**Implementation:**
```typescript
// src/lib/ocr/tesseract.ts
import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: { text: string; confidence: number; bbox: [number, number, number, number] }[];
}

export async function extractTextFromImage(
  image: File | string,
  options: {
    lang?: string;
    progressCallback?: (progress: number) => void;
  } = {}
): Promise<OCRResult> {
  const { lang = 'eng', progressCallback } = options;

  const { data } = await Tesseract.recognize(image, lang, {
    logger: (m) => {
      if (m.status === 'recognizing text' && progressCallback) {
        progressCallback(m.progress);
      }
    },
  });

  return {
    text: data.text,
    confidence: data.confidence,
    words: data.words.map((w) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: w.bbox,
    })),
  };
}
```

**Acceptance Criteria:**
- [ ] PDF/image uploaded and converted to base64
- [ ] OCR extracts text with 85%+ accuracy
- [ ] Progress indicator shows OCR status
- [ ] Supports English documents
- [ ] Handles invoices, permits, certificates

---

#### Task 2.2: Document Type Classification
**Priority:** P0 (Critical)
**Effort:** 1.5 days
**Dependencies:** Task 2.1

**Files to Create:**
- `src/lib/ai/documentClassifier.ts` - AI-powered document classification
- `server/lib/document-classifier.js` - Server-side classifier

**Implementation:**
```typescript
// src/lib/ai/documentClassifier.ts
export type DocumentType =
  | 'invoice'
  | 'permit'
  | 'certificate'
  | 'contract'
  | 'drawing'
  | 'specification'
  | 'ram'
  | 'report'
  | 'unknown';

export interface ClassificationResult {
  type: DocumentType;
  confidence: number;
  subType?: string;
  metadata: Record<string, string>;
}

export async function classifyDocument(ocrText: string): Promise<ClassificationResult> {
  const prompt = `Classify this document based on extracted text.

Document Types:
- invoice: Payment request with amounts, dates, supplier
- permit: Official permission/approval document
- certificate: Certification, license, qualification
- contract: Legal agreement between parties
- drawing: Technical drawing, plan, blueprint
- specification: Technical requirements, standards
- ram: Risk Assessment or Method Statement
- report: Progress report, inspection report, survey

Extracted Text:
${ocrText.substring(0, 2000)}

Respond with JSON:
{
  "type": "<document_type>",
  "confidence": <0-1>,
  "subType": "<optional_subtype>",
  "metadata": {
    "detectedFields": ["field1", "field2"]
  }
}`;

  const response = await fetch('/api/ai/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  return parseClassification(result.reply);
}
```

**Server Endpoint:**
```javascript
// server/routes/ai.js (add new route)
router.post('/classify', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt,
        format: 'json',
        stream: false,
      }),
    });

    const result = await response.json();
    res.json({ reply: result.response });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ error: 'Classification failed' });
  }
});
```

**Acceptance Criteria:**
- [ ] Correctly identifies invoices (90%+ accuracy)
- [ ] Distinguishes permits from certificates
- [ ] Handles ambiguous documents gracefully
- [ ] Returns confidence score
- [ ] Response time <3 seconds

---

#### Task 2.3: Invoice Data Extraction
**Priority:** P0 (Critical)
**Effort:** 2 days
**Dependencies:** Task 2.2

**Files to Create:**
- `src/lib/ai/invoiceExtractor.ts` - Invoice field extraction
- `server/lib/invoice-extractor.js` - Server-side extraction

**Implementation:**
```typescript
// src/lib/ai/invoiceExtractor.ts
export interface ExtractedInvoice {
  documentType: 'invoice';
  supplier: string;
  supplierAddress?: string;
  invoiceNumber: string;
  amount: number;
  vat: number;
  total: number;
  date: string;
  dueDate: string;
  purchaseOrder?: string;
  projectId?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number; amount: number }[];
  confidence: number;
}

export async function extractInvoiceData(ocrText: string): Promise<ExtractedInvoice> {
  const prompt = `Extract invoice data from this OCR text.

OCR Text:
${ocrText.substring(0, 3000)}

Extract these fields:
- supplier: Company name issuing the invoice
- supplierAddress: Supplier's address
- invoiceNumber: Invoice reference number
- amount: Subtotal (before VAT)
- vat: VAT amount
- total: Total amount due
- date: Invoice date
- dueDate: Payment due date
- purchaseOrder: PO number if present
- lineItems: Array of line items if present

Respond with JSON:
{
  "supplier": "...",
  "invoiceNumber": "...",
  "amount": 0.00,
  "vat": 0.00,
  "total": 0.00,
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "purchaseOrder": "...",
  "lineItems": [],
  "confidence": 0.0
}`;

  const response = await fetch('/api/ai/extract-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  return parseInvoiceResponse(result.reply);
}
```

**Server Endpoint:**
```javascript
// server/routes/ai.js
router.post('/extract-invoice', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for structured extraction
          num_predict: 500,
        },
      }),
    });

    const result = await response.json();
    res.json({ reply: result.response });
  } catch (error) {
    console.error('Invoice extraction error:', error);
    res.status(500).json({ error: 'Extraction failed' });
  }
});
```

**Acceptance Criteria:**
- [ ] Extracts all required fields from invoices
- [ ] Handles different invoice formats
- [ ] Amounts parsed correctly (handles £, commas, decimals)
- [ ] Dates normalized to ISO format
- [ ] 80%+ field accuracy
- [ ] Confidence score reflects accuracy

---

#### Task 2.4: Invoice Form Auto-Population
**Priority:** P0 (Critical)
**Effort:** 1.5 days
**Dependencies:** Task 2.3

**Files to Modify:**
- `src/components/modules/Invoicing.tsx` - Add "Import from PDF" button
- `src/components/ui/InvoiceImportModal.tsx` - New modal for import

**Files to Create:**
- `src/components/ui/InvoiceImportModal.tsx` - Import workflow UI

**Implementation:**
```typescript
// InvoiceImportModal.tsx
export function InvoiceImportModal({
  isOpen,
  onClose,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ExtractedInvoice) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setExtracting(true);
    setError(null);

    try {
      // Step 1: OCR
      const ocrResult = await extractTextFromImage(selectedFile);

      // Step 2: Classify
      const classification = await classifyDocument(ocrResult.text);
      if (classification.type !== 'invoice') {
        throw new Error('Document is not an invoice');
      }

      // Step 3: Extract invoice data
      const invoiceData = await extractInvoiceData(ocrResult.text);
      setExtracted(invoiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Invoice">
      <div className="p-6">
        {!extracted ? (
          <FileUpload
            accept=".pdf,.png,.jpg,.jpeg"
            onFileSelect={handleFileSelect}
            loading={extracting}
          />
        ) : (
          <InvoicePreview
            data={extracted}
            onConfirm={() => onImport(extracted)}
            onEdit={() => {/* Manual edit mode */}}
            onRetry={() => {
              setExtracted(null);
              setFile(null);
            }}
          />
        )}
      </div>
    </Modal>
  );
}
```

**Acceptance Criteria:**
- [ ] "Import from PDF" button in Invoicing module
- [ ] File upload with drag-drop
- [ ] Progress indicator during extraction
- [ ] Preview extracted data before import
- [ ] Manual edit option for corrections
- [ ] Creates invoice in database on confirm

---

#### Task 2.5: Batch Invoice Processing
**Priority:** P1 (High)
**Effort:** 1 day
**Dependencies:** Task 2.4

**Files to Create:**
- `src/components/ui/BatchInvoiceImport.tsx` - Batch upload UI

**Implementation:**
```typescript
export function BatchInvoiceImport({
  onBatchComplete,
}: {
  onBatchComplete: (results: { success: number; failed: number }) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  const processBatch = async () => {
    setProcessing(true);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        await processSingleInvoice(files[i]);
        success++;
      } catch {
        failed++;
      }
      setProgress({ current: i + 1, total: files.length, success, failed });
    }

    onBatchComplete({ success, failed });
  };

  return (
    <div>
      <FileUpload multiple onFilesSelect={setFiles} />
      {files.length > 0 && (
        <Button onClick={processBatch} disabled={processing}>
          Process {files.length} Invoices
        </Button>
      )}
      {processing && (
        <ProgressBar
          current={progress.current}
          total={progress.total}
          label={`Processed ${progress.current}/${progress.total} (${progress.success} success, ${progress.failed} failed)`}
        />
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Multiple file selection
- [ ] Progress bar shows batch status
- [ ] Continues processing on individual failures
- [ ] Summary report at end
- [ ] Failed items can be retried

---

#### Task 2.6: Document Expiry Tracking
**Priority:** P1 (High)
**Effort:** 1 day
**Dependencies:** Task 2.2

**Files to Create:**
- `src/lib/ai/expiryExtractor.ts` - Extract expiry dates from permits/certs
- `server/migrations/023_add_document_expiry.sql` - Add expiry tracking

**Database Migration:**
```sql
-- server/migrations/023_add_document_expiry.sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- Create reminder job
CREATE TABLE IF NOT EXISTS document_reminders (
  id SERIAL PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) DEFAULT 'expiry_warning',
  days_before INTEGER DEFAULT 30,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation:**
```typescript
// expiryExtractor.ts
export async function extractExpiryDate(ocrText: string, documentType: string): Promise<string | null> {
  const prompt = `Extract the expiry date from this ${documentType}.

Document Text:
${ocrText.substring(0, 2000)}

Look for patterns like:
- "Valid until: DD/MM/YYYY"
- "Expires: DD/MM/YYYY"
- "Expiry Date: DD/MM/YYYY"
- "Valid Through: DD/MM/YYYY"

Respond with just the date in ISO format (YYYY-MM-DD) or "null" if not found.`;

  const response = await fetch('/api/ai/extract-expiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();
  return result.reply.trim() === 'null' ? null : result.reply.trim();
}
```

**Acceptance Criteria:**
- [ ] Expiry dates extracted from permits/certificates
- [ ] Stored in database
- [ ] Reminder notifications 30 days before expiry
- [ ] Dashboard widget shows expiring documents
- [ ] Email notifications sent

---

## Quick Wins (<1 day each)

### QW1: Install Prompt Banner
**Effort:** 2 hours
**Impact:** High (mobile adoption)

Simple banner component that shows when app can be installed.

### QW2: Offline Indicator Enhancement
**Effort:** 2 hours
**Impact:** Medium (UX)

Enhance existing offline indicator with:
- Pending sync count
- "Sync Now" button
- Last sync timestamp

### QW3: Camera Access for PWA
**Effort:** 3 hours
**Impact:** High (mobile UX)

Add camera access via Web API:
```typescript
async function capturePhoto() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  // Show in video element, capture frame
}
```

### QW4: Invoice Import Button
**Effort:** 2 hours
**Impact:** High (time savings)

Add "Import from PDF" button to Invoicing module (wire up existing OCR).

### QW5: Document Type Badge
**Effort:** 1 hour
**Impact:** Low (UX)

Show classified document type as badge in Documents list.

---

## File Summary

### Files to Create (22 total)

**PWA Track:**
1. `src/components/ui/InstallPrompt.tsx`
2. `src/hooks/useInstallPrompt.ts`
3. `src/hooks/usePushNotifications.ts`
4. `src/components/ui/NotificationPermission.tsx`
5. `src/lib/offlineQueue.ts`
6. `src/lib/syncEngine.ts`
7. `src/lib/imageCompression.ts`
8. `server/routes/push-notification.js`
9. `server/lib/web-push.js`
10. `server/migrations/022_add_push_subscriptions.sql`

**Document AI Track:**
11. `src/lib/ocr/tesseract.ts`
12. `server/routes/ocr.js`
13. `src/lib/ai/documentClassifier.ts`
14. `server/lib/document-classifier.js`
15. `src/lib/ai/invoiceExtractor.ts`
16. `server/lib/invoice-extractor.js`
17. `src/components/ui/InvoiceImportModal.tsx`
18. `src/components/ui/BatchInvoiceImport.tsx`
19. `src/lib/ai/expiryExtractor.ts`
20. `server/migrations/023_add_document_expiry.sql`
21. `server/routes/ai.js` (extend with /classify, /extract-invoice, /extract-expiry)
22. `src/components/ui/InvoicePreview.tsx`

### Files to Modify (8 total)

1. `src/App.tsx` - Add InstallPrompt, NotificationPermission
2. `vite.config.ts` - Add vite-plugin-pwa
3. `public/sw.js` - Enhance sync handlers
4. `src/hooks/usePWA.ts` - Integrate sync engine
5. `src/components/modules/Invoicing.tsx` - Add import button
6. `src/components/modules/Documents.tsx` - Add type badges, expiry
7. `server/index.js` - Register new routes
8. `.env.example` - Add VAPID keys, OCR config

---

## Dependencies to Install

```bash
# Frontend
npm install tesseract.js web-push
npm install -D vite-plugin-pwa

# Backend (server/)
npm install tesseract.js web-push
```

---

## Environment Variables

Add to `.env.example`:

```bash
# PWA Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# AI/OCR
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=qwen3.5:4b
OCR_ENABLED=true
```

---

## Testing Checklist

### PWA Testing
- [ ] Install prompt shows on Chrome/Edge
- [ ] App installs and runs in standalone mode
- [ ] Push notifications work (permission + receive)
- [ ] Offline mode caches pages
- [ ] Sync queue processes when online
- [ ] Image compression reduces file size 90%
- [ ] Lighthouse PWA score: 100

### Document AI Testing
- [ ] OCR extracts text from PDF (90%+ accuracy)
- [ ] Document classification correct (90%+ accuracy)
- [ ] Invoice extraction: all fields populated (80%+ accuracy)
- [ ] Form auto-population works
- [ ] Batch processing handles 10+ invoices
- [ ] Expiry dates extracted correctly
- [ ] Error handling for poor quality scans

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mobile installs | 50+ | Analytics PWA installs |
| Push subscribers | 30% of users | Database count |
| Invoice import accuracy | 80%+ | Manual review sample |
| Time saved per invoice | 15 min | User feedback |
| OCR accuracy | 85%+ | Test suite |
| Document classification | 90%+ | Test suite |
| Lighthouse PWA score | 100 | Lighthouse CI |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OCR accuracy insufficient | Medium | High | Start with clean PDFs, improve over time |
| Push notifications blocked by iOS | Low | Medium | Fallback to email notifications |
| Sync conflicts cause data loss | Medium | High | Conservative conflict resolution, manual review |
| AI extraction errors | Medium | Medium | Human review before final import |
| Performance degradation | Low | Medium | Lazy load OCR, use web workers |

---

## Next Steps

1. **Generate VAPID keys** for push notifications
2. **Set up test invoices** (10 varied formats)
3. **Create development branch** `feature/phase1-pwa-doc-ai`
4. **Start with Quick Wins** for momentum
5. **Daily standups** to track progress
6. **Weekly demos** to stakeholders

---

**Prepared by:** AI Development Team
**Date:** 2026-04-02
**Review Date:** 2026-04-09 (weekly)
