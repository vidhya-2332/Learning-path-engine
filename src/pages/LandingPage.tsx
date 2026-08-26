import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Compass, BarChart3, Network, Route, Sparkles, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-sm">Adaptive Learning Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="btn-ghost">Sign In</Link>
            <Link to="/auth" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,121,255,0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(20,184,166,0.05),_transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-6 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Assisted Skill Intelligence
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance leading-[1.1] animate-slide-up">
              Adaptive Learning Path
              <span className="block text-primary-400">Recommendation Engine</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-400 max-w-2xl leading-relaxed text-balance animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Discover your skill gaps. Understand what to learn next. Build a
              personalized path toward your target career role.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth" className="btn-primary text-base px-6 py-3">
                Build My Learning Path
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#roles" className="btn-secondary text-base px-6 py-3">
                Explore Career Roles
              </a>
            </div>
          </div>

          {/* Flow visualization */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: BarChart3, label: 'Your Skills', desc: 'Assess what you know', color: 'text-primary-400' },
              { icon: Network, label: 'Skill Gap Analysis', desc: 'Find what is missing', color: 'text-secondary-400' },
              { icon: Brain, label: 'Recommendation Engine', desc: 'Score and rank skills', color: 'text-accent-400' },
              { icon: Route, label: 'Personalized Path', desc: 'Ordered learning sequence', color: 'text-success-400' },
            ].map((step, i) => (
              <div key={i} className="card p-5 group hover:border-neutral-700 transition-colors">
                <step.icon className={`h-7 w-7 ${step.color} mb-3`} />
                <div className="text-sm font-medium text-neutral-200">{step.label}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-center text-neutral-500 mb-12 max-w-xl mx-auto">
            A data-driven approach that transforms your skill signals into an
            intelligent, adaptive learning plan.
          </p>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { n: '01', title: 'Assess Skills', desc: 'Self-assess and take objective quizzes to build your skill profile.' },
              { n: '02', title: 'Select Role', desc: 'Choose your target career role to define required skill levels.' },
              { n: '03', title: 'Analyze Gaps', desc: 'The engine calculates gaps between your current and required levels.' },
              { n: '04', title: 'Get Recommendations', desc: 'Transparent scoring ranks what to learn next and why.' },
              { n: '05', title: 'Follow Your Path', desc: 'An ordered, prerequisite-aware path that adapts as you progress.' },
            ].map((step, i) => (
              <div key={i} className="card p-5 hover:border-neutral-700 transition-colors">
                <div className="font-mono text-xs text-primary-400 mb-2">{step.n}</div>
                <div className="text-sm font-medium text-neutral-200 mb-1">{step.title}</div>
                <div className="text-xs text-neutral-500 leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-3">Supported Career Roles</h2>
          <p className="text-center text-neutral-500 mb-12 max-w-xl mx-auto">
            Each role maps to a curated set of required skills with importance
            levels. New roles can be added without rewriting the engine.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'Frontend Developer', 'Backend Developer', 'Full-Stack Developer',
              'Python Developer', 'Data Analyst', 'Data Scientist',
              'DevOps Engineer',
            ].map((role, i) => (
              <div key={i} className="card p-4 flex items-center gap-3 hover:border-primary-500/30 transition-colors">
                <Compass className="h-5 w-5 text-primary-400 shrink-0" />
                <span className="text-sm font-medium text-neutral-300">{role}</span>
              </div>
            ))}
            <div className="card p-4 flex items-center gap-3 border-dashed border-neutral-700">
              <Sparkles className="h-5 w-5 text-neutral-600 shrink-0" />
              <span className="text-sm text-neutral-600">More roles extensible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Not Another Course List</h2>
          <div className="space-y-4">
            {[
              { title: 'Traditional System', desc: 'Student → Course List', isTraditional: true },
              { title: 'This System', desc: 'Student Data → Skill Intelligence → Career Requirements → Skill Gap → Graph-Based Prerequisites → Recommendation Algorithm → Adaptive Learning Path', isTraditional: false },
            ].map((item, i) => (
              <div
                key={i}
                className={`card p-6 ${item.isTraditional ? 'opacity-50' : 'border-primary-500/20 bg-primary-500/5'}`}
              >
                <div className="flex items-start gap-3">
                  {item.isTraditional ? (
                    <span className="text-neutral-600 text-lg">✕</span>
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-neutral-200 mb-1">{item.title}</div>
                    <div className="text-xs text-neutral-500 font-mono leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-neutral-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your skill gaps?</h2>
          <p className="text-neutral-500 mb-8">
            Build your profile, assess your skills, and get a personalized
            learning path in minutes.
          </p>
          <Link to="/auth" className="btn-primary text-base px-6 py-3">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-900 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-neutral-600">
          Adaptive Learning Path Recommendation Engine — Career Intelligence Platform
        </div>
      </footer>
    </div>
  );
}
