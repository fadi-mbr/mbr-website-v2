"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaPhone,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa';

const contactInfo = [
  {
    icon: FaPhone,
    title: "Call Us",
    primary: "800-MBRAuto",
    secondary: "800-627-2886",
    description: "Emergency Support Available",
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
    description: "Behind Times Square mall",
    action: "https://maps.app.goo.gl/P7vgB2XDpeRCMaH3A",
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

interface LocationData {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId: string;
  googleMapsUrl: string;
  embedUrl: string;
}

export default function ContactSection() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await fetch('/api/location');
        const result = await response.json();
        if (result.success && result.data) {
          setLocationData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch location data:', error);
      }
    };

    fetchLocationData();
  }, []);

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
                  <div className="glass-card p-6 h-full text-center group hover:bg-surface transition-colors">
                    <info.icon className={`w-8 h-8 mx-auto mb-4 ${info.color} group-hover:scale-110 transition-transform`} />
                    <h3 className="text-subheading text-white mb-2">
                      {info.title}
                    </h3>
                    <p className="text-body text-white mb-1">
                      {info.primary}
                    </p>
                    <p className="text-caption text-muted-enhanced mb-1">
                      {info.secondary}
                    </p>
                    <p className="text-caption text-muted-enhanced">
                      {info.description}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="glass-card p-6 h-full text-center">
                  <info.icon className={`w-8 h-8 mx-auto mb-4 ${info.color}`} />
                  <h3 className="text-subheading text-white mb-2">
                    {info.title}
                  </h3>
                  <p className="text-body text-white mb-1">
                    {info.primary}
                  </p>
                  <p className="text-caption text-muted-enhanced mb-1">
                    {info.secondary}
                  </p>
                  <p className="text-caption text-muted-enhanced">
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
          {/* Location & Hours */}
          <motion.div variants={itemVariants} className="space-y-8">

            {/* Map Embed */}
            <div className="glass-card p-8">
              <h3 className="text-heading text-white mb-6">
                Our Location
              </h3>
              <div className="aspect-video bg-gray-950 rounded-3xl mb-6 overflow-hidden">
                {locationData ? (
                  <iframe
                    src={locationData.embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="filter grayscale hover:grayscale-0 transition-all duration-500"
                    title="MBR Auto Services Location"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-body text-body-enhanced mb-2">
                  {locationData?.address || "Al Quoz Industrial Area 4, Dubai, UAE"}
                </p>
                {locationData && (
                  <a
                    href={locationData.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-primary hover:text-red-400 transition-colors"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="glass-card p-8">
              <h3 className="text-heading text-white mb-6">
                Working Hours
              </h3>
              <div className="space-y-3">
                {workingHours.map((schedule) => (
                  <div key={schedule.day} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                    <span className="text-body text-body-enhanced">
                      {schedule.day}
                    </span>
                    <span className={`text-body ${schedule.hours === 'Closed' ? 'text-red-400' : 'text-white'}`}>
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                <p className="text-caption text-muted-enhanced mb-2">
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
              className="liquid-glass-btn liquid-glass-btn-primary flex items-center space-x-2"
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>WhatsApp Now</span>
            </a>
            <a
              href="tel:8006272886"
              className="liquid-glass-btn liquid-glass-btn-secondary flex items-center space-x-2"
            >
              <FaPhone className="w-4 h-4" />
              <span>Call 800-MBRAuto</span>
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
}