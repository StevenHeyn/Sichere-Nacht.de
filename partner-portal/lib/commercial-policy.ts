import 'server-only';
// Confidential commercial information: send only after verified active membership.
export function commercialPolicy(role:string){
 return {
  ownRateBps: role==='agency'?2000:1500,
  reserveSummary:'5 % der Provision · maximal 2.500 €',
  financeSummary:'Kalendermonat in deutscher Ortszeit, Abrechnung zum Ende des Folgemonats. Provisionsbasis: freigegebener Nettowarenumsatz ohne Versand und Montage. Direkter VP 15 %, Agentur 20 % einschließlich des VP-Anteils. Spätere Erstattungen bleiben Korrekturbuchungen.',
  reserveDetails:'Geplante Stornoreserve: 5 % der Provision bis maximal 2.500 €. Prüfung der Auszahlung 12 Kalendermonate nach dem letzten provisionsrelevanten Auftrag. Die tatsächliche Einbehalts-/Vertragsregelung muss vor Aktivierung rechtswirksam freigegeben werden.',
  agencySummary:['agency','admin'].includes(role)?'Die Agentur erhält 20 % Nettoumsatzprovision einschließlich des vorgesehenen 15-Prozentpunkte-Anteils ihrer VP. Es gibt keine zusätzliche doppelte Auszahlung von 20 % plus 15 %. Die weitere Abrechnung mit deinen VP erfolgt über die Agentur.':null
 };
}
