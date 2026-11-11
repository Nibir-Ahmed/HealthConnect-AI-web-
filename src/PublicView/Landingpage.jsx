import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import db from '../services/db';
import { RiStethoscopeLine } from 'react-icons/ri';
import { MdOutlineChat } from 'react-icons/md';
import { BiShieldQuarter } from 'react-icons/bi';

const Landingpage = () => {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    return db.subscribe('blogs', (list) => {
      setBlogs(list || []);
    });
  }, []);

  const steps = [
    {
      step: '1',
      title: 'Describe your symptoms',
      description:
        'Write how you are feeling in Bangla, Banglish, or English to get severity guidance and find out which specialist to see.',
    },
    {
      step: '2',
      title: 'Book a verified doctor',
      description:
        'Browse doctors by specialty, check their consultation fees and available time slots, and book an appointment.',
    },
    {
      step: '3',
      title: 'Consult and save records',
      description:
        'Chat with your doctor during your appointment and keep your digital prescriptions and lab reports in your Health Vault.',
    },
  ];

  const servicesTicker = [
    'Symptom Checker in বাংলা, Banglish & English',
    'Verified Doctor Directory & Slot Booking',
    'Direct Doctor–Patient Consultation Chat',
    'Digital Prescriptions Saved Automatically',
    'Personal Medical Records & Lab Report Vault',
    'Printable Emergency Medical ID Card',
    'Instant 999 Emergency Helpline Alert',
  ];

  return (
    <div>
      {/* navbar */}
      <Navbar />

      {/* Hero Section: fills full viewport height so cards below don't peek in */}
      <section className="relative overflow-hidden bg-linear-to-b from-emerald-50/40 via-white to-gray-50/50 border-b border-gray-100 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-125 rounded-full opacity-40 blur-[120px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(76,175,130,0.35) 0%, rgba(76,175,130,0.08) 50%, transparent 70%)',
          }}
        />

        {/* Centered Hero Content */}
        <div className="relative flex-1 max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-gray-900 mb-6 text-center">
            Your Health,{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #3DBBA0 0%, #1A8A6E 40%, #156B57 100%)',
              }}
            >
              Simplified
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed text-center">
            Check your symptoms, talk to real doctors online, and keep all your
            medical records in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3 text-base font-semibold text-white rounded-full shadow-md shadow-emerald-700/20 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] no-underline"
              style={{ backgroundColor: '#4CAF82' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3d9a6e')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF82')}
            >
              Get Started Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center px-7 py-3 text-base font-semibold text-gray-700 bg-white rounded-full border border-gray-200 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              I'm a Doctor
            </Link>
          </div>
        </div>

        {/* Bottom News / Services Ticker Line */}
        <div className="relative w-full bg-white/90 backdrop-blur-xs border-t border-gray-200/80 py-3.5 overflow-hidden flex items-center">
          <div className="animate-hc-ticker flex items-center">
            {[...servicesTicker, ...servicesTicker].map((service, idx) => (
              <div key={idx} className="flex items-center shrink-0">
                <span className="text-xs sm:text-sm font-medium text-gray-600 px-6">
                  {service}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-linear-to-b from-gray-50/60 via-white to-gray-50/60 py-20 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-gray-100/90 p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-5">
              <RiStethoscopeLine className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Symptom Checker</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Tell us how you feel in Bangla, Banglish or English, and we'll help you figure out what might be going on and what to do next.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-gray-100/90 p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
              <MdOutlineChat className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Online Doctor Consultations</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Book verified specialists, chat in real time, and share reports directly from your vault.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-gray-100/90 p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-5">
              <BiShieldQuarter className="w-6 h-6 text-[#2A9D8F]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your Medical Records</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Store prescriptions, lab reports and scan results safely and access them anytime you need.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              How HealthConnect Works
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Three simple steps to get symptom guidance and connect with a doctor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center px-4"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-4"
                  style={{ backgroundColor: '#2A9D8F' }}
                >
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Health Articles Section */}
      <section className="bg-gray-50/50 py-20 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Health Articles
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Practical health tips and medical guides published by our team.
            </p>
          </div>

          {blogs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 max-w-md mx-auto px-6">
              <p className="text-sm text-gray-500">
                No articles have been published yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => setSelectedBlog(blog)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {blog.image && (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-44 object-cover"
                    />
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                        {blog.category || 'Health'}
                      </span>
                      <span>{blog.readTime || '3 min read'}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                      {blog.content}
                    </p>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>{blog.author || 'HealthConnect Team'}</span>
                      <span className="font-semibold text-teal-700">Read article →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article Reader Modal */}
      {selectedBlog && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedBlog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedBlog.image && (
              <img
                src={selectedBlog.image}
                alt={selectedBlog.title}
                className="w-full h-56 object-cover rounded-xl mb-5"
              />
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                {selectedBlog.category || 'Health'}
              </span>
              <span>{selectedBlog.readTime || '3 min read'}</span>
              <span>•</span>
              <span>By {selectedBlog.author || 'HealthConnect Team'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              {selectedBlog.title}
            </h2>
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {selectedBlog.content}
            </div>
            <button
              type="button"
              onClick={() => setSelectedBlog(null)}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landingpage;
