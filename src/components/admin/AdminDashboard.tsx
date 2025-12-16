"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  FaBuilding, 
  FaCalendarAlt, 
  FaClock, 
  FaEnvelope, 
  FaGoogle, 
  FaSave, 
  FaUndo,
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarCheck,
  FaCog
} from 'react-icons/fa';
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
  const [settingsLoading, setSettingsLoading] = useState(false); // Start as false, only true when actively loading
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await fetch('/api/admin/bookings');
      const data = await response.json();
      if (data.success) {
        console.log(`Loaded ${data.bookings.length} bookings`);
        setBookings(data.bookings);
      } else {
        console.error('Failed to fetch bookings:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const response = await fetch('/api/admin/settings');
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        const errorMsg = errorData.error || `Failed to load settings (${response.status})`;
        console.error('Settings API error:', response.status, errorMsg);
        setSettingsError(errorMsg);
        setSettingsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        console.log('Settings loaded successfully:', data.settings);
        setOriginalSettings(data.settings);
        setFormSettings(data.settings);
        setHasUnsavedChanges(false);
      } else {
        const errorMsg = data.error || 'Failed to load settings: Invalid response';
        console.error('Failed to load settings:', errorMsg, data);
        setSettingsError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch settings';
      console.error('Failed to fetch settings:', error);
      setSettingsError(errorMsg);
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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || `Failed to save ${key} (${response.status})`);
        }
        
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
      setTimeout(() => setSettingsMessage(null), 5000);
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

  // Show loading state only when settings tab is active and loading
  if (activeTab === 'settings' && settingsLoading && !formSettings && !settingsError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-body-enhanced text-muted-enhanced">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container-luxury py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-display font-light gradient-text mb-2">
              Admin Dashboard
            </h1>
            <p className="text-body-enhanced text-muted-enhanced">
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
        <div className="flex gap-1 mb-8 border-b border-gray-800">
          <button
            onClick={() => {
              if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
                return;
              }
              setActiveTab('bookings');
            }}
            className={`pb-4 px-6 text-subheading transition-colors relative ${
              activeTab === 'bookings'
                ? 'text-primary'
                : 'text-muted-enhanced hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <FaCalendarCheck />
              Bookings
            </span>
            {activeTab === 'bookings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-6 text-subheading transition-colors relative ${
              activeTab === 'settings'
                ? 'text-primary'
                : 'text-muted-enhanced hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <FaCog />
              Settings
              {hasUnsavedChanges && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              )}
            </span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
            )}
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-heading font-light">Bookings</h2>
              <div className="text-body text-muted-enhanced">
                Total: {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              </div>
            </div>
            
            {bookingsLoading ? (
              <div className="text-center py-8 text-muted-enhanced">
                <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading bookings...</p>
              </div>
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
                      <th className="text-left py-3 px-4 text-subheading">Email</th>
                      <th className="text-left py-3 px-4 text-subheading">Phone</th>
                      <th className="text-left py-3 px-4 text-subheading">Status</th>
                      <th className="text-left py-3 px-4 text-subheading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <td className="py-3 px-4 text-body">
                          {new Date(booking.slot_start).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-body">{booking.service_type}</td>
                        <td className="py-3 px-4 text-body">{booking.customer_name}</td>
                        <td className="py-3 px-4 text-body">
                          <a 
                            href={`mailto:${booking.customer_email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            {booking.customer_email}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-body">
                          <a 
                            href={`tel:${booking.customer_phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            {booking.customer_phone}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === 'CONFIRMED'
                                ? 'bg-green-500/20 text-green-400'
                                : booking.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : booking.status === 'CANCELLED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
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
                            className="text-primary hover:text-primary-hover transition-colors"
                          >
                            View Details
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
          <div className="space-y-8">
            {/* Sticky Save Bar */}
            {hasUnsavedChanges && (
              <div className="sticky top-0 z-10 glass-card p-4 mb-6 border-l-4 border-yellow-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaExclamationCircle className="text-yellow-400" />
                    <div>
                      <p className="text-subheading font-medium">You have unsaved changes</p>
                      <p className="text-sm text-muted-enhanced">Don&apos;t forget to save your changes</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={resetForm}
                      disabled={settingsSaving}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <FaUndo />
                      Reset
                    </button>
                    <button
                      onClick={saveAllSettings}
                      disabled={settingsSaving}
                      className="px-6 py-2 bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {settingsSaving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save All Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error Message */}
            {settingsMessage && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  settingsMessage.type === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}
              >
                {settingsMessage.type === 'success' ? (
                  <FaCheckCircle className="text-xl" />
                ) : (
                  <FaExclamationCircle className="text-xl" />
                )}
                <span>{settingsMessage.text}</span>
              </div>
            )}

            {settingsError ? (
              <div className="glass-card p-8">
                <div className="text-center py-12">
                  <FaExclamationCircle className="text-red-400 text-4xl mx-auto mb-4" />
                  <h3 className="text-heading font-light mb-2">Failed to Load Settings</h3>
                  <p className="text-body text-muted-enhanced mb-6">{settingsError}</p>
                  <button
                    onClick={fetchSettings}
                    className="liquid-glass-btn liquid-glass-btn-primary"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : settingsLoading || !formSettings ? (
              <div className="text-center py-12 text-muted-enhanced">
                <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading settings...</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); saveAllSettings(); }} className="space-y-8">
                {/* Business Information Section */}
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FaBuilding className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-heading font-light">Business Information</h2>
                      <p className="text-sm text-muted-enhanced mt-1">Configure your business details and location</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Business Name</label>
                      <input
                        type="text"
                        value={formSettings.business_name || ''}
                        onChange={(e) => updateFormField('business_name', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Enter business name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Timezone</label>
                      <select
                        value={formSettings.timezone || 'Asia/Dubai'}
                        onChange={(e) => updateFormField('timezone', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                      <p className="text-sm text-muted-enhanced mt-2">Select your business timezone for accurate scheduling</p>
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Business Address</label>
                      <textarea
                        value={formSettings.business_address || ''}
                        onChange={(e) => updateFormField('business_address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        placeholder="Enter full business address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Google Maps Link <span className="text-muted-enhanced font-normal">(Optional)</span></label>
                      <input
                        type="url"
                        value={formSettings.google_maps_link || ''}
                        onChange={(e) => updateFormField('google_maps_link', e.target.value || undefined)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Override default Google Maps link for location sharing</p>
                    </div>
                  </div>
                </div>

                {/* Booking Settings Section */}
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FaCalendarAlt className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-heading font-light">Booking Settings</h2>
                      <p className="text-sm text-muted-enhanced mt-1">Configure booking availability and scheduling rules</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Slot Duration <span className="text-muted-enhanced font-normal">(minutes)</span></label>
                      <input
                        type="number"
                        value={formSettings.slot_duration_minutes || 30}
                        onChange={(e) => updateFormField('slot_duration_minutes', Number(e.target.value))}
                        min="15"
                        step="15"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Time slot duration for bookings</p>
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Default Slot Capacity</label>
                      <input
                        type="number"
                        value={formSettings.slot_capacity || 1}
                        onChange={(e) => updateFormField('slot_capacity', Number(e.target.value))}
                        min="1"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Number of bookings allowed per time slot</p>
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Lead Time <span className="text-muted-enhanced font-normal">(hours)</span></label>
                      <input
                        type="number"
                        value={formSettings.lead_time_hours || 2}
                        onChange={(e) => updateFormField('lead_time_hours', Number(e.target.value))}
                        min="0"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Minimum hours before a booking can be made</p>
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Max Future Days</label>
                      <input
                        type="number"
                        value={formSettings.max_future_days || 90}
                        onChange={(e) => updateFormField('max_future_days', Number(e.target.value))}
                        min="1"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Maximum days in advance for bookings</p>
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Confirmation Expiry <span className="text-muted-enhanced font-normal">(minutes)</span></label>
                      <input
                        type="number"
                        value={formSettings.confirmation_expiry_minutes || 30}
                        onChange={(e) => updateFormField('confirmation_expiry_minutes', Number(e.target.value))}
                        min="5"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Time before confirmation link expires</p>
                    </div>
                  </div>
                </div>

                {/* Working Hours Section */}
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FaClock className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-heading font-light">Working Hours</h2>
                      <p className="text-sm text-muted-enhanced mt-1">Set your business operating hours for each day</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const dayHours = formSettings.working_hours?.[day] || { open: '09:00', close: '18:00', enabled: false };
                      return (
                        <div key={day} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                          <div className="flex items-center gap-3 w-40">
                            <input
                              type="checkbox"
                              id={`day-${day}`}
                              checked={dayHours.enabled}
                              onChange={(e) => updateWorkingHoursField(day, 'enabled', e.target.checked)}
                              className="w-5 h-5 cursor-pointer rounded border-gray-600 bg-gray-800 text-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <label htmlFor={`day-${day}`} className="text-subheading capitalize cursor-pointer font-medium">
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </label>
                          </div>
                          {dayHours.enabled && (
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="time"
                                value={dayHours.open}
                                onChange={(e) => updateWorkingHoursField(day, 'open', e.target.value)}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                              <span className="text-muted-enhanced">to</span>
                              <input
                                type="time"
                                value={dayHours.close}
                                onChange={(e) => updateWorkingHoursField(day, 'close', e.target.value)}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                              />
                            </div>
                          )}
                          {!dayHours.enabled && (
                            <span className="text-sm text-muted-enhanced">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Google Calendar Section */}
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FaGoogle className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-heading font-light">Google Calendar Integration</h2>
                      <p className="text-sm text-muted-enhanced mt-1">Connect your Google Calendar for automatic event creation</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-subheading mb-2 font-medium">Google Calendar ID</label>
                      <input
                        type="text"
                        value={formSettings.google_calendar_id || ''}
                        onChange={(e) => updateFormField('google_calendar_id', e.target.value || undefined)}
                        placeholder="calendar@group.calendar.google.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-sm text-muted-enhanced mt-2">Leave empty to disable calendar integration. Find your calendar ID in Google Calendar settings.</p>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="conflict-check"
                        checked={formSettings.google_calendar_conflict_check || false}
                        onChange={(e) => updateFormField('google_calendar_conflict_check', e.target.checked)}
                        className="w-5 h-5 mt-0.5 cursor-pointer rounded border-gray-600 bg-gray-800 text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <div>
                        <label htmlFor="conflict-check" className="text-subheading cursor-pointer font-medium block mb-1">
                          Enable conflict checking
                        </label>
                        <p className="text-sm text-muted-enhanced">Prevent double bookings by checking for existing calendar events</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMTP Settings Section */}
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FaEnvelope className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-heading font-light">Email Settings</h2>
                      <p className="text-sm text-muted-enhanced mt-1">Configure SMTP settings for booking confirmation emails</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-subheading mb-2 font-medium">SMTP Host</label>
                      <input
                        type="text"
                        value={formSettings.smtp_host || ''}
                        onChange={(e) => updateFormField('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">SMTP Port</label>
                      <input
                        type="number"
                        value={formSettings.smtp_port || 587}
                        onChange={(e) => updateFormField('smtp_port', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">SMTP Username</label>
                      <input
                        type="text"
                        value={formSettings.smtp_username || ''}
                        onChange={(e) => updateFormField('smtp_username', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-subheading mb-2 font-medium">SMTP From Address</label>
                      <input
                        type="email"
                        value={formSettings.smtp_from || ''}
                        onChange={(e) => updateFormField('smtp_from', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Note:</strong> SMTP password is stored securely in environment variables (SMTP_PASSWORD) and cannot be changed here.
                    </p>
                  </div>
                </div>

                {/* Email Preferences Section */}
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FaEnvelope className="text-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-heading font-light">Email Preferences</h2>
                      <p className="text-sm text-muted-enhanced mt-1">Customize what to include in confirmation emails</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'email_include_ics', label: 'Include ICS calendar attachment', desc: 'Add .ics file for easy calendar import' },
                      { key: 'email_include_google_calendar_link', label: 'Include Google Calendar link', desc: 'Add one-click link to add event to Google Calendar' },
                      { key: 'email_include_google_maps_link', label: 'Include Google Maps link', desc: 'Add location link for easy navigation' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                        <input
                          type="checkbox"
                          id={key}
                          checked={formSettings[key as keyof Settings] as boolean ?? true}
                          onChange={(e) => updateFormField(key as keyof Settings, e.target.checked)}
                          className="w-5 h-5 mt-0.5 cursor-pointer rounded border-gray-600 bg-gray-800 text-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <div>
                          <label htmlFor={key} className="text-subheading cursor-pointer font-medium block mb-1">
                            {label}
                          </label>
                          <p className="text-sm text-muted-enhanced">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Save Bar (for mobile) */}
                {hasUnsavedChanges && (
                  <div className="sticky bottom-0 glass-card p-4 border-t-2 border-primary md:hidden">
                    <div className="flex gap-3">
                      <button
                        onClick={resetForm}
                        disabled={settingsSaving}
                        className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FaUndo />
                        Reset
                      </button>
                      <button
                        onClick={saveAllSettings}
                        disabled={settingsSaving}
                        className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                      >
                        {settingsSaving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
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
                  className="text-muted-enhanced hover:text-white text-2xl"
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
