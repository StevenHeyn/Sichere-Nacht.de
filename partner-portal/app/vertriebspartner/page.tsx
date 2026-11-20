import type {Metadata} from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata:Metadata={
 title:'Vertriebspartner werden | Sichere Nacht',
 description:'Starte als Vertriebspartner für Ajax-Sicherheitssysteme bei Sichere Nacht. Erfahre mehr über die Zusammenarbeit, Schulung, digitale Tools und den Bewerbungsablauf.',
 alternates:{canonical:'https://vp.sichere-nacht.de/vertriebspartner'},
 robots:{index:true,follow:true}
};
const register='/login?register=1';
const benefits=[
 {n:'01',title:'Ein Produkt, das du erklären kannst',description:'Ajax-Sicherheitssysteme für Wohnungen, Häuser und Gewerbe. Statt eines unübersichtlichen Angebots steht die passende Ausstattung für das Objekt im Vordergrund.'},
 {n:'02',title:'Dein digitaler Arbeitsbereich',description:'Gebiete und Kontakte verwalten, Schulungsinhalte nutzen und die eigene Entwicklung im Partnerportal nachvollziehen.'},
 {n:'03',title:'Ein transparenter Vertriebsprozess',description:'Persönlicher Empfehlungslink nach der erforderlichen Freigabe und Qualifizierung. Provisionen und Abrechnungen sind im Portal nachvollziehbar.'}
];
const steps=[
 {n:'01',title:'Konto erstellen',description:'Registriere dich mit deiner E-Mail-Adresse und bestätige sie über den zugesandten Link.'},
 {n:'02',title:'Antrag vervollständigen',description:'Ergänze dein Profil, lade die notwendigen Nachweise hoch und prüfe die Vertragsbedingungen.'},
 {n:'03',title:'Freigabe erhalten',description:'Wir prüfen deinen Antrag individuell. Die Registrierung allein berechtigt noch nicht zum Vertrieb.'},
 {n:'04',title:'Akademie absolvieren',description:'Lerne die Grundlagen der Ajax-Systeme kennen. Erst nach bestandenem Vertriebstest wird der Verkauf freigeschaltet.'}
];
const faqs=[
 {q:'Muss ich bereits Erfahrung im Vertrieb haben?',a:'Vertriebserfahrung kann hilfreich sein, ist aber keine pauschal festgelegte Voraussetzung. Wichtig sind eine verlässliche Arbeitsweise, Interesse an Sicherheitstechnik und die Bereitschaft, die Produktschulung zu absolvieren.'},
 {q:'Kann ich sofort nach der Registrierung verkaufen?',a:'Nein. Nach deiner E-Mail-Bestätigung reichst du den vollständigen Antrag und die erforderlichen Nachweise ein. Erst nach manueller Freigabe und bestandenem Vertriebstest wird der Verkauf im Partnerportal freigeschaltet.'},
 {q:'Wie funktioniert die Vergütung?',a:'Die konkreten Provisions- und Abrechnungsbedingungen erhältst du im Rahmen der vertraglichen Zusammenarbeit. Deine freigegebenen Umsätze und die zugehörigen Abrechnungen kannst du anschließend im Partnerportal nachvollziehen. Eine bestimmte Verdiensthöhe wird nicht zugesagt.'},
 {q:'Gibt es auch eine Möglichkeit für Montagepartner?',a:'Im Partnerportal gibt es eine gesonderte Monteurqualifizierung. Die Masterclass und ihre Prüfung sind zusätzliche Voraussetzungen; ein Vertriebspartnerkonto allein berechtigt nicht zur Übernahme von Montageaufträgen.'},
 {q:'Welche Unterlagen benötige ich?',a:'Für die Antragstellung sind derzeit ein Portraitfoto, ein Gewerbenachweis und die Annahme der jeweils veröffentlichten Vertragsfassung vorgesehen. Weitere Profildaten werden im Bewerbungsprozess abgefragt.'}
];
function Arrow(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function Shield(){return <svg viewBox="0 0 120 136" role="img" aria-label="Symbol für moderne Sicherheitssysteme"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b9ffe6"/><stop offset="1" stopColor="#4fd4b2"/></linearGradient></defs><path d="M60 8 108 27v37c0 31-19 51-48 64C31 115 12 95 12 64V27L60 8Z" fill="url(#s)" opacity=".16" stroke="#9aefd2" strokeWidth="2"/><path d="m40 67 14 13 28-31" fill="none" stroke="#a8ffdc" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
export default function RecruitmentLanding(){return <main className={styles.page}>
 <div className={styles.announcement}><span className={styles.pulse}></span> DEIN EINSTIEG IN DEN SICHERHEITSVERTRIEB <span className={styles.announcementDivider}>/</span> HAMBURG &amp; DEUTSCHLAND</div>
 <section className={styles.hero} aria-labelledby="vp-title"><div className={styles.container}><div className={styles.heroGrid}>
  <div className={styles.heroCopy}>
   <div className={styles.kicker}><span className={styles.kickerLine}></span> SICHERE NACHT · VERTRIEBSPARTNER</div>
   <h1 id="vp-title">Sicherheit verkaufen.<br/><span>Perspektiven schaffen.</span></h1>
   <p className={styles.heroLead}>Werde Vertriebspartner für moderne Ajax-Sicherheitssysteme. Mit einem strukturierten Einstieg, einer digitalen Akademie und einem Partnerportal, das dir die tägliche Arbeit erleichtert.</p>
   <div className={styles.heroActions}><Link href={register} className={styles.primary}>Jetzt als Partner registrieren <Arrow/></Link><a href="#ablauf" className={styles.secondary}>So funktioniert der Einstieg</a></div>
   <p className={styles.disclaimer}>Die Registrierung ist unverbindlich. Die Zusammenarbeit beginnt erst nach Prüfung, Vertragsannahme und Freigabe. Keine Verdienstgarantie.</p>
   <div className={styles.heroProof}><span><b>01</b> Persönlicher Antrag</span><span><b>02</b> Digitale Schulung</span><span><b>03</b> Strukturierter Vertrieb</span></div>
  </div>
  <div className={styles.visual} aria-label="Illustration des digitalen Vertriebspartner-Portals">
   <div className={styles.glow}></div>
   <div className={styles.visualBackdrop}></div>
   <div className={styles.device}>
    <div className={styles.deviceBar}><span className={styles.dots}><i></i><i></i><i></i></span><span>PARTNER WORKSPACE</span><span className={styles.liveDot}></span></div>
    <div className={styles.deviceHead}><div><small>DEINE PARTNERWELT</small><strong>Alles im Blick.</strong><p>Ein zentraler Ort für deinen Vertrieb.</p></div><div className={styles.shield}><Shield/></div></div>
    <div className={styles.deviceGrid}><div><span className={styles.glyph}>⌖</span><strong>Gebiete</strong><small>Strukturiert arbeiten</small></div><div><span className={styles.glyph}>▤</span><strong>Akademie</strong><small>Wissen aufbauen</small></div><div><span className={styles.glyph}>↗</span><strong>Abrechnung</strong><small>Transparent verfolgen</small></div></div>
    <div className={styles.progressPanel}><div><small>DEIN EINSTIEG</small><strong>Schritt für Schritt</strong></div><div className={styles.progressBars}><span></span><span></span><span></span><span></span></div></div>
   </div>
   <div className={styles.floatingTag}><span className={styles.floatingIcon}>✓</span><span><b>Mit System starten</b><small>Von der Anmeldung bis zur Qualifizierung</small></span></div>
  </div>
 </div></div></section>
 <section className={styles.statsStrip}><div className={styles.container}><div><b>Modernes Portfolio</b><span>Ajax-Systeme für unterschiedliche Objekte</span></div><div><b>Digitale Unterstützung</b><span>Portal, Akademie und Gebietsverwaltung</span></div><div><b>Klare Freigabeprozesse</b><span>Prüfung und Qualifizierung vor Vertriebsstart</span></div></div></section>
 <section className={styles.section} id="vorteile"><div className={styles.container}><div className={styles.sectionHeading}><span className={styles.kicker}>DEINE MÖGLICHKEITEN</span><h2>Mehr als Produkte.<br/><em>Ein System für deinen Vertrieb.</em></h2><p>Wir verbinden Sicherheitstechnik mit einem klaren Partnerprozess. Du konzentrierst dich auf Beratung und passende Kundenlösungen.</p></div><div className={styles.benefitGrid}>{benefits.map(b=><article key={b.n} className={styles.benefit}><span>{b.n} / VORTEIL</span><h3>{b.title}</h3><p>{b.description}</p><div className={styles.benefitLine}></div></article>)}</div></div></section>
 <section className={styles.darkBand}><div className={styles.container}><div className={styles.split}><div><span className={styles.kicker}>DER MARKT</span><h2>Technik, die<br/><em>Menschen schützt.</em></h2><p>Ob Wohnung, Einfamilienhaus oder Gewerbe: Menschen wollen verstehen, wie sie ihre Räume und Zugänge sinnvoll sichern können. Genau hier setzt ein guter Vertriebspartner an.</p><Link href={register} className={styles.inlineLink}>Teil des Partnernetzwerks werden <Arrow/></Link></div><div className={styles.marketPanel}><span className={styles.marketTop}>WO DU ANSETZEN KANNST</span><div><span>01</span><strong>Privathaushalte</strong><small>Wohnung &amp; Eigenheim</small></div><div><span>02</span><strong>Gewerbekunden</strong><small>Büro, Laden &amp; Lager</small></div><div><span>03</span><strong>Empfehlungen</strong><small>Persönliche Kontakte &amp; passende Lösungen</small></div><p>Produkte und Eignung werden objektbezogen geprüft. Keine pauschalen Sicherheitsversprechen.</p></div></div></div></section>
 <section id="ablauf" className={styles.section}><div className={styles.container}><div className={styles.sectionHeading}><span className={styles.kicker}>DEIN WEG ZU UNS</span><h2>Vier Schritte.<br/><em>Ein klarer Einstieg.</em></h2></div><div className={styles.steps}>{steps.map(step=><article key={step.n} className={styles.step}><span>{step.n}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div><div className={styles.center}><Link href={register} className={styles.primary}>Partnerkonto erstellen <Arrow/></Link><p>Der Vertriebstest und die Freigabe sind Voraussetzung für den Verkaufsstart.</p></div></div></section>
 <section className={styles.faqSection} id="fragen"><div className={styles.container}><div className={styles.faqGrid}><div><span className={styles.kicker}>GUT ZU WISSEN</span><h2>Die wichtigsten Fragen.</h2><p>Klare Antworten statt Kleingedrucktes im Nachhinein.</p><a className={styles.inlineLink} href="mailto:bestellungen@sichere-nacht.de?subject=Frage%20zur%20Vertriebspartnerschaft">Weitere Frage stellen <Arrow/></a></div><div>{faqs.map((f,i)=><details className={styles.faqItem} key={i}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>)}</div></div></div></section>
 <section className={styles.bottomCta}><div className={styles.container}><div className={styles.ctaBox}><div><span className={styles.kicker}>BEREIT FÜR DEN NÄCHSTEN SCHRITT?</span><h2>Dein Einstieg beginnt hier.</h2><p>Registriere dich und erfahre im Partnerportal, wie du deinen Antrag vervollständigst und die nächsten Schritte gehst.</p></div><div className={styles.ctaButtons}><Link href={register} className={styles.primary}>Jetzt registrieren <Arrow/></Link><Link href="/login" className={styles.secondary}>Ich habe bereits ein Konto</Link></div></div></div></section>
 <div className={styles.bottomNote}>Sichere Nacht · H&amp;K Projekt UG (haftungsbeschränkt) · <Link href="/datenschutz">Datenschutz</Link></div>
 </main>}
