"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Booking, Settings } from '@/lib/booking/types';

type Tab = 'bookings' | 'settings';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

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
        console.log('Settings loaded:', data.settings);
        setSettings(data.settings);
        setLocalSettings(data.settings);
      } else {
        console.error('Failed to load settings:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: unknown) => {
    if (!localSettings) return;
    
    // Update local state immediately for responsive UI
    setLocalSettings({ ...localSettings, [key]: value });
    setSavingKeys(prev => new Set(prev).add(key));
    setSettingsMessage(null);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the main settings state
        setSettings({ ...localSettings, [key]: value });
        setSettingsMessage({ type: 'success', text: 'Setting saved successfully' });
        setTimeout(() => setSettingsMessage(null), 3000);
      } else {
        // Revert on error
        setLocalSettings(settings);
        setSettingsMessage({ type: 'error', text: data.error || 'Failed to save setting' });
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert on error
      setLocalSettings(settings);
      setSettingsMessage({ type: 'error', text: 'Failed to save setting' });
    } finally {
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const updateLocalSetting = (key: string, value: unknown) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    if (!localSettings) return;
    
    const updatedHours = {
      ...localSettings.working_hours,
      [day]: {
        ...(localSettings.working_hours[day] || { open: '09:00', close: '18:00', enabled: false }),
        [field]: value,
      },
    };
    
    updateSetting('working_hours', updatedHours);
  };

  const updateLocalWorkingHours = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    if (!localSettings) return;
    
    const updatedHours = {
      ...localSettings.working_hours,
      [day]: {
        ...(localSettings.working_hours[day] || { open: '09:00', close: '18:00', enabled: false }),
        [field]: value,
      },
    };
    
    setLocalSettings({ ...localSettings, working_hours: updatedHours });
  };

  // Use localSettings for display, fallback to settings
  const displaySettings = localSettings || settings;

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
            onClick={() => setActiveTab('bookings')}
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
            ) : displaySettings ? (
              <>
                {/* Business Information */}
                <div className="glass-card p-8">
                  <h2 className="text-heading font-light mb-6">Business Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-subheading mb-2">Business Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={displaySettings.business_name || ''}
                          onChange={(e) => updateLocalSetting('business_name', e.target.value)}
                          onBlur={(e) => updateSetting('business_name', e.target.value)}
                          disabled={savingKeys.has('business_name')}
                          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                          placeholder="Enter business name"
                        />
                        {savingKeys.has('business_name') && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Timezone</label>
                      <select
                        value={displaySettings.timezone || 'Asia/Dubai'}
                        onChange={(e) => updateSetting('timezone', e.target.value)}
                        disabled={savingKeys.has('timezone')}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
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
                        value={displaySettings.business_address || ''}
                        onChange={(e) => updateLocalSetting('business_address', e.target.value)}
                        onBlur={(e) => updateSetting('business_address', e.target.value)}
                        disabled={savingKeys.has('business_address')}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 resize-none"
                        placeholder="Enter full business address"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Google Maps Link (Optional)</label>
                      <input
                        type="url"
                        value={displaySettings.google_maps_link || ''}
                        onChange={(e) => updateLocalSetting('google_maps_link', e.target.value || undefined)}
                        onBlur={(e) => updateSetting('google_maps_link', e.target.value || undefined)}
                        disabled={savingKeys.has('google_maps_link')}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
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
                        value={displaySettings.slot_duration_minutes || 30}
                        onChange={(e) => updateLocalSetting('slot_duration_minutes', Number(e.target.value))}
                        onBlur={(e) => updateSetting('slot_duration_minutes', Number(e.target.value))}
                        disabled={savingKeys.has('slot_duration_minutes')}
                        min="15"
                        step="15"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Default Slot Capacity</label>
                      <input
                        type="number"
                        value={displaySettings.slot_capacity || 1}
                        onChange={(e) => updateLocalSetting('slot_capacity', Number(e.target.value))}
                        onBlur={(e) => updateSetting('slot_capacity', Number(e.target.value))}
                        disabled={savingKeys.has('slot_capacity')}
                        min="1"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Lead Time (hours)</label>
                      <input
                        type="number"
                        value={displaySettings.lead_time_hours || 2}
                        onChange={(e) => updateLocalSetting('lead_time_hours', Number(e.target.value))}
                        onBlur={(e) => updateSetting('lead_time_hours', Number(e.target.value))}
                        disabled={savingKeys.has('lead_time_hours')}
                        min="0"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Minimum hours before booking</p>
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Max Future Days</label>
                      <input
                        type="number"
                        value={displaySettings.max_future_days || 90}
                        onChange={(e) => updateLocalSetting('max_future_days', Number(e.target.value))}
                        onBlur={(e) => updateSetting('max_future_days', Number(e.target.value))}
                        disabled={savingKeys.has('max_future_days')}
                        min="1"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Maximum days in future for bookings</p>
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">Confirmation Expiry (minutes)</label>
                      <input
                        type="number"
                        value={displaySettings.confirmation_expiry_minutes || 30}
                        onChange={(e) => updateLocalSetting('confirmation_expiry_minutes', Number(e.target.value))}
                        onBlur={(e) => updateSetting('confirmation_expiry_minutes', Number(e.target.value))}
                        disabled={savingKeys.has('confirmation_expiry_minutes')}
                        min="5"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
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
                      const dayHours = displaySettings.working_hours?.[day] || { open: '09:00', close: '18:00', enabled: false };
                      return (
                        <div key={day} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center gap-2 w-32">
                            <input
                              type="checkbox"
                              checked={dayHours.enabled}
                              onChange={(e) => updateWorkingHours(day, 'enabled', e.target.checked)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <label className="text-subheading capitalize cursor-pointer">{day}</label>
                          </div>
                          {dayHours.enabled && (
                            <>
                              <input
                                type="time"
                                value={dayHours.open}
                                onChange={(e) => updateLocalWorkingHours(day, 'open', e.target.value)}
                                onBlur={(e) => updateWorkingHours(day, 'open', e.target.value)}
                                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary"
                              />
                              <span className="text-muted-enhanced">to</span>
                              <input
                                type="time"
                                value={dayHours.close}
                                onChange={(e) => updateLocalWorkingHours(day, 'close', e.target.value)}
                                onBlur={(e) => updateWorkingHours(day, 'close', e.target.value)}
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
                        value={displaySettings.google_calendar_id || ''}
                        onChange={(e) => updateLocalSetting('google_calendar_id', e.target.value || undefined)}
                        onBlur={(e) => updateSetting('google_calendar_id', e.target.value || undefined)}
                        disabled={savingKeys.has('google_calendar_id')}
                        placeholder="calendar@group.calendar.google.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                      <p className="text-sm text-muted-enhanced mt-1">Leave empty to disable calendar integration</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.google_calendar_conflict_check || false}
                        onChange={(e) => updateSetting('google_calendar_conflict_check', e.target.checked)}
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
                        value={displaySettings.smtp_host || ''}
                        onChange={(e) => updateLocalSetting('smtp_host', e.target.value)}
                        onBlur={(e) => updateSetting('smtp_host', e.target.value)}
                        disabled={savingKeys.has('smtp_host')}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">SMTP Port</label>
                      <input
                        type="number"
                        value={displaySettings.smtp_port || 587}
                        onChange={(e) => updateLocalSetting('smtp_port', Number(e.target.value))}
                        onBlur={(e) => updateSetting('smtp_port', Number(e.target.value))}
                        disabled={savingKeys.has('smtp_port')}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">SMTP Username</label>
                      <input
                        type="text"
                        value={displaySettings.smtp_username || ''}
                        onChange={(e) => updateLocalSetting('smtp_username', e.target.value)}
                        onBlur={(e) => updateSetting('smtp_username', e.target.value)}
                        disabled={savingKeys.has('smtp_username')}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-subheading mb-2">SMTP From Address</label>
                      <input
                        type="email"
                        value={displaySettings.smtp_from || ''}
                        onChange={(e) => updateLocalSetting('smtp_from', e.target.value)}
                        onBlur={(e) => updateSetting('smtp_from', e.target.value)}
                        disabled={savingKeys.has('smtp_from')}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-primary disabled:opacity-50"
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
                        checked={displaySettings.email_include_ics ?? true}
                        onChange={(e) => updateSetting('email_include_ics', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Include ICS calendar attachment</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.email_include_google_calendar_link ?? true}
                        onChange={(e) => updateSetting('email_include_google_calendar_link', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Include Google Calendar link</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.email_include_google_maps_link ?? true}
                        onChange={(e) => updateSetting('email_include_google_maps_link', e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label className="text-subheading cursor-pointer">Include Google Maps link</label>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-enhanced">Failed to load settings</div>
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
