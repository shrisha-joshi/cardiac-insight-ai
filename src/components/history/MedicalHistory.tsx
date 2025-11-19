import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { History, Calendar, Search, Filter, Download } from 'lucide-react';
import { usePredictionHistory } from '@/hooks/use-prediction-history';
import PredictionHistory from '@/components/PredictionHistory';

export default function MedicalHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const { toast } = useToast();
  
  // Use the unified prediction history hook
  const { predictions, addFeedback, getFeedbackStats, userId, isLoading } = usePredictionHistory();

  // Filter predictions based on search and risk level
  const filteredPredictions = predictions.filter(prediction => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const riskLevel = prediction.riskLevel?.toLowerCase() || '';
      const date = new Date(prediction.timestamp).toLocaleDateString().toLowerCase();
      if (!riskLevel.includes(searchLower) && !date.includes(searchLower)) {
        return false;
      }
    }

    // Apply risk level filter (normalize medium/moderate)
    if (riskFilter !== 'all') {
      const normalizedPredictionLevel = prediction.riskLevel?.toLowerCase() === 'medium' ? 'medium' : prediction.riskLevel?.toLowerCase();
      const normalizedFilterLevel = riskFilter === 'moderate' ? 'medium' : riskFilter;
      if (normalizedPredictionLevel !== normalizedFilterLevel) {
        return false;
      }
    }

    return true;
  });

  const exportData = () => {
    const csvContent = [
      ['Date', 'Risk Level', 'Risk Score', 'Confidence', 'Age', 'Blood Pressure', 'Cholesterol'].join(','),
      ...predictions.map(pred => [
        new Date(pred.timestamp).toLocaleDateString(),
        pred.riskLevel || 'N/A',
        pred.riskScore || 0,
        pred.confidence || 0,
        pred.patientData?.age || 'N/A',
        pred.patientData?.restingBP || 'N/A',
        pred.patientData?.cholesterol || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Exported ${predictions.length} medical records to CSV`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Medical History
          </h1>
          <p className="text-muted-foreground">
            Track your cardiovascular health assessments over time
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold text-foreground">{predictions.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Risk Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    {predictions.length > 0 
                      ? Math.round(predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length)
                      : 0}%
                  </p>
                </div>
                <History className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk Assessments</p>
                  <p className="text-2xl font-bold text-destructive">
                    {predictions.filter(p => p.riskLevel === 'high').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-destructive/20 dark:bg-destructive/30 flex items-center justify-center">
                  <span className="text-destructive font-bold">!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified Predictions</p>
                  <p className="text-2xl font-bold text-success">
                    {getFeedbackStats().correct}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-success/20 dark:bg-success/30 flex items-center justify-center">
                  <span className="text-success font-bold">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by date or risk level..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={exportData}
                  disabled={predictions.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            {filteredPredictions.length !== predictions.length && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredPredictions.length} of {predictions.length} assessments
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prediction History Component */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Assessment History</CardTitle>
            <CardDescription>
              Detailed view of all your cardiovascular risk assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PredictionHistory 
              predictions={filteredPredictions}
              userId={userId}
              onAddFeedback={addFeedback}
              feedbackStats={getFeedbackStats()}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
