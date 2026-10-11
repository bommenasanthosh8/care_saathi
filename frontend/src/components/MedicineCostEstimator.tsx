import React, { useState, useEffect, useRef } from 'react';
import { 
  Pill, 
  Search, 
  Upload, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ExternalLink, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
  FileText,
  AlertTriangle,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { 
  api, 
  MedicineDTO, 
  MedicineCourseEstimateDTO,
  ExtractedMedicineAlternativeDTO,
  PrescriptionOCRDTO
} from '../services/api';

interface MedicineCostEstimatorProps {
  onTotalMedicineCostChange?: (minCost: number, maxCost: number, data: MedicineCourseEstimateDTO) => void;
  isOpenDefault?: boolean;
}

interface SelectedMedicineInput {
  medicine_id?: string;
  name: string;
  generic_name?: string;
  strength?: string;
  formulation?: string;
  quantity: number;
  confidence?: number;
  is_verified?: boolean;
  match_score?: number;
  raw_extracted_text?: string;
  alternatives?: ExtractedMedicineAlternativeDTO[];
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const MedicineCostEstimator: React.FC<MedicineCostEstimatorProps> = ({
  onTotalMedicineCostChange,
  isOpenDefault: _isOpenDefault = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineDTO[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Selected list of medicines for the prescription course
  const [selectedItems, setSelectedItems] = useState<SelectedMedicineInput[]>([
    {
      medicine_id: 'med_pcm_650',
      name: 'Dolo 650',
      generic_name: 'Paracetamol',
      strength: '650 mg',
      formulation: 'Tablet',
      quantity: 15,
      confidence: 1.0,
      is_verified: true,
      match_score: 1.0
    },
    {
      medicine_id: 'med_panto_40',
      name: 'Pan 40',
      generic_name: 'Pantoprazole',
      strength: '40 mg',
      formulation: 'Tablet',
      quantity: 15,
      confidence: 1.0,
      is_verified: true,
      match_score: 1.0
    }
  ]);

  // Estimate response from backend
  const [estimateData, setEstimateData] = useState<MedicineCourseEstimateDTO | null>(null);

  // Prescription OCR Upload states
  const [isUploadingOcr, setIsUploadingOcr] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0); // 0: idle, 1: Reading image, 2: Finding medicines, 3: Matching prices
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);
  const [ocrErrorMsg, setOcrErrorMsg] = useState<string | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);

  // Collapsible panels & alternatives state
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showRawTextPanel, setShowRawTextPanel] = useState(false);
  const [unreadableParts, setUnreadableParts] = useState<string[]>([]);
  const [openAlternativesIdx, setOpenAlternativesIdx] = useState<number | null>(null);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState<string>('');
  const [editingItemStrength, setEditingItemStrength] = useState<string>('');
  const [editingItemForm, setEditingItemForm] = useState<string>('Tablet');
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search autocomplete debounced
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await api.searchMedicines(searchTerm.trim());
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Failed to search medicines', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const recalculateEstimate = async () => {
    if (selectedItems.length === 0) {
      setEstimateData(null);
      if (onTotalMedicineCostChange) {
        onTotalMedicineCostChange(0, 0, {
          items: [],
          total_estimated_branded_mrp: 0,
          total_estimated_nppa_ceiling: 0,
          total_estimated_jan_aushadhi: 0,
          potential_generic_savings: 0,
          potential_savings_percentage: 0,
          price_source_disclaimer: '',
          has_unverified_items: false
        });
      }
      return;
    }

    try {
      const payload = selectedItems.map(item => ({
        medicine_id: item.medicine_id,
        name: item.name,
        quantity: item.quantity,
        strength: item.strength,
        formulation: item.formulation
      }));

      const res = await api.estimateMedicineCourse(payload);
      setEstimateData(res);

      if (onTotalMedicineCostChange) {
        onTotalMedicineCostChange(res.total_estimated_jan_aushadhi, res.total_estimated_branded_mrp, res);
      }
    } catch (err) {
      console.error('Failed to calculate medicine course estimate', err);
    }
  };

  // Recalculate estimate whenever selectedItems change
  useEffect(() => {
    recalculateEstimate();
  }, [selectedItems]);

  const handleSelectMedicine = (med: MedicineDTO) => {
    const existing = selectedItems.find(i => i.medicine_id === med.id);
    if (existing) {
      setSelectedItems(prev => prev.map(i => i.medicine_id === med.id ? { ...i, quantity: i.quantity + (med.pack_size || 10) } : i));
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          medicine_id: med.id,
          name: med.brand_name,
          generic_name: med.generic_name,
          strength: med.strength,
          formulation: med.formulation,
          quantity: med.pack_size || 10,
          confidence: 1.0,
          is_verified: true,
          match_score: 1.0
        }
      ]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleAddCustomMedicine = () => {
    if (!searchTerm.trim()) return;
    setSelectedItems(prev => [
      ...prev,
      {
        name: searchTerm.trim(),
        generic_name: 'Unverified salt',
        strength: 'Standard dose',
        formulation: 'Tablet',
        quantity: 10,
        confidence: 0.5,
        is_verified: false
      }
    ]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
    if (openAlternativesIdx === index) setOpenAlternativesIdx(null);
    if (editingItemIdx === index) setEditingItemIdx(null);
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setSelectedItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const handleSelectAlternative = (itemIndex: number, alt: ExtractedMedicineAlternativeDTO) => {
    setSelectedItems(prev => prev.map((item, i) => {
      if (i !== itemIndex) return item;
      return {
        ...item,
        medicine_id: alt.medicine_id,
        name: alt.brand_name,
        generic_name: alt.generic_name,
        strength: alt.strength,
        formulation: alt.formulation,
        is_verified: true,
        confidence: 0.95,
        match_score: alt.match_score
      };
    }));
    setOpenAlternativesIdx(null);
  };

  const handleStartEditing = (idx: number) => {
    setEditingItemIdx(idx);
    setEditingItemText(selectedItems[idx].name);
    setEditingItemStrength(selectedItems[idx].strength || '');
    setEditingItemForm(selectedItems[idx].formulation || 'Tablet');
  };

  const handleSaveEditing = async (idx: number) => {
    const newName = editingItemText.trim();
    const newStrength = editingItemStrength.trim();
    const newForm = editingItemForm.trim() || 'Tablet';
    if (!newName) {
      setEditingItemIdx(null);
      return;
    }

    try {
      // Look up in database
      const searchRes = await api.searchMedicines(newName);
      if (searchRes.length > 0) {
        const matchedWithStrength = searchRes.find(m => 
          newStrength && m.strength.toLowerCase().includes(newStrength.toLowerCase())
        ) || searchRes[0];

        setSelectedItems(prev => prev.map((it, i) => i === idx ? {
          ...it,
          medicine_id: matchedWithStrength.id,
          name: matchedWithStrength.brand_name,
          generic_name: matchedWithStrength.generic_name,
          strength: newStrength || matchedWithStrength.strength,
          formulation: newForm || matchedWithStrength.formulation,
          is_verified: true,
          confidence: 1.0,
          match_score: 1.0
        } : it));
      } else {
        setSelectedItems(prev => prev.map((it, i) => i === idx ? {
          ...it,
          name: newName,
          strength: newStrength || it.strength || 'Standard dose',
          formulation: newForm,
          medicine_id: undefined,
          is_verified: false,
          confidence: 0.6
        } : it));
      }
    } catch {
      setSelectedItems(prev => prev.map((it, i) => i === idx ? {
        ...it,
        name: newName,
        strength: newStrength || it.strength,
        formulation: newForm
      } : it));
    } finally {
      setEditingItemIdx(null);
    }
  };

  // Client-side Tesseract.js fallback
  const runClientOcrFallback = async (file: File): Promise<PrescriptionOCRDTO | null> => {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();

      if (ret.data && ret.data.text && ret.data.text.trim()) {
        const res = await api.ocrPrescription(undefined, ret.data.text.trim());
        return res;
      }
    } catch (err) {
      console.warn('Client Tesseract fallback error:', err);
    }
    return null;
  };

  // Prescription OCR Handler (End-to-End)
  const handleOcrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // STEP 1: File Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setOcrErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 10 MB. Please upload a smaller image or compressed PDF.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAcceptedExt = ext && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'].includes(ext);
    const isAcceptedMime = ALLOWED_MIME_TYPES.includes(file.type) || isAcceptedExt;

    if (!isAcceptedMime) {
      setOcrErrorMsg(`Unsupported file format ('.${ext || 'unknown'}'). Please upload a JPG, PNG, WEBP, HEIC, or PDF prescription.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Set preview
    setUploadedFileName(file.name);
    setIsPdf(file.type === 'application/pdf' || ext === 'pdf');
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setUploadedPreviewUrl(objectUrl);
    } else {
      setUploadedPreviewUrl(null);
    }

    setIsUploadingOcr(true);
    setAnalysisStep(1); // 1. Reading image
    setOcrSuccessMsg(null);
    setOcrErrorMsg(null);
    setRawOcrText(null);
    setShowRawTextPanel(false);
    setUnreadableParts([]);

    try {
      // Step 2 timer simulation for UI progress
      setTimeout(() => setAnalysisStep(2), 700); // 2. Finding medicines
      setTimeout(() => setAnalysisStep(3), 1500); // 3. Matching prices

      let data: PrescriptionOCRDTO | null = null;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/ocr/prescription', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          data = await res.json();
        } else {
          throw new Error('Server Vision OCR failed');
        }
      } catch (serverErr) {
        console.warn('Server OCR failed, attempting client Tesseract fallback...', serverErr);
      }

      // Fall back to client-side Tesseract.js if server returned no medicines
      if (!data || !data.medicines || data.medicines.length === 0) {
        setAnalysisStep(2); // Finding medicines via local optical character recognition
        const fallbackData = await runClientOcrFallback(file);
        if (fallbackData) {
          data = fallbackData;
        }
      }

      if (!data) {
        throw new Error('Unable to analyze document. Please ensure the prescription is legible.');
      }

      setRawOcrText(data.extracted_raw_text || '');
      setUnreadableParts(data.unreadable_parts || data.uncertain_regions || []);

      // Check extracted medicines
      const rawMeds = (data.medicines && data.medicines.length > 0)
        ? data.medicines
        : (data.detected_medicines_detailed || []);

      if (rawMeds && rawMeds.length > 0) {
        const extracted: SelectedMedicineInput[] = rawMeds.map((m: any) => ({
          medicine_id: m.matched_medicine_id || m.medicine_id || undefined,
          name: m.matched_brand_name || m.brand_name || m.name || m.name_as_written || 'Prescribed Medicine',
          generic_name: m.matched_generic_name || m.generic_name || m.name,
          strength: m.matched_strength || m.strength || m.dosage || 'Standard dose',
          formulation: m.matched_formulation || m.form || m.formulation || 'Tablet',
          quantity: m.quantity || 10,
          confidence: m.confidence !== undefined ? m.confidence : (m.is_verified ? 0.9 : 0.6),
          is_verified: m.is_verified !== undefined ? m.is_verified : false,
          match_score: m.match_score !== undefined ? m.match_score : 1.0,
          raw_extracted_text: m.name_as_written || m.visibly_extracted_text || m.name,
          alternatives: m.alternatives || []
        }));

        setSelectedItems(extracted);
        setIsAwaitingConfirmation(true);

        const verifiedCount = extracted.filter(m => m.is_verified).length;
        const unverifiedCount = extracted.length - verifiedCount;
        if (unverifiedCount > 0) {
          setOcrSuccessMsg(`${extracted.length} medicine(s) detected (${verifiedCount} verified; ${unverifiedCount} need verification). Please verify medicine names & dosage strengths below.`);
        } else {
          setOcrSuccessMsg(`Successfully identified ${extracted.length} medicine(s). Please verify quantities & confirm below.`);
        }
      } else {
        setOcrErrorMsg('No identifiable medicine names detected in the uploaded prescription.');
        setShowRawTextPanel(true);
      }
    } catch (err: any) {
      setOcrErrorMsg(err.message || 'Error uploading prescription document');
      setShowRawTextPanel(true);
    } finally {
      setIsUploadingOcr(false);
      setAnalysisStep(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearUploadedFile = () => {
    if (uploadedPreviewUrl) {
      URL.revokeObjectURL(uploadedPreviewUrl);
    }
    setUploadedPreviewUrl(null);
    setUploadedFileName(null);
    setIsPdf(false);
    setRawOcrText(null);
    setShowRawTextPanel(false);
    setOcrSuccessMsg(null);
    setOcrErrorMsg(null);
    setIsAwaitingConfirmation(false);
  };

  return (
    <div 
      className="card medicine-cost-estimator"
      id="medicine-cost-estimator-panel"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 14px rgba(18, 48, 74, 0.06)',
        marginBottom: '28px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-teal" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px' }}>
              <Pill size={14} />
              <span>NPPA Pharma Sahi Daam & Jan Aushadhi Reference</span>
            </span>
            <span className="badge badge-navy" style={{ padding: '4px 8px' }}>Statutory Rate Master</span>
          </div>
          <h3 style={{ fontSize: '1.35rem', color: '#12304A', margin: 0, fontWeight: 700 }}>
            Medicine Cost Estimator & Generic Alternatives
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#64717D', margin: '4px 0 0' }}>
            Compare branded MRP against official ceiling caps and PMBJP Janaushadhi generic prices.
          </p>
        </div>

        {/* Prescription OCR Action */}
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleOcrFileUpload} 
            accept="image/jpeg,image/png,image/webp,image/heic,.heic,application/pdf" 
            style={{ display: 'none' }} 
            id="prescription-ocr-file-input"
          />
          <button
            type="button"
            id="upload-prescription-ocr-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingOcr}
            className="btn btn-secondary btn-sm"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.86rem',
              padding: '8px 16px',
              backgroundColor: '#F0FDF4',
              borderColor: '#86EFAC',
              color: '#166534',
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            {isUploadingOcr ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing Prescription...</span>
              </>
            ) : (
              <>
                <Upload size={15} color="#166534" />
                <span>Upload Prescription (OCR)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Uploaded Prescription Thumbnail & Metadata Preview */}
      {uploadedFileName && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {uploadedPreviewUrl ? (
              <img 
                src={uploadedPreviewUrl} 
                alt="Prescription Thumbnail" 
                style={{
                  width: '46px',
                  height: '46px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1'
                }} 
              />
            ) : (
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                backgroundColor: isPdf ? '#FEE2E2' : '#E2E8F0',
                color: isPdf ? '#DC2626' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={22} />
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1E293B' }}>
                {uploadedFileName}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                {isPdf ? 'Multi-page Clinical PDF Document' : 'High-Resolution Clinical Prescription Image'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearUploadedFile}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            title="Remove prescription"
          >
            <X size={14} />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* Progress Multi-Step State Indicator */}
      {isUploadingOcr && (
        <div style={{
          backgroundColor: '#F0FDFA',
          border: '1px solid #99F6E4',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#0F766E' }}>
              <RefreshCw size={16} style={{ animation: 'spin 1.2s linear infinite' }} />
              <span>Analyzing prescription with Gemini Multimodal Vision...</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#0D9488', fontWeight: 600 }}>
              Step {analysisStep || 1} of 3
            </span>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: analysisStep >= 1 ? '#0D9488' : '#CCFBF1',
              color: analysisStep >= 1 ? '#FFFFFF' : '#0F766E',
              fontSize: '0.76rem',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              1. Reading image
            </div>
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: analysisStep >= 2 ? '#0D9488' : '#CCFBF1',
              color: analysisStep >= 2 ? '#FFFFFF' : '#0F766E',
              fontSize: '0.76rem',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              2. Finding medicines
            </div>
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: analysisStep >= 3 ? '#0D9488' : '#CCFBF1',
              color: analysisStep >= 3 ? '#FFFFFF' : '#0F766E',
              fontSize: '0.76rem',
              fontWeight: 600,
              textAlign: 'center',
              transition: 'all 0.3s'
            }}>
              3. Matching prices
            </div>
          </div>
        </div>
      )}

      {/* OCR Status Alerts */}
      {ocrSuccessMsg && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.84rem',
          color: '#065F46',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
          <span>{ocrSuccessMsg}</span>
        </div>
      )}

      {ocrErrorMsg && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '0.84rem',
          color: '#991B1B',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{ocrErrorMsg}</div>
            <div style={{ fontSize: '0.78rem', marginTop: '2px', color: '#7F1D1D' }}>
              You can search and add prescribed medications manually using the search box below.
            </div>
          </div>
        </div>
      )}

      {/* Unreadable Parts Note */}
      {unreadableParts.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.78rem',
          color: '#92400E',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Unclear sections detected:</strong> {unreadableParts.join(', ')}. Please verify with your doctor or pharmacist.
          </span>
        </div>
      )}

      {/* Collapsible "What we read" and "Retake photo" Guidelines */}
      {rawOcrText && (
        <div style={{
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          <button
            type="button"
            onClick={() => setShowRawTextPanel(!showRawTextPanel)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: '#F8FAFC',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              color: '#334155',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#0D9488" />
              <span>What We Read from Prescription</span>
            </div>
            {showRawTextPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showRawTextPanel && (
            <div style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
              <div style={{
                backgroundColor: '#F1F5F9',
                borderRadius: '8px',
                padding: '10px 12px',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#334155',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
                overflowY: 'auto',
                marginBottom: '12px'
              }}>
                {rawOcrText}
              </div>

              {/* Photo Retake Guidelines */}
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                  <Lightbulb size={15} />
                  <span>Tips for clear prescription capture:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.76rem', color: '#15803D', lineHeight: 1.5 }}>
                  <li><strong>Good, even lighting:</strong> Ensure natural daylight or bright ambient room light without phone flash glare.</li>
                  <li><strong>Flat paper:</strong> Smooth out any deep folds, wrinkles, or curl along the edges.</li>
                  <li><strong>No shadows:</strong> Hold your phone directly above the prescription without casting hand shadows.</li>
                  <li><strong>Sharp focus:</strong> Tap the screen to focus on the doctor's handwriting before snapping the photo.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Input with Autocomplete */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={16} 
              color="#64717D" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search prescribed medicine (e.g., Dolo, Pan 40, Augmentin, Telma, Metformin...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddCustomMedicine}
            disabled={!searchTerm.trim()}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={14} />
            <span>Add Custom</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            {searchResults.map(med => (
              <div
                key={med.id}
                onClick={() => handleSelectMedicine(med)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#12304A' }}>
                    {med.brand_name} <span style={{ fontWeight: 400, color: '#64717D', fontSize: '0.8rem' }}>({med.strength})</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#2C8C83' }}>
                    Generic Salt: {med.generic_name} • {med.formulation}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#12304A' }}>
                    ₹{med.mrp_branded.toFixed(2)} (Pack of {med.pack_size})
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    Jan Aushadhi: ₹{(med.jan_aushadhi_per_unit * med.pack_size).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editable Confirmation Banner for Prescription OCR */}
      {isAwaitingConfirmation && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #6EE7B7',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065F46' }}>
                Extracted Medications Verification
              </div>
              <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                Please verify medicine names, dosage strengths, and quantities below against your prescription. Click the edit icon to adjust any field before final cost calculation.
              </div>
            </div>
          </div>

          <button
            type="button"
            id="confirm-prescription-btn"
            onClick={() => {
              setIsAwaitingConfirmation(false);
              recalculateEstimate();
            }}
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: '#0D9488',
              borderColor: '#0F766E',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.82rem',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Check size={14} />
            <span>Confirm & Calculate Costs</span>
          </button>
        </div>
      )}

      {/* Selected Medicines Table */}
      <div style={{ marginBottom: '18px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAF9', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64717D' }}>
              <th style={{ padding: '8px 10px' }}>Prescribed Medicine</th>
              <th style={{ padding: '8px 10px' }}>Active Formulation</th>
              <th style={{ padding: '8px 10px', width: '90px' }}>Quantity</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Branded MRP</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Jan Aushadhi Generic</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map((item, idx) => {
              const estItem = estimateData?.items[idx];
              const isVerified = (item.is_verified !== false) && (estItem ? estItem.verified : true);
              const isLowConfidence = (item.confidence !== undefined && item.confidence < 0.70) || !isVerified;
              const hasAlternatives = item.alternatives && item.alternatives.length > 0;
              const isEditing = editingItemIdx === idx;

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isLowConfidence ? '#FFFDF8' : 'transparent' }}>
                  {/* Prescribed Medicine */}
                  <td style={{ padding: '10px 10px', fontWeight: 600, color: '#12304A', position: 'relative' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          value={editingItemText}
                          onChange={(e) => setEditingItemText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditing(idx); }}
                          autoFocus
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid #0D9488',
                            fontSize: '0.82rem',
                            width: '140px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditing(idx)}
                          style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: '2px' }}
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItemIdx(null)}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{item.name}</span>
                          {/* Low Confidence Amber Badge */}
                          {isLowConfidence && (
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: '#FEF3C7', 
                                color: '#B45309', 
                                border: '1px solid #FDE68A',
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <AlertTriangle size={11} />
                              <span>Please verify</span>
                            </span>
                          )}

                          {/* Inline Edit Trigger */}
                          <button
                            type="button"
                            onClick={() => handleStartEditing(idx)}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '1px' }}
                            title="Edit medicine name"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>

                        {/* Raw extracted line if different */}
                        {item.raw_extracted_text && item.raw_extracted_text !== item.name && (
                          <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '1px' }}>
                            Read as: <em>"{item.raw_extracted_text}"</em>
                          </div>
                        )}

                        {/* Alternatives Dropdown Button */}
                        {hasAlternatives && (
                          <div style={{ marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setOpenAlternativesIdx(openAlternativesIdx === idx ? null : idx)}
                              style={{
                                background: 'none',
                                border: '1px dashed #CBD5E1',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '0.68rem',
                                color: '#0F766E',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                backgroundColor: '#F0FDFA'
                              }}
                            >
                              <Sparkles size={11} />
                              <span>{item.alternatives?.length} Alternatives</span>
                              <ChevronDown size={11} />
                            </button>

                            {/* Alternatives Modal / Menu */}
                            {openAlternativesIdx === idx && (
                              <div style={{
                                position: 'absolute',
                                left: '10px',
                                top: '100%',
                                zIndex: 120,
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '8px',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                                width: '260px',
                                padding: '6px 0',
                                marginTop: '4px'
                              }}>
                                <div style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>
                                  Select verified Jan Aushadhi match:
                                </div>
                                {item.alternatives?.map((alt, aIdx) => (
                                  <div
                                    key={aIdx}
                                    onClick={() => handleSelectAlternative(idx, alt)}
                                    style={{
                                      padding: '8px 10px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #F8FAFC',
                                      transition: 'background-color 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0FDFA'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                                  >
                                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#1E293B' }}>
                                      {alt.brand_name} ({alt.strength})
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#059669' }}>
                                      Generic: {alt.generic_name} • ₹{alt.jan_aushadhi_per_unit}/tab
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Active Formulation & Strength */}
                  <td style={{ padding: '10px 10px', color: '#475569' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          value={editingItemStrength}
                          onChange={(e) => setEditingItemStrength(e.target.value)}
                          placeholder="Strength (e.g. 650 mg)"
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid #0D9488',
                            fontSize: '0.80rem',
                            width: '95px'
                          }}
                        />
                        <select
                          value={editingItemForm}
                          onChange={(e) => setEditingItemForm(e.target.value)}
                          style={{
                            padding: '3px 4px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.78rem'
                          }}
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Eye Drops">Eye Drops</option>
                          <option value="Ointment">Ointment</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>
                          {item.generic_name || item.name} ({item.strength || 'Standard dose'})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditing(idx)}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '1px' }}
                          title="Edit strength or formulation"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td style={{ padding: '10px 10px' }}>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                      style={{
                        width: '65px',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem'
                      }}
                    />
                  </td>

                  {/* Branded MRP */}
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600, color: '#12304A' }}>
                    {estItem?.cost_branded !== null && estItem?.cost_branded !== undefined ? (
                      `₹${estItem.cost_branded.toFixed(2)}`
                    ) : (
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Unverified</span>
                    )}
                  </td>

                  {/* Jan Aushadhi Generic */}
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    {estItem?.cost_jan_aushadhi !== null && estItem?.cost_jan_aushadhi !== undefined ? (
                      `₹${estItem.cost_jan_aushadhi.toFixed(2)}`
                    ) : (
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Unverified</span>
                    )}
                  </td>

                  {/* Action */}
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      title="Remove medicine"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Cost & Savings Card */}
      {estimateData && (
        <div style={{
          backgroundColor: '#F8FAF9',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 18px',
          marginBottom: '18px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64717D', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Branded MRP
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#12304A' }}>
                ₹{estimateData.total_estimated_branded_mrp.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#059669', textTransform: 'uppercase', fontWeight: 600 }}>
                Jan Aushadhi Generic Course
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                ₹{estimateData.total_estimated_jan_aushadhi.toFixed(2)}
              </div>
            </div>

            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>
                Potential Generic Savings
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                ₹{estimateData.potential_generic_savings.toFixed(2)} ({estimateData.potential_savings_percentage}%)
              </div>
            </div>
          </div>

          {/* Unverified items exclusion advisory */}
          {estimateData.has_unverified_items && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              fontSize: '0.76rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle size={13} color="#D97706" style={{ flexShrink: 0 }} />
              <span>
                <strong>Notice:</strong> Totals and potential generic savings include verified statutory medicines only. {estimateData.unverified_items_count ? `${estimateData.unverified_items_count} unverified medicine(s) are excluded` : 'Unverified medicines are excluded'} from calculations until confirmed or edited.
              </span>
            </div>
          )}

          {/* Official Source Reference Link */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#64717D',
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid #E2E8F0',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            <span>
              Official Reference: <strong>NPPA Pharma Sahi Daam & PMBJP</strong> (Jan Aushadhi Rate Master)
            </span>
            <a 
              href="https://nppaipdms.gov.in/NPPA/PharmaSahiDaam/searchMedicine" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#2C8C83', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
            >
              Verify on NPPA Portal <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Safety & Clinician Advisory Notice */}
      <div style={{
        backgroundColor: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.80rem', color: '#92400E', lineHeight: 1.5 }}>
          <strong>Important Medical Notice:</strong> CareSaathi AI provides pricing transparency and statutory ceiling information only. <em>Please verify the detected medicines against your prescription.</em> We do not prescribe medicines, modify dosages, or recommend altering your doctor's prescribed therapy. Always consult your prescribing physician or a licensed pharmacist before substituting any branded medication with a generic alternative.
        </div>
      </div>
    </div>
  );
};
