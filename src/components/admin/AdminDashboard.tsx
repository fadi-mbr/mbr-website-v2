"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Booking } from '@/lib/booking/types';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

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
      setLoading(false);
    }
  };

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

        {/* Bookings Table */}
        <div className="glass-card p-8">
          <h2 className="text-heading font-light mb-6">Bookings</h2>
          
          {loading ? (
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

