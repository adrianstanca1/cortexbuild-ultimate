import { useState, useEffect, useRef } from 'react';
import { defectsApi, uploadFile } from '../../services/api';
import {
  AlertTriangle, Plus, Search, Filter, Download, Clock, AlertCircle,
  CheckCircle, XCircle, ArrowRight, Calendar, Building2, User,
  FileText, Eye, Edit, Trash2, X, Wrench, MapPin, Camera, MessageSquare
} from 'lucide-react';

interface Defect {
  id: string;
  ref: string;
  title: string;
  project: string;
  location: string;
  defectType: 'structural' | 'finishing' | 'm&e' | 'fire' | 'waterproofing' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'identified' | 'assigned' | 'in_progress' | 'completed' | 'closed' | 'disputed';
  identifiedDate: string;
  targetDate: string;
  completedDate?: string;
  identifiedBy: string;
  assignedTo: string;
  trade: string;
  description: string;
  rootCause: string;
  correctiveAction: string;
  photos: { url: string; caption: string }[];
  cost: number;
  comments: { author: string; date: string; text: string }[];
}

const mockDefects: Defect[] = [
  {
    id: 'DEF-001',
    ref: 'DEF-2024-001',
    title: 'Cracking to Level 2 Internal Walls',
    project: 'Kingspan Stadium Refurbishment',
    location: 'Level 2, Rooms 201-208',
    defectType: 'structural',
    priority: 'high',
    status: 'in_progress',
    identifiedDate: '2024-03-10',
    targetDate: '2024-03-25',
    identifiedBy: 'David McCullagh',
    assignedTo: 'Parker Contracts',
    trade: 'Drylining',
    description: 'Vertical cracking observed to drywall partitions in multiple rooms on Level 2. Cracks approximately 2-3mm width, running full height of partitions.',
    rootCause: 'Insufficient control joints specified in original design. Structure experiencing thermal movement without accommodation.',
    correctiveAction: 'Install control joints at 4m intervals. Repair cracks with flexible filler and redecorate. Awaiting structural engineer review.',
    photos: [
      { url: '#', caption: 'Crack in Room 203' },
      { url: '#', caption: 'Crack in Room 205' },
    ],
    cost: 2500,
    comments: [
      { author: 'John McAllister', date: '2024-03-12', text: 'Structural engineer inspected site. Recommends control joint installation.' },
      { author: 'Parker Contracts', date: '2024-03-15', text: 'Will commence works next week once materials delivered.' },
    ],
  },
  {
    id: 'DEF-002',
    ref: 'DEF-2024-002',
    title: 'Water Ingress - Roof Light GL03',
    project: 'Belfast High School Extension',
    location: 'Main Hall, Roof Area',
    defectType: 'waterproofing',
    priority: 'critical',
    status: 'assigned',
    identifiedDate: '2024-03-18',
    targetDate: '2024-03-20',
    identifiedBy: 'Emma Walsh',
    assignedTo: 'Rooftech Solutions',
    trade: 'Flat Roofing',
    description: 'Active water ingress observed during heavy rainfall. Drips forming below roof light GL03 junction with main roof covering.',
    rootCause: 'Likely failed sealant at junction or damage to upstand flashing. Requires urgent investigation.',
    correctiveAction: 'Emergency call out to roofing subcontractor. Temporary protection to be installed to protect works below.',
    photos: [
      { url: '#', caption: 'Water damage to ceiling below GL03' },
    ],
    cost: 0,
    comments: [
      { author: 'Emma Walsh', date: '2024-03-18', text: 'Client reporting water dripping into main hall during assembly. Urgent response required.' },
    ],
  },
  {
    id: 'DEF-003',
    ref: 'DEF-2024-003',
    title: 'M&E Ventilation Grille Damage',
    project: 'Office Fit-Out Belfast',
    location: 'Floor 3, Open Plan Area',
    defectType: 'm&e',
    priority: 'medium',
    status: 'completed',
    identifiedDate: '2024-03-05',
    targetDate: '2024-03-15',
    completedDate: '2024-03-14',
    identifiedBy: 'Steven Kelly',
    assignedTo: 'M&E Solutions NI',
    trade: 'Mechanical',
    description: 'Several ceiling diffuser grilles dented or misaligned. Aesthetic defect impacting client presentation areas.',
    rootCause: 'Damage during final fix works by other trades. Poor coordination of works in ceiling zone.',
    correctiveAction: 'Replace damaged grilles with new. Check alignment of all grilles in area and adjust as necessary.',
    photos: [],
    cost: 850,
    comments: [
      { author: 'Steven Kelly', date: '2024-03-05', text: 'Photos taken. Forwarding to M&E subcontractor.' },
      { author: 'M&E Solutions NI', date: '2024-03-14', text: 'All grilles replaced and aligned. Works complete.' },
    ],
  },
  {
    id: 'DEF-004',
    ref: 'DEF-2024-004',
    title: 'Fire Door Frame Gap - FD04',
    project: 'Holiday Inn Express Refurbishment',
    location: 'Corridor A, Door FD04',
    defectType: 'fire',
    priority: 'high',
    status: 'disputed',
    identifiedDate: '2024-03-20',
    targetDate: '2024-03-22',
    identifiedBy: 'Lisa McMurray',
    assignedTo: 'FireStop Systems',
    trade: 'Fire Stopping',
    description: 'Gap observed between fire door frame and structural opening. Exceeds 3mm tolerance. Potential non-compliance with fire regulation.',
    rootCause: 'Poor installation or dimensional error in opening preparation.',
    correctiveAction: 'Subcontractor disputes this is a defect. Claims gap is within tolerance for existing building. Awaiting third-party inspection.',
    photos: [
      { url: '#', caption: 'Gap at frame junction' },
    ],
    cost: 0,
    comments: [
      { author: 'Lisa McMurray', date: '2024-03-20', text: 'Gap is minimum 8mm. Clearly not compliant.' },
      { author: 'FireStop Systems', date: '2024-03-21', text: 'Building is 1970s construction. Tolerances were different then.' },
    ],
  },
  {
    id: 'DEF-005',
    ref: 'DEF-2024-005',
    title: 'Paint Defects - Roller Marks',
    project: 'Retail Park Car Park',
    location: 'Customer toilets',
    defectType: 'finishing',
    priority: 'low',
    status: 'identified',
    identifiedDate: '2024-03-22',
    targetDate: '2024-03-30',
    identifiedBy: 'Robert Brown',
    assignedTo: 'TBD',
    trade: 'Painting & Decorating',
    description: 'Visible roller marks in paint finish on all walls. Multiple areas require touching up or full redecorate.',
    rootCause: 'Painter used wrong nap roller cover or applied paint too thinly. Drying too fast.',
    correctiveAction: 'Full redecoration of customer toilets. Use appropriate roller and maintain wet edge.',
    photos: [],
    cost: 600,
    comments: [],
  },
];

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  identified: { label: 'Identified', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: AlertCircle },
  assigned: { label: 'Assigned', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: User },
  in_progress: { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Wrench },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  structural: { label: 'Structural', color: 'text-red-400' },
  finishing: { label: 'Finishing', color: 'text-purple-400' },
  'm&e': { label: 'M&E', color: 'text-blue-400' },
  fire: { label: 'Fire Safety', color: 'text-orange-400' },
  waterproofing: { label: 'Waterproofing', color: 'text-cyan-400' },
  other: { label: 'Other', color: 'text-gray-400' },
};

export default function Defects() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', project: '', location: '', trade: '', priority: 'medium', status: 'identified',
    description: '', identifiedBy: '', assignedTo: '', targetDate: ''
  });

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const data = await defectsApi.getAll();
        setDefects(data);
      } catch (error) {
        console.error('Failed to fetch defects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefects();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.project) return;
    setCreating(true);
    try {
      const ref = `DEF-${String(Date.now()).slice(-6)}`;
      const newRecord = {
        reference: ref,
        title: form.title,
        project: form.project,
        location: form.location,
        trade: form.trade,
        priority: form.priority,
        status: form.status,
        description: form.description,
        identified_by: form.identifiedBy,
        assigned_to: form.assignedTo,
        due_date: form.targetDate,
        photos: [],
        comments: [],
      };
      const created = await defectsApi.create(newRecord);
      setDefects(prev => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ title: '', project: '', location: '', trade: '', priority: 'medium', status: 'identified', description: '', identifiedBy: '', assignedTo: '', targetDate: '' });
    } catch (err) {
      console.error('Failed to create defect:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this defect?')) return;
    try {
      await defectsApi.delete(id);
      setDefects(prev => prev.filter(d => String(d.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    setSaving(true);
    try {
      const updated = await defectsApi.update(editItem.id, {
        title: editItem.title,
        project: editItem.project,
        location: editItem.location,
        trade: editItem.trade,
        priority: editItem.priority,
        status: editItem.status,
        description: editItem.description,
        identified_by: editItem.identifiedBy,
        assigned_to: editItem.assignedTo,
        due_date: editItem.targetDate,
      });
      setDefects(prev => prev.map(d => String(d.id) === String(editItem.id) ? updated : d));
      setEditItem(null);
    } catch (err) {
      console.error('Failed to update defect:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (defectId: string, file: File) => {
    setUploading(true);
    try {
      const result = await uploadFile(file, 'PHOTOS');
      setDefects(prev => prev.map(d => {
        if (String(d.id) === String(defectId)) {
          return { ...d, photos: [...(d.photos || []), { url: result.file_url || result.name, caption: file.name }] };
        }
        return d;
      }));
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const filteredDefects = defects.filter((d: any) => {
    const matchesSearch = d.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || d.priority === filterPriority;
    const matchesType = filterType === 'all' || d.defectType === filterType;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalOpen = defects.filter((v: any) => !['completed', 'closed'].includes(v.status)).length;
  const totalCritical = defects.filter((v: any) => v.priority === 'critical' && v.status !== 'closed').length;
  const totalCost = defects.reduce((sum, v: any) => sum + v.cost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Defects Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">Track, assign, and resolve construction defects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          Report Defect
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Open Defects</p>
              <p className="text-2xl font-bold text-white mt-1">{totalOpen}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="text-orange-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Critical</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{totalCritical}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="text-red-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Repair Cost</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">£{totalCost.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Wrench className="text-amber-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Defects</p>
              <p className="text-2xl font-bold text-white mt-1">{defects.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="text-blue-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by ref, title, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="identified">Identified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
            <option value="disputed">Disputed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="structural">Structural</option>
            <option value="finishing">Finishing</option>
            <option value="m&e">M&E</option>
            <option value="fire">Fire Safety</option>
            <option value="waterproofing">Waterproofing</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredDefects.map((defect) => {
            const status = statusConfig[defect.status];
            const priority = priorityConfig[defect.priority];
            const StatusIcon = status.icon;
            const isExpanded = expandedCards.includes(defect.id);

            return (
              <div
                key={defect.id}
                className="border border-gray-700 rounded-lg overflow-hidden hover:border-orange-500/50 transition-colors"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-gray-800/50 hover:bg-gray-800"
                  onClick={() => {
                    setSelectedDefect(defect);
                    setShowCreateModal(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(defect.id); }}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-orange-400">{defect.ref}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} className="inline mr-1" />
                          {status.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${priority.bg} ${priority.color}`}>
                          {priority.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded bg-gray-500/10 ${typeConfig[defect.defectType].color}`}>
                          {typeConfig[defect.defectType].label}
                        </span>
                      </div>
                      <p className="text-white font-medium mt-1">{defect.title}</p>
                      <p className="text-gray-400 text-sm flex items-center gap-2">
                        <MapPin size={12} /> {defect.location} | {defect.project}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{defect.trade}</p>
                      <p className="text-gray-400 text-xs">Trade</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">{defect.targetDate}</p>
                      <p className="text-gray-400 text-xs">Target</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditItem(defect);
                        setShowCreateModal(false);
                      }}
                      className="p-2 text-blue-400 hover:text-blue-300"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(defect.id);
                      }}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-xs">Identified By</p>
                        <p className="text-white text-sm">{defect.identifiedBy}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Assigned To</p>
                        <p className="text-white text-sm">{defect.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Identified Date</p>
                        <p className="text-white text-sm">{defect.identifiedDate}</p>
                      </div>
                      {defect.cost > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs">Est. Cost</p>
                          <p className="text-amber-400 text-sm font-medium">£{defect.cost.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-xs mb-1">Description</p>
                      <p className="text-gray-300 text-sm">{defect.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Root Cause</p>
                        <p className="text-gray-300 text-sm">{defect.rootCause}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Corrective Action</p>
                        <p className="text-gray-300 text-sm">{defect.correctiveAction}</p>
                      </div>
                    </div>

                    {(defect.photos as any[])?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-xs mb-2">Photos ({defect.photos?.length || 0})</p>
                        <div className="flex gap-2 flex-wrap">
                          {(defect.photos as any[]).map((photo: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded text-sm text-gray-300">
                              <Camera size={14} /> {photo.caption}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadPhoto(String(defect.id), file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        <Camera size={14} /> {uploading ? 'Uploading...' : 'Add Photo'}
                      </button>
                    </div>

                    {(defect.comments as any[])?.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Comments</p>
                        <div className="space-y-2">
                          {(defect.comments as any[]).map((comment: any, idx: number) => (
                            <div key={idx} className="flex gap-3 p-3 bg-gray-800 rounded">
                              <MessageSquare size={14} className="text-gray-500 mt-1" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-medium">{comment.author}</span>
                                  <span className="text-gray-500 text-xs">{comment.date}</span>
                                </div>
                                <p className="text-gray-300 text-sm mt-1">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Report Defect</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Project</label>
                  <select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="">Select project...</option>
                    <option>Canary Wharf Office Complex</option>
                    <option>Manchester City Apartments</option>
                    <option>Birmingham Road Bridge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Defect title..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location on site..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Trade</label>
                  <input type="text" value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} placeholder="Trade responsible..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the defect..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Identified By</label>
                  <input type="text" value={form.identifiedBy} onChange={e => setForm(f => ({ ...f, identifiedBy: e.target.value }))} placeholder="Your name..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Assigned To</label>
                  <input type="text" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Contractor/worker..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Target Date</label>
                <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={handleCreate} disabled={creating || !form.title || !form.project} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Report Defect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Defect</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Project</label>
                  <input type="text" value={editItem.project || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, project: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Priority</label>
                  <select value={editItem.priority || 'medium'} onChange={e => setEditItem((prev: any) => ({ ...prev, priority: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title</label>
                <input type="text" value={editItem.title || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Location</label>
                  <input type="text" value={editItem.location || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Trade</label>
                  <input type="text" value={editItem.trade || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, trade: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea rows={3} value={editItem.description || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Status</label>
                  <select value={editItem.status || 'identified'} onChange={e => setEditItem((prev: any) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="identified">Identified</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Identified By</label>
                  <input type="text" value={editItem.identifiedBy || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, identifiedBy: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Assigned To</label>
                  <input type="text" value={editItem.assignedTo || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, assignedTo: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Target Date</label>
                  <input type="date" value={editItem.targetDate || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, targetDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={saving || !editItem?.title || !editItem?.project} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
