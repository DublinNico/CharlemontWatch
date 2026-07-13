import { useState } from 'react';
import { ArrowLeft, Upload, X, AlertCircle, MapPin, FileText, Mail, ImageIcon, User, Send } from 'lucide-react';

import { useNavigate } from 'react-router';
import { useApp, IncidentType, Photo, ComplaintData } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

export function ReportIncident() {
  const navigate = useNavigate();
  const { addIncident } = useApp();

  const [formData, setFormData] = useState({
    type: '' as IncidentType | '',
    location: '',
    description: '',
    reporterEmail: '',
  });

  const [typeSpecificData, setTypeSpecificData] = useState<any>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [complaint, setComplaint] = useState({
    sendToTuath: true,
    sendToDCC: true,
    name: '',
    address: '',
  });
  const sendingComplaint = complaint.sendToTuath || complaint.sendToDCC;

  const updateSpecific = (key: string, value: any) =>
    setTypeSpecificData((prev: any) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return;

    if (!formData.reporterEmail.trim()) {
      setSubmitError('Please provide your email to confirm you live in the complex.');
      return;
    }

    if (sendingComplaint && (!complaint.name.trim() || !complaint.address.trim())) {
      setSubmitError('Please provide your name and address to send a formal complaint.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const complaintData: ComplaintData | undefined = sendingComplaint ? {
      name: complaint.name,
      address: complaint.address,
      sendTo: [
        ...(complaint.sendToTuath ? ['tuath' as const] : []),
        ...(complaint.sendToDCC ? ['dcc' as const] : []),
      ],
    } : undefined;

    try {
      const incidentId = await addIncident({
        type: formData.type,
        location: formData.location,
        description: formData.description,
        reporterEmail: formData.reporterEmail,
        status: 'NEW',
        photos,
        typeSpecificData,
      }, complaintData);
      navigate(`/success/${incidentId}?complaint=${sendingComplaint}`);
    } catch {
      setSubmitError('Failed to submit report. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && photos.length < 10) {
      const newPhotos: Photo[] = Array.from(files).slice(0, 10 - photos.length).map((file, index) => ({
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

  const incidentTypes = [
    { value: 'Graffiti', label: 'Graffiti', description: 'Vandalism or unwanted markings' },
    { value: 'Anti-Social Behaviour', label: 'Anti-Social Behaviour', description: 'Disruptive or threatening behaviour' },
    { value: 'Safety Hazard', label: 'Safety Hazard', description: 'Immediate danger to public safety' },
    { value: 'Maintenance Issue', label: 'Maintenance Issue', description: 'Repair or upkeep needed' },
  ];

  const renderTypeSpecificFields = () => {
    if (!formData.type) return null;

    switch (formData.type) {
      case 'Graffiti':
        return (
          <Card className="border-orange-100 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Graffiti Details</CardTitle>
              <CardDescription>Additional information about the graffiti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="surface-type">Surface Type</Label>
                <Select
                  value={typeSpecificData.surfaceType || ''}
                  onValueChange={v => updateSpecific('surfaceType', v)}
                >
                  <SelectTrigger id="surface-type" className="bg-white">
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
                <Label htmlFor="estimated-area">Estimated Area (m²)</Label>
                <Input
                  id="estimated-area"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  className="bg-white"
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
          <Card className="border-red-100 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Anti-Social Behaviour Details</CardTitle>
              <CardDescription>Additional information about the incident</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="antisocial-type">Type of Behaviour</Label>
                <Select
                  value={typeSpecificData.antisocialType || ''}
                  onValueChange={v => updateSpecific('antisocialType', v)}
                >
                  <SelectTrigger id="antisocial-type" className="bg-white">
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
          <Card className="border-amber-100 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Safety Hazard Details</CardTitle>
              <CardDescription>Additional information about the hazard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hazard-type">Hazard Type</Label>
                <Select
                  value={typeSpecificData.hazardType || ''}
                  onValueChange={v => updateSpecific('hazardType', v)}
                >
                  <SelectTrigger id="hazard-type" className="bg-white">
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
                <Label htmlFor="risk-level">Risk Level</Label>
                <Select
                  value={typeSpecificData.riskLevel || ''}
                  onValueChange={v => updateSpecific('riskLevel', v)}
                >
                  <SelectTrigger id="risk-level" className="bg-white">
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
          <Card className="border-emerald-100 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Maintenance Details</CardTitle>
              <CardDescription>Additional information about the maintenance issue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="issue-type">Issue Type</Label>
                <Select
                  value={typeSpecificData.issueType || ''}
                  onValueChange={v => updateSpecific('issueType', v)}
                >
                  <SelectTrigger id="issue-type" className="bg-white">
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
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={typeSpecificData.priority || ''}
                  onValueChange={v => updateSpecific('priority', v)}
                >
                  <SelectTrigger id="priority" className="bg-white">
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
                <Label htmlFor="work-category">Work Category</Label>
                <Select
                  value={typeSpecificData.workCategory || ''}
                  onValueChange={v => updateSpecific('workCategory', v)}
                >
                  <SelectTrigger id="work-category" className="bg-white">
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
                  <Label htmlFor="custom-description">Describe the Issue</Label>
                  <Textarea
                    id="custom-description"
                    rows={3}
                    className="bg-white"
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
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Report an Incident</h1>
          <p className="text-indigo-100">Help keep our Charlemont Street community safe and well-maintained</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Your report helps everyone</p>
            <p>All submissions are reviewed promptly. Include photos and detailed descriptions for faster resolution.</p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
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
                <p className="text-xs text-muted-foreground mt-1.5">
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
                <p className="text-xs text-muted-foreground mt-1.5">
                  Required to confirm you live in the complex. We'll also email you when the status of your report changes. You can still report anonymously: your name and address are never required unless you choose to send a formal complaint below.
                </p>
              </div>
            </CardContent>
          </Card>

          {renderTypeSpecificFields()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                Photo Evidence
              </CardTitle>
              <CardDescription>Upload up to 10 photos to support your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group">
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
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-indigo-600 transition-colors" />
                  <p className="font-medium mb-1">
                    {photos.length >= 10 ? 'Maximum photos reached' : 'Click to upload photos'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG up to 10MB each ({photos.length}/10 uploaded)
                  </p>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Upload preview"
                        className="w-full aspect-square object-cover rounded-lg shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Send className="w-5 h-5 text-amber-600" />
                Take Action: Send a Formal Complaint
              </CardTitle>
              <CardDescription className="text-amber-800/70">
                Without a formal complaint, nothing will happen. This report creates the evidence. The complaint forces Túath Housing or Dublin City Council to respond officially.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="send-tuath"
                    checked={complaint.sendToTuath}
                    onCheckedChange={v => setComplaint(c => ({ ...c, sendToTuath: !!v }))}
                  />
                  <Label htmlFor="send-tuath" className="cursor-pointer font-medium">
                    Túath Housing
                    <span className="block text-xs text-muted-foreground font-normal">
                      For issues in Túath managed properties or estates
                    </span>
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="send-dcc"
                    checked={complaint.sendToDCC}
                    onCheckedChange={v => setComplaint(c => ({ ...c, sendToDCC: !!v }))}
                  />
                  <Label htmlFor="send-dcc" className="cursor-pointer font-medium">
                    Dublin City Council
                    <span className="block text-xs text-muted-foreground font-normal">
                      For issues on public roads, footpaths, or council-managed areas
                    </span>
                  </Label>
                </div>
              </div>

              <p className="text-sm text-amber-900 font-semibold">
                Formal complaints can't be ignored: they require an official written response within 30 working days. Untick only if you do not want to escalate.
              </p>

              {sendingComplaint && (
                <div className="space-y-4 pt-2 border-t border-amber-200">
                  <p className="text-sm text-amber-900 font-medium">
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
                      className="bg-white"
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
                      className="bg-white"
                    />
                  </div>
                  <p className="text-xs text-amber-800/70">
                    Your name, address, and email are shared only with {[
                      complaint.sendToTuath ? 'Túath Housing' : null,
                      complaint.sendToDCC ? 'Dublin City Council' : null,
                    ].filter(Boolean).join(' and ')} so they can respond to you directly. They are never published on the CharlemontWatch board. Once you hear back, let the CharlemontWatch team know and we will update the status on the app.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !formData.type}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? 'Submitting…' : sendingComplaint ? 'Submit Report & Complaint' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
