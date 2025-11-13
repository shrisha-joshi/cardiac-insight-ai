/**
 * Imaging & Structural Analysis Service
 * Analyzes cardiac imaging data for structural abnormalities
 * Evaluates ejection fraction, chamber sizes, wall motion, and other findings
 * 
 * Phase 5 Task 6: Imaging & Structural Analysis
 */

export interface EchocardiogramFindings {
  timestamp: Date;
  qualityRating: 'excellent' | 'good' | 'fair' | 'poor';

  // Systolic function
  lvef: number; // Left ventricular ejection fraction (%)
  lvfs: number; // Fractional shortening (%)
  globalLongitudinalStrain?: number; // %; negative values

  // Chamber dimensions (mm)
  lviddiastolic: number; // LV internal dimension diastole
  lvidiastolic?: number; // Alternative notation
  lvidsystolic: number; // LV internal dimension systole
  lvWallThickness?: number; // mm
  interventricularSeptal?: number; // mm

  // Right ventricle
  rvBasal?: number; // mm
  rvDiastolicArea?: number; // cm²
  rvSystolicArea?: number; // cm²
  tapse?: number; // Tricuspid annular plane systolic excursion (mm)
  rvsystolicPressure?: number; // mmHg

  // Left atrium
  laVolume?: number; // mL
  laVolumex?: number; // Indexed
  laSize?: number; // mm

  // Diastolic function
  e_aPrime?: number; // E/e' ratio
  diastolicDysfunction?: 'normal' | 'grade-1' | 'grade-2' | 'grade-3';

  // Valve findings
  mitralRegurgitation?: 'none' | 'mild' | 'moderate' | 'moderate-severe' | 'severe';
  aorticRegurgitation?: 'none' | 'mild' | 'moderate' | 'moderate-severe' | 'severe';
  tricuspidRegurgitation?: 'none' | 'mild' | 'moderate' | 'moderate-severe' | 'severe';
  pulmonicRegurgitation?: 'none' | 'mild' | 'moderate' | 'moderate-severe' | 'severe';

  // Valve stenosis
  aorticStenosis?: { velocity: number; area?: number; gradient?: number }; // m/s
  mitralStenosis?: { area?: number; gradient?: number };

  // Wall motion abnormality
  wallMotionAbnormality?: string; // Description of region
  numberOfAbnormalSegments?: number;

  // Other findings
  pericardialEffusion?: 'none' | 'trivial' | 'small' | 'moderate' | 'large';
  congenitalAbnormality?: string;
  ventricularkSeptalDefect?: boolean;
  pfo?: boolean; // Patent foramen ovale

  // Strain values by segment
  segmentalStrains?: { [segment: string]: number };

  // Overall interpretation
  interpretation: string;
}

export interface CTImagingFindings {
  timestamp: Date;
  type: 'coronary-cta' | 'cardiac-ct' | 'aortic-ct';

  // Coronary artery disease
  coronaryCalciumScore?: number; // Agatston score
  coronaryCalciumPercentile?: number;
  calciumRisk?: 'minimal' | 'mild' | 'moderate' | 'extensive';

  // Coronary stenosis
  coronaryStenosis?: {
    leftMain?: number; // % stenosis
    lad?: number;
    lcx?: number;
    rca?: number;
    dominance?: 'right' | 'left' | 'codominant';
  };

  // Aortic measurements
  aorticRootDiameter?: number; // mm
  aorticSinusOfValsalva?: number; // mm
  sinotubularJunction?: number; // mm
  aorticAscending?: number; // mm
  aorticArch?: number; // mm
  aorticDescending?: number; // mm

  // Aortic findings
  aorticDissection?: boolean;
  aorticAneurysm?: { location: string; diameter: number };
  aorticAtherosclerosis?: boolean;
  intramuralhematoma?: boolean;

  // Pulmonary embolism
  pe?: { location: string; extent: 'saddle' | 'main' | 'segmental' | 'subsegmental' };

  // Myocardial findings
  myocardialInfarctionScar?: { location: string; extent: string };
  myocardialTiming?: string; // Acute vs chronic

  // Cardiac chamber
  lvVolume?: number; // mL
  lvMass?: number; // grams
  rvVolume?: number; // mL

  // Other
  interpretation: string;
  findings: string[];
}

export interface CatheterizationFindings {
  timestamp: Date;
  indication: string;
  accessSite: 'femoral' | 'radial' | 'brachial';
  complications?: string[];

  // Coronary findings
  coronaryStenosis: {
    [vessel: string]: {
      location: string;
      stenosis: number; // percent
      lesionLength?: number; // mm
      referenceVessel?: number; // mm
      thrombus?: boolean;
      calcification?: 'none' | 'mild' | 'moderate' | 'severe';
      ulceration?: boolean;
    };
  };

  // Hemodynamics
  hemodynamics?: {
    raP?: number; // mmHg
    paP?: number;
    pcwp?: number;
    lvedp?: number;
    aorticP?: number;
    cardiacOutput?: number; // L/min
    cardiacIndex?: number; // L/min/m²
  };

  // Ventricular function
  lvEjectionFraction?: number;
  globalHypokinesis?: boolean;
  segmentalWallMotion?: string;

  // Intervention
  intervention?: {
    type: 'pci' | 'stent' | 'cabg-candidate' | 'none';
    stents?: Array<{ vessel: string; type: string; length: number }>;
    timi?: 'timi-3' | 'timi-2' | 'timi-1' | 'timi-0';
  };

  // Collaterals
  collateralGrade?: 'none' | 'minimal' | 'moderate' | 'well-developed';

  // Functional assessment
  fractionalFlowReserve?: { vessel: string; ffr: number }[];

  interpretation: string;
}

export interface StructuralAbnormality {
  type: string;
  location: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  hemodynamicSignificance: boolean;
  naturalHistory: string;
  interventionRequired: boolean;
  recommendedFollowUp: string;
}

export interface ImagingProfile {
  patientId: string;
  imaging: {
    echocardiograms: EchocardiogramFindings[];
    ctFindings: CTImagingFindings[];
    cathFindings: CatheterizationFindings[];
  };
  structuralAbnormalities: StructuralAbnormality[];
  riskScore: number;
  riskCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  recommendations: string[];
  followUpSchedule: string[];
}

class ImagingAnalysisService {
  private readonly imagingProfiles: Map<string, ImagingProfile> = new Map();

  /**
   * Add echocardiogram findings
   */
  addEchocardiogramFindings(patientId: string, findings: EchocardiogramFindings): ImagingProfile {
    let profile = this.imagingProfiles.get(patientId);

    if (!profile) {
      profile = {
        patientId,
        imaging: {
          echocardiograms: [],
          ctFindings: [],
          cathFindings: []
        },
        structuralAbnormalities: [],
        riskScore: 0,
        riskCategory: 'very-low',
        recommendations: [],
        followUpSchedule: []
      };
    }

    profile.imaging.echocardiograms.push(findings);
    this.analyzeProfile(profile);
    this.imagingProfiles.set(patientId, profile);

    return profile;
  }

  /**
   * Add CT imaging findings
   */
  addCTImagingFindings(patientId: string, findings: CTImagingFindings): ImagingProfile {
    let profile = this.imagingProfiles.get(patientId);

    if (!profile) {
      profile = {
        patientId,
        imaging: {
          echocardiograms: [],
          ctFindings: [],
          cathFindings: []
        },
        structuralAbnormalities: [],
        riskScore: 0,
        riskCategory: 'very-low',
        recommendations: [],
        followUpSchedule: []
      };
    }

    profile.imaging.ctFindings.push(findings);
    this.analyzeProfile(profile);
    this.imagingProfiles.set(patientId, profile);

    return profile;
  }

  /**
   * Add catheterization findings
   */
  addCatheterizationFindings(patientId: string, findings: CatheterizationFindings): ImagingProfile {
    let profile = this.imagingProfiles.get(patientId);

    if (!profile) {
      profile = {
        patientId,
        imaging: {
          echocardiograms: [],
          ctFindings: [],
          cathFindings: []
        },
        structuralAbnormalities: [],
        riskScore: 0,
        riskCategory: 'very-low',
        recommendations: [],
        followUpSchedule: []
      };
    }

    profile.imaging.cathFindings.push(findings);
    this.analyzeProfile(profile);
    this.imagingProfiles.set(patientId, profile);

    return profile;
  }

  /**
   * Analyze imaging profile
   */
  private analyzeProfile(profile: ImagingProfile): void {
    profile.structuralAbnormalities = [];
    profile.riskScore = 0;

    // Analyze echocardiogram
    if (profile.imaging.echocardiograms.length > 0) {
      const latest = profile.imaging.echocardiograms[profile.imaging.echocardiograms.length - 1];
      this.analyzeEchocardiogram(latest, profile);
    }

    // Analyze CT findings
    if (profile.imaging.ctFindings.length > 0) {
      const latest = profile.imaging.ctFindings[profile.imaging.ctFindings.length - 1];
      this.analyzeCTFindings(latest, profile);
    }

    // Analyze catheterization
    if (profile.imaging.cathFindings.length > 0) {
      const latest = profile.imaging.cathFindings[profile.imaging.cathFindings.length - 1];
      this.analyzeCatheterization(latest, profile);
    }

    // Categorize risk
    if (profile.riskScore < 15) profile.riskCategory = 'very-low';
    else if (profile.riskScore < 30) profile.riskCategory = 'low';
    else if (profile.riskScore < 50) profile.riskCategory = 'moderate';
    else if (profile.riskScore < 75) profile.riskCategory = 'high';
    else profile.riskCategory = 'very-high';

    // Generate recommendations
    profile.recommendations = this.generateRecommendations(profile);
    profile.followUpSchedule = this.generateFollowUpSchedule(profile);
  }

  /**
   * Analyze echocardiogram findings
   */
  private analyzeEchocardiogram(echo: EchocardiogramFindings, profile: ImagingProfile): void {
    // Assess systolic function
    if (echo.lvef < 35) {
      profile.riskScore += 40;
      profile.structuralAbnormalities.push({
        type: 'Severe systolic dysfunction',
        location: 'Left ventricle',
        severity: 'severe',
        hemodynamicSignificance: true,
        naturalHistory: 'Elevated risk of sudden cardiac death and heart failure progression',
        interventionRequired: true,
        recommendedFollowUp: 'Repeat echo in 3 months, consider device therapy'
      });
    } else if (echo.lvef < 40) {
      profile.riskScore += 25;
      profile.structuralAbnormalities.push({
        type: 'Reduced ejection fraction',
        location: 'Left ventricle',
        severity: 'moderate',
        hemodynamicSignificance: true,
        naturalHistory: 'Increased mortality risk',
        interventionRequired: true,
        recommendedFollowUp: 'Repeat echo in 6 months'
      });
    } else if (echo.lvef < 50) {
      profile.riskScore += 15;
    }

    // Assess chamber size
    if (echo.lviddiastolic > 60) {
      profile.riskScore += 20;
      profile.structuralAbnormalities.push({
        type: 'Severe left ventricular dilatation',
        location: 'Left ventricle',
        severity: 'severe',
        hemodynamicSignificance: true,
        naturalHistory: 'Associated with systolic dysfunction progression',
        interventionRequired: false,
        recommendedFollowUp: 'Serial echocardiography every 6-12 months'
      });
    }

    // Assess wall motion abnormality
    if (echo.wallMotionAbnormality) {
      profile.riskScore += 15;
      profile.structuralAbnormalities.push({
        type: 'Regional wall motion abnormality',
        location: echo.wallMotionAbnormality,
        severity: 'moderate',
        hemodynamicSignificance: true,
        naturalHistory: 'Suggests prior or ongoing ischemia',
        interventionRequired: false,
        recommendedFollowUp: 'Correlation with ECG and biomarkers; stress testing if appropriate'
      });
    }

    // Assess valvular disease
    if (echo.mitralRegurgitation === 'severe' || echo.aorticRegurgitation === 'severe') {
      profile.riskScore += 25;
      const valve = echo.mitralRegurgitation === 'severe' ? 'mitral' : 'aortic';
      profile.structuralAbnormalities.push({
        type: `Severe ${valve} regurgitation`,
        location: `${valve.charAt(0).toUpperCase() + valve.slice(1)} valve`,
        severity: 'severe',
        hemodynamicSignificance: true,
        naturalHistory: 'Progressive LV dilatation and dysfunction',
        interventionRequired: true,
        recommendedFollowUp: 'Cardiac surgery evaluation'
      });
    }

    // Assess diastolic dysfunction
    if (echo.diastolicDysfunction === 'grade-3') {
      profile.riskScore += 20;
    } else if (echo.diastolicDysfunction === 'grade-2') {
      profile.riskScore += 10;
    }

    // Assess pericardial effusion
    if (echo.pericardialEffusion === 'moderate' || echo.pericardialEffusion === 'large') {
      profile.riskScore += 15;
      profile.structuralAbnormalities.push({
        type: `${echo.pericardialEffusion} pericardial effusion`,
        location: 'Pericardium',
        severity: echo.pericardialEffusion === 'large' ? 'severe' : 'moderate',
        hemodynamicSignificance: echo.pericardialEffusion === 'large',
        naturalHistory: 'Risk of tamponade if enlarging',
        interventionRequired: echo.pericardialEffusion === 'large',
        recommendedFollowUp: 'Follow-up echo in 1 week, consider pericardiocentesis if tamponade'
      });
    }
  }

  /**
   * Analyze CT findings
   */
  private analyzeCTFindings(ct: CTImagingFindings, profile: ImagingProfile): void {
    // Assess coronary calcium score
    if (ct.coronaryCalciumScore !== undefined) {
      if (ct.coronaryCalciumScore > 1000) {
        profile.riskScore += 30;
        profile.structuralAbnormalities.push({
          type: 'Extensive coronary artery calcification',
          location: 'Coronary arteries',
          severity: 'severe',
          hemodynamicSignificance: true,
          naturalHistory: 'High atherosclerotic burden; elevated MI risk',
          interventionRequired: false,
          recommendedFollowUp: 'Stress testing and angiography as clinically indicated'
        });
      } else if (ct.coronaryCalciumScore > 400) {
        profile.riskScore += 20;
      } else if (ct.coronaryCalciumScore > 100) {
        profile.riskScore += 10;
      }
    }

    // Assess coronary stenosis
    if (ct.coronaryStenosis) {
      if ((ct.coronaryStenosis.leftMain || 0) > 50) {
        profile.riskScore += 35;
        profile.structuralAbnormalities.push({
          type: 'Left main coronary artery stenosis',
          location: 'Left main coronary artery',
          severity: 'critical',
          hemodynamicSignificance: true,
          naturalHistory: 'High-risk lesion; consider early revascularization',
          interventionRequired: true,
          recommendedFollowUp: 'Urgent cardiac catheterization and angiography'
        });
      }

      if ((ct.coronaryStenosis.lad || 0) > 70) {
        profile.riskScore += 20;
      }
      if ((ct.coronaryStenosis.lcx || 0) > 70) {
        profile.riskScore += 15;
      }
      if ((ct.coronaryStenosis.rca || 0) > 70) {
        profile.riskScore += 15;
      }
    }

    // Assess aortic abnormalities
    if (ct.aorticDissection) {
      profile.riskScore += 45;
      profile.structuralAbnormalities.push({
        type: 'Aortic dissection',
        location: 'Thoracic aorta',
        severity: 'critical',
        hemodynamicSignificance: true,
        naturalHistory: 'Life-threatening condition; immediate intervention required',
        interventionRequired: true,
        recommendedFollowUp: 'Immediate surgical/interventional evaluation'
      });
    }

    if (ct.aorticAneurysm) {
      const severity = ct.aorticAneurysm.diameter > 60 ? 'critical' : 'severe';
      const scoreIncrease = severity === 'critical' ? 35 : 20;
      profile.riskScore += scoreIncrease;

      profile.structuralAbnormalities.push({
        type: `${ct.aorticAneurysm.location} aortic aneurysm`,
        location: 'Thoracic aorta',
        severity,
        hemodynamicSignificance: true,
        naturalHistory: `Risk of rupture; surgery recommended if diameter > ${severity === 'critical' ? '55' : '60'}mm`,
        interventionRequired: severity === 'critical',
        recommendedFollowUp: `Follow-up CT in ${severity === 'critical' ? '3' : '6'} months`
      });
    }

    if (ct.myocardialInfarctionScar) {
      profile.riskScore += 15;
      profile.structuralAbnormalities.push({
        type: 'Myocardial infarction scar',
        location: ct.myocardialInfarctionScar.location,
        severity: 'moderate',
        hemodynamicSignificance: false,
        naturalHistory: 'Prior MI; risk of recurrence',
        interventionRequired: false,
        recommendedFollowUp: 'Risk factor modification and secondary prevention'
      });
    }
  }

  /**
   * Analyze catheterization findings
   */
  private analyzeCatheterization(cath: CatheterizationFindings, profile: ImagingProfile): void {
    // Assess coronary stenosis
    for (const [vessel, details] of Object.entries(cath.coronaryStenosis)) {
      if (details.stenosis > 90) {
        profile.riskScore += 25;
        profile.structuralAbnormalities.push({
          type: `Critical ${vessel} stenosis`,
          location: vessel,
          severity: 'critical',
          hemodynamicSignificance: true,
          naturalHistory: 'High risk of acute occlusion and MI',
          interventionRequired: true,
          recommendedFollowUp: 'Immediate PCI or CABG evaluation'
        });
      } else if (details.stenosis > 70) {
        profile.riskScore += 15;
      } else if (details.stenosis > 50) {
        profile.riskScore += 8;
      }
    }

    // Assess left ventricular function
    if (cath.lvEjectionFraction && cath.lvEjectionFraction < 35) {
      profile.riskScore += 30;
    } else if (cath.lvEjectionFraction && cath.lvEjectionFraction < 40) {
      profile.riskScore += 20;
    }

    // Assess hemodynamics
    if (cath.hemodynamics) {
      if ((cath.hemodynamics.pcwp || 0) > 18) {
        profile.riskScore += 15;
      }
      if ((cath.hemodynamics.cardiacIndex || 0) < 2.2) {
        profile.riskScore += 20;
      }
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(profile: ImagingProfile): string[] {
    const recommendations: string[] = [];

    if (profile.riskScore >= 70) {
      recommendations.push(
        'URGENT: Critical structural abnormalities detected',
        'Immediate cardiology consultation required',
        'Consider advanced interventions (surgery, catheterization)'
      );
    }

    // Echo-based recommendations
    if (profile.imaging.echocardiograms.length > 0) {
      const latest = profile.imaging.echocardiograms[profile.imaging.echocardiograms.length - 1];

      if (latest.lvef < 40) {
        recommendations.push(
          'Initiate ACE inhibitor/ARB and beta-blocker therapy',
          'Consider aldosterone antagonist if LVEF < 35',
          'Evaluate for device therapy (ICD, CRT)'
        );
      }

      if (latest.mitralRegurgitation === 'severe' || latest.aorticRegurgitation === 'severe') {
        recommendations.push('Cardiac surgery evaluation for valve intervention');
      }

      if (latest.diastolicDysfunction === 'grade-3') {
        recommendations.push(
          'Optimize blood pressure and heart rate control',
          'Consider diuretics and calcium channel blockers'
        );
      }
    }

    // CT-based recommendations
    if (profile.imaging.ctFindings.length > 0) {
      const latest = profile.imaging.ctFindings[profile.imaging.ctFindings.length - 1];

      if ((latest.coronaryCalciumScore || 0) > 400) {
        recommendations.push(
          'Initiate or intensify lipid-lowering therapy',
          'Consider aspirin therapy',
          'Stress testing recommended'
        );
      }

      if (latest.aorticAneurysm || latest.aorticDissection) {
        recommendations.push(
          'Urgent surgical evaluation',
          'Control blood pressure strictly'
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate follow-up schedule
   */
  private generateFollowUpSchedule(profile: ImagingProfile): string[] {
    const schedule: string[] = [];

    if (profile.riskScore >= 70) {
      schedule.push(
        'Clinical evaluation: 1 week',
        'Repeat echo: 3 weeks',
        'Specialist consultation: STAT'
      );
    } else if (profile.riskScore >= 50) {
      schedule.push(
        'Clinical evaluation: 2 weeks',
        'Repeat echo: 3 months',
        'Specialist consultation: 2 weeks'
      );
    } else if (profile.riskScore >= 30) {
      schedule.push(
        'Clinical evaluation: 1 month',
        'Repeat echo: 6 months',
        'Specialist consultation: As needed'
      );
    } else {
      schedule.push(
        'Clinical evaluation: 3 months',
        'Repeat echo: 12 months'
      );
    }

    return schedule;
  }

  /**
   * Get imaging profile
   */
  getImagingProfile(patientId: string): ImagingProfile | null {
    return this.imagingProfiles.get(patientId) || null;
  }

  /**
   * Generate imaging report
   */
  generateImagingReport(patientId: string): string {
    const profile = this.imagingProfiles.get(patientId);
    if (!profile) return 'Patient imaging data not found';

    let report = '# Comprehensive Cardiac Imaging Report\n\n';
    report += `Patient ID: ${patientId}\n`;
    report += `Analysis Date: ${new Date().toLocaleString()}\n\n`;

    report += '## Imaging Risk Assessment\n';
    report += `- **Imaging Risk Score**: ${profile.riskScore}/100\n`;
    report += `- **Risk Category**: ${profile.riskCategory.toUpperCase()}\n\n`;

    if (profile.structuralAbnormalities.length > 0) {
      report += '## Structural Abnormalities\n';
      for (let i = 0; i < profile.structuralAbnormalities.length; i++) {
        const abnormality = profile.structuralAbnormalities[i];
        report += `${i + 1}. **${abnormality.type}**\n`;
        report += `   - Location: ${abnormality.location}\n`;
        report += `   - Severity: ${abnormality.severity.toUpperCase()}\n`;
        report += `   - Natural History: ${abnormality.naturalHistory}\n`;
        report += `   - Follow-up: ${abnormality.recommendedFollowUp}\n`;
      }
    }

    report += '\n## Clinical Recommendations\n';
    for (let i = 0; i < profile.recommendations.length; i++) {
      report += `${i + 1}. ${profile.recommendations[i]}\n`;
    }

    report += '\n## Follow-up Schedule\n';
    for (let i = 0; i < profile.followUpSchedule.length; i++) {
      report += `${i + 1}. ${profile.followUpSchedule[i]}\n`;
    }

    return report;
  }

  /**
   * Compare imaging studies over time
   */
  compareImaging(patientId: string, studyIndex1: number, studyIndex2: number): { comparison: string } | null {
    const profile = this.imagingProfiles.get(patientId);
    if (!profile || !profile.imaging.echocardiograms[studyIndex1] || !profile.imaging.echocardiograms[studyIndex2]) {
      return null;
    }

    const study1 = profile.imaging.echocardiograms[studyIndex1];
    const study2 = profile.imaging.echocardiograms[studyIndex2];

    let comparison = '# Imaging Comparison\n\n';
    comparison += `Study 1: ${study1.timestamp.toLocaleDateString()}\n`;
    comparison += `Study 2: ${study2.timestamp.toLocaleDateString()}\n\n`;

    comparison += '## LVEF Comparison\n';
    comparison += `- Study 1: ${study1.lvef}%\n`;
    comparison += `- Study 2: ${study2.lvef}%\n`;
    comparison += `- Change: ${(study2.lvef - study1.lvef > 0 ? '+' : '')}${study2.lvef - study1.lvef}%\n\n`;

    comparison += '## Chamber Size Comparison\n';
    comparison += `- Study 1 LVIDd: ${study1.lviddiastolic}mm\n`;
    comparison += `- Study 2 LVIDd: ${study2.lviddiastolic}mm\n`;
    comparison += `- Change: ${study2.lviddiastolic - study1.lviddiastolic > 0 ? '+' : ''}${study2.lviddiastolic - study1.lviddiastolic}mm\n`;

    return { comparison };
  }

  /**
   * Get high-risk imaging profiles
   */
  getHighRiskProfiles(): ImagingProfile[] {
    return Array.from(this.imagingProfiles.values()).filter(p =>
      p.riskCategory === 'high' || p.riskCategory === 'very-high'
    );
  }
}

export default new ImagingAnalysisService();
