import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { mlService } from '@/services/mlService';
import { useToast } from '@/hooks/use-toast';
import { History, Calendar, TrendingUp, TrendingDown, Minus, Search, Filter, Download, Eye } from 'lucide-react';

interface MedicalRecord {
  id: string;
  assessment_date: string;
  patient_data: any;
  prediction_result: any;
  created_at: string;
}

export default function MedicalHistory() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserAndHistory();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, riskFilter]);

  const fetchUserAndHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const history = await mlService.getMedicalHistory(user.id);
        setRecords(history || []);
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medical history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        const riskLevel = record.prediction_result?.prediction?.riskLevel?.toLowerCase() || '';
        const date = new Date(record.assessment_date).toLocaleDateString().toLowerCase();
        return riskLevel.includes(searchLower) || date.includes(searchLower);
      });
    }

    // Apply risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(record => 
        record.prediction_result?.prediction?.riskLevel?.toLowerCase() === riskFilter
      );
    }

    setFilteredRecords(filtered);
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getRiskTrend = (currentIndex: number) => {
    if (currentIndex >= records.length - 1) return null;
    
    const current = records[currentIndex].prediction_result?.prediction?.riskScore || 0;
    const previous = records[currentIndex + 1].prediction_result?.prediction?.riskScore || 0;
    
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  };

  const calculateAverageRiskScore = () => {
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, record) => 
      acc + (record.prediction_result?.prediction?.riskScore || 0), 0
    );
    return sum / records.length;
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Risk Level', 'Risk Score', 'Confidence', 'Age', 'Blood Pressure', 'Cholesterol'].join(','),
      ...records.map(record => [
        new Date(record.assessment_date).toLocaleDateString(),
        record.prediction_result?.prediction?.riskLevel || '',
        record.prediction_result?.prediction?.riskScore || '',
        record.prediction_result?.prediction?.confidence || '',
        record.patient_data?.age || '',
        `${record.patient_data?.bloodPressureSystolic || ''}/${record.patient_data?.bloodPressureDiastolic || ''}`,
        record.patient_data?.cholesterol || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading medical history...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please log in to view your medical history
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Medical History</h1>
          <p className="text-muted-foreground">
            Track your heart health assessments and progress over time
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold">{records.length}</p>
                </div>
                <History className="h-8 w-8 text-medical-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Risk Score</p>
                  <p className="text-2xl font-bold">{calculateAverageRiskScore().toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-medical-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Risk</p>
                  <p className="text-2xl font-bold text-success">
                    {records.filter(r => r.prediction_result?.prediction?.riskLevel?.toLowerCase() === 'low').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-2xl font-bold text-destructive">
                    {records.filter(r => r.prediction_result?.prediction?.riskLevel?.toLowerCase() === 'high').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by date or risk level..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportData} disabled={records.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
              <p className="text-muted-foreground mb-4">
                {records.length === 0 
                  ? "You haven't completed any health assessments yet." 
                  : "No records match your current filters."}
              </p>
              {records.length === 0 && (
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Take Your First Assessment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record, index) => {
              const riskLevel = record.prediction_result?.prediction?.riskLevel || 'Unknown';
              const riskScore = record.prediction_result?.prediction?.riskScore || 0;
              const confidence = record.prediction_result?.prediction?.confidence || 0;
              const trend = getRiskTrend(records.findIndex(r => r.id === record.id));

              return (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(record.assessment_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <Badge variant={getRiskBadgeVariant(riskLevel)}>
                          {riskLevel} Risk
                        </Badge>
                        
                        {trend && (
                          <div className="flex items-center gap-1">
                            {trend === 'up' && <TrendingUp className="h-4 w-4 text-destructive" />}
                            {trend === 'down' && <TrendingDown className="h-4 w-4 text-success" />}
                            {trend === 'same' && <Minus className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {selectedRecord?.id === record.id ? 'Hide' : 'View'} Details
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className="text-xl font-semibold">{riskScore.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-xl font-semibold">{confidence.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Age at Assessment</p>
                        <p className="text-xl font-semibold">{record.patient_data?.age || 'N/A'}</p>
                      </div>
                    </div>

                    {selectedRecord?.id === record.id && (
                      <div className="border-t pt-4 mt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">Key Measurements</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Blood Pressure:</span>
                                <span>
                                  {record.patient_data?.bloodPressureSystolic || 'N/A'}/
                                  {record.patient_data?.bloodPressureDiastolic || 'N/A'} mmHg
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cholesterol:</span>
                                <span>{record.patient_data?.cholesterol || 'N/A'} mg/dL</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Heart Rate:</span>
                                <span>{record.patient_data?.restingHeartRate || 'N/A'} bpm</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">BMI:</span>
                                <span>
                                  {record.patient_data?.height && record.patient_data?.weight
                                    ? (record.patient_data.weight / Math.pow(record.patient_data.height / 100, 2)).toFixed(1)
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-3">Risk Factors</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Smoking:</span>
                                <span>{record.patient_data?.smoking ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Diabetes:</span>
                                <span>{record.patient_data?.diabetes ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Family History:</span>
                                <span>{record.patient_data?.familyHistory ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Exercise (hrs/week):</span>
                                <span>{record.patient_data?.exerciseHours || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {record.prediction_result?.explanation && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold mb-2">AI Analysis</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.prediction_result.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}