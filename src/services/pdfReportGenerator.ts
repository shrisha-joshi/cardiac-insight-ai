/**
 * PDF Report Generator Service
 * Generates comprehensive, personalized PDF reports for cardiac risk assessments
 * Includes risk summary, factor breakdown, medication analysis, and recommendations
 * 
 * Phase 4 Task 1: Comprehensive PDF Report Generation
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Type declaration for jsPDF with autoTable support
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => void;
    lastAutoTable: { finalY: number };
  }
}

export interface PredictionData {
  patientName: string;
  age: number;
  gender: 'Male' | 'Female';
  region: string;
  riskScore: number;
  riskCategory: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  confidence: number;
  systemicBloodPressure: number;
  diastolicBloodPressure: number;
  totalCholesterol: number;
  hdlCholesterol: number;
  ldlCholesterol: number;
  triglycerides: number;
  glucose: number;
  bmi: number;
  heartRate: number;
  lpA?: number;
  crp?: number;
  homocysteine?: number;
  smokingStatus: string;
  diabetesStatus: string;
  familyHistory: string;
  previousMI: boolean;
  hypertension: boolean;
  medications: Array<{ name: string; class: string; efficacy: number }>;
  lifestyleScore: number;
  dataQuality: number;
  trendStatus: 'stable' | 'improving' | 'deteriorating';
  projectionRisk3M?: number;
  projectionRisk6M?: number;
  projectionRisk12M?: number;
  uncertaintyRange?: { lower: number; upper: number };
  timestamp: Date;
}

interface ReportOptions {
  includeCharts?: boolean;
  includeMedicationAnalysis?: boolean;
  includeHistoricalData?: boolean;
  language?: 'en' | 'hi';
  colorTheme?: 'professional' | 'blue' | 'green';
}

class PDFReportGenerator {
  private defaultOptions: ReportOptions = {
    includeCharts: true,
    includeMedicationAnalysis: true,
    includeHistoricalData: true,
    language: 'en',
    colorTheme: 'professional'
  };

  private colorSchemes: Record<string, { primary: string; secondary: string; accent: string; warning: string; danger: string }> = {
    professional: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#0ea5e9',
      warning: '#f59e0b',
      danger: '#ef4444'
    },
    blue: {
      primary: '#0066cc',
      secondary: '#3399ff',
      accent: '#00b4ff',
      warning: '#ffaa00',
      danger: '#ff4444'
    },
    green: {
      primary: '#006644',
      secondary: '#00aa77',
      accent: '#00cc88',
      warning: '#ffaa00',
      danger: '#ff4444'
    }
  };

  /**
   * Generate comprehensive PDF report
   */
  generateReport(data: PredictionData, options: ReportOptions = {}): jsPDF {
    const opts = { ...this.defaultOptions, ...options };
    const colors = this.colorSchemes[opts.colorTheme!] || this.colorSchemes.professional;

    // Create PDF (A4, mm, portrait)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let yPosition = 15;

    // Add header
    yPosition = this.addHeader(doc, data, colors, yPosition);

    // Add risk summary
    yPosition = this.addRiskSummary(doc, data, colors, yPosition);

    // Add clinical parameters
    yPosition = this.addClinicalParameters(doc, data, colors, yPosition);

    // Add risk factors breakdown
    yPosition = this.addRiskFactorsBreakdown(doc, data, colors, yPosition);

    // Add biomarkers (if available)
    if (data.lpA || data.crp || data.homocysteine) {
      yPosition = this.addBiomarkers(doc, data, colors, yPosition);
    }

    // Add medication analysis
    if (opts.includeMedicationAnalysis && data.medications.length > 0) {
      yPosition = this.addMedicationAnalysis(doc, data, colors, yPosition);
    }

    // Add trend analysis
    if (data.projectionRisk3M) {
      yPosition = this.addTrendAnalysis(doc, data, colors, yPosition);
    }

    // Add data quality assessment
    yPosition = this.addDataQuality(doc, data, colors, yPosition);

    // Add recommendations
    yPosition = this.addRecommendations(doc, data, colors, yPosition);

    // Add emergency resources if high risk
    if (data.riskCategory === 'High' || data.riskCategory === 'Very High') {
      yPosition = this.addEmergencyResources(doc, data, colors, yPosition);
    }

    // Add footer
    this.addFooter(doc, data.timestamp);

    return doc;
  }

  /**
   * Add PDF header with patient info
   */
  private addHeader(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const colorObj = colors as { primary: string; secondary: string; danger: string };

    // Background
    doc.setFillColor(...this.hexToRgb(colorObj.primary));
    doc.rect(0, yPos - 12, pageWidth, 25, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Cardiac Risk Assessment Report', pageWidth / 2, yPos, { align: 'center' });

    // Patient info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const patientInfo = [
      `Patient: ${data.patientName}`,
      `Age: ${data.age} years | Gender: ${data.gender} | Region: ${data.region}`,
      `Date: ${data.timestamp.toLocaleDateString()} | Time: ${data.timestamp.toLocaleTimeString()}`
    ];

    yPos += 8;
    patientInfo.forEach((info, index) => {
      doc.text(info, pageWidth / 2, yPos + index * 5, { align: 'center' });
    });

    return yPos + 20;
  }

  /**
   * Add risk summary section
   */
  private addRiskSummary(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const colorObj = colors as { primary: string; secondary: string; danger: string };

    // Section title
    this.addSectionTitle(doc, '1. CARDIAC RISK SUMMARY', yPos, colors);
    yPos += 8;

    // Risk score box
    const boxX = 15;
    const boxWidth = (pageWidth - 30) / 2;
    const boxHeight = 30;

    // Risk score
    doc.setFillColor(...this.hexToRgb(colorObj.secondary));
    doc.rect(boxX, yPos, boxWidth, boxHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(`${Math.round(data.riskScore)}%`, boxX + boxWidth / 2, yPos + 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('10-Year Risk Score', boxX + boxWidth / 2, yPos + 24, { align: 'center' });

    // Risk category
    const categoryColor = this.getCategoryColor(data.riskCategory, colors);
    doc.setFillColor(...this.hexToRgb(categoryColor));
    doc.rect(boxX + boxWidth + 5, yPos, boxWidth, boxHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(data.riskCategory, boxX + boxWidth * 1.5 + 5, yPos + 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Risk Category', boxX + boxWidth * 1.5 + 5, yPos + 24, { align: 'center' });

    yPos += boxHeight + 8;

    // Key metrics
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const metrics = [
      { label: 'Confidence Level', value: `${Math.round(data.confidence)}%` },
      { label: 'Data Quality', value: `${Math.round(data.dataQuality)}%` },
      { label: 'Trend Status', value: data.trendStatus.charAt(0).toUpperCase() + data.trendStatus.slice(1) }
    ];

    if (data.uncertaintyRange) {
      metrics.push({
        label: 'Uncertainty Range',
        value: `${Math.round(data.uncertaintyRange.lower)}% - ${Math.round(data.uncertaintyRange.upper)}%`
      });
    }

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: metrics.map(m => [m.label, m.value]),
      theme: 'grid',
      headStyles: { fillColor: this.hexToRgb(colorObj.primary), textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 50 } }
    });

    return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  /**
   * Add clinical parameters section
   */
  private addClinicalParameters(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    this.addSectionTitle(doc, '2. CLINICAL PARAMETERS', yPos, colors);
    yPos += 8;

    const tableData = [
      ['Parameter', 'Value', 'Reference Range', 'Status'],
      ['Systolic BP', `${data.systemicBloodPressure} mmHg`, '<120 mmHg', this.getParameterStatus(data.systemicBloodPressure, 'sbp')],
      ['Diastolic BP', `${data.diastolicBloodPressure} mmHg`, '<80 mmHg', this.getParameterStatus(data.diastolicBloodPressure, 'dbp')],
      ['Total Cholesterol', `${Math.round(data.totalCholesterol)} mg/dL`, '<200 mg/dL', this.getParameterStatus(data.totalCholesterol, 'tc')],
      ['HDL Cholesterol', `${Math.round(data.hdlCholesterol)} mg/dL`, '>40 mg/dL (M), >50 mg/dL (F)', this.getParameterStatus(data.hdlCholesterol, 'hdl')],
      ['LDL Cholesterol', `${Math.round(data.ldlCholesterol)} mg/dL`, '<100 mg/dL', this.getParameterStatus(data.ldlCholesterol, 'ldl')],
      ['Triglycerides', `${Math.round(data.triglycerides)} mg/dL`, '<150 mg/dL', this.getParameterStatus(data.triglycerides, 'tg')],
      ['Fasting Glucose', `${Math.round(data.glucose)} mg/dL`, '70-100 mg/dL', this.getParameterStatus(data.glucose, 'glucose')],
      ['BMI', `${data.bmi.toFixed(1)} kg/m²`, '18.5-24.9', this.getParameterStatus(data.bmi, 'bmi')],
      ['Heart Rate', `${data.heartRate} bpm`, '60-100 bpm', this.getParameterStatus(data.heartRate, 'hr')]
    ];

    doc.autoTable({
      startY: yPos,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: this.hexToRgb(colorObj.primary), textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 25 }
      }
    });

    return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  /**
   * Add risk factors breakdown
   */
  private addRiskFactorsBreakdown(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    this.addSectionTitle(doc, '3. RISK FACTORS', yPos, colors);
    yPos += 8;

    const riskFactors = this.extractRiskFactors(data);
    const factorData = riskFactors.map(f => [f.factor, f.value, f.impact]);

    doc.autoTable({
      startY: yPos,
      head: [['Risk Factor', 'Status/Value', 'Impact']],
      body: factorData,
      theme: 'grid',
      headStyles: { fillColor: this.hexToRgb(colorObj.primary), textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 }
      }
    });

    return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  /**
   * Add biomarkers section
   */
  private addBiomarkers(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    this.addSectionTitle(doc, '4. ADVANCED BIOMARKERS', yPos, colors);
    yPos += 8;

    const biomarkerData: string[][] = [];
    if (data.lpA !== undefined) {
      biomarkerData.push(['Lipoprotein(a)', `${data.lpA.toFixed(1)} nmol/L`, data.lpA > 50 ? 'Elevated' : 'Normal']);
    }
    if (data.crp !== undefined) {
      biomarkerData.push(['C-Reactive Protein (CRP)', `${data.crp.toFixed(2)} mg/L`, data.crp > 3 ? 'Elevated' : 'Normal']);
    }
    if (data.homocysteine !== undefined) {
      biomarkerData.push(['Homocysteine', `${data.homocysteine.toFixed(1)} µmol/L`, data.homocysteine > 15 ? 'Elevated' : 'Normal']);
    }

    if (biomarkerData.length > 0) {
      const colorObj = colors as { primary: string; secondary: string; danger: string };
      doc.autoTable({
        startY: yPos,
        head: [['Biomarker', 'Value', 'Status']],
        body: biomarkerData,
        theme: 'grid',
        headStyles: { fillColor: this.hexToRgb(colorObj.primary), textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 }
        }
      });

      return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    return yPos;
  }

  /**
   * Add medication analysis
   */
  private addMedicationAnalysis(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    const colorObj = colors as { primary: string; secondary: string; danger: string };
    this.addSectionTitle(doc, '5. CURRENT MEDICATIONS & EFFICACY', yPos, colors);
    yPos += 8;

    const medData = data.medications.map(m => [
      m.name,
      m.class,
      `${Math.round(m.efficacy * 100)}%`
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Medication', 'Class', 'Efficacy']],
      body: medData,
      theme: 'grid',
      headStyles: { fillColor: this.hexToRgb(colorObj.secondary), textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 }
      }
    });

    yPos = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // Medication recommendations
    const totalEfficacy = data.medications.reduce((sum, m) => sum + m.efficacy, 0) / data.medications.length;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    const medNote = `Combined Medication Efficacy: ${Math.round(totalEfficacy * 100)}% - ${
      totalEfficacy > 0.7 ? 'Adequate medication coverage' :
      totalEfficacy > 0.5 ? 'Moderate medication coverage - Consider optimization' :
      'Suboptimal medication coverage - Consult with healthcare provider'
    }`;
    
    doc.text(medNote, 15, yPos, { maxWidth: doc.internal.pageSize.getWidth() - 30 });

    return yPos + 10;
  }

  /**
   * Add trend analysis
   */
  private addTrendAnalysis(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    this.addSectionTitle(doc, '6. RISK TREND & PROJECTIONS', yPos, colors);
    yPos += 8;

    const projectionData = [
      ['Time Frame', 'Projected Risk', 'Status'],
      ['Current', `${Math.round(data.riskScore)}%`, 'Baseline'],
      ['3 Months', `${Math.round(data.projectionRisk3M || data.riskScore)}%`, this.getTrendIndicator(data.riskScore, data.projectionRisk3M)],
      ['6 Months', `${Math.round(data.projectionRisk6M || data.riskScore)}%`, this.getTrendIndicator(data.riskScore, data.projectionRisk6M)],
      ['12 Months', `${Math.round(data.projectionRisk12M || data.riskScore)}%`, this.getTrendIndicator(data.riskScore, data.projectionRisk12M)]
    ];

    doc.autoTable({
      startY: yPos,
      head: [projectionData[0]],
      body: projectionData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: this.hexToRgb(colorObj.primary), textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 50 },
        2: { cellWidth: 60 }
      }
    });

    return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  /**
   * Add data quality section
   */
  private addDataQuality(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    this.addSectionTitle(doc, '7. DATA QUALITY & CONFIDENCE', yPos, colors);
    yPos += 8;

    // Quality metrics
    const qualityText = `
Data Completeness: ${Math.round(data.dataQuality)}%
Prediction Confidence: ${Math.round(data.confidence)}%
Uncertainty Range: ${data.uncertaintyRange ? `${Math.round(data.uncertaintyRange.lower)}% - ${Math.round(data.uncertaintyRange.upper)}%` : 'N/A'}

${data.dataQuality > 80 ? '✓ Data quality is excellent - High confidence in prediction' :
  data.dataQuality > 60 ? '⚠ Data quality is adequate - Moderate confidence in prediction' :
  '⚠ Data quality is limited - Lower confidence in prediction, consider providing more information'}
    `;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(qualityText.trim(), 15, yPos, { maxWidth: doc.internal.pageSize.getWidth() - 30 });

    return yPos + 35;
  }

  /**
   * Add personalized recommendations
   */
  private addRecommendations(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    if (yPos > 250) {
      doc.addPage();
      yPos = 15;
    }

    this.addSectionTitle(doc, '8. PERSONALIZED RECOMMENDATIONS', yPos, colors);
    yPos += 8;

    const recommendations = this.generateRecommendations(data);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    recommendations.forEach((rec, index) => {
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${rec.title}`, 15, yPos);
      yPos += 5;

      doc.setFont(undefined, 'normal');
      const descLines = doc.splitTextToSize(rec.description, doc.internal.pageSize.getWidth() - 30);
      doc.text(descLines, 20, yPos);
      yPos += descLines.length * 4 + 3;

      if (yPos > 250) {
        doc.addPage();
        yPos = 15;
      }
    });

    return yPos;
  }

  /**
   * Add emergency resources for high-risk patients
   */
  private addEmergencyResources(doc: jsPDF, data: PredictionData, colors: unknown, yPos: number): number {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    if (yPos > 245) {
      doc.addPage();
      yPos = 15;
    }

    // Warning box
    doc.setFillColor(...this.hexToRgb(colorObj.danger));
    doc.rect(10, yPos, doc.internal.pageSize.getWidth() - 20, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('⚠ HIGH-RISK ALERT', 15, yPos + 8);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('This assessment indicates elevated cardiovascular risk.', 15, yPos + 14);
    doc.text('Please consult with a healthcare provider immediately for personalized management.', 15, yPos + 19);
    doc.text('In case of chest pain, shortness of breath, or other emergency symptoms, call emergency services.', 15, yPos + 24);

    yPos += 40;

    // Emergency contact info
    this.addSectionTitle(doc, 'EMERGENCY RESOURCES', yPos, colors);
    yPos += 8;

    const emergencyInfo = [
      'Emergency Services (India): 102 (Ambulance) or 108 (AIKS)',
      'All India Medical Emergency Number: 1298',
      'Heart Disease Hotline: 1800-180-1100 (Toll-free)',
      'Nearest Hospital: Contact your local emergency department',
      'Cardiology Consultation: Recommended within 1-2 weeks'
    ];

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    emergencyInfo.forEach((info, i) => {
      doc.text(`• ${info}`, 15, yPos + i * 5);
    });

    return yPos + emergencyInfo.length * 5 + 5;
  }

  /**
   * Add footer
   */
  private addFooter(doc: jsPDF, timestamp: Date): void {
    const docWithPages = doc as { internal: { pages: unknown[] } };
    const pageCount = docWithPages.internal.pages.length - 1;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10);
      doc.text(`Generated: ${timestamp.toLocaleString()}`, 15, pageHeight - 10);
    }
  }

  /**
   * Helper: Add section title
   */
  private addSectionTitle(doc: jsPDF, title: string, yPos: number, colors: unknown): void {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    doc.setFillColor(...this.hexToRgb(colorObj.primary));
    doc.rect(15, yPos - 4, doc.internal.pageSize.getWidth() - 30, 7, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, yPos + 1);
  }

  /**
   * Helper: Convert hex to RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  /**
   * Helper: Get category color
   */
  private getCategoryColor(category: string, colors: unknown): string {
    const colorObj = colors as { primary: string; secondary: string; danger: string };
    switch (category) {
      case 'Very Low':
        return '#10b981';
      case 'Low':
        return '#3b82f6';
      case 'Moderate':
        return '#f59e0b';
      case 'High':
        return '#ef4444';
      case 'Very High':
        return '#dc2626';
      default:
        return colorObj.primary;
    }
  }

  /**
   * Helper: Get parameter status
   */
  private getParameterStatus(value: number, type: string): string {
    const ranges: Record<string, { optimal: [number, number]; warning: [number, number] }> = {
      sbp: { optimal: [0, 120], warning: [120, 140] },
      dbp: { optimal: [0, 80], warning: [80, 90] },
      tc: { optimal: [0, 200], warning: [200, 240] },
      hdl: { optimal: [40, 300], warning: [0, 40] },
      ldl: { optimal: [0, 100], warning: [100, 130] },
      tg: { optimal: [0, 150], warning: [150, 200] },
      glucose: { optimal: [70, 100], warning: [100, 126] },
      bmi: { optimal: [18.5, 24.9], warning: [24.9, 29.9] },
      hr: { optimal: [60, 100], warning: [0, 60] }
    };

    const range = ranges[type];
    if (!range) return 'N/A';

    if (value >= range.optimal[0] && value <= range.optimal[1]) return '✓ Optimal';
    if (value >= range.warning[0] && value <= range.warning[1]) return '⚠ Warning';
    return '✗ Abnormal';
  }

  /**
   * Helper: Extract risk factors from data
   */
  private extractRiskFactors(data: PredictionData): Array<{ factor: string; value: string; impact: string }> {
    const factors: Array<{ factor: string; value: string; impact: string }> = [];

    if (data.smokingStatus !== 'Never') factors.push({ factor: 'Smoking Status', value: data.smokingStatus, impact: 'High' });
    if (data.diabetesStatus !== 'No') factors.push({ factor: 'Diabetes', value: data.diabetesStatus, impact: 'Very High' });
    if (data.hypertension) factors.push({ factor: 'Hypertension', value: 'Present', impact: 'High' });
    if (data.previousMI) factors.push({ factor: 'Previous MI', value: 'Yes', impact: 'Very High' });
    if (data.familyHistory !== 'No') factors.push({ factor: 'Family History', value: data.familyHistory, impact: 'Moderate' });
    if (data.bmi > 25) factors.push({ factor: 'Overweight/Obesity', value: `BMI ${data.bmi.toFixed(1)}`, impact: 'Moderate' });
    if (data.ldlCholesterol > 130) factors.push({ factor: 'Elevated LDL', value: `${Math.round(data.ldlCholesterol)} mg/dL`, impact: 'Moderate' });

    return factors;
  }

  /**
   * Helper: Generate personalized recommendations
   */
  private generateRecommendations(data: PredictionData): Array<{ title: string; description: string }> {
    const recommendations: Array<{ title: string; description: string }> = [];

    // Lifestyle recommendations
    if (data.smokingStatus !== 'Never') {
      recommendations.push({
        title: 'Smoking Cessation',
        description: 'Smoking is a major risk factor. Quitting will significantly reduce your cardiovascular risk. Consider consulting a smoking cessation specialist or using approved cessation aids.'
      });
    }

    if (data.lifestyleScore < 60) {
      recommendations.push({
        title: 'Improve Physical Activity',
        description: 'Aim for at least 150 minutes of moderate-intensity aerobic exercise per week. Start with brisk walking 30 minutes daily, 5 days a week.'
      });
    }

    // Dietary recommendations
    if (data.ldlCholesterol > 130 || data.triglycerides > 150) {
      recommendations.push({
        title: 'Dietary Modifications',
        description: 'Follow a heart-healthy diet rich in fiber, whole grains, and omega-3 fatty acids. Reduce saturated fats and processed foods. Consider consulting a dietician.'
      });
    }

    // Medication recommendations
    if (data.riskCategory === 'High' || data.riskCategory === 'Very High') {
      recommendations.push({
        title: 'Medication Review',
        description: 'Given your risk category, review current medications with your healthcare provider. Consider statin therapy and blood pressure management.'
      });
    }

    // Weight management
    if (data.bmi > 25) {
      recommendations.push({
        title: 'Weight Management',
        description: `Your BMI is ${data.bmi.toFixed(1)}. Aim for a BMI of 18.5-24.9 through balanced diet and regular exercise. A 5-10% weight loss can significantly improve cardiac risk.`
      });
    }

    // Stress management
    recommendations.push({
      title: 'Stress Management',
      description: 'Practice stress-reduction techniques like meditation, yoga, or deep breathing exercises. Chronic stress increases cardiovascular risk.'
    });

    // Sleep recommendations
    recommendations.push({
      title: 'Sleep Quality',
      description: 'Aim for 7-9 hours of quality sleep per night. Poor sleep is associated with increased cardiovascular risk. Maintain consistent sleep schedules.'
    });

    // Medical follow-up
    recommendations.push({
      title: 'Regular Monitoring',
      description: 'Schedule regular check-ups with your cardiologist. Monitor blood pressure, lipids, and glucose regularly. Repeat this assessment annually.'
    });

    return recommendations;
  }

  /**
   * Helper: Get trend indicator
   */
  private getTrendIndicator(currentRisk: number, projectedRisk: number | undefined): string {
    if (!projectedRisk) return 'N/A';
    
    const diff = projectedRisk - currentRisk;
    if (diff < -2) return '↓ Improving';
    if (diff > 2) return '↑ Worsening';
    return '→ Stable';
  }

  /**
   * Download PDF file
   */
  downloadPDF(pdf: jsPDF, patientName: string): void {
    const filename = `Cardiac-Risk-Report-${patientName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  /**
   * Get PDF as blob
   */
  getPDFBlob(pdf: jsPDF): Blob {
    return pdf.output('blob');
  }
}

export default new PDFReportGenerator();
