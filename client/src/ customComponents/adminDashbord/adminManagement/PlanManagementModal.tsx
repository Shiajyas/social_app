import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

interface Plan {
  _id?: string;
  name: string;
  amount: number;
  duration: number;
  description?: string;
}

interface PlanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Plan) => Promise<void> | void;
  initialData?: Plan | null;
}

const PlanManagementModal: React.FC<PlanManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [form, setForm] = useState<Plan>(
    initialData || { name: '', amount: 0, duration: 1, description: '' }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when editingPlan changes
  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', amount: 0, duration: 1, description: '' });
    setErrors({});
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name === 'price' ? 'amount' : name]:
        name === 'price' || name === 'duration' ? Number(value) : value,
    }));

    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Plan name is required';
    if (form.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (form.duration <= 0) newErrors.duration = 'Duration must be at least 1 month';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      await onSave(form);
      onClose();
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Something went wrong while saving the plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Plan Management"
      className="bg-white dark:bg-gray-900 dark:text-white p-6 rounded-lg max-w-lg mx-auto my-20 outline-none shadow-lg"
      overlayClassName="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
    >
      <h2 className="text-xl font-bold mb-4">
        {initialData ? 'Edit Plan' : 'Create Plan'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Plan Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={`w-full p-2 mt-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 ${
              errors.name ? 'border-red-500' : ''
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Price ($)</label>
          <input
            type="number"
            name="price"
            value={form.amount}
            onChange={handleChange}
            required
            min={0}
            className={`w-full p-2 mt-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 ${
              errors.amount ? 'border-red-500' : ''
            }`}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Duration (months)</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            min={1}
            required
            className={`w-full p-2 mt-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 ${
              errors.duration ? 'border-red-500' : ''
            }`}
          />
          {errors.duration && (
            <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 mt-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PlanManagementModal;
