"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaPhone,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaClock,
  FaEnvelope,
  FaPaperPlane
} from 'react-icons/fa';

const contactInfo = [
  {
    icon: FaPhone,
    title: "Call Us",
    primary: "800-MBR-AUTO",
    secondary: "+971 4 123 4567",
    description: "24/7 Customer Support",
    action: "tel:8006272886",
    color: "text-blue-400"
  },
  {
    icon: FaWhatsapp,
    title: "WhatsApp",
    primary: "+971 56 501 5800",
    secondary: "Instant Response",
    description: "Quick quotes and booking",
    action: "https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20automotive%20service",
    color: "text-green-400"
  },
  {
    icon: FaMapMarkerAlt,
    title: "Visit Us",
    primary: "Al Quoz Industrial 4",
    secondary: "Dubai, UAE",
    description: "Behind Mall of the Emirates",
    action: "https://maps.app.goo.gl/6A6XeA4Nk4qD8MdRA",
    color: "text-red-400"
  },
  {
    icon: FaClock,
    title: "Working Hours",
    primary: "Mon - Sat",
    secondary: "8:30 AM - 7:30 PM",
    description: "Sunday: Closed",
    action: null,
    color: "text-yellow-400"
  }
];

const workingHours = [
  { day: "Monday", hours: "8:30 AM - 7:30 PM" },
  { day: "Tuesday", hours: "8:30 AM - 7:30 PM" },
  { day: "Wednesday", hours: "8:30 AM - 7:30 PM" },
  { day: "Thursday", hours: "8:30 AM - 7:30 PM" },
  { day: "Friday", hours: "8:30 AM - 7:30 PM" },
  { day: "Saturday", hours: "8:30 AM - 7:30 PM" },
  { day: "Sunday", hours: "Closed" }
];

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', service: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="contact" className="section-horizontal section-dark">
      <div className="container-luxury">

        {/* Section Header */}
        <motion.div
          className="content-block mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-display text-center mb-6">
            Get in Touch
          </h2>
          <p className="text-body text-center max-w-2xl mx-auto">
            Ready to experience premium automotive service? Contact us today
            for expert consultation and professional car care solutions.
          </p>
        </motion.div>

        {/* Contact Information Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {info.action ? (
                <a
                  href={info.action}
                  target={info.action.startsWith('http') ? '_blank' : undefined}
                  rel={info.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block h-full"
                >
                  <div className="card-minimal p-6 h-full text-center group hover:bg-surface transition-colors">
                    <info.icon className={`w-8 h-8 mx-auto mb-4 ${info.color} group-hover:scale-110 transition-transform`} />
                    <h3 className="text-subheading text-white mb-2">
                      {info.title}
                    </h3>
                    <p className="text-body text-white mb-1">
                      {info.primary}
                    </p>
                    <p className="text-caption text-gray-400 mb-1">
                      {info.secondary}
                    </p>
                    <p className="text-caption text-gray-500">
                      {info.description}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="card-minimal p-6 h-full text-center">
                  <info.icon className={`w-8 h-8 mx-auto mb-4 ${info.color}`} />
                  <h3 className="text-subheading text-white mb-2">
                    {info.title}
                  </h3>
                  <p className="text-body text-white mb-1">
                    {info.primary}
                  </p>
                  <p className="text-caption text-gray-400 mb-1">
                    {info.secondary}
                  </p>
                  <p className="text-caption text-gray-500">
                    {info.description}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          className="grid-two gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >

          {/* Contact Form */}
          <motion.div variants={itemVariants}>
            <div className="card-minimal p-8">
              <h3 className="text-heading text-white mb-6">
                Send us a Message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-caption text-gray-400 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-surface border border-gray-600 rounded text-white focus:border-primary focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-caption text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-surface border border-gray-600 rounded text-white focus:border-primary focus:outline-none transition-colors"
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-caption text-gray-400 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-surface border border-gray-600 rounded text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-caption text-gray-400 mb-2">
                    Service Required
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-surface border border-gray-600 rounded text-white focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="">Select a service</option>
                    <option value="mechanical">Mechanical Repairs</option>
                    <option value="electrical">Electrical & Diagnostics</option>
                    <option value="suspension">Suspension & Steering</option>
                    <option value="maintenance">Maintenance Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-caption text-gray-400 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-surface border border-gray-600 rounded text-white focus:border-primary focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your vehicle and service requirements..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>

                {submitStatus === 'success' && (
                  <p className="text-green-400 text-center">
                    Message sent successfully! We&apos;ll get back to you soon.
                  </p>
                )}

                {submitStatus === 'error' && (
                  <p className="text-red-400 text-center">
                    Failed to send message. Please try again or contact us directly.
                  </p>
                )}
              </form>
            </div>
          </motion.div>

          {/* Location & Hours */}
          <motion.div variants={itemVariants} className="space-y-8">

            {/* Map Embed */}
            <div className="card-minimal p-8">
              <h3 className="text-heading text-white mb-6">
                Our Location
              </h3>
              <div className="aspect-video bg-gray-800 rounded-lg mb-6 overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.1234567890!2d55.2345678!3d25.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDA3JzI0LjQiTiA1NcKwMTQnMDQuNCJF!5e0!3m2!1sen!2sae!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="filter grayscale hover:grayscale-0 transition-all duration-500"
                  title="MBR Auto Services Location"
                ></iframe>
              </div>
              <div className="text-center">
                <p className="text-body text-gray-300 mb-2">
                  Al Quoz Industrial Area 4, Dubai, UAE
                </p>
                <p className="text-caption text-gray-400">
                  Behind Mall of the Emirates, Easy Parking Available
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="card-minimal p-8">
              <h3 className="text-heading text-white mb-6">
                Working Hours
              </h3>
              <div className="space-y-3">
                {workingHours.map((schedule, index) => (
                  <div key={schedule.day} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                    <span className="text-body text-gray-300">
                      {schedule.day}
                    </span>
                    <span className={`text-body ${schedule.hours === 'Closed' ? 'text-red-400' : 'text-white'}`}>
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                <p className="text-caption text-gray-400 mb-2">
                  Emergency Services Available
                </p>
                <a
                  href="tel:+971565015800"
                  className="text-primary hover:text-red-400 transition-colors"
                >
                  Call +971 56 501 5800
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Contact Actions */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <a
              href="https://wa.me/+971565015800?text=Hello%20MBR,%20I%20need%20immediate%20automotive%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center space-x-2"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>WhatsApp Now</span>
            </a>
            <a
              href="tel:8006272886"
              className="btn-secondary flex items-center space-x-2"
            >
              <FaPhone className="w-4 h-4" />
              <span>Call 800-MBR-AUTO</span>
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}