/**
 * Model Versioning & Version Control Service
 * Implements model versioning with rollback capability, A/B testing support, and version tracking
 * 
 * Phase 4 Task 2: Model Version Control System
 */

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'testing';
  modelType: 'ensemble' | 'logistic' | 'randomforest' | 'gradientboosting';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  trainedOn: number; // sample count
  metrics: {
    sensitivity: number;
    specificity: number;
    ppv: number;
    npv: number;
    dataQuality: number;
    confidenceScore: number;
  };
  features: string[]; // list of features used
  hyperparameters: Record<string, any>;
  dependencies: string[]; // other model versions this depends on
  changelog: ChangelogEntry[];
  performanceTests: PerformanceTest[];
  metadata: Record<string, any>;
}

export interface ChangelogEntry {
  timestamp: Date;
  author: string;
  change: string;
  detail: string;
  severity: 'minor' | 'patch' | 'feature' | 'breaking';
}

export interface PerformanceTest {
  id: string;
  timestamp: Date;
  testName: string;
  passed: boolean;
  metrics: Record<string, number>;
  issues: string[];
  notes: string;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'active' | 'completed';
  versionA: string; // version ID
  versionB: string; // version ID
  splitRatio: number; // 0.5 = 50-50 split
  successMetric: string; // which metric to track
  successThreshold: number;
  results?: ABTestResult;
}

export interface ABTestResult {
  completedAt: Date;
  versionAMetrics: Record<string, number>;
  versionBMetrics: Record<string, number>;
  improvement: number; // percentage
  statSignificant: boolean;
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  notes: string;
}

export interface ModelComparison {
  versions: ModelVersion[];
  comparisonDate: Date;
  metrics: {
    accuracy: number[];
    precision: number[];
    recall: number[];
    f1Score: number[];
    auc: number[];
  };
  bestPerformer: string; // version ID
  recommendation: string;
}

class ModelVersioningService {
  private versions: Map<string, ModelVersion> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private rollbackHistory: Array<{ timestamp: Date; fromVersion: string; toVersion: string; reason: string }> = [];
  private versionCounter: number = 0;

  /**
   * Create a new model version
   */
  createVersion(versionData: Omit<ModelVersion, 'id' | 'createdAt' | 'updatedAt' | 'changelog' | 'performanceTests'>): ModelVersion {
    const id = `model-v${++this.versionCounter}-${Date.now()}`;
    
    const version: ModelVersion = {
      ...versionData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      changelog: [
        {
          timestamp: new Date(),
          author: 'system',
          change: 'Model version created',
          detail: `Created new ${versionData.modelType} model with ${versionData.trainedOn} samples`,
          severity: 'feature'
        }
      ],
      performanceTests: []
    };

    this.versions.set(id, version);
    return version;
  }

  /**
   * Get a specific model version
   */
  getVersion(versionId: string): ModelVersion | null {
    return this.versions.get(versionId) || null;
  }

  /**
   * List all versions with optional filtering
   */
  listVersions(filter?: { status?: string; modelType?: string }): ModelVersion[] {
    let versions = Array.from(this.versions.values());

    if (filter?.status) {
      versions = versions.filter(v => v.status === filter.status);
    }
    if (filter?.modelType) {
      versions = versions.filter(v => v.modelType === filter.modelType);
    }

    return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get active version
   */
  getActiveVersion(): ModelVersion | null {
    const versions = this.listVersions({ status: 'active' });
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Update version status
   */
  updateVersionStatus(versionId: string, newStatus: 'active' | 'archived' | 'testing'): ModelVersion | null {
    const version = this.versions.get(versionId);
    if (!version) return null;

    // If activating a new version, deactivate the previous one
    if (newStatus === 'active') {
      const activeVersions = this.listVersions({ status: 'active' });
      activeVersions.forEach(v => {
        if (v.id !== versionId) {
          v.status = 'archived';
          v.updatedAt = new Date();
        }
      });
    }

    version.status = newStatus;
    version.updatedAt = new Date();
    version.changelog.push({
      timestamp: new Date(),
      author: 'system',
      change: `Version status updated to ${newStatus}`,
      detail: `Model version transitioned to ${newStatus} status`,
      severity: 'minor'
    });

    return version;
  }

  /**
   * Add changelog entry
   */
  addChangelogEntry(
    versionId: string,
    author: string,
    change: string,
    detail: string,
    severity: 'minor' | 'patch' | 'feature' | 'breaking' = 'minor'
  ): ModelVersion | null {
    const version = this.versions.get(versionId);
    if (!version) return null;

    version.changelog.push({
      timestamp: new Date(),
      author,
      change,
      detail,
      severity
    });

    version.updatedAt = new Date();
    return version;
  }

  /**
   * Add performance test result
   */
  addPerformanceTest(versionId: string, test: Omit<PerformanceTest, 'id'>): ModelVersion | null {
    const version = this.versions.get(versionId);
    if (!version) return null;

    const testId = `test-${Date.now()}`;
    const fullTest: PerformanceTest = {
      ...test,
      id: testId
    };

    version.performanceTests.push(fullTest);

    if (!test.passed) {
      this.addChangelogEntry(
        versionId,
        'system',
        'Performance test failed',
        `Test ${test.testName} failed with issues: ${test.issues.join(', ')}`,
        'patch'
      );
    }

    version.updatedAt = new Date();
    return version;
  }

  /**
   * Compare multiple versions
   */
  compareVersions(versionIds: string[]): ModelComparison {
    const versions = versionIds
      .map(id => this.versions.get(id))
      .filter((v): v is ModelVersion => v !== null);

    const metrics = {
      accuracy: versions.map(v => v.accuracy),
      precision: versions.map(v => v.precision),
      recall: versions.map(v => v.recall),
      f1Score: versions.map(v => v.f1Score),
      auc: versions.map(v => v.auc)
    };

    const avgAccuracy = metrics.accuracy.reduce((a, b) => a + b, 0) / metrics.accuracy.length;
    const bestPerformer = versions.reduce((best, v) => v.accuracy > best.accuracy ? v : best).id;

    const comparison: ModelComparison = {
      versions,
      comparisonDate: new Date(),
      metrics,
      bestPerformer,
      recommendation: this.generateComparisonRecommendation(versions)
    };

    return comparison;
  }

  /**
   * Create A/B test configuration
   */
  createABTest(config: Omit<ABTestConfig, 'id' | 'createdAt' | 'results'>): ABTestConfig {
    const id = `abtest-${Date.now()}`;
    
    const abTest: ABTestConfig = {
      ...config,
      id,
      createdAt: new Date()
    };

    this.abTests.set(id, abTest);
    return abTest;
  }

  /**
   * Get A/B test
   */
  getABTest(testId: string): ABTestConfig | null {
    return this.abTests.get(testId) || null;
  }

  /**
   * List A/B tests
   */
  listABTests(filter?: { status?: string }): ABTestConfig[] {
    let tests = Array.from(this.abTests.values());

    if (filter?.status) {
      tests = tests.filter(t => t.status === filter.status);
    }

    return tests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Complete A/B test with results
   */
  completeABTest(testId: string, result: ABTestResult): ABTestConfig | null {
    const test = this.abTests.get(testId);
    if (!test) return null;

    test.status = 'completed';
    test.results = result;
    test.endDate = new Date();

    // Add changelog to winning version
    const winnerVersionId = result.winner === 'A' ? test.versionA : test.versionB;
    const winnerVersion = this.versions.get(winnerVersionId);
    
    if (winnerVersion) {
      const improvementPct = (result.improvement * 100).toFixed(2);
      this.addChangelogEntry(
        winnerVersionId,
        'system',
        'A/B test winner',
        `Won A/B test "${test.name}" with ${improvementPct}% improvement. Significant: ${result.statSignificant}`,
        'feature'
      );
    }

    return test;
  }

  /**
   * Rollback to a previous version
   */
  rollbackToVersion(targetVersionId: string, reason: string): { success: boolean; previousVersion: string | null; newActiveVersion: ModelVersion | null } {
    const targetVersion = this.versions.get(targetVersionId);
    if (!targetVersion) {
      return { success: false, previousVersion: null, newActiveVersion: null };
    }

    const activeVersions = this.listVersions({ status: 'active' });
    const previousVersionId = activeVersions.length > 0 ? activeVersions[0].id : null;

    // Update statuses
    activeVersions.forEach(v => {
      v.status = 'archived';
      v.updatedAt = new Date();
    });

    targetVersion.status = 'active';
    targetVersion.updatedAt = new Date();

    // Record rollback
    this.rollbackHistory.push({
      timestamp: new Date(),
      fromVersion: previousVersionId || 'unknown',
      toVersion: targetVersionId,
      reason
    });

    // Add changelog
    this.addChangelogEntry(
      targetVersionId,
      'system',
      'Rollback activation',
      `Version activated via rollback. Reason: ${reason}`,
      'breaking'
    );

    return {
      success: true,
      previousVersion: previousVersionId,
      newActiveVersion: targetVersion
    };
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(limit: number = 10): typeof this.rollbackHistory {
    return this.rollbackHistory.slice(-limit).reverse();
  }

  /**
   * Get version statistics
   */
  getVersionStatistics(): {
    totalVersions: number;
    activeVersions: number;
    archivedVersions: number;
    testingVersions: number;
    bestPerformer: ModelVersion | null;
    averageAccuracy: number;
    accuracyTrend: 'improving' | 'declining' | 'stable';
  } {
    const allVersions = Array.from(this.versions.values());
    const activeVersions = allVersions.filter(v => v.status === 'active');
    const archivedVersions = allVersions.filter(v => v.status === 'archived');
    const testingVersions = allVersions.filter(v => v.status === 'testing');

    const bestPerformer = allVersions.reduce((best, v) => v.accuracy > best.accuracy ? v : best, allVersions[0] || null);
    const avgAccuracy = allVersions.length > 0 ? allVersions.reduce((sum, v) => sum + v.accuracy, 0) / allVersions.length : 0;

    // Determine trend
    let accuracyTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (allVersions.length >= 2) {
      const sorted = [...allVersions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const recentAvg = sorted.slice(-5).reduce((sum, v) => sum + v.accuracy, 0) / Math.min(5, sorted.length);
      const olderAvg = sorted.slice(0, Math.max(1, sorted.length - 5)).reduce((sum, v) => sum + v.accuracy, 0) / Math.max(1, sorted.length - 5);
      
      if (recentAvg > olderAvg + 0.5) accuracyTrend = 'improving';
      else if (recentAvg < olderAvg - 0.5) accuracyTrend = 'declining';
    }

    return {
      totalVersions: allVersions.length,
      activeVersions: activeVersions.length,
      archivedVersions: archivedVersions.length,
      testingVersions: testingVersions.length,
      bestPerformer,
      averageAccuracy: avgAccuracy,
      accuracyTrend
    };
  }

  /**
   * Generate model snapshot for comparison
   */
  generateVersionSnapshot(versionId: string): string {
    const version = this.versions.get(versionId);
    if (!version) return '';

    const snapshot = {
      id: version.id,
      name: version.name,
      version: version.version,
      modelType: version.modelType,
      accuracy: version.accuracy,
      f1Score: version.f1Score,
      auc: version.auc,
      featuresCount: version.features.length,
      trainedSamples: version.trainedOn,
      createdAt: version.createdAt.toISOString(),
      status: version.status,
      recentChanges: version.changelog.slice(0, 5)
    };

    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Export version history as report
   */
  exportVersionHistory(): string {
    const versions = this.listVersions();
    let report = '# Model Version History Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    versions.forEach(v => {
      report += `## ${v.name} (${v.version})\n`;
      report += `- **ID**: ${v.id}\n`;
      report += `- **Type**: ${v.modelType}\n`;
      report += `- **Status**: ${v.status}\n`;
      report += `- **Accuracy**: ${(v.accuracy * 100).toFixed(2)}%\n`;
      report += `- **F1 Score**: ${(v.f1Score * 100).toFixed(2)}%\n`;
      report += `- **Created**: ${v.createdAt.toISOString()}\n`;
      report += `- **Trained On**: ${v.trainedOn} samples\n`;
      report += `- **Recent Changes**:\n`;
      
      v.changelog.slice(0, 3).forEach(change => {
        report += `  - ${change.timestamp.toISOString()}: ${change.change}\n`;
      });

      report += '\n';
    });

    // A/B Test summary
    report += '## A/B Tests\n\n';
    const completedTests = this.listABTests({ status: 'completed' });
    completedTests.forEach(test => {
      if (test.results) {
        report += `- **${test.name}**: Winner ${test.results.winner} with ${(test.results.improvement * 100).toFixed(2)}% improvement\n`;
      }
    });

    // Statistics
    const stats = this.getVersionStatistics();
    report += `\n## Statistics\n\n`;
    report += `- **Total Versions**: ${stats.totalVersions}\n`;
    report += `- **Active**: ${stats.activeVersions}\n`;
    report += `- **Average Accuracy**: ${(stats.averageAccuracy * 100).toFixed(2)}%\n`;
    report += `- **Accuracy Trend**: ${stats.accuracyTrend}\n`;

    return report;
  }

  /**
   * Generate comparison recommendation
   */
  private generateComparisonRecommendation(versions: ModelVersion[]): string {
    if (versions.length === 0) return 'No versions to compare';

    const bestVersion = versions.reduce((best, v) => v.accuracy > best.accuracy ? v : best);
    const accuracy = (bestVersion.accuracy * 100).toFixed(2);
    const f1 = (bestVersion.f1Score * 100).toFixed(2);

    // Check for performance stability
    const accuracyVariance = Math.max(...versions.map(v => v.accuracy)) - Math.min(...versions.map(v => v.accuracy));
    
    let recommendation = `Best performing model is "${bestVersion.name}" with ${accuracy}% accuracy and ${f1}% F1 score. `;

    if (accuracyVariance < 0.01) {
      recommendation += 'Performance across versions is very consistent. ';
    } else if (accuracyVariance < 0.05) {
      recommendation += 'Performance is relatively consistent with minor variations. ';
    } else {
      recommendation += 'Significant performance differences detected between versions. ';
    }

    if (bestVersion.auc > 0.95) {
      recommendation += 'Excellent discrimination capability (AUC > 0.95). Recommended for production.';
    } else if (bestVersion.auc > 0.90) {
      recommendation += 'Good discrimination capability. Suitable for deployment.';
    } else {
      recommendation += 'Moderate discrimination capability. Consider further optimization.';
    }

    return recommendation;
  }

  /**
   * Validate version readiness
   */
  validateVersionReadiness(versionId: string): { isReady: boolean; issues: string[]; warnings: string[] } {
    const version = this.versions.get(versionId);
    if (!version) {
      return { isReady: false, issues: ['Version not found'], warnings: [] };
    }

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check accuracy threshold
    if (version.accuracy < 0.85) {
      issues.push(`Accuracy below threshold (${(version.accuracy * 100).toFixed(2)}%)`);
    }

    // Check F1 score
    if (version.f1Score < 0.80) {
      warnings.push(`F1 score is below 0.80 (${(version.f1Score * 100).toFixed(2)}%)`);
    }

    // Check performance tests
    const failedTests = version.performanceTests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      issues.push(`${failedTests.length} performance test(s) failed`);
    }

    // Check features count
    if (version.features.length < 5) {
      warnings.push('Limited number of features being used');
    }

    // Check training data size
    if (version.trainedOn < 1000) {
      warnings.push('Trained on relatively small dataset (< 1000 samples)');
    }

    return {
      isReady: issues.length === 0 && version.status !== 'archived',
      issues,
      warnings
    };
  }
}

export default new ModelVersioningService();
