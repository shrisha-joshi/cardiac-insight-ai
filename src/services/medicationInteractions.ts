/**
 * Medication Interaction Database & Warning System
 * Comprehensive drug-drug interactions, side-effects, and contraindications
 * For cardiac medications commonly used in India
 * 
 * Phase 4 Task 5: Medication Interaction & Safety System
 */

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  class: string;
  commonDoses: string[];
  commonBrands: string[];
  indications: string[];
  contraindications: string[];
  sideEffects: {
    common: string[];
    uncommon: string[];
    serious: string[];
  };
  warnings: string[];
  monitoringRequired: string[];
}

export interface DrugInteraction {
  drug1Id: string;
  drug2Id: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  mechanism: string;
  management: string;
  alternativeOptions: string[];
}

export interface InteractionResult {
  hasMajorInteractions: boolean;
  hasModerateInteractions: boolean;
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: string;
    description: string;
    management: string;
  }>;
  warnings: string[];
  recommendations: string[];
}

export interface ContraindicationCheck {
  isDcontraindicated: boolean;
  reason: string;
  alternatives: string[];
  consultationNeeded: boolean;
}

export interface PatientMedicationProfile {
  patientId: string;
  medications: Array<{ medicationId: string; dose: string; frequency: string }>;
  allergies: string[];
  renalFunction: 'normal' | 'mild' | 'moderate' | 'severe';
  hepaticFunction: 'normal' | 'mild' | 'moderate' | 'severe';
  pregnancyStatus: boolean;
  breastfeeding: boolean;
}

class MedicationInteractionService {
  private medications: Map<string, Medication> = this.initializeMedications();
  private interactions: Map<string, DrugInteraction> = this.initializeInteractions();

  /**
   * Initialize cardiac medications database
   */
  private initializeMedications(): Map<string, Medication> {
    const meds = new Map<string, Medication>();

    // STATINS
    meds.set('atorvastatin', {
      id: 'atorvastatin',
      name: 'Atorvastatin',
      genericName: 'Atorvastatin',
      class: 'Statin (HMG-CoA Reductase Inhibitor)',
      commonDoses: ['10 mg', '20 mg', '40 mg', '80 mg'],
      commonBrands: ['Lipitor', 'Atorsol', 'Atorin'],
      indications: ['Hypercholesterolemia', 'CHD prevention', 'Secondary prevention'],
      contraindications: ['Liver disease', 'Pregnancy', 'Breastfeeding', 'Active liver disease'],
      sideEffects: {
        common: ['Myalgia', 'Insomnia', 'Fatigue', 'Headache'],
        uncommon: ['Peripheral neuropathy', 'Memory impairment'],
        serious: ['Rhabdomyolysis', 'Severe myopathy', 'Hepatotoxicity']
      },
      warnings: ['Monitor LFTs', 'Avoid with certain drugs', 'Caution with grapefruit'],
      monitoringRequired: ['Liver function', 'CK levels if symptomatic', 'Lipid panel']
    });

    meds.set('rosuvastatin', {
      id: 'rosuvastatin',
      name: 'Rosuvastatin',
      genericName: 'Rosuvastatin',
      class: 'Statin (HMG-CoA Reductase Inhibitor)',
      commonDoses: ['5 mg', '10 mg', '20 mg', '40 mg'],
      commonBrands: ['Crestor', 'Rosumed', 'Rozat'],
      indications: ['Hypercholesterolemia', 'CHD prevention', 'Atherosclerosis'],
      contraindications: ['Active liver disease', 'Pregnancy', 'Elevation of CK >3x ULN'],
      sideEffects: {
        common: ['Myalgia', 'Headache', 'Insomnia'],
        uncommon: ['Neuropathy', 'Tendon rupture'],
        serious: ['Rhabdomyolysis', 'Acute renal failure']
      },
      warnings: ['Increased diabetes risk', 'Asian population: increased levels', 'Monitor renal function'],
      monitoringRequired: ['Liver enzymes', 'CK if symptomatic', 'Glucose levels']
    });

    // BETA-BLOCKERS
    meds.set('metoprolol', {
      id: 'metoprolol',
      name: 'Metoprolol',
      genericName: 'Metoprolol tartrate/succinate',
      class: 'Beta-Blocker (Cardioselective)',
      commonDoses: ['25 mg', '50 mg', '100 mg', '200 mg'],
      commonBrands: ['Lopressor', 'Betaloc', 'Metolar'],
      indications: ['Hypertension', 'Angina', 'Post-MI', 'Heart failure', 'Arrhythmias'],
      contraindications: ['Cardiogenic shock', 'Decompensated heart failure', 'Bradycardia', 'Heart block'],
      sideEffects: {
        common: ['Fatigue', 'Dizziness', 'Bradycardia', 'Cold extremities'],
        uncommon: ['Depression', 'Bronchospasm', 'Sexual dysfunction'],
        serious: ['Acute heart failure', 'Severe bradycardia', 'Bronchospasm in asthma']
      },
      warnings: ['Do not stop abruptly', 'Caution in asthma/COPD', 'May mask hypoglycemia'],
      monitoringRequired: ['Heart rate', 'Blood pressure', 'ECG', 'Glucose in diabetics']
    });

    meds.set('atenolol', {
      id: 'atenolol',
      name: 'Atenolol',
      genericName: 'Atenolol',
      class: 'Beta-Blocker (Cardioselective)',
      commonDoses: ['25 mg', '50 mg', '100 mg'],
      commonBrands: ['Tenormin', 'Atenol', 'Atendol'],
      indications: ['Hypertension', 'Angina', 'Post-MI', 'Arrhythmias'],
      contraindications: ['Acute heart failure', 'Bradycardia <50', 'Severe COPD'],
      sideEffects: {
        common: ['Fatigue', 'Dizziness', 'Cold hands/feet'],
        uncommon: ['Alopecia', 'Rash'],
        serious: ['AV block', 'Severe bradycardia', 'Heart failure exacerbation']
      },
      warnings: ['Taper withdrawal', 'Avoid in asthma', 'Reduce in renal failure'],
      monitoringRequired: ['Heart rate', 'Blood pressure', 'Renal function']
    });

    // ACE INHIBITORS
    meds.set('lisinopril', {
      id: 'lisinopril',
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      class: 'ACE Inhibitor',
      commonDoses: ['2.5 mg', '5 mg', '10 mg', '20 mg', '40 mg'],
      commonBrands: ['Prinivil', 'Zestril', 'Lisuril'],
      indications: ['Hypertension', 'Heart failure', 'Post-MI', 'Renal protection in DM'],
      contraindications: ['Pregnancy', 'Bilateral renal artery stenosis', 'History of angioedema'],
      sideEffects: {
        common: ['Cough', 'Dizziness', 'Fatigue', 'Headache'],
        uncommon: ['Hyperkalemia', 'Hyponatremia'],
        serious: ['Angioedema', 'Acute renal failure', 'Severe hypotension']
      },
      warnings: ['Monitor potassium', 'Check renal function', 'Risk with NSAIDs'],
      monitoringRequired: ['Blood pressure', 'Potassium', 'Creatinine', 'Cough assessment']
    });

    meds.set('ramipril', {
      id: 'ramipril',
      name: 'Ramipril',
      genericName: 'Ramipril',
      class: 'ACE Inhibitor',
      commonDoses: ['1.25 mg', '2.5 mg', '5 mg', '10 mg'],
      commonBrands: ['Altace', 'Ramipace', 'Rampril'],
      indications: ['Hypertension', 'Heart failure', 'Post-MI', 'Diabetic nephropathy'],
      contraindications: ['Pregnancy', 'Angioedema history', 'Renal artery stenosis'],
      sideEffects: {
        common: ['Cough', 'Dizziness', 'Fatigue'],
        uncommon: ['Taste disturbance', 'Rash'],
        serious: ['Angioedema', 'Hyperkalemia', 'Acute renal failure']
      },
      warnings: ['Avoid NSAIDs', 'Monitor potassium', 'Caution in renal disease'],
      monitoringRequired: ['BP', 'Potassium', 'Renal function', 'Cough severity']
    });

    // ASPIRIN
    meds.set('aspirin', {
      id: 'aspirin',
      name: 'Aspirin',
      genericName: 'Acetylsalicylic acid',
      class: 'Antiplatelet / NSAID',
      commonDoses: ['75 mg', '100 mg', '300 mg'],
      commonBrands: ['Ecosprin', 'Aspirin', 'Clopidex'],
      indications: ['CHD prevention', 'Secondary prevention', 'Acute MI', 'Stroke prevention'],
      contraindications: ['Active bleeding', 'GI ulcer', 'Aspirin allergy', 'Severe liver disease'],
      sideEffects: {
        common: ['GI upset', 'Dyspepsia'],
        uncommon: ['Rash', 'Asthma exacerbation'],
        serious: ['GI bleeding', 'Hemorrhagic stroke', 'Allergic reaction']
      },
      warnings: ['Increased bleeding risk', 'GI protection needed', 'Avoid with NSAIDs'],
      monitoringRequired: ['Bleeding signs', 'GI symptoms', 'Platelets if prolonged use']
    });

    // DIURETICS
    meds.set('furosemide', {
      id: 'furosemide',
      name: 'Furosemide',
      genericName: 'Furosemide',
      class: 'Loop Diuretic',
      commonDoses: ['20 mg', '40 mg', '80 mg', '120 mg'],
      commonBrands: ['Lasix', 'Furex', 'Lasix Oral'],
      indications: ['Heart failure', 'Edema', 'Hypertension', 'Pulmonary edema'],
      contraindications: ['Anuria', 'Severe hypokalemia', 'Dehydration'],
      sideEffects: {
        common: ['Hypokalemia', 'Hyponatremia', 'Dehydration', 'Hyperuricemia'],
        uncommon: ['Ototoxicity', 'Hyperglycemia'],
        serious: ['Severe electrolyte imbalance', 'Acute renal failure', 'Hypotension']
      },
      warnings: ['Monitor electrolytes', 'Assess fluid status', 'High doses cause ototoxicity'],
      monitoringRequired: ['Potassium', 'Sodium', 'Creatinine', 'Fluid balance', 'Weight']
    });

    meds.set('hydrochlorothiazide', {
      id: 'hydrochlorothiazide',
      name: 'Hydrochlorothiazide',
      genericName: 'Hydrochlorothiazide',
      class: 'Thiazide Diuretic',
      commonDoses: ['12.5 mg', '25 mg', '50 mg'],
      commonBrands: ['Hydrodiuril', 'Diuran', 'HCZ'],
      indications: ['Hypertension', 'Mild-moderate edema', 'CHF'],
      contraindications: ['Anuria', 'Severe hypokalemia', 'Sulfonamide allergy'],
      sideEffects: {
        common: ['Hypokalemia', 'Hyperglycemia', 'Hyperuricemia', 'Hypotension'],
        uncommon: ['Photosensitivity', 'Pancreatitis'],
        serious: ['Severe electrolyte imbalance', 'Hyponatremic crisis']
      },
      warnings: ['Monitor glucose in diabetics', 'Electrolyte monitoring', 'May elevate uric acid'],
      monitoringRequired: ['Potassium', 'Glucose', 'Uric acid', 'Lipids', 'Calcium']
    });

    // CALCIUM CHANNEL BLOCKERS
    meds.set('amlodipine', {
      id: 'amlodipine',
      name: 'Amlodipine',
      genericName: 'Amlodipine besylate',
      class: 'Calcium Channel Blocker (Dihydropyridine)',
      commonDoses: ['2.5 mg', '5 mg', '10 mg'],
      commonBrands: ['Norvasc', 'Amlod', 'Amtas'],
      indications: ['Hypertension', 'Angina', 'Coronary vasospasm'],
      contraindications: ['Cardiogenic shock', 'Severe aortic stenosis'],
      sideEffects: {
        common: ['Peripheral edema', 'Flushing', 'Headache', 'Fatigue'],
        uncommon: ['Gingival hyperplasia', 'Sexual dysfunction'],
        serious: ['Acute MI', 'Severe hypotension']
      },
      warnings: ['Grapefruit interaction', 'Avoid in acute MI', 'Caution with beta-blockers'],
      monitoringRequired: ['Blood pressure', 'Heart rate', 'Gingival health', 'Ankle edema']
    });

    meds.set('diltiazem', {
      id: 'diltiazem',
      name: 'Diltiazem',
      genericName: 'Diltiazem hydrochloride',
      class: 'Calcium Channel Blocker (Non-dihydropyridine)',
      commonDoses: ['30 mg', '60 mg', '120 mg'],
      commonBrands: ['Cardizem', 'Dilzem', 'Dilkam'],
      indications: ['Hypertension', 'Angina', 'SVT', 'Atrial fibrillation'],
      contraindications: ['Sick sinus syndrome', 'Heart block', 'Acute MI', 'Cardiogenic shock'],
      sideEffects: {
        common: ['Dizziness', 'Fatigue', 'Headache', 'Bradycardia'],
        uncommon: ['AV block', 'Constipation'],
        serious: ['Severe bradycardia', 'Heart block', 'Heart failure']
      },
      warnings: ['Monitor heart rate', 'Avoid with beta-blockers unless needed', 'Grapefruit interaction'],
      monitoringRequired: ['Heart rate', 'ECG', 'Blood pressure', 'Liver function']
    });

    return meds;
  }

  /**
   * Initialize drug interactions database
   */
  private initializeInteractions(): Map<string, DrugInteraction> {
    const interactions = new Map<string, DrugInteraction>();

    // Statin + Statin interactions (not typically combined)
    interactions.set('atorvastatin-rosuvastatin', {
      drug1Id: 'atorvastatin',
      drug2Id: 'rosuvastatin',
      severity: 'contraindicated',
      description: 'Combining two statins significantly increases myopathy and rhabdomyolysis risk',
      mechanism: 'Additive HMG-CoA inhibition leading to excessive cholesterol depletion',
      management: 'Do not combine. Use single statin at appropriate dose or add ezetimibe if needed',
      alternativeOptions: ['Single statin at higher dose', 'Statin + ezetimibe', 'Statin + bempedoic acid']
    });

    // Statin + beta-blocker (generally safe but mild interaction)
    interactions.set('atorvastatin-metoprolol', {
      drug1Id: 'atorvastatin',
      drug2Id: 'metoprolol',
      severity: 'minor',
      description: 'Metoprolol may increase atorvastatin levels slightly',
      mechanism: 'CYP3A4 competition, but clinical significance is minimal',
      management: 'Monitor for statin side effects. No dose adjustment needed',
      alternativeOptions: []
    });

    // ACE-I + Potassium-sparing (major)
    interactions.set('lisinopril-potassium', {
      drug1Id: 'lisinopril',
      drug2Id: 'potassium',
      severity: 'major',
      description: 'Severe hyperkalemia risk',
      mechanism: 'ACE-I reduces aldosterone, reducing potassium excretion',
      management: 'Monitor potassium closely. Check renal function. May need potassium restriction',
      alternativeOptions: ['Use diuretic instead', 'Frequent K+ monitoring', 'NSAIDs avoided']
    });

    // Aspirin + NSAIDs (major)
    interactions.set('aspirin-nsaid', {
      drug1Id: 'aspirin',
      drug2Id: 'nsaid',
      severity: 'major',
      description: 'Significantly increased GI bleeding risk',
      mechanism: 'Both inhibit platelet aggregation and COX1/2, damaging GI mucosa',
      management: 'Avoid combination. If necessary, add PPI. Consider alternative pain relief',
      alternativeOptions: ['Acetaminophen instead', 'Aspirin + PPI if NSAID must be used', 'Paracetamol']
    });

    // Beta-blocker + Calcium Channel Blocker (moderate)
    interactions.set('metoprolol-diltiazem', {
      drug1Id: 'metoprolol',
      drug2Id: 'diltiazem',
      severity: 'moderate',
      description: 'Increased risk of bradycardia and AV block',
      mechanism: 'Additive cardiac conduction effects',
      management: 'Use combination cautiously. Monitor HR and ECG. May reduce doses',
      alternativeOptions: ['Use different CCB (amlodipine)', 'Monotherapy with higher dose', 'ARB instead']
    });

    // Diuretics + NSAIDs (major)
    interactions.set('furosemide-nsaid', {
      drug1Id: 'furosemide',
      drug2Id: 'nsaid',
      severity: 'major',
      description: 'Acute renal failure risk, reduced diuretic effectiveness',
      mechanism: 'NSAIDs reduce renal perfusion and block prostaglandin-mediated fluid excretion',
      management: 'Avoid NSAIDs. Use acetaminophen. Monitor renal function closely',
      alternativeOptions: ['Acetaminophen for pain', 'COX-2 inhibitor (cautiously)', 'Topical NSAIDs only']
    });

    return interactions;
  }

  /**
   * Check interactions for a medication combination
   */
  checkInteractions(medicationIds: string[]): InteractionResult {
    const interactions: InteractionResult['interactions'] = [];
    const warnings: string[] = [];
    let hasMajor = false;
    let hasModerate = false;

    // Check all pairs
    for (let i = 0; i < medicationIds.length; i++) {
      for (let j = i + 1; j < medicationIds.length; j++) {
        const key1 = `${medicationIds[i]}-${medicationIds[j]}`;
        const key2 = `${medicationIds[j]}-${medicationIds[i]}`;

        const interaction = this.interactions.get(key1) || this.interactions.get(key2);

        if (interaction) {
          const drug1 = this.medications.get(interaction.drug1Id);
          const drug2 = this.medications.get(interaction.drug2Id);

          interactions.push({
            drug1: drug1?.name || interaction.drug1Id,
            drug2: drug2?.name || interaction.drug2Id,
            severity: interaction.severity,
            description: interaction.description,
            management: interaction.management
          });

          if (interaction.severity === 'major') hasMajor = true;
          if (interaction.severity === 'major' || interaction.severity === 'contraindicated') {
            warnings.push(`⚠️ ${interaction.description}`);
          }
          if (interaction.severity === 'moderate') hasModerate = true;
        }
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (hasMajor) {
      recommendations.push('CAUTION: Major interactions detected. Consult healthcare provider immediately.');
    }
    if (hasModerate) {
      recommendations.push('Monitor closely for adverse effects and signs of toxicity.');
    }
    if (interactions.length === 0) {
      recommendations.push('No known significant interactions between selected medications.');
    }

    return {
      hasMajorInteractions: hasMajor,
      hasModerateInteractions: hasModerate,
      interactions,
      warnings,
      recommendations
    };
  }

  /**
   * Get medication details
   */
  getMedicationDetails(medicationId: string): Medication | null {
    return this.medications.get(medicationId) || null;
  }

  /**
   * Check contraindications for patient
   */
  checkContraindications(medicationId: string, patientProfile: PatientMedicationProfile): ContraindicationCheck {
    const medication = this.medications.get(medicationId);
    if (!medication) {
      return { isDcontraindicated: false, reason: 'Medication not found', alternatives: [], consultationNeeded: true };
    }

    const issues: string[] = [];
    const alternatives: string[] = [];

    // Check allergies
    if (patientProfile.allergies.some(allergy =>
      medication.name.toLowerCase().includes(allergy.toLowerCase()) ||
      medication.genericName.toLowerCase().includes(allergy.toLowerCase())
    )) {
      return {
        isDcontraindicated: true,
        reason: 'Patient has documented allergy to this medication',
        alternatives: this.getSafeAlternatives(medication.class),
        consultationNeeded: true
      };
    }

    // Check renal function
    if (patientProfile.renalFunction === 'severe' && medicationId === 'atenolol') {
      issues.push('Severe renal impairment may require dose adjustment');
      alternatives.push('Use other beta-blockers metabolized by liver');
    }

    // Check hepatic function
    if (patientProfile.hepaticFunction === 'severe' && medicationId.includes('statin')) {
      issues.push('Severe liver disease contraindicates statin use');
      alternatives.push('Ezetimibe', 'PCSK9 inhibitors');
    }

    // Check pregnancy
    if (patientProfile.pregnancyStatus && medication.contraindications.some(c => c.toLowerCase().includes('pregnancy'))) {
      return {
        isDcontraindicated: true,
        reason: 'Medication is contraindicated in pregnancy',
        alternatives: this.getSafeAlternatives(medication.class, true),
        consultationNeeded: true
      };
    }

    // Check breastfeeding
    if (patientProfile.breastfeeding && ['lisinopril', 'enalapril'].includes(medicationId)) {
      issues.push('Use with caution during breastfeeding');
    }

    return {
      isDcontraindicated: issues.length > 0 && issues.some(i => i.includes('contraindicated')),
      reason: issues.join('; '),
      alternatives,
      consultationNeeded: issues.length > 0
    };
  }

  /**
   * Get safe alternatives for a drug class
   */
  private getSafeAlternatives(drugClass: string, isPregnancy: boolean = false): string[] {
    const alternatives: Record<string, string[]> = {
      'Statin (HMG-CoA Reductase Inhibitor)': ['Ezetimibe', 'Bempedoic acid', 'PCSK9 inhibitors'],
      'Beta-Blocker (Cardioselective)': ['Atenolol', 'Bisoprolol', 'Labetalol (in pregnancy)'],
      'ACE Inhibitor': ['ARB (losartan, valsartan)', 'Calcium channel blocker', 'Labetalol (pregnancy)'],
      'Calcium Channel Blocker (Dihydropyridine)': ['ACE inhibitor', 'Beta-blocker', 'Labetalol'],
      'Loop Diuretic': ['Thiazide diuretic', 'Potassium-sparing diuretic'],
      'Thiazide Diuretic': ['Loop diuretic', 'Potassium-sparing diuretic']
    };

    return alternatives[drugClass] || [];
  }

  /**
   * Generate comprehensive medication report
   */
  generateMedicationReport(profile: PatientMedicationProfile): string {
    let report = '# Medication Safety & Interaction Report\n\n';

    // Current medications
    report += '## Current Medications\n';
    profile.medications.forEach(med => {
      const medDetails = this.medications.get(med.medicationId);
      if (medDetails) {
        report += `- **${medDetails.name}** (${med.dose}, ${med.frequency})\n`;
      }
    });

    // Allergies
    report += '\n## Known Allergies\n';
    if (profile.allergies.length > 0) {
      profile.allergies.forEach(allergy => {
        report += `- ${allergy}\n`;
      });
    } else {
      report += '- No known allergies\n';
    }

    // Interaction check
    const interactions = this.checkInteractions(profile.medications.map(m => m.medicationId));
    report += '\n## Drug-Drug Interactions\n';
    if (interactions.hasMajorInteractions) {
      report += '⚠️ **MAJOR INTERACTIONS DETECTED**\n';
    }
    interactions.interactions.forEach(inter => {
      report += `- **${inter.drug1} + ${inter.drug2}** (${inter.severity})\n`;
      report += `  - ${inter.description}\n`;
      report += `  - Management: ${inter.management}\n`;
    });

    if (interactions.interactions.length === 0) {
      report += 'No significant drug-drug interactions detected.\n';
    }

    // Warnings based on renal/hepatic function
    report += '\n## Organ Function Considerations\n';
    report += `- **Renal Function**: ${profile.renalFunction}\n`;
    report += `- **Hepatic Function**: ${profile.hepaticFunction}\n`;

    return report;
  }

  /**
   * List all medications in database
   */
  getAllMedications(): Medication[] {
    return Array.from(this.medications.values());
  }

  /**
   * Search medications
   */
  searchMedications(query: string): Medication[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.medications.values()).filter(med =>
      med.name.toLowerCase().includes(lowerQuery) ||
      med.genericName.toLowerCase().includes(lowerQuery) ||
      med.commonBrands.some(b => b.toLowerCase().includes(lowerQuery)) ||
      med.class.toLowerCase().includes(lowerQuery)
    );
  }
}

export default new MedicationInteractionService();
