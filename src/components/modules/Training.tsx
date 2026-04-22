import { useState, useRef } from 'react';
import { Plus, GraduationCap, Award, AlertCircle, Trash2, X, Edit, Download } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { DataImporter, ExportButton, ColumnMapping } from '../ui/DataImportExport';
import { trainingApi, uploadFile } from '../../services/api';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { toast } from 'sonner';
import { useTraining } from '../../hooks/useData';
import { useQueryClient } from '@tanstack/react-query';


interface TrainingRecord {
  id: string;
  title: string;
  type: string;
  provider: string;
  scheduled_date?: string;
  completed_date?: string;
  status: string;
  duration?: number;
  location?: string;
  attendees?: string[];
  certification?: string;
  cert_name?: string;
}

export default function Training() {
  const { data: training = [] } = useTraining.useList();
  const createMutation = useTraining.useCreate();
  const updateMutation = useTraining.useUpdate();
  const deleteMutation = useTraining.useDelete();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [_uploading, setUploading] = useState(false);
  const [_selectedId, setSelectedId] = useState<string | null>(null);
  const _fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'schedule' | 'matrix' | 'providers' | 'reports'>('register');
  const [form, setForm] = useState({ title: '', provider: '', type: 'formal_course', status: 'scheduled', scheduledDate: '', completedDate: '', duration: '', location: '', certification: 'no', certName: '', attendees: '' });
  const [editItem, setEditItem] = useState<(TrainingRecord & { scheduledDate?: string; completedDate?: string }) | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { selectedIds, clearSelection } = useBulkSelection();

  const trainingData = training as unknown as TrainingRecord[];

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      clearSelection();
      toast.success(`Deleted ${ids.length} item(s)`);
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const filtered = trainingData.filter((t: TrainingRecord) =>
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.provider || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = trainingData.filter((t: TrainingRecord) => t.status === 'completed').length;
  const scheduledCount = trainingData.filter((t: TrainingRecord) => t.status === 'scheduled').length;
  const totalCount = trainingData.length;

  const handleCreate = async () => {
    if (!form.title) return;
    try {
      await createMutation.mutateAsync({
        title: form.title,
        provider: form.provider || 'CortexBuild Training',
        type: form.type || 'formal_course',
        status: form.status,
        scheduled_date: form.scheduledDate || null,
        completed_date: form.completedDate || null,
        duration: form.duration ? parseFloat(form.duration) : null,
        location: form.location || '',
        attendees: form.attendees ? form.attendees.split(',').map(a => a.trim()) : [],
        certification: form.certification || 'no',
        cert_name: form.certName || '',
      });
      toast.success('Training record created');
      setShowCreateModal(false);
      setForm({ title: '', provider: '', type: 'formal_course', status: 'scheduled', scheduledDate: '', completedDate: '', duration: '', location: '', certification: 'no', certName: '', attendees: '' });
    } catch {
      toast.error('Failed to create training record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training record?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Training record deleted');
    } catch {
      toast.error('Failed to delete training record');
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.title) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          title: editItem.title,
          provider: editItem.provider,
          type: editItem.type,
          status: editItem.status,
          scheduled_date: editItem.scheduled_date || null,
          completed_date: editItem.completed_date || null,
          duration: editItem.duration || null,
          location: editItem.location || '',
          attendees: editItem.attendees || [],
          certification: editItem.certification || 'no',
          cert_name: editItem.cert_name || '',
        },
      });
      toast.success('Training record updated');
      setEditItem(null);
    } catch {
      toast.error('Failed to update training record');
    }
  };

  const _handleUploadCert = async (id: string, file: File) => {
    setUploading(true);
    setSelectedId(id);
    try {
      await uploadFile(file, 'REPORTS');
      queryClient.invalidateQueries({ queryKey: ['training'] });
      toast.success(`Uploaded: ${file.name}`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setSelectedId(null);
    }
  };

  async function handleBulkImport(data: Record<string, unknown>[], mapping: ColumnMapping[]) {
    let failed = 0;
    for (const row of data) {
      const mapped: Record<string, unknown> = {};
      mapping.forEach(m => { if (m.target) mapped[m.target] = row[m.source]; });
      try {
        await trainingApi.create({
          title: String(mapped.title || ''),
          provider: String(mapped.provider || 'CortexBuild Training'),
          type: String(mapped.type || 'formal_course'),
          status: String(mapped.status || 'scheduled'),
          scheduled_date: mapped.scheduled_date || null,
          completed_date: mapped.completed_date || null,
          certification: String(mapped.certification || 'no'),
        });
      } catch { failed++; }
    }
    if (failed > 0) toast.error(`${failed} row(s) failed to import`);
    toast.success(`${data.length - failed} training record(s) imported`);
  }

  // Training Register Tab
  const registerTab = (
    <div className="space-y-4">
      <input type="text" placeholder="Search training records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 input input-bordered text-white mb-4" />
      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No training records found" description="Add training records to track workforce qualifications." />
      ) : (
        <div className="cb-table-scroll touch-pan-x">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Title</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Type</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Provider</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Attendees</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Date</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Duration</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Status</th>
                <th className="px-4 py-2 text-left text-gray-400 font-semibold">Certification</th>
                <th className="px-4 py-2 text-right text-gray-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: TrainingRecord) => (
                <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-gray-300">{t.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-300">{t.provider}</td>
                  <td className="px-4 py-3 text-gray-300">{Array.isArray(t.attendees) ? t.attendees.length : 0}</td>
                  <td className="px-4 py-3 text-gray-300">{t.completed_date || t.scheduled_date || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-300">{t.duration ? `${t.duration}h` : 'N/A'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'completed' ? 'bg-green-500/10 text-green-400' : t.status === 'scheduled' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.status}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${t.certification === 'yes' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.certification === 'yes' ? 'Yes' : 'No'}</span></td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setEditItem({ ...t, scheduledDate: t.scheduled_date || '', completedDate: t.completed_date || '' })} className="p-1 hover:bg-gray-700 rounded"><Edit size={16} className="text-gray-400" /></button>
                    <button type="button" onClick={() => handleDelete(String(t.id))} className="p-1 hover:bg-red-900/30 rounded"><Trash2 size={16} className="text-red-400" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Schedule Tab (Timeline view)
  const scheduleTab = (
    <div className="space-y-4">
      {(() => {
        const sorted = [...trainingData].sort((a: TrainingRecord, b: TrainingRecord) => new Date(a.scheduled_date || a.completed_date || 0).getTime() - new Date(b.scheduled_date || b.completed_date || 0).getTime());
        const grouped = new Map<string, TrainingRecord[]>();

        sorted.forEach(t => {
          const dateStr = t.scheduled_date || t.completed_date || '';
          if (!dateStr) return;
          const date = new Date(dateStr);
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
          if (!grouped.has(weekKey)) grouped.set(weekKey, []);
          grouped.get(weekKey)!.push(t);
        });

        return Array.from(grouped.entries()).map(([week, items]) => (
          <div key={week}>
            <h3 className="text-gray-300 font-semibold mb-3 text-sm">{week}</h3>
            <div className="space-y-2 ml-4 border-l-2 border-amber-500/30 pl-4">
              {items.map(t => (
                <div key={t.id} className="card p-3 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{t.title}</p>
                      <p className="text-gray-400 text-sm">{t.provider} - {t.scheduled_date || t.completed_date}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>{t.status}</span>
                        {Array.isArray(t.attendees) && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">{t.attendees.length} attendees</span>
                        )}
                      </div>
                    </div>
                    {t.status === 'completed' ? (
                      <button type="button" className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded font-medium">Completed</button>
                    ) : (
                      <button type="button" className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded font-medium">Mark Complete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ));
      })()}
    </div>
  );

  // Matrix Tab (Compliance matrix)
  const matrixTab = (
    <div className="space-y-4">
      <div className="cb-table-scroll touch-pan-x">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="px-4 py-2 text-left text-gray-400 font-semibold">Team Member</th>
              <th className="px-4 py-2 text-center text-gray-400 font-semibold">Manual Handling</th>
              <th className="px-4 py-2 text-center text-gray-400 font-semibold">First Aid</th>
              <th className="px-4 py-2 text-center text-gray-400 font-semibold">CSCS</th>
              <th className="px-4 py-2 text-center text-gray-400 font-semibold">Site Induction</th>
              <th className="px-4 py-2 text-center text-gray-400 font-semibold">Compliance %</th>
            </tr>
          </thead>
          <tbody>
            {['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emma Wilson'].map(name => (
              <tr key={name} className="border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-4 py-2 text-white font-medium">{name}</td>
                <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">✓</span></td>
                <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs">~</span></td>
                <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">✓</span></td>
                <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">✓</span></td>
                <td className="px-4 py-2 text-center text-white font-semibold">75%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Providers Tab
  const providers = [
    { id: '1', name: 'CITB', accreditation: 'CITB Approved', contact: 'info@citb.co.uk', courses: 'SMSTS, SSSTS, Manual Handling', cost: '£500-£2000' },
    { id: '2', name: 'Red Cross', accreditation: 'HSE Approved', contact: 'training@redcross.org', courses: 'First Aid', cost: '£50-£150' },
    { id: '3', name: 'IPAF', accreditation: 'IPAF Certified', contact: 'courses@ipaf.org', courses: 'IPAF 3a+3b, IPAF 1a+1b', cost: '£400-£600' },
  ];

  const providersTab = (
    <div className="space-y-4">
      <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
        <Plus size={16} /> Add Provider
      </button>
      {providers.map(p => (
        <div key={p.id} className="card p-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs">Provider Name</p>
              <p className="text-white font-semibold">{p.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Accreditation</p>
              <p className="text-white font-semibold">{p.accreditation}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Contact</p>
              <p className="text-gray-300 text-sm">{p.contact}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Courses Offered</p>
              <p className="text-gray-300 text-sm">{p.courses}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-xs">Cost Range</p>
              <p className="text-white font-semibold">{p.cost}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Reports Tab
  const reportsTab = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-gray-400 text-xs mb-2">Total Training Hours</div><div className="text-3xl font-bold text-white">{Math.round(trainingData.reduce((sum: number, t: TrainingRecord) => sum + (t.duration || 0), 0))}</div></div>
        <div className="card p-4"><div className="text-gray-400 text-xs mb-2">Completion Rate</div><div className="text-3xl font-bold text-green-400">{Math.round((completedCount / totalCount) * 100)}%</div></div>
        <div className="card p-4"><div className="text-gray-400 text-xs mb-2">Scheduled</div><div className="text-3xl font-bold text-amber-400">{scheduledCount}</div></div>
      </div>

      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">Training by Type</h3>
        <div className="space-y-3">
          {(() => {
            const types = new Map<string, number>();
            trainingData.forEach(t => {
              const typeKey = (t.type || 'unknown').replace(/_/g, ' ');
              types.set(typeKey, (types.get(typeKey) || 0) + 1);
            });
            const total = trainingData.length;
            return Array.from(types.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-300 text-sm">{type}</span>
                      <span className="text-gray-400 text-xs">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-white font-semibold mb-4">Budget Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
            <span className="text-gray-300">Budget Allocated</span>
            <span className="text-white font-semibold">£15,000</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
            <span className="text-gray-300">Spent to Date</span>
            <span className="text-amber-400 font-semibold">£8,450</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-3 mt-4">
            <div className="bg-amber-500 h-3 rounded" style={{ width: '56%' }}></div>
          </div>
          <p className="text-gray-400 text-xs">Remaining: £6,550 (44%)</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ModuleBreadcrumbs currentModule="training" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Training & Certifications</h2>
            <p className="text-gray-400 text-sm mt-1">Track workforce training, compliance and development</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowBulkImport(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium">
              <Download size={16}/><span>Import</span>
            </button>
            <ExportButton data={trainingData as unknown as Record<string, unknown>[]} filename="training" />
            <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
              <Plus size={18} /> Add Training
            </button>
          </div>
        </div>

        {activeTab === 'register' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Award className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Completed</p><p className="text-2xl font-bold text-green-400">{completedCount}</p></div></div></div>
            <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertCircle className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Scheduled</p><p className="text-2xl font-bold text-amber-400">{scheduledCount}</p></div></div></div>
            <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><GraduationCap className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Records</p><p className="text-2xl font-bold text-blue-400">{totalCount}</p></div></div></div>
          </div>
        )}

        <div className="flex border-b border-gray-700">
          {(['register', 'schedule', 'matrix', 'providers', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'register' && 'Training Register'}
              {tab === 'schedule' && 'Schedule'}
              {tab === 'matrix' && 'Compliance Matrix'}
              {tab === 'providers' && 'Providers'}
              {tab === 'reports' && 'Reports'}
            </button>
          ))}
        </div>

        <div className="card p-6">
          {activeTab === 'register' && registerTab}
          {activeTab === 'schedule' && scheduleTab}
          {activeTab === 'matrix' && matrixTab}
          {activeTab === 'providers' && providersTab}
          {activeTab === 'reports' && reportsTab}
        </div>

        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          actions={[
            { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          ]}
          onClearSelection={clearSelection}
        />

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
                <h3 className="text-xl font-bold text-white">Add Training Record</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CSCS Health & Safety" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="toolbox_talk">Toolbox Talk</option>
                      <option value="formal_course">Formal Course</option>
                      <option value="e_learning">E-Learning</option>
                      <option value="on_the_job">On-the-Job</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Provider</label>
                    <input type="text" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="e.g. CITB" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Scheduled Date</label>
                    <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Completed Date</label>
                    <input type="date" value={form.completedDate} onChange={e => setForm(f => ({ ...f, completedDate: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Duration (hours)</label>
                    <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 4" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Location</label>
                    <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Training Centre" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Attendees (comma separated)</label>
                  <input type="text" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="e.g. John Smith, Sarah Johnson" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Certification Awarded</label>
                    <select value={form.certification} onChange={e => setForm(f => ({ ...f, certification: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  {form.certification === 'yes' && (
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Certification Name</label>
                      <input type="text" value={form.certName} onChange={e => setForm(f => ({ ...f, certName: e.target.value }))} placeholder="e.g. CSCS Card" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-900">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.title} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Add Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editItem && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
                <h3 className="text-xl font-bold text-white">Edit Training Record</h3>
                <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Title *</label>
                  <input type="text" value={editItem.title} onChange={e => setEditItem(f => ({ ...f!, title: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Type</label>
                    <select value={editItem.type} onChange={e => setEditItem(f => ({ ...f!, type: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="toolbox_talk">Toolbox Talk</option>
                      <option value="formal_course">Formal Course</option>
                      <option value="e_learning">E-Learning</option>
                      <option value="on_the_job">On-the-Job</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Provider</label>
                    <input type="text" value={editItem.provider} onChange={e => setEditItem(f => ({ ...f!, provider: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Scheduled Date</label>
                    <input type="date" value={editItem.scheduled_date || ''} onChange={e => setEditItem(f => ({ ...f!, scheduled_date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Completed Date</label>
                    <input type="date" value={editItem.completed_date || ''} onChange={e => setEditItem(f => ({ ...f!, completed_date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Duration (hours)</label>
                    <input type="number" value={editItem.duration || ''} onChange={e => setEditItem(f => ({ ...f!, duration: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Status</label>
                  <select value={editItem.status} onChange={e => setEditItem(f => ({ ...f!, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-900">
                <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.title} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBulkImport && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Import Items</h2>
                <button type="button" onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} className="text-gray-400"/></button>
              </div>
              <div className="p-6">
                <DataImporter
                  onImport={handleBulkImport}
                  format="csv"
                  exampleData={{ title: '', provider: '', type: '', date: '', status: '', notes: '' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
