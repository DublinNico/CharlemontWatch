import { useRef, useState } from 'react';
import { Upload, X, AlertCircle, MapPin, FileText, Mail, ImageIcon, User, Send, Tag, ClipboardList, Siren, EyeOff } from 'lucide-react';
import { Header } from '../components/Header';

import { useNavigate } from 'react-router';
import { useApp, IncidentType, Photo, ComplaintData } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { TurnstileWidget, TurnstileWidgetHandle } from '../components/Turnstile';

// Incident report submission form — type selection, common fields, per-type
// detail fields, photo upload, and optional formal complaint escalation
export function ReportIncident() {
  const navigate = useNavigate();
  const { addIncident } = useApp();

  const [formData, setFormData] = useState({
    type: '' as IncidentType | '',
    title: '',
    location: '',
    description: '',
    reporterEmail: '',
  });

  const [typeSpecificData, setTypeSpecificData] = useState<any>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const turnstileResolveRef = useRef<((token: string) => void) | null>(null);
  const turnstileRejectRef = useRef<((error: Error) => void) | null>(null);

  // Requests a fresh Turnstile token at the moment it's actually needed,
  // rather than reusing whatever token (if any) was captured whenever the
  // widget first loaded — reports can take residents several minutes to
  // fill out, long enough for an earlier token to expire.
  const requestTurnstileToken = (): Promise<string> => {
    if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) return Promise.resolve('');
    return new Promise((resolve, reject) => {
      turnstileResolveRef.current = resolve;
      turnstileRejectRef.current = reject;
      turnstileRef.current?.execute();
      setTimeout(() => {
        if (turnstileResolveRef.current === resolve) {
          turnstileResolveRef.current = null;
          turnstileRejectRef.current = null;
          reject(new Error('Verification challenge timed out'));
        }
      }, 15000);
    });
  };

  const [complaint, setComplaint] = useState({
    sendToTuath: true,
    sendToDCC: true,
    name: '',
    address: '',
  });
  const sendingComplaint = complaint.sendToTuath || complaint.sendToDCC;

  // Merges a single type-specific field update into typeSpecificData
  const updateSpecific = (key: string, value: any) =>
    setTypeSpecificData((prev: any) => ({ ...prev, [key]: value }));

  // Validates required fields (email always; name/address only if a
  // complaint is being sent), then submits the report via addIncident
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return;

    const title = formData.title.trim();
    const reporterEmail = formData.reporterEmail.trim();
    const complainantName = complaint.name.trim();
    const complainantAddress = complaint.address.trim();

    if (!title) {
      setSubmitError('Please give the report a short title.');
      return;
    }

    if (!reporterEmail) {
      setSubmitError('Please provide your email so we can send you status updates.');
      return;
    }

    if (sendingComplaint && (!complainantName || !complainantAddress)) {
      setSubmitError('Please provide your name and address to send a formal complaint.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    let turnstileToken = '';
    try {
      turnstileToken = await requestTurnstileToken();
    } catch (err: any) {
      // onError/onExpire below already set a specific message when that's
      // what caused the rejection — only fall back to a generic one for the
      // plain 15s timeout case, so we don't overwrite a more useful message.
      if (err?.message === 'Verification challenge timed out') {
        setSubmitError('Verification challenge timed out. Please try again.');
      }
      turnstileRef.current?.reset();
      setIsSubmitting(false);
      return;
    }

    const complaintData: ComplaintData | undefined = sendingComplaint ? {
      name: complainantName,
      address: complainantAddress,
      sendTo: [
        ...(complaint.sendToTuath ? ['tuath' as const] : []),
        ...(complaint.sendToDCC ? ['dcc' as const] : []),
      ],
    } : undefined;

    try {
      const incidentId = await addIncident({
        type: formData.type,
        title,
        location: formData.location,
        description: formData.description,
        reporterEmail,
        status: 'AWAITING_RESPONSE',
        photos,
        typeSpecificData,
      }, complaintData, turnstileToken);
      navigate(`/success/${incidentId}?complaint=${sendingComplaint}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit report. Please check your connection and try again.');
      // Turnstile tokens are single-use — Cloudflare will reject a retry with
      // the same token even if the original failure was unrelated, so reset
      // the widget; the next submit attempt requests a fresh one anyway via
      // requestTurnstileToken(), but this clears any stuck internal state.
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Downscales and re-encodes a photo as JPEG client-side before it's ever
  // uploaded — phone camera photos can be 10-20MB, which times out or fails
  // outright on a slow/weak mobile connection well before the server's own
  // compression step (which only runs after the full original file has
  // already been received) ever gets a chance to shrink it. Falls back to
  // the original file if the browser can't decode it (e.g. HEIC, which the
  // server rejects anyway with a clear message).
  const compressForUpload = (file: File): Promise<File> => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1920;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src);
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });

  // Adds newly-selected files as local preview Photos, capped at 10 total
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && photos.length < 10) {
      const selected = Array.from(files).slice(0, 10 - photos.length);
      const compressed = await Promise.all(selected.map(compressForUpload));
      const newPhotos: Photo[] = compressed.map((file, index) => ({
        id: `photo-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        file,
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Options shown in the Incident Type select
  const incidentTypes = [
    { value: 'Graffiti', label: 'Graffiti', description: 'Vandalism or unwanted markings' },
    { value: 'Anti-Social Behaviour', label: 'Anti-Social Behaviour', description: 'Disruptive or threatening behaviour' },
    { value: 'Safety Hazard', label: 'Safety Hazard', description: 'Immediate danger to public safety' },
    { value: 'Maintenance Issue', label: 'Maintenance Issue', description: 'Repair or upkeep needed' },
  ];

  // Renders the extra detail card for whichever incident type is selected
  // (surface/area for graffiti, hazard/risk for safety, etc.)
  const renderTypeSpecificFields = () => {
    if (!formData.type) return null;

    switch (formData.type) {
      case 'Graffiti':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Graffiti Details</CardTitle>
              <CardDescription>Additional information about the graffiti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="surface-type" className="mb-2 block">Surface Type</Label>
                <Select
                  value={typeSpecificData.surfaceType || ''}
                  onValueChange={v => updateSpecific('surfaceType', v)}
                >
                  <SelectTrigger id="surface-type">
                    <SelectValue placeholder="Select surface type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Wall', 'Bridge', 'Sign', 'Door', 'Window', 'Other'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimated-area" className="mb-2 block">Estimated Area (m²)</Label>
                <Input
                  id="estimated-area"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                 
                  value={typeSpecificData.estimatedArea || ''}
                  onChange={e => updateSpecific('estimatedArea', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-profane"
                  checked={!!typeSpecificData.isProfane}
                  onCheckedChange={v => updateSpecific('isProfane', v)}
                />
                <Label htmlFor="is-profane" className="cursor-pointer">Contains offensive or profane content</Label>
              </div>
            </CardContent>
          </Card>
        );

      case 'Anti-Social Behaviour':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Anti-Social Behaviour Details</CardTitle>
              <CardDescription>Additional information about the incident</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 p-4 bg-status-none-bg rounded-md">
                <AlertCircle className="w-5 h-5 text-status-none flex-shrink-0 mt-px" />
                <p className="text-sm text-foreground">
                  For a crime in progress, an emergency, or serious anti-social behaviour, contact An Garda
                  Síochána directly. This platform isn't monitored in real time, and reports submitted here are
                  not sent to An Garda Síochána.
                </p>
              </div>
              <div>
                <Label htmlFor="antisocial-type" className="mb-2 block">Type of Behaviour</Label>
                <Select
                  value={typeSpecificData.antisocialType || ''}
                  onValueChange={v => updateSpecific('antisocialType', v)}
                >
                  <SelectTrigger id="antisocial-type">
                    <SelectValue placeholder="Select behaviour type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Loitering', 'Noise / Disturbance', 'Vandalism', 'Urination / Defecation', 'Other'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 'Safety Hazard':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Safety Hazard Details</CardTitle>
              <CardDescription>Additional information about the hazard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hazard-type" className="mb-2 block">Hazard Type</Label>
                <Select
                  value={typeSpecificData.hazardType || ''}
                  onValueChange={v => updateSpecific('hazardType', v)}
                >
                  <SelectTrigger id="hazard-type">
                    <SelectValue placeholder="Select hazard type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Pothole', 'Broken Glass', 'Electrical', 'Water Leak', 'Structural', 'Other'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="risk-level" className="mb-2 block">Risk Level</Label>
                <Select
                  value={typeSpecificData.riskLevel || ''}
                  onValueChange={v => updateSpecific('riskLevel', v)}
                >
                  <SelectTrigger id="risk-level">
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="caused-injury"
                  checked={!!typeSpecificData.causedInjury}
                  onCheckedChange={v => updateSpecific('causedInjury', v)}
                />
                <Label htmlFor="caused-injury" className="cursor-pointer">Has caused or could cause injury</Label>
              </div>
            </CardContent>
          </Card>
        );

      case 'Maintenance Issue':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Maintenance Details</CardTitle>
              <CardDescription>Additional information about the maintenance issue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="issue-type" className="mb-2 block">Issue Type</Label>
                <Select
                  value={typeSpecificData.issueType || ''}
                  onValueChange={v => updateSpecific('issueType', v)}
                >
                  <SelectTrigger id="issue-type">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Roof Leak', 'Plumbing', 'Electrical', 'Heating', 'Broken Door / Lock',
                      'Broken Window', 'Bin Room', 'Lift', 'Pest', 'Damp / Mold', 'Other'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="mb-2 block">Priority Level</Label>
                <Select
                  value={typeSpecificData.priority || ''}
                  onValueChange={v => updateSpecific('priority', v)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="work-category" className="mb-2 block">Work Category</Label>
                <Select
                  value={typeSpecificData.workCategory || ''}
                  onValueChange={v => updateSpecific('workCategory', v)}
                >
                  <SelectTrigger id="work-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Structural', 'Electrical', 'Plumbing', 'Heating', 'Cleaning', 'Other'].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {typeSpecificData.issueType === 'Other' && (
                <div>
                  <Label htmlFor="custom-description" className="mb-2 block">Describe the Issue</Label>
                  <Textarea
                    id="custom-description"
                    rows={3}
                   
                    value={typeSpecificData.customIssueDescription || ''}
                    onChange={e => updateSpecific('customIssueDescription', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-background">
      <Header />

      <main className="page-container">
        <div className="pt-10 md:pt-16 pb-8 md:pb-10">
          <h1 className="text-[36px] md:text-[52px] 2xl:text-[60px] leading-[1.04] tracking-[-0.035em] font-bold">Report an Incident</h1>
          <p className="mt-3.5 text-lg md:text-[19px] text-muted-foreground">Help keep our Charlemont Street community safe and well-maintained</p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-10 items-start">
        <aside className="lg:sticky lg:top-[92px] lg:order-2 grid gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-[17px] font-semibold tracking-[-0.015em]">What happens next</h2>
            <ul className="mt-3.5 grid gap-3.5 text-sm text-muted-foreground">
              <li className="grid grid-cols-[22px_1fr] gap-2.5"><Mail className="size-[18px] text-primary" />You get a CW reference by email straight away.</li>
              <li className="grid grid-cols-[22px_1fr] gap-2.5"><ClipboardList className="size-[18px] text-primary" />A volunteer admin reviews the report and photos.</li>
              {sendingComplaint && (
                <li className="grid grid-cols-[22px_1fr] gap-2.5"><Send className="size-[18px] text-primary" />Once approved, your complaint is emailed to the recipients you chose.</li>
              )}
            </ul>
          </div>
          <div className="hidden lg:flex gap-3.5 p-[18px] rounded-lg border border-border bg-card text-sm text-muted-foreground">
            <Siren className="size-5 text-destructive shrink-0" />
            <p><strong className="text-foreground">Emergency? Call 999 or 112.</strong> This site isn't monitored in real time.</p>
          </div>
          <div className="hidden lg:flex gap-3.5 p-[18px] rounded-lg border border-border bg-card text-sm text-muted-foreground">
            <EyeOff className="size-5 text-primary shrink-0" />
            <p>Don't name individuals or photograph faces. Focus on the issue, not the people.</p>
          </div>
        </aside>

        <div className="min-w-0 lg:order-1">
        {submitError && (
          <div className="mb-5 p-4 bg-status-none-bg rounded-lg flex gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-status-none flex-shrink-0 mt-px" />
            <p className="text-sm text-foreground font-medium">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-xl font-semibold">
                <FileText className="w-5 h-5 text-primary" />
                Incident Details
              </CardTitle>
              <CardDescription>Provide information about the incident you're reporting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="incident-type" className="flex items-center gap-2 mb-3">
                  Incident Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value as IncidentType });
                    setTypeSpecificData({});
                  }}
                >
                  <SelectTrigger id="incident-type">
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title" className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4" />
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  required
                  maxLength={100}
                  placeholder="e.g. Broken door lock"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-[13px] text-subtle-foreground mt-2">
                  A short summary shown above the location on the report
                </p>
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  required
                  placeholder="e.g. Charlemont Street near the bridge"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
                <p className="text-[13px] text-subtle-foreground mt-2">
                  Be as specific as possible to help responders locate the issue
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  required
                  rows={5}
                  placeholder="Describe what you observed, when it happened, and any other relevant details..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.reporterEmail}
                  onChange={e => setFormData({ ...formData, reporterEmail: e.target.value })}
                />
                <p className="text-[13px] text-subtle-foreground mt-2">
                  We'll email you when the status of your report changes. You can still report anonymously: your name and address are never required unless you choose to send a formal complaint below.
                </p>
              </div>
            </CardContent>
          </Card>

          {renderTypeSpecificFields()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-xl font-semibold">
                <ImageIcon className="w-5 h-5 text-primary" />
                Photo Evidence
              </CardTitle>
              <CardDescription>Upload up to 10 photos to support your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-[1.5px] border-dashed border-border bg-background rounded-lg p-8 md:p-10 text-center hover:border-primary hover:bg-primary-soft/40 transition-colors cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={photos.length >= 10}
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="font-medium mb-1">
                    {photos.length >= 10 ? 'Maximum photos reached' : 'Click to upload photos'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG up to 10MB each ({photos.length}/10 uploaded)
                  </p>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Upload preview"
                        className="w-full aspect-square object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        aria-label="Remove photo"
                        className="absolute top-1.5 right-1.5 bg-foreground/80 hover:bg-foreground text-background rounded-full p-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary ring-1 ring-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-xl font-semibold">
                <Send className="w-5 h-5 text-primary" />
                Take Action: Send a Formal Complaint
              </CardTitle>
              <CardDescription>
                Without a formal complaint, nothing will happen. This report creates the evidence. The complaint forces Túath Housing or Dublin City Council to respond officially.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className={`flex items-start gap-3.5 p-4 rounded-md border transition-colors ${complaint.sendToTuath ? 'border-primary bg-primary-soft' : 'border-border bg-background'}`}>
                  <Checkbox
                    id="send-tuath"
                    checked={complaint.sendToTuath}
                    onCheckedChange={v => setComplaint(c => ({ ...c, sendToTuath: !!v }))}
                  />
                  <Label htmlFor="send-tuath" className="cursor-pointer text-[15px] flex-col items-start gap-0.5 leading-snug">
                    Túath Housing
                    <span className="block text-sm text-muted-foreground font-normal mt-0.5">
                      For issues in Túath managed properties or estates
                    </span>
                  </Label>
                </div>
                <div className={`flex items-start gap-3.5 p-4 rounded-md border transition-colors ${complaint.sendToDCC ? 'border-primary bg-primary-soft' : 'border-border bg-background'}`}>
                  <Checkbox
                    id="send-dcc"
                    checked={complaint.sendToDCC}
                    onCheckedChange={v => setComplaint(c => ({ ...c, sendToDCC: !!v }))}
                  />
                  <Label htmlFor="send-dcc" className="cursor-pointer text-[15px] flex-col items-start gap-0.5 leading-snug">
                    <span>Dublin City Council</span>
                    <span className="block text-sm text-muted-foreground font-normal mt-0.5">
                      For issues on public roads, footpaths, or council-managed areas. DCC directs these through their{' '}
                      <a
                        href="https://citizenhub.dublincity.ie/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary font-medium"
                        onClick={e => e.stopPropagation()}
                      >
                        Citizen Hub
                      </a>{' '}
                      portal. We still send this automatically as a courtesy, but for a guaranteed formal response you may also want to submit there directly.
                    </span>
                  </Label>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Formal complaints can't be ignored: they require an official written response within 30 working days (Túath) or 15 working days (Dublin City Council). Untick only if you do not want to escalate.
              </p>

              {sendingComplaint && (
                <div className="space-y-4 pt-5 border-t border-border">
                  <p className="text-sm font-medium">
                    Your contact details are required to submit a formal complaint:
                  </p>
                  <div>
                    <Label htmlFor="complainant-name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="complainant-name"
                      placeholder="Your full name"
                      value={complaint.name}
                      onChange={e => setComplaint(c => ({ ...c, name: e.target.value }))}
                     
                    />
                  </div>
                  <div>
                    <Label htmlFor="complainant-address" className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Your Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="complainant-address"
                      placeholder="e.g. Apt 12, Charlemont Street, Dublin 2"
                      value={complaint.address}
                      onChange={e => setComplaint(c => ({ ...c, address: e.target.value }))}
                     
                    />
                  </div>
                  <p className="text-[13px] text-subtle-foreground">
                    Your name, address, and email are shared only with {[
                      complaint.sendToTuath ? 'Túath Housing' : null,
                      complaint.sendToDCC ? 'Dublin City Council' : null,
                    ].filter(Boolean).join(' and ')} so they can respond to you directly. They are never published on the CharlemontWatch board. Once you hear back, let the CharlemontWatch team know and we will update the status on the app.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <TurnstileWidget
            ref={turnstileRef}
            onVerify={token => {
              turnstileResolveRef.current?.(token);
              turnstileResolveRef.current = null;
              turnstileRejectRef.current = null;
            }}
            onExpire={() => {
              setSubmitError('Verification challenge expired. Please try again.');
              turnstileRejectRef.current?.(new Error('Turnstile challenge expired'));
              turnstileResolveRef.current = null;
              turnstileRejectRef.current = null;
            }}
            onError={() => {
              setSubmitError('Verification challenge failed to load. Please refresh the page and try again.');
              turnstileRejectRef.current?.(new Error('Turnstile widget error'));
              turnstileResolveRef.current = null;
              turnstileRejectRef.current = null;
            }}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-card border border-border rounded-lg p-5 md:px-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !formData.type}
            >
              {isSubmitting ? 'Submitting…' : sendingComplaint ? 'Submit Report & Complaint' : 'Submit Report'}
            </Button>
          </div>
        </form>
        </div>
        </div>
      </main>
    </div>
  );
}
