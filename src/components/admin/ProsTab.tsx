'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { slugify } from '@/lib/pros/parseRatings';

interface AdminPro {
  id: string;
  slug: string;
  name: string;
  division: 'MPO' | 'FPO' | string;
  pdgaNumber: number | null;
  rating: number;
  manualOverride: number | null;
  effectiveRating: number;
  previousRating: number | null;
  ratingUpdatedAt: string | null;
  lastSyncedAt: string | null;
  syncSource: string;
  blurb: string | null;
  featured: boolean;
  displayOrder: number;
  active: boolean;
  historyCount: number;
}

interface ImportReport {
  parsed: number;
  updated: number;
  unchanged: number;
  created: number;
  unmatched: Array<{ pdgaNumber: number; name?: string; rating: number; reason: string }>;
  parseErrors: Array<{ line: number; text: string; reason: string }>;
}

interface Draft {
  rating: string;
  manualOverride: string;
  blurb: string;
  displayOrder: string;
  featured: boolean;
  active: boolean;
}

const emptyNewPro = { name: '', division: 'MPO', pdgaNumber: '', rating: '', blurb: '' };

export default function ProsTab() {
  const [pros, setPros] = useState<AdminPro[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const [importText, setImportText] = useState('');
  const [createMissing, setCreateMissing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  const [newPro, setNewPro] = useState(emptyNewPro);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pros');
      if (!res.ok) throw new Error('Failed to load pros');
      const data = await res.json();
      setPros(data.pros ?? []);
    } catch {
      toast.error('Could not load pros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/cron/pros/sync', { method: 'POST' });
      const report = await res.json();
      if (!res.ok) throw new Error(report.error || 'Sync failed');
      toast.success(
        `Sync (${report.provider}): ${report.changed} changed, ${report.unchanged} unchanged, ${report.failed} failed.`
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error('Paste some rows first.');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/admin/pros/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText, createMissing }),
      });
      const report = await res.json();
      if (!res.ok) throw new Error(report.error || 'Import failed');
      setImportReport(report);
      toast.success(
        `Imported: ${report.updated} updated, ${report.created} created, ${report.unchanged} unchanged.`
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const startEdit = (pro: AdminPro) => {
    setEditingId(pro.id);
    setDraft({
      rating: String(pro.rating),
      manualOverride: pro.manualOverride == null ? '' : String(pro.manualOverride),
      blurb: pro.blurb ?? '',
      displayOrder: String(pro.displayOrder),
      featured: pro.featured,
      active: pro.active,
    });
  };

  const saveEdit = async (id: string) => {
    if (!draft) return;
    const body: Record<string, unknown> = { id };
    const ratingNum = Number(draft.rating);
    if (Number.isFinite(ratingNum)) body.rating = ratingNum;
    body.manualOverride = draft.manualOverride.trim() === '' ? null : Number(draft.manualOverride);
    body.blurb = draft.blurb;
    const orderNum = Number(draft.displayOrder);
    if (Number.isFinite(orderNum)) body.displayOrder = orderNum;
    body.featured = draft.featured;
    body.active = draft.active;

    try {
      const res = await fetch('/api/admin/pros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast.success('Saved.');
      setEditingId(null);
      setDraft(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const deactivate = async (pro: AdminPro) => {
    if (!confirm(`Deactivate ${pro.name}? Existing share links keep working.`)) return;
    try {
      const res = await fetch(`/api/admin/pros?id=${pro.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to deactivate');
      toast.success('Deactivated.');
      await load();
    } catch {
      toast.error('Could not deactivate.');
    }
  };

  const createPro = async () => {
    if (!newPro.name.trim() || !newPro.rating) {
      toast.error('Name and rating are required.');
      return;
    }
    setCreating(true);
    try {
      const body = {
        name: newPro.name.trim(),
        slug: slugify(newPro.name),
        division: newPro.division,
        rating: Number(newPro.rating),
        pdgaNumber: newPro.pdgaNumber ? Number(newPro.pdgaNumber) : undefined,
        blurb: newPro.blurb.trim() || undefined,
        featured: true,
      };
      const res = await fetch('/api/admin/pros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      toast.success(`Added ${body.name}.`);
      setNewPro(emptyNewPro);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const inputClass = 'w-full px-2 py-1 border rounded text-sm';

  return (
    <div className="space-y-8">
      {/* Sync */}
      <section className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pro players</h2>
          <p className="text-sm text-gray-500">
            {pros.length} total. Ratings refresh via import or the scheduled sync.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </section>

      {/* Importer */}
      <section className="border rounded p-4 bg-white space-y-3">
        <h3 className="font-semibold">Paste ratings to import</h3>
        <p className="text-sm text-gray-500">
          Paste rows from the PDGA player stats table (tab-separated) or CSV as
          <code className="mx-1 px-1 bg-gray-100 rounded">Name, PDGA#, Rating</code>. Matched
          by PDGA number.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={6}
          placeholder={'Gannon Buhr\t75412\t1062\nR. Wysocki, 38008, 1053'}
          className="w-full border rounded p-2 text-sm font-mono"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createMissing}
              onChange={(e) => setCreateMissing(e.target.checked)}
            />
            Create pros not already in the list (needs a name and Male/Female column)
          </label>
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60"
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>

        {importReport && (
          <div className="text-sm border-t pt-3 space-y-1">
            <p>
              Parsed {importReport.parsed}: {importReport.updated} updated,{' '}
              {importReport.created} created, {importReport.unchanged} unchanged.
            </p>
            {importReport.unmatched.length > 0 && (
              <details>
                <summary className="cursor-pointer text-amber-700">
                  {importReport.unmatched.length} unmatched
                </summary>
                <ul className="mt-1 ml-4 list-disc text-gray-600">
                  {importReport.unmatched.map((u, i) => (
                    <li key={i}>
                      {u.name ?? '(no name)'} #{u.pdgaNumber} ({u.rating}): {u.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {importReport.parseErrors.length > 0 && (
              <details>
                <summary className="cursor-pointer text-red-600">
                  {importReport.parseErrors.length} lines could not be parsed
                </summary>
                <ul className="mt-1 ml-4 list-disc text-gray-600">
                  {importReport.parseErrors.map((e, i) => (
                    <li key={i}>
                      Line {e.line}: {e.reason} - <code>{e.text}</code>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>

      {/* Add pro */}
      <section className="border rounded p-4 bg-white space-y-3">
        <h3 className="font-semibold">Add a pro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <input
            className={inputClass}
            placeholder="Name"
            value={newPro.name}
            onChange={(e) => setNewPro({ ...newPro, name: e.target.value })}
          />
          <select
            className={inputClass}
            value={newPro.division}
            onChange={(e) => setNewPro({ ...newPro, division: e.target.value })}
          >
            <option value="MPO">MPO</option>
            <option value="FPO">FPO</option>
          </select>
          <input
            className={inputClass}
            placeholder="PDGA # (optional)"
            value={newPro.pdgaNumber}
            onChange={(e) => setNewPro({ ...newPro, pdgaNumber: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Rating"
            value={newPro.rating}
            onChange={(e) => setNewPro({ ...newPro, rating: e.target.value })}
          />
          <button
            onClick={createPro}
            disabled={creating}
            className="px-3 py-1 rounded bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-60"
          >
            {creating ? 'Adding…' : 'Add'}
          </button>
        </div>
      </section>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Div</th>
              <th className="px-3 py-2 text-left">PDGA#</th>
              <th className="px-3 py-2 text-left">Rating</th>
              <th className="px-3 py-2 text-left">Override</th>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Featured</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Last sync</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pros.map((pro) => {
              const editing = editingId === pro.id && draft;
              return (
                <tr key={pro.id} className={`border-t ${pro.active ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-2">
                    {pro.name}
                    {pro.blurb && !editing && (
                      <div className="text-xs text-gray-400">{pro.blurb}</div>
                    )}
                    {editing && (
                      <input
                        className={`${inputClass} mt-1`}
                        value={draft.blurb}
                        placeholder="Blurb"
                        onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">{pro.division}</td>
                  <td className="px-3 py-2">{pro.pdgaNumber ?? '-'}</td>
                  <td className="px-3 py-2">
                    {editing ? (
                      <input
                        className="w-20 px-2 py-1 border rounded"
                        value={draft.rating}
                        onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
                      />
                    ) : (
                      pro.rating
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editing ? (
                      <input
                        className="w-20 px-2 py-1 border rounded"
                        value={draft.manualOverride}
                        placeholder="none"
                        onChange={(e) => setDraft({ ...draft, manualOverride: e.target.value })}
                      />
                    ) : (
                      pro.manualOverride ?? '-'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editing ? (
                      <input
                        className="w-16 px-2 py-1 border rounded"
                        value={draft.displayOrder}
                        onChange={(e) => setDraft({ ...draft, displayOrder: e.target.value })}
                      />
                    ) : (
                      pro.displayOrder
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editing ? (
                      <input
                        type="checkbox"
                        checked={draft.featured}
                        onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                      />
                    ) : pro.featured ? 'Yes' : 'No'}
                  </td>
                  <td className="px-3 py-2">
                    {editing ? (
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      />
                    ) : pro.active ? 'Yes' : 'No'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {pro.lastSyncedAt ? new Date(pro.lastSyncedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {editing ? (
                      <>
                        <button
                          onClick={() => saveEdit(pro.id)}
                          className="text-green-700 hover:underline mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setDraft(null);
                          }}
                          className="text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(pro)}
                          className="text-blue-600 hover:underline mr-2"
                        >
                          Edit
                        </button>
                        {pro.active && (
                          <button
                            onClick={() => deactivate(pro)}
                            className="text-red-600 hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {pros.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  No pros yet. Run <code>npm run seed:pros</code> or add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
