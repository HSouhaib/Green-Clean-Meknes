import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import SectionLabel from '@/components/SectionLabel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Leaf,
} from 'lucide-react';

export default function ContactSection() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formState, setFormState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { data: settings } = trpc.settings.list.useQuery();

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setFormState('success');
      setFormData({ name: '', email: '', message: '' });
    },
    onError: (err) => {
      setFormState('error');
      setErrorMsg(err.message || t('contact.error.generic'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormState('error');
      setErrorMsg(t('contact.error.invalid_email'));
      return;
    }

    if (/[<>]/.test(formData.name) || /[<>]/.test(formData.email) || /[<>]/.test(formData.message)) {
      setFormState('error');
      setErrorMsg(t('contact.error.invalid_chars'));
      return;
    }

    setFormState('sending');
    setErrorMsg('');
    submitMutation.mutate({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      message: formData.message.trim(),
    });
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1.5px solid var(--bg-surface-light)',
    borderRadius: '12px',
    padding: '14px 16px 14px 48px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: 'var(--accent-green)',
    boxShadow: '0 0 0 3px rgba(107, 142, 90, 0.12)',
  };

  const getInputStyle = (field: string): React.CSSProperties => ({
    ...inputBaseStyle,
    ...(focusedField === field ? inputFocusStyle : {}),
  });

  const email = settings?.contact_email ?? 'green.clean.meknes@gmail.com';
  const phone = settings?.contact_phone ?? '+212 6XX-XXXXXX';
  const whatsapp = settings?.social_whatsapp ?? 'https://wa.me/212600000000';
  const instagram = settings?.social_instagram ?? 'https://instagram.com/green.meknes';
  const facebook = settings?.social_facebook ?? 'https://facebook.com/green.meknes';
  const tiktok = settings?.social_tiktok ?? 'https://tiktok.com/@green.meknes';

  return (
    <section id="contact" style={{ padding: 'var(--section-gap) 0' }}>
      <div className="mx-auto flex flex-col md:flex-row gap-12 md:gap-16" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        {/* Left column */}
        <div className="w-full md:w-1/2" data-animate="fade-left">
          <SectionLabel text={t('contact.label')} />
          <h2 className="font-display mt-8 leading-[1.1]" style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.02em' }}>
            {t('contact.heading')}
          </h2>
          <p className="font-light leading-[1.7] mt-8" style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '380px' }}>
            {t('contact.body')}
          </p>
          <div className="mt-16 space-y-4">
            <a href={`mailto:${email}`} className="block text-sm font-normal transition-colors duration-200 no-underline" style={{ color: 'var(--accent-green-light)' }}>
              {email}
            </a>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="block text-sm font-normal transition-colors duration-200 no-underline" style={{ color: 'var(--text-secondary)' }}>
              {phone}
            </a>
            <div className="flex items-center gap-6 pt-4">
              {[
                { href: whatsapp, label: 'WhatsApp', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>) },
                { href: instagram, label: 'Instagram', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>) },
                { href: facebook, label: 'Facebook', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>) },
                { href: tiktok, label: 'TikTok', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.89 2.89 2.89 0 012.88-2.89c.2 0 .39.03.58.07V9.56a6.33 6.33 0 00-.58-.03A6.34 6.34 0 005.77 15.87a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.83a8.16 8.16 0 004.83 1.58V6.92a4.83 4.83 0 01-3.69-1.23z"/></svg>) },
              ].map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="transition-colors duration-200" style={{ color: 'var(--text-tertiary)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')} aria-label={social.label}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - form */}
        <div className="w-full md:w-1/2" data-animate="fade-right">
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--bg-surface-light)',
            }}
          >
            {/* Form header */}
            <div className="text-center mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(107, 142, 90, 0.12)' }}
              >
                <Leaf size={22} style={{ color: 'var(--accent-green)' }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('contact.form_title')}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('contact.form_subtitle')}
              </p>
            </div>

            {formState === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-5 py-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(107, 142, 90, 0.15)' }}
                  >
                    <CheckCircle2 size={32} style={{ color: 'var(--accent-green)' }} />
                  </div>
                </motion.div>
                <div>
                  <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('contact.success')}
                  </p>
                  <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    We will get back to you as soon as possible.
                  </p>
                </div>
                <button
                  onClick={() => setFormState('idle')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border-none hover:opacity-90"
                  style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
                >
                  <ArrowRight size={14} />
                  {t('contact.send_another')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AnimatePresence>
                  {/* Name */}
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="relative"
                  >
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: focusedField === 'name' ? 'var(--accent-green)' : 'var(--text-tertiary)', transition: 'color 0.25s' }}
                    />
                    <input
                      type="text"
                      placeholder={t('contact.name.placeholder')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      maxLength={255}
                      style={getInputStyle('name')}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    key="email-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="relative"
                  >
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: focusedField === 'email' ? 'var(--accent-green)' : 'var(--text-tertiary)', transition: 'color 0.25s' }}
                    />
                    <input
                      type="email"
                      placeholder={t('contact.email.placeholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      maxLength={320}
                      style={getInputStyle('email')}
                    />
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    key="message-field"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                  >
                    <MessageSquare
                      size={16}
                      className="absolute left-4 top-4 pointer-events-none"
                      style={{ color: focusedField === 'message' ? 'var(--accent-green)' : 'var(--text-tertiary)', transition: 'color 0.25s' }}
                    />
                    <textarea
                      placeholder={t('contact.message.placeholder')}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      required
                      rows={4}
                      maxLength={5000}
                      style={{
                        ...getInputStyle('message'),
                        paddingTop: '14px',
                        resize: 'vertical',
                        minHeight: '100px',
                      }}
                    />
                  </motion.div>
                </AnimatePresence>

                {formState === 'error' && (
                  <p className="text-sm" style={{ color: '#c44' }}>{errorMsg}</p>
                )}

                {/* Submit */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  type="submit"
                  disabled={formState === 'sending'}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border-none relative overflow-hidden"
                  style={{
                    background: 'var(--accent-green)',
                    color: 'white',
                    padding: '14px 24px',
                    opacity: formState === 'sending' ? 0.7 : 1,
                  }}
                >
                  {formState === 'sending' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('contact.sending')}
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      {t('contact.submit')}
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
