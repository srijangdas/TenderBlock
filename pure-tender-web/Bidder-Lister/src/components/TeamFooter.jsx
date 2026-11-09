import { Github, MapPin } from 'lucide-react';
import { TEAM } from '../data/constants';
import Brand from './Brand';

export default function TeamFooter() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-[#f3f4f1] py-12 dark:border-slate-700 dark:bg-slate-950">
      <div className="tb-container">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-300">
              A student software engineering project exploring a more structured tender workflow.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><MapPin size={15} /> BITS Pilani, Pilani Campus</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[.14em] text-[#415b65] dark:text-slate-200">Project team</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#364c59] dark:text-slate-300">
              {TEAM.map(member => <li key={member.name}>{member.name}</li>)}
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">Official contact information can be added once the team confirms it.</p>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#daddd8] pt-5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span>© {new Date().getFullYear()} TenderBlock · Academic project</span>
          <a href="https://github.com/srijangdas/TenderBlock" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline-offset-4 hover:underline"><Github size={14}/> Source repository</a>
        </div>
      </div>
    </footer>
  );
}
