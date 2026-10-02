import { useState } from 'react';

const pages = [
  { title: 'Your details', description: 'Let us know how to reach you.', fields: [
    ['company', 'Company name', 'text'], ['contact', 'Contact name', 'text'],
    ['email', 'Contact email', 'email', true], ['phone', 'Contact phone', 'tel', true]
  ]},
  { title: 'Choose a project', description: 'Share a little more so we can understand your request.', fields: [
    ['projectType', 'Project type', 'select', true, ['Research and development', 'Technical support', 'Training', 'Something else']],
    ['summary', 'What do you need?', 'textarea', true]
  ]},
  { title: 'Your needs', description: 'Tell us what would be most helpful.', fields: [
    ['service', 'Area of interest', 'select', true, ['Computing', 'Data and AI', 'Software development', 'Other']],
    ['timeline', 'When would you like to start?', 'select', false, ['As soon as possible', 'Within 3 months', 'Just exploring']]
  ]},
  { title: 'Additional details', description: 'Anything else that would help us understand your request?', fields: [
    ['details', 'Additional information', 'textarea']
  ]}
];
const sample = { company: 'Example Studio', contact: 'Alex Morgan', email: 'alex@example.com',
  phone: '+44 7700 900123', projectType: 'Research and development', summary: '',
  service: '', timeline: '', details: '' };

function Ring({number, percent, active}) {
  const circumference = 2 * Math.PI * 19;
  return <span className={'ring' + (active ? ' active' : '')} aria-hidden="true">
    <svg viewBox="0 0 48 48"><circle className="track" cx="24" cy="24" r="19" />
      <circle className="value" cx="24" cy="24" r="19" style={{opacity: percent ? 1 : 0}}
        strokeDasharray={`${circumference * percent / 100} ${circumference}`} /></svg>
    <b>{number}</b>
  </span>;
}

export function App() {
  const [values, setValues] = useState(sample);
  const [index, setIndex] = useState(1);
  const [visited, setVisited] = useState(1);
  const [review, setReview] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState({});
  const filled = value => String(value || '').trim().length > 0;
  const progress = i => Math.round(pages[i].fields.filter(f => filled(values[f[0]])).length / pages[i].fields.length * 100);
  const ready = i => pages[i].fields.every(f => !f[3] || filled(values[f[0]]));
  const overall = Math.round(pages.filter((_, i) => (i < visited || review || sent) && ready(i)).length / pages.length * 100);
  const change = (key, value) => setValues(v => ({ ...v, [key]: value }));
  const next = () => {
    if (!ready(index)) return;
    if (index === 3) return setReview(true);
    setVisited(Math.max(visited, index + 1));
    setIndex(index + 1);
  };
  const reset = () => {
    setValues(Object.fromEntries(Object.keys(sample).map(key => [key, ''])));
    setIndex(0); setVisited(0); setReview(false); setSent(false); setTouched({});
  };
  function field([key, label, type, required, choices]) {
    const props = { id: key, value: values[key], onChange: e => change(key, e.target.value),
      onBlur: () => setTouched(t => ({...t, [key]: true})), 'aria-required': !!required,
      'aria-invalid': !!(required && touched[key] && !filled(values[key])) };
    return <div className="field" key={key}><label htmlFor={key}>{label}{required && <span> *</span>}</label>
      {type === 'select' ? <select {...props}><option value="">Select an option</option>
        {choices.map(c => <option key={c}>{c}</option>)}</select>
        : type === 'textarea' ? <textarea {...props} rows="4" placeholder="Add a short description" />
        : <input {...props} type={type} />}
      {required && touched[key] && !filled(values[key]) && <small className="error">This field is required.</small>}
    </div>;
  }
  return <div className="site">
    <header className="portal-header"><div className="header-inner">
      <strong className="brand">Services</strong><nav aria-label="Portal navigation">
        <a href="#home" onClick={e => e.preventDefault()}>Home</a>
        <a href="#catalog" className="selected" onClick={e => e.preventDefault()}>Catalog</a>
        <a href="#help" onClick={e => e.preventDefault()}>Help</a></nav>
      <input className="search" aria-label="Search catalog" placeholder="Search catalog" />
    </div></header>
    <div className="page">
      <div className="breadcrumb">Home <span>/</span> Catalog <span>/</span> Guided request</div>
      <div className="hero"><div><small>GUIDED REQUEST</small><h1>Tell us what you need</h1>
        <p>Complete a few short steps to share your request.</p></div>
        <button type="button" onClick={reset}>Start over</button></div>
      <div className="layout"><aside className="navigator" aria-label="Form progress">
        <div className="overall"><small>YOUR PROGRESS</small>
          <div className="overall-title"><strong>{sent ? 'Request sent' : review ? 'Ready to send' : `${index + 1}. ${pages[index].title}`}</strong>
            <strong className="percent">{overall}%</strong></div>
          <p>{review || sent ? 'Review complete' : `Page ${index + 1} of 4`}</p>
          <div className="bar" role="progressbar" aria-valuenow={overall} aria-valuemin="0" aria-valuemax="100" aria-label="Overall progress">
            <span style={{width: overall + '%'}} /></div></div>
        {!sent && <div className="steps">{pages.map((p, i) => <button type="button" key={p.title}
          className={'step' + (i === index && !review ? ' active' : '')}
          disabled={review || i > visited} onClick={() => {
            if (i <= index || pages.slice(index, i).every((_, offset) => ready(index + offset))) setIndex(i);
          }}
          aria-current={i === index && !review ? 'step' : undefined}>
          <Ring number={i + 1} percent={progress(i)} active={i === index && !review} />
          <span><small>PAGE {i + 1} · {progress(i)}% ANSWERED</small><b>{p.title}</b></span>
        </button>)}</div>}
        {!sent && <div className="actions">{review ? <>
          <button className="secondary" type="button" onClick={() => setReview(false)}>Edit answers</button>
          <button className="primary" type="button" onClick={() => setSent(true)}>Send request</button></>
          : <>{index > 0 && <button className="secondary" type="button" onClick={() => setIndex(index - 1)}>Previous</button>}
          {ready(index) && <button className="primary" type="button" onClick={next}>{index === 3 ? 'Review' : 'Continue'}</button>}
          {!ready(index) && <p>Complete the required fields to continue.</p>}</>}</div>}
      </aside><main className="form-card">
        {sent ? <div className="success" role="status"><div>✓</div><h2>Request sent</h2>
          <p>This is a frontend preview. No request was submitted to ServiceNow.</p>
          <button className="primary" type="button" onClick={reset}>Start another</button></div>
        : review ? <div className="review"><div className="form-header"><small>FINAL STEP</small><h2>Review your answers</h2>
          <p>Check your details before sending.</p></div>
          {pages.map((p, i) => <section key={p.title}><div className="review-title"><h3>{p.title}</h3>
            <button type="button" onClick={() => {setIndex(i);setReview(false)}}>Edit</button></div>
            <dl>{p.fields.map(f => <div key={f[0]}><dt>{f[1]}</dt><dd>{values[f[0]] || '—'}</dd></div>)}</dl>
          </section>)}</div>
        : <div className="form-view" key={index}><div className="form-header"><small>STEP {index + 1} OF 4</small>
          <h2>{pages[index].title}</h2><p>{pages[index].description}</p></div>
          <div className="fields">{pages[index].fields.map(field)}</div><p className="footnote"><span>*</span> Required field</p>
        </div>}
      </main></div>
      <p className="demo-note">Interactive demonstration · No data leaves this page</p>
    </div>
  </div>;
}
