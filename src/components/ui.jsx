import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const PATHS = {
  thermo: <><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z" /><path d="M12 10v6" /></>,
  cabinet: <><rect x="4" y="3.5" width="16" height="17" rx="3" /><path d="M4 12h16" /><path d="M10 7.5h4" /><path d="M10 16h4" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  family: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2c2.8.4 5 2.8 5 5.8" /></>,
  cross: <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />,
  back: <path d="M15 5l-7 7 7 7" />,
  chev: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  scan: <><path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M20 16v2a2 2 0 0 1-2 2h-2" /><path d="M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></>,
  pin: <><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  drop: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />,
  pill: <><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="M9.2 8l5.6 8" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  leaf: <><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19l7-7" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l1 13h9l1-13" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /></>,
  box: <><path d="M4 8l8-4 8 4v8l-8 4-8-4z" /><path d="M4 8l8 4 8-4" /><path d="M12 12v8" /></>,
  sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l4-4-4-4" /><path d="M14 12H4" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-5-5-8 8.5" /></>,
};
export function Icon({ name, size = 20, stroke = 1.8, className, style }) {
  return (
    <svg aria-hidden="true" className={className} style={{ flexShrink: 0, ...style }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}

/* ---------- app context ---------- */
const AppCtx = createContext(null);
export const AppProvider = AppCtx.Provider;
export const useApp = () => useContext(AppCtx);

const AVATAR_TONES = { alex: ['#DCEEFC', '#0B5A99'], leo: ['#FFF1D6', '#8A5300'], mom: ['#FDE4E7', '#A8202F'] };

export function Avatar({ profile, size = 36 }) {
  const [bg, fg] = AVATAR_TONES[profile.id] || ['#E8EEF4', '#46566A'];
  return (
    <span className="avatar" style={{ width: size, height: size, borderRadius: size / 2, background: bg, color: fg, fontSize: size * 0.46 }} aria-hidden="true">
      {profile.name[0]}
    </span>
  );
}

function ProfileMenu({ onClose }) {
  const { state, dispatch } = useApp();
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const people = ['alex', 'leo', 'mom'].map((id) => state.profiles[id]);
  const pick = (id) => { dispatch({ type: 'who', id }); onClose(); };
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Switch profile" ref={ref} onClick={(e) => e.stopPropagation()}>
        <p className="sheet-title">Whose profile?</p>
        {people.map((p) => (
          <button key={p.id} type="button" className={`sheet-row ${state.who === p.id ? 'on' : ''}`} aria-pressed={state.who === p.id} onClick={() => pick(p.id)}>
            <Avatar profile={p} size={40} />
            <span className="grow"><b>{p.id === 'alex' ? 'Alex (me)' : p.name}</b><span>{p.age} years · {p.weightKg} kg</span></span>
            {state.who === p.id && <Icon name="check" size={20} stroke={2.4} />}
          </button>
        ))}
        <div className="divider" />
        <a className="sheet-row" href="#/health" onClick={onClose}><span className="sheet-ico"><Icon name="heart" /></span><span className="grow"><b>Health info</b><span>Allergies, conditions, medicines</span></span><Icon name="chev" size={18} /></a>
        <a className="sheet-row" href="#/plans" onClick={onClose}><span className="sheet-ico"><Icon name="sparkle" /></span><span className="grow"><b>Plans</b><span>Free, Premium, Family, Premium+</span></span><Icon name="chev" size={18} /></a>
      </div>
    </div>
  );
}

export function TopBar({ title, back }) {
  const { state, back: goBack } = useApp();
  const [open, setOpen] = useState(false);
  const p = state.profiles[state.who];
  return (
    <header className="topbar">
      {back ? (
        <button type="button" className="icon-btn" aria-label="Back" onClick={goBack}><Icon name="back" size={22} stroke={2.2} /></button>
      ) : (
        <img src={`${import.meta.env.BASE_URL}pharmie-logo.svg`} alt="" width="34" height="34" className="topbar-logo" />
      )}
      <h1 className="topbar-title">{title}</h1>
      <button type="button" className="who" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Profile: ${p.name}. Switch profile`}>
        <Avatar profile={p} size={30} />
        <span>{p.id === 'alex' ? 'Me' : p.name}</span>
        <Icon name="chev" size={16} stroke={2.2} style={{ transform: 'rotate(90deg)' }} />
      </button>
      {open && <ProfileMenu onClose={() => setOpen(false)} />}
    </header>
  );
}

/** A screen: top bar, content, and an optional action bar pinned above the tabs. */
export function Screen({ title, back, cta, children, className = '' }) {
  return (
    <>
      <TopBar title={title} back={back} />
      <main className={`page ${className}`}>{children}</main>
      {cta && <div className="cta-bar">{cta}</div>}
    </>
  );
}

/** “OTC only” footnote shown wherever Pharmie suggests medicines. */
export function Footnote() {
  return (
    <p className="footnote">
      <Icon name="alert" size={14} />
      <span>Pharmie suggests over-the-counter (OTC) medicines only. This isn’t prescription or medical advice. Ask a pharmacist or doctor if you’re unsure.</span>
    </p>
  );
}

/** The two halves of the first tab: the symptom check and Explore OTC. */
export function HubTabs({ value }) {
  return (
    <nav className="subtabs" aria-label="Check or explore">
      <a href="#/check" className={value === 'check' ? 'on' : ''} aria-current={value === 'check' ? 'page' : undefined}>Check symptoms</a>
      <a href="#/explore" className={value === 'explore' ? 'on' : ''} aria-current={value === 'explore' ? 'page' : undefined}>Explore OTC</a>
    </nav>
  );
}

/** One step of a step-by-step flow. */
export function Step({ title, back, index, total, heading, sub, children, next, prev, above }) {
  return (
    <Screen
      title={title}
      back={back}
      cta={
        <>
          {prev && <Btn kind="ghost" grow={false} href={prev} aria-label="Previous step"><Icon name="back" size={20} stroke={2.2} /></Btn>}
          {next}
        </>
      }
    >
      {above}
      <div className="progress" role="progressbar" aria-label={`Step ${index} of ${total}`} aria-valuemin={1} aria-valuemax={total} aria-valuenow={index}>
        {Array.from({ length: total }, (_, i) => <span key={i} className={i < index ? 'on' : ''} />)}
      </div>
      <p className="step-count">Step {index} of {total}</p>
      {heading && <h2 className="step-heading">{heading}</h2>}
      {sub && <p className="muted">{sub}</p>}
      <div className="step-body">{children}</div>
    </Screen>
  );
}

export function SubTabs({ tabs, value, base }) {
  return (
    <nav className="subtabs" aria-label="Sections">
      {tabs.map(([id, label]) => (
        <a key={id} href={`#/${base}${id ? '/' + id : ''}`} className={value === id ? 'on' : ''} aria-current={value === id ? 'page' : undefined}>{label}</a>
      ))}
    </nav>
  );
}

/** Big tappable single-choice rows. */
export function Choice({ options, value, onPick, label }) {
  return (
    <div className="choices" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button key={String(o.id)} type="button" role="radio" aria-checked={on} className={`choice ${on ? 'on' : ''}`} onClick={() => onPick(o.id)}>
            <span className="radio">{on && <span />}</span>
            <span className="grow"><b>{o.label}</b>{o.hint && <span>{o.hint}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Mascot({ size = 58 }) {
  return <img src={`${import.meta.env.BASE_URL}pharmie-logo.svg`} alt="" width={size} height={size} style={{ borderRadius: '22%' }} />;
}

export function Card({ children, tone, className = '', ...rest }) {
  return <section className={`card ${tone ? 'card-' + tone : ''} ${className}`} {...rest}>{children}</section>;
}

export function Tag({ kind = 'ok', icon, children }) {
  return (
    <span className={`tag tag-${kind}`}>
      {icon && <Icon name={icon} size={13} stroke={2.6} />}
      {children}
    </span>
  );
}

export function Btn({ kind = 'primary', icon, href, onClick, children, grow = true, disabled, type = 'button', ...rest }) {
  const cls = `btn btn-${kind}${grow ? ' grow' : ''}`;
  const inner = <>{icon && <Icon name={icon} size={19} stroke={2} />}{children != null && <span>{children}</span>}</>;
  if (href && !disabled) return <a className={cls} href={href} onClick={onClick} {...rest}>{inner}</a>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>{inner}</button>;
}

export function Line({ icon, children, tone }) {
  return (
    <div className={`line ${tone ? 'tone-' + tone : ''}`}>
      <Icon name={icon} size={17} />
      <span>{children}</span>
    </div>
  );
}

export function Bar({ pct, tone = 'blue' }) {
  return (
    <div className="bar" role="presentation">
      <div className={`bar-fill fill-${tone}`} style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => {
        const id = o.id ?? o;
        const text = o.label ?? o;
        return (
          <button key={id} type="button" aria-pressed={value === id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

export function CheckRow({ checked, onChange, children }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className={`checkrow ${checked ? 'on' : ''}`} onClick={onChange}>
      <span className={`box ${checked ? 'on' : ''}`}>{checked && <Icon name="check" size={16} stroke={2.6} />}</span>
      <span>{children}</span>
    </button>
  );
}

const NAV = [
  ['check', 'Check', 'thermo'],
  ['cabinet', 'Cabinet', 'cabinet'],
  ['me', 'Profile', 'user'],
  ['family', 'Family', 'family'],
  ['help', 'Help', 'cross'],
];
const TAB_OF = { check: 'check', explore: 'check', result: 'check', product: 'cabinet', cabinet: 'cabinet', checkmed: 'cabinet', add: 'cabinet', me: 'me', log: 'me', health: 'me', plans: 'me', family: 'family', help: 'help' };

export function Nav({ route }) {
  const active = TAB_OF[route] || 'check';
  return (
    <nav className="nav" aria-label="Main">
      {NAV.map(([id, label, icon]) => (
        <a key={id} href={'#/' + id} className={active === id ? 'on' : ''} aria-current={active === id ? 'page' : undefined}>
          <span className="nav-pill"><Icon name={icon} size={21} /></span>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-wrap" aria-live="polite">{msg && <div className="toast">{msg}</div>}</div>
    </ToastCtx.Provider>
  );
}

export async function shareText(title, text, toast) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast('Copied. Paste it anywhere to share.');
  } catch {
    toast('Couldn’t share from this browser.');
  }
}
