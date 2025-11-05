import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { PatientData } from '../lib/mockData';

export interface PDFReportData {
  patientInfo: {
    name: string;
    age: number;
    gender: string;
    assessmentDate: string;
  };
  riskAssessment: {
    overallRisk: number;
    riskLevel: string;
    factors: string[];
    confidence?: number;
    confidenceInterval?: {
      lower: number;
      upper: number;
    };
  };
  recommendations: {
    medicines: string[];
    ayurveda: string[];
    yoga: string[];
    diet: string[];
  };
  featureContributions?: {
    feature: string;
    contribution: number;
    percentage: number;
  }[];
  patientData?: PatientData;
  reportType: 'premium' | 'professional';
  reportId: string;
  modelMetadata?: {
    accuracy: number;
    sensitivity: number;
    specificity: number;
    auc: number;
  };
}

export class PDFService {
  static async generateReport(data: PDFReportData): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // ========== PAGE 1: HEADER & SUMMARY ==========
    this.addHeader(pdf, data, margin, pageWidth);
    yPosition = 50;

    // Patient Information
    yPosition = this.addSection(pdf, 'Patient Information', margin, yPosition, pageWidth, pageHeight);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const patientLines = [
      `Name: ${data.patientInfo.name}`,
      `Age: ${data.patientInfo.age} years`,
      `Gender: ${data.patientInfo.gender}`,
      `Assessment Date: ${data.patientInfo.assessmentDate}`,
      `Report ID: ${data.reportId}`
    ];
    
    patientLines.forEach(line => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin + 3, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Risk Assessment Summary
    yPosition = this.addSection(pdf, 'Risk Assessment Summary', margin, yPosition, pageWidth, pageHeight);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const riskColor = data.riskAssessment.riskLevel === 'High' 
      ? [220, 53, 69] 
      : data.riskAssessment.riskLevel === 'Medium' 
        ? [255, 193, 7] 
        : [40, 167, 69];
    
    pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    pdf.text(`Risk Level: ${data.riskAssessment.riskLevel.toUpperCase()}`, margin + 3, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Risk Score: ${data.riskAssessment.overallRisk.toFixed(1)}%`, margin + 3, yPosition);
    yPosition += 7;

    if (data.riskAssessment.confidence) {
      pdf.text(`Confidence: ${(data.riskAssessment.confidence * 100).toFixed(1)}%`, margin + 3, yPosition);
      yPosition += 7;
    }

    if (data.riskAssessment.confidenceInterval) {
      const ci = data.riskAssessment.confidenceInterval;
      pdf.text(
        `95% Confidence Interval: ${ci.lower.toFixed(1)}% - ${ci.upper.toFixed(1)}%`,
        margin + 3,
        yPosition
      );
      yPosition += 10;
    }

    // ========== KEY RISK FACTORS ==========
    if (data.riskAssessment.factors.length > 0) {
      yPosition = this.addSection(pdf, 'Key Risk Factors', margin, yPosition, pageWidth, pageHeight);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      data.riskAssessment.factors.forEach((factor) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        const lines = pdf.splitTextToSize(factor, pageWidth - 2 * margin - 10);
        lines.forEach((line: string, idx: number) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }
          const bullet = idx === 0 ? '•' : ' ';
          pdf.text(`${bullet} ${line}`, margin + 5, yPosition);
          yPosition += 6;
        });
      });
      yPosition += 10;
    }

    // ========== PAGE 2: FEATURE IMPORTANCE & CLINICAL DATA ==========
    if (data.featureContributions && data.featureContributions.length > 0) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }
      
      yPosition = this.addSection(pdf, 'Feature Importance Analysis', margin, yPosition, pageWidth, pageHeight);
      
      // Create simple bar chart representation
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const sortedFeatures = [...data.featureContributions]
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 8); // Top 8 features
      
      sortedFeatures.forEach((feature) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Feature name
        pdf.text(`${feature.feature}:`, margin + 3, yPosition);
        
        // Percentage bar
        const barWidth = (feature.percentage / 100) * (pageWidth - 2 * margin - 50);
        pdf.setFillColor(41, 98, 255);
        pdf.rect(margin + 40, yPosition - 2.5, barWidth, 4, 'F');
        
        // Percentage text
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${feature.percentage.toFixed(1)}%`, margin + 45 + barWidth, yPosition);
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 7;
      });
      yPosition += 10;
    }

    // ========== CLINICAL METRICS ==========
    if (data.patientData) {
      yPosition = this.addSection(pdf, 'Clinical Measurements', margin, yPosition, pageWidth, pageHeight);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const metrics = this.extractClinicalMetrics(data.patientData);
      let col = 0;
      const columnX = [margin + 3, margin + 70];
      let colYPosition = yPosition;
      
      metrics.forEach((metric, index) => {
        if (colYPosition > pageHeight - 20) {
          pdf.addPage();
          colYPosition = margin;
          col = 0;
        }
        
        const x = columnX[col];
        pdf.text(`${metric.label}: ${metric.value}`, x, colYPosition);
        colYPosition += 5;
        
        col = col === 0 ? 1 : 0;
        if (col === 0) {
          colYPosition += 2;
        }
      });
      yPosition = colYPosition + 10;
    }

    // ========== RECOMMENDATIONS ==========
    const recData = data.recommendations;
    const hasRecommendations = 
      (recData.medicines && recData.medicines.length > 0) ||
      (recData.ayurveda && recData.ayurveda.length > 0) ||
      (recData.yoga && recData.yoga.length > 0) ||
      (recData.diet && recData.diet.length > 0);

    if (hasRecommendations) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }
      
      yPosition = this.addSection(pdf, 'Personalized Recommendations', margin, yPosition, pageWidth, pageHeight);
      
      // Medicines
      if (recData.medicines && recData.medicines.length > 0) {
        yPosition = this.addSubsection(pdf, 'Medicines', margin, yPosition, pageWidth, pageHeight);
        yPosition = this.addRecommendationList(pdf, recData.medicines, margin, yPosition, pageWidth, pageHeight);
      }
      
      // Ayurveda
      if (recData.ayurveda && recData.ayurveda.length > 0) {
        yPosition = this.addSubsection(pdf, 'Ayurvedic Recommendations', margin, yPosition, pageWidth, pageHeight);
        yPosition = this.addRecommendationList(pdf, recData.ayurveda, margin, yPosition, pageWidth, pageHeight);
      }
      
      // Yoga
      if (recData.yoga && recData.yoga.length > 0) {
        yPosition = this.addSubsection(pdf, 'Yoga & Breathing Exercises', margin, yPosition, pageWidth, pageHeight);
        yPosition = this.addRecommendationList(pdf, recData.yoga, margin, yPosition, pageWidth, pageHeight);
      }
      
      // Diet
      if (recData.diet && recData.diet.length > 0) {
        yPosition = this.addSubsection(pdf, 'Dietary Recommendations', margin, yPosition, pageWidth, pageHeight);
        yPosition = this.addRecommendationList(pdf, recData.diet, margin, yPosition, pageWidth, pageHeight);
      }
    }

    // ========== MODEL INFORMATION (Professional report only) ==========
    if (data.reportType === 'professional' && data.modelMetadata) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }
      
      yPosition = this.addSection(pdf, 'Model Performance Metrics', margin, yPosition, pageWidth, pageHeight);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const metrics = [
        `Accuracy: ${(data.modelMetadata.accuracy * 100).toFixed(1)}%`,
        `Sensitivity: ${(data.modelMetadata.sensitivity * 100).toFixed(1)}%`,
        `Specificity: ${(data.modelMetadata.specificity * 100).toFixed(1)}%`,
        `AUC-ROC: ${data.modelMetadata.auc.toFixed(3)}`
      ];
      
      metrics.forEach(metric => {
        pdf.text(metric, margin + 3, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // ========== FOOTER & DISCLAIMER ==========
    this.addFooter(pdf, pageHeight, margin);

    // Generate filename
    const filename = `${data.reportType}_report_${data.reportId}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    pdf.save(filename);
  }

  /**
   * Add header to PDF
   */
  private static addHeader(pdf: jsPDF, data: PDFReportData, margin: number, pageWidth: number): void {
    pdf.setFillColor(41, 98, 255);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    
    const title = data.reportType === 'professional' 
      ? 'Professional Clinical Assessment'
      : 'Premium Heart Risk Assessment';
    
    pdf.text(title, margin, 15);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Powered by Cardiac Insight AI - Machine Learning Based Cardiovascular Risk Assessment', margin, 28);
  }

  /**
   * Add a main section header
   */
  private static addSection(
    pdf: jsPDF,
    title: string,
    margin: number,
    yPosition: number,
    pageWidth: number,
    pageHeight: number
  ): number {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 98, 255);
    pdf.text(title, margin, yPosition);
    pdf.setTextColor(0, 0, 0);

    // Underline
    pdf.setDrawColor(41, 98, 255);
    pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);

    return yPosition + 8;
  }

  /**
   * Add a subsection header
   */
  private static addSubsection(
    pdf: jsPDF,
    title: string,
    margin: number,
    yPosition: number,
    pageWidth: number,
    pageHeight: number
  ): number {
    if (yPosition > pageHeight - 25) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text(title, margin + 5, yPosition);
    pdf.setTextColor(0, 0, 0);

    return yPosition + 7;
  }

  /**
   * Add a list of recommendations
   */
  private static addRecommendationList(
    pdf: jsPDF,
    items: string[],
    margin: number,
    yPosition: number,
    pageWidth: number,
    pageHeight: number
  ): number {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    items.forEach((item) => {
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = margin;
      }

      const lines = pdf.splitTextToSize(item, pageWidth - 2 * margin - 15);
      lines.forEach((line: string, idx: number) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = margin;
        }

        const bullet = idx === 0 ? '◆' : ' ';
        pdf.text(`${bullet} ${line}`, margin + 10, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
    });

    return yPosition + 5;
  }

  /**
   * Add footer to all pages
   */
  private static addFooter(pdf: jsPDF, pageHeight: number, margin: number): void {
    const footerY = pageHeight - 12;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    
    const disclaimer = 'DISCLAIMER: This report is AI-generated for informational purposes only. Consult a qualified healthcare professional for diagnosis and treatment.';
    const disclaimerLines = pdf.splitTextToSize(disclaimer, pdf.internal.pageSize.getWidth() - 2 * margin);
    
    disclaimerLines.forEach((line: string, idx: number) => {
      pdf.text(line, margin, footerY - idx * 4);
    });
  }

  /**
   * Extract clinical metrics from patient data
   */
  private static extractClinicalMetrics(patientData: PatientData): { label: string; value: string }[] {
    const metrics: { label: string; value: string }[] = [];

    if (patientData.age) metrics.push({ label: 'Age', value: `${patientData.age} years` });
    if (patientData.gender) metrics.push({ label: 'Gender', value: patientData.gender });
    if (patientData.restingBP) metrics.push({ label: 'Resting BP', value: `${patientData.restingBP} mmHg` });
    if (patientData.cholesterol) metrics.push({ label: 'Cholesterol', value: `${patientData.cholesterol} mg/dL` });
    if (patientData.maxHR) metrics.push({ label: 'Max HR', value: `${patientData.maxHR} bpm` });
    if (patientData.oldpeak !== undefined) metrics.push({ label: 'ST Depression', value: `${patientData.oldpeak.toFixed(1)}mm` });
    if (patientData.smoking) metrics.push({ label: 'Smoking', value: 'Yes' });
    if (patientData.diabetes) metrics.push({ label: 'Diabetes', value: 'Yes' });
    if (patientData.stressLevel) metrics.push({ label: 'Stress Level', value: `${patientData.stressLevel}/10` });
    if (patientData.sleepHours) metrics.push({ label: 'Sleep Hours', value: `${patientData.sleepHours}h/day` });
    if (patientData.physicalActivity) metrics.push({ label: 'Activity Level', value: patientData.physicalActivity });

    return metrics;
  }

  static async generateReportFromHTML(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // 10mm margin from top

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }
}