import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(user?.notificationPreferences || {});
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn || false);

  const handleSave = async () => {
    try {
      await axios.put('/api/auth/preferences', {
        notificationPreferences: preferences,
        whatsappOptIn
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">User Settings</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={user?.name} className="input" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={user?.email} className="input" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Territory</label>
                <input type="text" value={user?.territory || 'N/A'} className="input" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <input type="text" value={user?.role} className="input" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Notification Preferences</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.email}
              onChange={(e) => setPreferences({ ...preferences, email: e.target.checked })}
              className="w-5 h-5 text-primary-600"
            />
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive lead alerts via email</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.sms}
              onChange={(e) => setPreferences({ ...preferences, sms: e.target.checked })}
              className="w-5 h-5 text-primary-600"
            />
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-gray-600">Receive lead alerts via SMS</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <div>
              <p className="font-medium">WhatsApp Notifications</p>
              <p className="text-sm text-gray-600">Receive lead alerts via WhatsApp (requires opt-in)</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.push}
              onChange={(e) => setPreferences({ ...preferences, push: e.target.checked })}
              className="w-5 h-5 text-primary-600"
            />
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive browser push notifications</p>
            </div>
          </label>
        </div>

        <button onClick={handleSave} className="mt-6 btn btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
}
