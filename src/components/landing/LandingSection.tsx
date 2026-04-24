"use client";
import { motion } from "framer-motion";
import { LaptopMockup } from "./LaptopMockup";
import { StudentsMockup } from "./StudentsMockup";
import { AttendanceMockup } from "./AttendanceMockup";
import { NotificationMockup } from "./NotificationMockup";
import { ResponsiveMockup } from "./ResponsiveMockup";

const fadeUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

const features = [
  { icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5", color: "from-indigo-500 to-purple-600", title: "Student Management", desc: "Add, edit and organise all your students in one place. Bulk import via CSV, assign classes, and manage parent contacts." },
  { icon: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z", color: "from-blue-500 to-cyan-500", title: "QR Code Attendance", desc: "Each student gets a unique QR code. Scan in under a second to mark attendance — no manual entry, no errors." },
  { icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0", color: "from-emerald-500 to-teal-500", title: "Instant SMS Alerts", desc: "Parents receive an SMS the moment their child is marked present or absent. Real-time peace of mind." },
  { icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941", color: "from-amber-500 to-orange-500", title: "Analytics & Reports", desc: "Visual attendance trends, per-student stats, and exportable PDF billing reports — all at a glance." },
  { icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5", color: "from-violet-500 to-purple-600", title: "Class Scheduling", desc: "Set weekly recurring or one-time class sessions. Auto-generate sessions and track completion rates." },
  { icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z", color: "from-pink-500 to-rose-500", title: "Billing Management", desc: "Automatic monthly billing based on SMS usage and software fees. Track payment status and export PDF invoices." },
];

const steps = [
  { num: "01", title: "Teacher signs in", desc: "Credentials are sent to your email. Change your password on first login." },
  { num: "02", title: "Add your students", desc: "Import via CSV or add one by one. Assign them to classes instantly." },
  { num: "03", title: "Scan QR at class", desc: "Open the scanner, point at the student's QR card — attendance marked in under a second." },
  { num: "04", title: "Parents get notified", desc: "An SMS fires automatically to the parent's phone the moment attendance is recorded." },
];

export default function LandingSection() {
  return (
    <div className="force-light bg-white">
      {/* ── Section 1: Dashboard preview — continues the hero gradient ── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-0" style={{ background: "linear-gradient(160deg,#3730A3 0%,#4F46E5 30%,#6366F1 55%,#EEF2FF 75%,#ffffff 100%)" }}>
        {/* Decorative blobs that echo the login panel */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-6xl mx-auto pt-20">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text side */}
            <motion.div
              className="flex-1 max-w-lg"
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-semibold text-white">Live Dashboard</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                Everything you need,<br />
                <span className="text-indigo-200">in one view</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-indigo-100/80 text-base leading-relaxed mb-6">
                Your dashboard shows today&apos;s attendance count, weekly trends, class overview, and recent activity — the moment you log in.
              </motion.p>
              <motion.div variants={stagger} className="space-y-3">
                {[
                  "Real-time attendance count updated on every scan",
                  "Weekly bar chart showing attendance trends",
                  "Per-class student count and session history",
                ].map((text) => (
                  <motion.div key={text} variants={fadeUp} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-indigo-100/90">{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Laptop side */}
            <motion.div
              className="flex-1 w-full"
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <LaptopMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Features grid ── */}
      <section className="py-20 px-6 overflow-hidden" style={{ background: "#F8FAFC" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
              <span className="text-xs font-semibold text-indigo-600">Features</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              Built for teachers, loved by parents
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 text-base max-w-xl mx-auto">
              Every feature is designed to save you time and keep parents informed — without any technical knowledge required.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            {features.map((f) => (
              <motion.div
                key={f.title} variants={fadeUp}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(79,70,229,0.10)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-md`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Section 3: Students preview ── */}
      <section className="py-16 px-4 sm:py-20 sm:px-6 overflow-hidden" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            <motion.div
              className="flex-1 max-w-lg"
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">Student Management</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
                All your students,<br />
                <span style={{ background: "linear-gradient(135deg,#10B981,#059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  perfectly organised
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-500 text-base leading-relaxed mb-6">
                Import hundreds of students from a CSV in seconds. Track attendance rates, manage parent contacts, and generate ID cards with QR codes.
              </motion.p>
              <motion.div variants={stagger} className="space-y-3">
                {[
                  "Bulk CSV import with parent contact details",
                  "Per-student attendance health bar",
                  "Printable QR ID cards for every student",
                  "Assign students to multiple classes at once",
                ].map((t) => (
                  <motion.div key={t} variants={fadeUp} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600">{t}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              className="flex-1 w-full"
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <StudentsMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Attendance / QR preview ── */}
      <section className="py-16 px-4 sm:py-20 sm:px-6 overflow-hidden" style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E1B4B 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <motion.div
              className="flex-1 max-w-lg"
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-semibold text-indigo-300">QR Attendance</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                Mark attendance<br />
                <span style={{ background: "linear-gradient(135deg,#818CF8,#C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  in under a second
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 text-base leading-relaxed mb-6">
                Open the scanner on any device, point at the student&apos;s QR card, and attendance is recorded instantly — with an SMS sent to parents automatically.
              </motion.p>
              <motion.div variants={stagger} className="grid grid-cols-2 gap-3">
                {[
                  { label: "Scan Speed", value: "< 1s" },
                  { label: "SMS Delivery", value: "Instant" },
                  { label: "Accuracy", value: "100%" },
                  { label: "Works on", value: "Any device" },
                ].map((s) => (
                  <motion.div key={s.label} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              className="flex-1 w-full"
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <AttendanceMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 5: SMS Notification preview ── */}
      <section className="py-16 px-4 sm:py-20 sm:px-6 overflow-hidden" style={{ background: "linear-gradient(135deg,#FFFBEB 0%,#FFF7ED 50%,#FEFCE8 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            <motion.div
              className="flex-1 max-w-lg"
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Parent Notifications</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
                Parents always<br />
                <span style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  in the loop
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-500 text-base leading-relaxed mb-6">
                The moment a student is marked present or absent, their parent receives an SMS. Customise the message template to match your school&apos;s tone.
              </motion.p>
              <motion.div variants={stagger} className="space-y-3">
                {[
                  "Automatic SMS on every attendance mark",
                  "Customisable message templates",
                  "Separate present & absent message formats",
                  "Per-teacher SMS usage tracking & billing",
                ].map((t) => (
                  <motion.div key={t} variants={fadeUp} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2.5} className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600">{t}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              className="flex-1 w-full"
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <NotificationMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Works on every device ── */}
      <section className="py-16 px-4 sm:py-20 sm:px-6 overflow-hidden" style={{ background: "linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 50%,#EDE9FE 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 border border-violet-200 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs font-semibold text-violet-700">Any Device</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
              Works on mobile, tablet<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#4F46E5,#8B5CF6)" }}>
                and desktop
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 text-base max-w-xl mx-auto">
              Nexora is fully responsive. Teachers can manage classes and scan attendance from any device — no app install needed, just open the browser.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <ResponsiveMockup />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-14"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            {[
              { icon: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3M6.75 20.25v.75h10.5v-.75", label: "Mobile", title: "Scan on your phone", desc: "Open the QR scanner from any smartphone browser. No app download required — works instantly.", color: "from-indigo-500 to-purple-600" },
              { icon: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3", label: "Tablet", title: "Manage on a tablet", desc: "The sidebar layout adapts perfectly to tablet screens. Great for managing students and classes in class.", color: "from-blue-500 to-cyan-500" },
              { icon: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3", label: "Desktop", title: "Full power on desktop", desc: "The complete dashboard with charts, weekly schedule, billing, and all management tools on a large screen.", color: "from-violet-500 to-purple-600" },
            ].map((d) => (
              <motion.div key={d.label} variants={fadeUp}
                className="bg-white rounded-2xl p-6 border border-violet-100 shadow-[0_2px_12px_rgba(79,70,229,0.06)] text-center hover:shadow-[0_4px_24px_rgba(79,70,229,0.12)] hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center mx-auto mb-4 shadow-md`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                  </svg>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{d.label}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">{d.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Section 7: How it works ── */}
      <section className="py-20 px-6" style={{ background: "#F1F5F9" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 mb-4">
              <span className="text-xs font-semibold text-indigo-700">How it works</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Up and running in minutes</motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 text-base max-w-md mx-auto">No setup fees, no hardware required. Just log in and start tracking.</motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            {steps.map((s, i) => (
              <motion.div key={s.num} variants={fadeUp} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-indigo-200 to-transparent z-0" style={{ width: "calc(100% - 24px)", left: "calc(50% + 24px)" }} />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
                    <span className="text-white font-black text-sm">{s.num}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Section 8: CTA ── */}
      <section className="py-20 px-6 overflow-hidden" style={{ background: "linear-gradient(135deg,#4F46E5 0%,#3730A3 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        </div>
        <motion.div
          className="relative max-w-2xl mx-auto text-center"
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to modernise your classroom?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/70 text-base mb-8 max-w-md mx-auto">
            Want to join? Call or message us on WhatsApp and we&apos;ll get your account set up the same day.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/94763653696"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              style={{ background: "#25D366", color: "white", boxShadow: "0 4px 20px rgba(37,211,102,0.35)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.428a.75.75 0 0 0 .916.916l5.57-1.476A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.528-5.208-1.443l-.374-.222-3.875 1.027 1.027-3.875-.222-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              <span>Message us on WhatsApp</span>
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white border border-white/30 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Sign In ↑
            </button>
          </motion.div>
          <motion.p variants={fadeUp} className="text-white/50 text-sm mt-4">
            Call or WhatsApp{" "}
            <a href="tel:+94763653696" className="text-white/80 font-semibold hover:text-white transition-colors">0763653696</a>
            {" "}to get your account set up.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-slate-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4F46E5,#3730A3)" }}>
            <span className="text-white font-black text-xs">N</span>
          </div>
          <span className="text-white font-bold text-sm">Nexora</span>
        </div>
        <p className="text-slate-500 text-xs">Smart attendance management for modern classrooms.</p>
        <p className="text-slate-600 text-xs mt-2">© {new Date().getFullYear()} Nexora. All rights reserved.</p>
      </footer>
    </div>
  );
}
