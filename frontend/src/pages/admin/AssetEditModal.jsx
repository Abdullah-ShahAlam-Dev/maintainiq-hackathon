import { useState } from 'react';
import { ASSET_CATEGORIES, OTHER_CATEGORY } from '../../constants/categories';

// Opened from a card/row's Edit icon. Pre-filled with the asset's current
// values; onSave(assetId, updates, imageFile) is expected to PUT to the
// backend (multipart if a new image was picked) and refresh the parent's list.
const AssetEditModal = ({ asset, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: asset.name || '',
    category: asset.category || '',
    location: asset.location || '',
    condition: asset.condition || 'Good'
  });
  const [showCustomCategory, setShowCustomCategory] = useState(
    Boolean(asset.category) && !ASSET_CATEGORIES.includes(asset.category)
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(asset.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCategorySelect = (e) => {
    const value = e.target.value;
    if (value === OTHER_CATEGORY) {
      setShowCustomCategory(true);
      setForm({ ...form, category: '' });
    } else {
      setShowCustomCategory(false);
      setForm({ ...form, category: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(asset._id, form, imageFile);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4">
      <div className="bg-panel border-t-4 border-hazard rounded-sm w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-mono text-xs uppercase tracking-tag text-muted m-0 mb-1">Edit Asset</h2>
        <p className="text-sm text-ink mb-4">
          <span className="font-mono">{asset.assetCode}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {imagePreview && (
            <img src={imagePreview} alt="Asset preview" className="w-full h-40 object-cover rounded-sm border border-line" />
          )}
          <label className="block text-xs font-mono uppercase tracking-tag text-muted">
            Asset Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full mt-1 text-sm"
            />
          </label>

          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          <select
            value={showCustomCategory ? OTHER_CATEGORY : form.category}
            onChange={handleCategorySelect}
            required
            className="w-full border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Select category...</option>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value={OTHER_CATEGORY}>{OTHER_CATEGORY}</option>
          </select>
          {showCustomCategory && (
            <input
              placeholder="Specify category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="w-full border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          )}

          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            required
            className="w-full border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          <input
            name="condition"
            placeholder="Condition"
            value={form.condition}
            onChange={handleChange}
            className="w-full border border-line rounded-sm px-3 py-2 text-sm font-sans focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          {error && <p className="error-text">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 !bg-transparent !text-ink border border-line hover:!bg-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brand hover:bg-brand-dark text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetEditModal;