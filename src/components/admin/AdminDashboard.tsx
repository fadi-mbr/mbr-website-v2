"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Booking, Settings } from '@/lib/booking/types';

type Tab = 'bookings' | 'settings';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Settings state
  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null);
  const [formSettings, setFormSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success) {
        setOriginalSettings(data.settings);
        setFormSettings(data.settings);
        setHasUnsavedChanges(false);
      } else {
        console.error('Failed to load settings:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Update form field
  const updateFormField = useCallback((key: keyof Settings, value: unknown) => {
    if (!formSettings) return;
    
    setFormSettings(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      
      // Check if there are unsaved changes
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(hasChanges);
      
      return updated;
    });
  }, [formSettings, originalSettings]);

  // Update working hours field
  const updateWorkingHoursField = useCallback((day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    if (!formSettings) return;
    
    setFormSettings(prev => {
      if (!prev) return prev;
      
      const updatedHours = {
        ...prev.working_hours,
        [day]: {
          ...(prev.working_hours[day] || { open: '09:00', close: '18:00', enabled: false }),
          [field]: value,
        },
      };
      
      const updated = { ...prev, working_hours: updatedHours };
      
      // Check if there are unsaved changes
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(hasChanges);
      
      return updated;
    });
  }, [formSettings, originalSettings]);

  // Save all settings
  const saveAllSettings = async () => {
    if (!formSettings || !originalSettings) return;
    
    setSettingsSaving(true);
    setSettingsMessage(null);
    
    try {
      // Save all settings in parallel
      const savePromises = Object.entries(formSettings).map(async ([key, value]) => {
        // Skip service_types as it's hardcoded
        if (key === 'service_types') return;
        
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || `Failed to save ${key}`);
        }
      });
      
      await Promise.all(savePromises);
      
      // Update original settings after successful save
      setOriginalSettings(formSettings);
      setHasUnsavedChanges(false);
      setSettingsMessage({ type: 'success', text: 'All settings saved successfully' });
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSettingsMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Reset form to original values
  const resetForm = () => {
    if (originalSettings) {
      setFormSettings(originalSettings);
      setHasUnsavedChanges(false);
      setSettingsMessage(null);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!formSettings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container-luxury py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-display font-light gradient-text mb-2">
              Admin Dashboard
            </h1>
            <p className="text-body-enhanced">
              Welcome, {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="liquid-glass-btn liquid-glass-btn-secondary"
          >
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => {
              if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
                return;
              }
              setActiveTab('bookings');
            }}
            className={`pb-4 px-6 text-subheading transition-colors ${
              activeTab === 'bookings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-enhanced hover:text-white'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-6 text-subheading transition-colors ${
              activeTab === 'settings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-enhanced hover:text-white'
            }`}
          >
            Settings
            {hasUnsavedChanges && (
              <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
            )}
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="glass-card p-8">
            <h2 className="text-heading font-light mb-6">Bookings</h2>
            
            {bookingsLoading ? (
              <div className="text-center py-8 text-muted-enhanced">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-enhanced">No bookings found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-subheading">Date/Time</th>
                      <th className="text-left py-3 px-4 text-subheading">Service</th>
                      <th className="text-left py-3 px-4 text-subheading">Customer</th>
                      <th className="text-left py-3 px-4 text-subheading">Phone</th>
                      <th className="text-left py-3 px-4 text-subheading">Status</th>
                      <th className="text-left py-3 px-4 text-subheading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <td className="py-3 px-4 text-body">
                          {new Date(booking.slot_start).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-body">{booking.service_type}</td>
                        <td className="py-3 px-4 text-body">{booking.customer_name}</td>
                        <td className="py-3 px-4 text-body">{booking.customer_phone}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              booking.status === 'CONFIRMED'
                                ? 'bg-green-500/20 text-green-400'
                                : booking.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                            className="text-primary hover:text-primary-hover"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Save/Reset Bar */}
            <div className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {hasUnsavedChanges && (
                  <span className="text-yellow-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    You have unsaved changes
                  </span>
                )}
                {!hasUnsavedChanges && !settingsSaving && (
                  <span className="text-green-400 text-sm">All changes saved</span>
                )}
              </div>
              <div className="flex gap-3">
                {hasUnsavedChanges && (
                  <button
                    onClick={resetForm}
                    disabled={settingsSaving}
                    className="liquid-glass-btn liquid-glass-btn-secondary"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={saveAllSettings}
                  disabled={settingsSaving || !hasUnsavedChanges}
                  className="liquid-glass-btn liquid-glass-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingsSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : (
                    'Save All Changes'
                  )}
                </button>
              </div>
            </div>

            {settingsMessage && (
              <div
                className={`p-4 rounded-lg ${
                  settingsMessage.type === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}
              >
                {settingsMessage.text}
              </div>
            )}

            {settingsLoading ? (
              <div className="text-center py-8 text-muted-enhanced">Loading settings...</div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); saveAllSettings(); }}>
                {/* Business Information */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">Business Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-subheading mb-2">Business Name</label>
                      <input
                        type="text"
                        value={formSettings.business_name || ''}
                        onChange={(e) => updateFormField('business_name', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Enter business name"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Timezone</label>
                      <select
                        value={formSettings.timezone || 'Asia/Dubai'}
                        onChange={(e) => updateFormField('timezone', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      >
                        <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Business Address</label>
                      <textarea
                        value={formSettings.business_address || ''}
                        onChange={(e) => updateFormField('business_address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary resize-none"
                        placeholder="Enter full business address"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Google Maps Link (Optional)</label>
                      <input
                        type="url"
                        value={formSettings.google_maps_link || ''}
                        onChange={(e) => updateFormField('google_maps_link', e.target.value || undefined)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Settings */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">Booking Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-subheading mb-2">Slot Duration (minutes)</label>
                      <input
                        type="number"
                        value={formSettings.slot_duration_minutes || 30}
                        onChange={(e) => updateFormField('slot_duration_minutes', Number(e.target.value))}
                        min="15"
                        step="15"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Default Slot Capacity</label>
                      <input
                        type="number"
                        value={formSettings.slot_capacity || 1}
                        onChange={(e) => updateFormField('slot_capacity', Number(e.target.value))}
                        min="1"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Lead Time (hours)</label>
                      <input
                        type="number"
                        value={formSettings.lead_time_hours || 2}
                        onChange={(e) => updateFormField('lead_time_hours', Number(e.target.value))}
                        min="0"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Minimum hours before booking</p>
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Max Future Days</label>
                      <input
                        type="number"
                        value={formSettings.max_future_days || 90}
                        onChange={(e) => updateFormField('max_future_days', Number(e.target.value))}
                        min="1"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Maximum days in future for bookings</p>
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Confirmation Expiry (minutes)</label>
                      <input
                        type="number"
                        value={formSettings.confirmation_expiry_minutes || 30}
                        onChange={(e) => updateFormField('confirmation_expiry_minutes', Number(e.target.value))}
                        min="5"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Time before confirmation link expires</p>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">Working Hours</h2>
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const dayHours = formSettings.working_hours?.[day] || { open: '09:00', close: '18:00', enabled: false };
                      return (
                        <div key={day} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center gap-2 w-32">
                            <input
                              type="checkbox"
                              checked={dayHours.enabled}
                              onChange={(e) => updateWorkingHoursField(day, 'enabled', e.target.checked)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <label className="text-subheading capitalize cursor-pointer">{day}</label>
                          </div>
                          {dayHours.enabled && (
                            <>
                              <input
                                type="time"
                                value={dayHours.open}
                                onChange={(e) => updateWorkingHoursField(day, 'open', e.target.value)}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                              />
                              <span className="text-muted-enhanced">to</span>
                              <input
                                type="time"
                                value={dayHours.close}
                                onChange={(e) => updateWorkingHoursField(day, 'close', e.target.value)}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Google Calendar Settings */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">Google Calendar Integration</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-subheading mb-2">Google Calendar ID</label>
                      <input
                        type="text"
                        value={formSettings.google_calendar_id || ''}
                        onChange={(e) => updateFormField('google_calendar_id', e.target.value || undefined)}
                        placeholder="calendar@group.calendar.google.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Leave empty to disable calendar integration</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formSettings.google_calendar_conflict_check || false}
                        onChange={(e) => updateFormField('google_calendar_conflict_check', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Enable conflict checking</label>
                    </div>
                  </div>
                </div>

                {/* SMTP Settings */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">SMTP Email Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-subheading mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={formSettings.smtp_host || ''}
                        onChange={(e) => updateFormField('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">SMTP Port</label>
                      <input
                        type="number"
                        value={formSettings.smtp_port || 587}
                        onChange={(e) => updateFormField('smtp_port', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">SMTP Username</label>
                      <input
                        type="text"
                        value={formSettings.smtp_username || ''}
                        onChange={(e) => updateFormField('smtp_username', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">SMTP From Address</label>
                      <input
                        type="email"
                        value={formSettings.smtp_from || ''}
                        onChange={(e) => updateFormField('smtp_from', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-enhanced mt-4">
                    Note: SMTP password is stored in environment variable (SMTP_PASSWORD) for security.
                  </p>
                </div>

                {/* Email Preferences */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">Email Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formSettings.email_include_ics ?? true}
                        onChange={(e) => updateFormField('email_include_ics', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Include ICS calendar attachment</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formSettings.email_include_google_calendar_link ?? true}
                        onChange={(e) => updateFormField('email_include_google_calendar_link', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Include Google Calendar link</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formSettings.email_include_google_maps_link ?? true}
                        onChange={(e) => updateFormField('email_include_google_maps_link', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Include Google Maps link</label>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-heading font-light">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-muted-enhanced hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-subheading mb-2">Customer Information</h3>
                  <p className="text-body">Name: {selectedBooking.customer_name}</p>
                  <p className="text-body">Email: {selectedBooking.customer_email}</p>
                  <p className="text-body">Phone: {selectedBooking.customer_phone}</p>
                </div>
                
                <div>
                  <h3 className="text-subheading mb-2">Service Details</h3>
                  <p className="text-body">Service: {selectedBooking.service_type}</p>
                  <p className="text-body">
                    Date/Time: {new Date(selectedBooking.slot_start).toLocaleString()}
                  </p>
                  <p className="text-body">
                    Duration: {selectedBooking.service_duration_minutes} minutes
                  </p>
                </div>
                
                {selectedBooking.customer_notes && (
                  <div>
                    <h3 className="text-subheading mb-2">Customer Notes</h3>
                    <p className="text-body">{selectedBooking.customer_notes}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-subheading mb-2">Status</h3>
                  <p className="text-body">Status: {selectedBooking.status}</p>
                  <p className="text-body">
                    Created: {new Date(selectedBooking.created_at).toLocaleString()}
                  </p>
                  {selectedBooking.confirmed_at && (
                    <p className="text-body">
                      Confirmed: {new Date(selectedBooking.confirmed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
