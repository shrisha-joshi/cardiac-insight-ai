import { describe, it, expect, beforeEach } from 'vitest';
import {
  assessEnhancedCVDRisk,
  type EnhancedCVDPatientData,
  type EnhancedCVDRiskResponse,
} from '@/lib/enhancedCVDRiskAssessment';

describe('Enhanced CVD Risk Assessment Service', () => {
  let testPatient: EnhancedCVDPatientData;

  beforeEach(() => {
    testPatient = {
      age: 45,
      sex: 'M',
      region: 'Urban',
      socioeconomicStatus: 'Middle',
      populationGroup: 'Indian',
      previousMI: false,
      previousStroke: false,
      heartFailureHistory: false,
      systolicBP: 130,
      diastolicBP: 85,
      heartRate: 75,
      waistCircumference: 92,
      height: 170,
      weight: 75,
      totalCholesterol: 210,
      ldlCholesterol: 130,
      hdlCholesterol: 45,
      triglycerides: 180,
      lipoproteinA: 25,
      fastingBloodGlucose: 105,
      hba1c: 5.8,
      urineAlbuminCreatinineRatio: 15,
      smokingStatus: 'Current',
      betelQuinUse: 'Current',
      physicalActivity: 'Low',
      alcoholConsumption: 'Moderate',
      dietaryPattern: 'Western',
      diabetesStatus: 'Prediabetic',
    };
  });

  describe('Basic Risk Calculation', () => {
    it('should calculate CVD risk for a standard patient', () => {
      const result = assessEnhancedCVDRisk(testPatient);
      
      expect(result).toBeDefined();
      expect(result.framinghamRisk).toBeGreaterThanOrEqual(0);
      expect(result.framinghamRisk).toBeLessThanOrEqual(100);
      expect(result.ascvdRisk).toBeGreaterThanOrEqual(0);
      expect(result.ascvdRisk).toBeLessThanOrEqual(100);
      expect(result.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(result.combinedRisk).toBeLessThanOrEqual(100);
    });

    it('should return response object with all required fields', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.framinghamRisk).toBeDefined();
      expect(result.framinghamCategory).toBeDefined();
      expect(result.ascvdRisk).toBeDefined();
      expect(result.ascvdCategory).toBeDefined();
      expect(result.interheart).toBeDefined();
      expect(result.interheart.percentage).toBeDefined();
      expect(result.interheart.score).toBeDefined();
      expect(result.interheart.category).toBeDefined();
      expect(result.indianAdjustedRisk).toBeDefined();
      expect(result.indianCategory).toBeDefined();
      expect(result.combinedRisk).toBeDefined();
      expect(result.finalRiskCategory).toBeDefined();
      expect(result.topRiskFactors).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.modelVersions).toBeDefined();
    });

    it('should identify high-risk Indian patient correctly', () => {
      testPatient.age = 60;
      testPatient.systolicBP = 160;
      testPatient.ldlCholesterol = 200;
      testPatient.triglycerides = 350;
      testPatient.diabetesStatus = 'Diabetic';
      testPatient.smokingStatus = 'Current';
      testPatient.previousMI = true;

      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.indianAdjustedRisk).toBeGreaterThan(30);
      expect(result.finalRiskCategory).toMatch(/High|Very High/);
    });

    it('should identify low-risk patient correctly', () => {
      testPatient.age = 30;
      testPatient.systolicBP = 120;
      testPatient.diastolicBP = 75;
      testPatient.ldlCholesterol = 100;
      testPatient.hdlCholesterol = 55;
      testPatient.triglycerides = 120;
      testPatient.smokingStatus = 'Never';
      testPatient.physicalActivity = 'High';
      testPatient.diabetesStatus = 'No';
      testPatient.waistCircumference = 80;

      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.combinedRisk).toBeLessThan(10);
      expect(result.finalRiskCategory).toMatch(/Low|Very Low/);
    });
  });

  describe('Risk Model Calculations', () => {
    it('should return multiple risk models', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.framinghamRisk).toBeDefined();
      expect(result.ascvdRisk).toBeDefined();
      expect(result.interheart).toBeDefined();
      expect(result.indianAdjustedRisk).toBeDefined();
    });

    it('should calculate valid Framingham risk', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.framinghamRisk).toBeGreaterThanOrEqual(0);
      expect(result.framinghamRisk).toBeLessThanOrEqual(100);
      expect(result.framinghamCategory).toMatch(/Very Low|Low|Moderate|High|Very High/);
    });

    it('should calculate valid ASCVD risk', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.ascvdRisk).toBeGreaterThanOrEqual(0);
      expect(result.ascvdRisk).toBeLessThanOrEqual(100);
      expect(result.ascvdCategory).toMatch(/Very Low|Low|Moderate|High|Very High/);
    });

    it('should calculate valid INTERHEART score', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.interheart.percentage).toBeGreaterThanOrEqual(0);
      expect(result.interheart.percentage).toBeLessThanOrEqual(100);
      expect(result.interheart.score).toBeGreaterThanOrEqual(0);
      expect(result.interheart.category).toMatch(/Very Low|Low|Moderate|High|Very High/);
    });

    it('should calculate valid Indian-adjusted risk', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.indianAdjustedRisk).toBeGreaterThanOrEqual(0);
      expect(result.indianAdjustedRisk).toBeLessThanOrEqual(100);
      expect(result.indianCategory).toMatch(/Very Low|Low|Moderate|High|Very High/);
    });

    it('should calculate combined risk as average/weight of all models', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(result.combinedRisk).toBeLessThanOrEqual(100);
      expect(result.finalRiskCategory).toMatch(/Very Low|Low|Moderate|High|Very High/);
    });
  });

  describe('Age Impact on Risk', () => {
    it('should increase risk with age', () => {
      const youngPatient = { ...testPatient, age: 35 };
      const midPatient = { ...testPatient, age: 50 };
      const oldPatient = { ...testPatient, age: 70 };

      const youngResult = assessEnhancedCVDRisk(youngPatient);
      const midResult = assessEnhancedCVDRisk(midPatient);
      const oldResult = assessEnhancedCVDRisk(oldPatient);

      expect(oldResult.combinedRisk).toBeGreaterThan(midResult.combinedRisk);
      expect(midResult.combinedRisk).toBeGreaterThan(youngResult.combinedRisk);
    });

    it('should handle extreme ages', () => {
      const youngPatient = { ...testPatient, age: 18 };
      const elderlyPatient = { ...testPatient, age: 100 };

      const youngResult = assessEnhancedCVDRisk(youngPatient);
      const elderlyResult = assessEnhancedCVDRisk(elderlyPatient);

      expect(youngResult.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(elderlyResult.combinedRisk).toBeLessThanOrEqual(100);
    });
  });

  describe('Gender Differences', () => {
    it('should calculate risk for both genders', () => {
      const malePatient = { ...testPatient, sex: 'M' as const };
      const femalePatient = { ...testPatient, sex: 'F' as const };

      const maleResult = assessEnhancedCVDRisk(malePatient);
      const femaleResult = assessEnhancedCVDRisk(femalePatient);

      expect(maleResult.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(femaleResult.combinedRisk).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Blood Pressure Impact', () => {
    it('should increase risk with hypertension', () => {
      const normalBP = { ...testPatient, systolicBP: 120, diastolicBP: 80 };
      const elevatedBP = { ...testPatient, systolicBP: 140, diastolicBP: 90 };
      const stageBP = { ...testPatient, systolicBP: 160, diastolicBP: 100 };

      const normalResult = assessEnhancedCVDRisk(normalBP);
      const elevatedResult = assessEnhancedCVDRisk(elevatedBP);
      const stageResult = assessEnhancedCVDRisk(stageBP);

      expect(elevatedResult.combinedRisk).toBeGreaterThan(normalResult.combinedRisk);
      expect(stageResult.combinedRisk).toBeGreaterThan(elevatedResult.combinedRisk);
    });
  });

  describe('Diabetes Status Impact', () => {
    it('should increase risk with diabetes progression', () => {
      const noDiabetes = { ...testPatient, diabetesStatus: 'No' as const };
      const prediabetic = { ...testPatient, diabetesStatus: 'Prediabetic' as const };
      const diabetic = { ...testPatient, diabetesStatus: 'Diabetic' as const };

      const noResult = assessEnhancedCVDRisk(noDiabetes);
      const preResult = assessEnhancedCVDRisk(prediabetic);
      const diabResult = assessEnhancedCVDRisk(diabetic);

      expect(preResult.combinedRisk).toBeGreaterThan(noResult.combinedRisk);
      expect(diabResult.combinedRisk).toBeGreaterThan(preResult.combinedRisk);
    });
  });

  describe('Smoking Status Impact', () => {
    it('should show worse risk with smoking', () => {
      const neverSmoke = { ...testPatient, smokingStatus: 'Never' as const };
      const formerSmoke = { ...testPatient, smokingStatus: 'Former' as const };
      const currentSmoke = { ...testPatient, smokingStatus: 'Current' as const };

      const neverResult = assessEnhancedCVDRisk(neverSmoke);
      const formerResult = assessEnhancedCVDRisk(formerSmoke);
      const currentResult = assessEnhancedCVDRisk(currentSmoke);

      expect(currentResult.combinedRisk).toBeGreaterThan(formerResult.combinedRisk);
      expect(formerResult.combinedRisk).toBeGreaterThanOrEqual(neverResult.combinedRisk);
    });
  });

  describe('Lipid Profile Impact', () => {
    it('should show worse risk with poor lipid profile', () => {
      const goodLipids = { 
        ...testPatient, 
        totalCholesterol: 180,
        ldlCholesterol: 100,
        hdlCholesterol: 60,
        triglycerides: 100
      };
      const poorLipids = {
        ...testPatient,
        totalCholesterol: 300,
        ldlCholesterol: 220,
        hdlCholesterol: 30,
        triglycerides: 400
      };

      const goodResult = assessEnhancedCVDRisk(goodLipids);
      const poorResult = assessEnhancedCVDRisk(poorLipids);

      expect(poorResult.combinedRisk).toBeGreaterThan(goodResult.combinedRisk);
    });

    it('should show protective effect of high HDL', () => {
      const lowHDL = { ...testPatient, hdlCholesterol: 30 };
      const normalHDL = { ...testPatient, hdlCholesterol: 50 };
      const highHDL = { ...testPatient, hdlCholesterol: 70 };

      const lowResult = assessEnhancedCVDRisk(lowHDL);
      const normalResult = assessEnhancedCVDRisk(normalHDL);
      const highResult = assessEnhancedCVDRisk(highHDL);

      expect(lowResult.combinedRisk).toBeGreaterThan(normalResult.combinedRisk);
      expect(normalResult.combinedRisk).toBeGreaterThan(highResult.combinedRisk);
    });

    it('should emphasize triglycerides in Indian population', () => {
      const indianLowTrig = { ...testPatient, populationGroup: 'Indian' as const, triglycerides: 120 };
      const indianHighTrig = { ...testPatient, populationGroup: 'Indian' as const, triglycerides: 400 };

      const lowTrigResult = assessEnhancedCVDRisk(indianLowTrig);
      const highTrigResult = assessEnhancedCVDRisk(indianHighTrig);

      expect(highTrigResult.indianAdjustedRisk).toBeGreaterThan(lowTrigResult.indianAdjustedRisk);
    });
  });

  describe('Central Obesity Impact', () => {
    it('should show increased risk with central obesity', () => {
      const normalWaist = { ...testPatient, waistCircumference: 80 };
      const abnormalWaist = { ...testPatient, waistCircumference: 110 };

      const normalResult = assessEnhancedCVDRisk(normalWaist);
      const abnormalResult = assessEnhancedCVDRisk(abnormalWaist);

      expect(abnormalResult.combinedRisk).toBeGreaterThan(normalResult.combinedRisk);
    });
  });

  describe('CVD History Impact', () => {
    it('should significantly increase risk with CVD history', () => {
      const noHistory = { ...testPatient, previousMI: false, previousStroke: false };
      const withMI = { ...testPatient, previousMI: true };
      const withStroke = { ...testPatient, previousStroke: true };
      const withBoth = { ...testPatient, previousMI: true, previousStroke: true };

      const noHistoryResult = assessEnhancedCVDRisk(noHistory);
      const withMIResult = assessEnhancedCVDRisk(withMI);
      const withStrokeResult = assessEnhancedCVDRisk(withStroke);
      const withBothResult = assessEnhancedCVDRisk(withBoth);

      expect(withMIResult.combinedRisk).toBeGreaterThan(noHistoryResult.combinedRisk);
      expect(withStrokeResult.combinedRisk).toBeGreaterThan(noHistoryResult.combinedRisk);
      expect(withBothResult.combinedRisk).toBeGreaterThan(withMIResult.combinedRisk);
    });
  });

  describe('Population Group Adjustments', () => {
    it('should handle all population groups', () => {
      const indianResult = assessEnhancedCVDRisk({ ...testPatient, populationGroup: 'Indian' });
      const southAsianResult = assessEnhancedCVDRisk({ ...testPatient, populationGroup: 'SouthAsian' });
      const globalResult = assessEnhancedCVDRisk({ ...testPatient, populationGroup: 'Global' });

      expect(indianResult.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(southAsianResult.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(globalResult.combinedRisk).toBeGreaterThanOrEqual(0);
    });

    it('should apply different calculations for Indian population', () => {
      const indianPatient = { ...testPatient, populationGroup: 'Indian' as const };
      const globalPatient = { ...testPatient, populationGroup: 'Global' as const };

      const indianResult = assessEnhancedCVDRisk(indianPatient);
      const globalResult = assessEnhancedCVDRisk(globalPatient);

      expect(indianResult.indianAdjustedRisk).toBeDefined();
      expect(globalResult.indianAdjustedRisk).toBeDefined();
    });
  });

  describe('Risk Factor Identification', () => {
    it('should identify top risk factors', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.topRiskFactors).toBeDefined();
      expect(Array.isArray(result.topRiskFactors)).toBe(true);
      expect(result.topRiskFactors.length).toBeGreaterThan(0);
      expect(result.topRiskFactors.length).toBeLessThanOrEqual(10);
    });

    it('should properly structure risk factors', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      result.topRiskFactors.forEach(factor => {
        expect(factor.factor).toBeDefined();
        expect(typeof factor.factor).toBe('string');
        expect(factor.percentage).toBeGreaterThanOrEqual(0);
        expect(factor.percentage).toBeLessThanOrEqual(100);
        expect(['High', 'Moderate', 'Low']).toContain(factor.severity);
      });
    });
  });

  describe('Indian Population Insights', () => {
    it('should provide Indian population insights', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.indianPopulationInsights).toBeDefined();
      expect(result.indianPopulationInsights.ageEquivalent).toBeGreaterThan(0);
      expect(typeof result.indianPopulationInsights.triglycerideConcern).toBe('boolean');
      expect(typeof result.indianPopulationInsights.centralObesityConcern).toBe('boolean');
    });
  });

  describe('Recommendations Generation', () => {
    it('should provide Indian-specific recommendations', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.indianSpecificRecommendations).toBeDefined();
      expect(Array.isArray(result.indianSpecificRecommendations)).toBe(true);
      expect(result.indianSpecificRecommendations.length).toBeGreaterThan(0);
    });

    it('should structure recommendations as strings', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      result.indianSpecificRecommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide confidence metric', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Model Versions', () => {
    it('should list all models used', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.modelVersions).toBeDefined();
      expect(Array.isArray(result.modelVersions)).toBe(true);
      expect(result.modelVersions.length).toBeGreaterThan(0);
    });

    it('should include all four major models', () => {
      const result = assessEnhancedCVDRisk(testPatient);

      expect(result.modelVersions).toContain('Framingham');
      expect(result.modelVersions).toContain('ASCVD');
      expect(result.modelVersions).toContain('INTERHEART');
      expect(result.modelVersions).toContain('Indian-Adjusted');
    });
  });

  describe('Consistency', () => {
    it('should return consistent results for same input', () => {
      const result1 = assessEnhancedCVDRisk(testPatient);
      const result2 = assessEnhancedCVDRisk(testPatient);

      expect(result1.combinedRisk).toBe(result2.combinedRisk);
      expect(result1.framinghamRisk).toBe(result2.framinghamRisk);
      expect(result1.indianAdjustedRisk).toBe(result2.indianAdjustedRisk);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum/maximum BP values', () => {
      const lowBP = { ...testPatient, systolicBP: 90, diastolicBP: 60 };
      const highBP = { ...testPatient, systolicBP: 200, diastolicBP: 130 };

      const lowResult = assessEnhancedCVDRisk(lowBP);
      const highResult = assessEnhancedCVDRisk(highBP);

      expect(lowResult.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(highResult.combinedRisk).toBeLessThanOrEqual(100);
    });

    it('should handle extreme triglyceride values', () => {
      const zeroTrig = { ...testPatient, triglycerides: 0 };
      const highTrig = { ...testPatient, triglycerides: 800 };

      const zeroResult = assessEnhancedCVDRisk(zeroTrig);
      const highResult = assessEnhancedCVDRisk(highTrig);

      expect(zeroResult.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(highResult.combinedRisk).toBeLessThanOrEqual(100);
    });

    it('should handle missing optional fields', () => {
      const minimalPatient: EnhancedCVDPatientData = {
        age: 45,
        sex: 'M',
        populationGroup: 'Global',
        systolicBP: 130,
        diastolicBP: 85,
        waistCircumference: 90,
        height: 170,
        weight: 75,
        totalCholesterol: 210,
        ldlCholesterol: 130,
        hdlCholesterol: 45,
        triglycerides: 150,
        fastingBloodGlucose: 100,
        hba1c: 5.5,
        smokingStatus: 'Never',
        physicalActivity: 'Moderate',
        alcoholConsumption: 'None',
        diabetesStatus: 'No',
      };

      const result = assessEnhancedCVDRisk(minimalPatient);
      expect(result.combinedRisk).toBeGreaterThanOrEqual(0);
      expect(result.combinedRisk).toBeLessThanOrEqual(100);
    });
  });
});
