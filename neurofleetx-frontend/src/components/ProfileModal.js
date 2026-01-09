import React, { useState } from "react";
import api from "../api";
import { toast } from "react-toastify";

const ProfileModal = ({ profile: initialProfile, onClose }) => {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/profile", profile);
      toast.success("Profile updated successfully!");
      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-96">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>

        <input
          name="name"
          value={profile.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-2"
        />
        <input
          name="email"
          value={profile.email}
          readOnly
          className="w-full border rounded px-3 py-2 mb-2 bg-gray-100 cursor-not-allowed"
        />
        <input
          name="role"
          value={profile.role}
          readOnly
          className="w-full border rounded px-3 py-2 mb-2 bg-gray-100 cursor-not-allowed"
        />
        <input
          name="phone"
          value={profile.phone || ""}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-2"
        />
        <textarea
          name="address"
          value={profile.address || ""}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mb-2"
          rows={3}
        />

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

