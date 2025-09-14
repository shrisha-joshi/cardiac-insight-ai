import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Activity, Shield, Stethoscope, CheckCircle, Users, TrendingUp, Clock, Database, AlertTriangle } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import { useDatabaseStatus } from '@/hooks/use-database-status';
import heroImage from '@/assets/medical-hero.jpg';

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const databaseStatus = useDatabaseStatus();

  if (showDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Database Status Banner */}
      {!databaseStatus.checking && (!databaseStatus.isConfigured || !databaseStatus.tablesExist) && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <Alert className="border-yellow-200 bg-transparent">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <span className="font-semibold">Database Setup Required:</span> 
                {!databaseStatus.isConfigured 
                  ? " Supabase is not configured. Some features may not work properly."
                  : " Database tables are missing. Please set up the database to use all features."
                }
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 ml-2 h-auto text-yellow-700 hover:text-yellow-900"
                  onClick={() => window.location.href = '/database-status'}
                >
                  <Database className="h-3 w-3 mr-1" />
                  Check Database Status
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-medical-primary/10 via-background to-medical-secondary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  AI-Powered <span className="text-medical-primary">Heart Attack</span> Risk Assessment
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Advanced machine learning algorithms combined with traditional Ayurvedic wisdom 
                  to predict cardiovascular risks and provide personalized health recommendations.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => window.location.href = '/basic-dashboard'}
                >
                  Start Risk Assessment
                  <Heart className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6"
                >
                  Learn More
                  <Activity className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-medical-primary">98.5%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-medical-secondary">50K+</div>
                  <div className="text-sm text-muted-foreground">Assessments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-medical-primary/20 to-medical-secondary/20 rounded-3xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Medical professional with patient" 
                className="relative z-10 rounded-3xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Comprehensive Health Assessment
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with traditional wellness practices
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-medical-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-medical-primary" />
                </div>
                <CardTitle className="text-xl">Advanced ML Algorithms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  State-of-the-art machine learning models trained on extensive medical datasets for accurate risk prediction.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-medical-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-medical-secondary" />
                </div>
                <CardTitle className="text-xl">Ayurvedic Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Traditional Indian medicine principles combined with modern healthcare for holistic wellness.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Customized lifestyle, diet, and exercise recommendations based on your unique health profile.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Health Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the plan that best fits your health monitoring needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow p-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold mb-2">Basic</CardTitle>
                <div className="text-4xl font-bold text-green-600 mb-2">Free</div>
                <p className="text-muted-foreground">forever</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Basic risk assessment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">All PatientForm features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Basic AI insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Limited document upload (2 files)</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" onClick={() => window.location.href = '/basic-dashboard'}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow p-8 border-medical-primary">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-medical-primary text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold mb-2">Premium</CardTitle>
                <div className="text-4xl font-bold text-medical-primary mb-2">₹499</div>
                <p className="text-muted-foreground">per month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Advanced assessment (15+ factors)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Weekly health reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Ayurvedic recommendations</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" onClick={() => window.location.href = '/premium-dashboard'}>
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow p-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold mb-2">Professional</CardTitle>
                <div className="text-4xl font-bold text-medical-secondary mb-2">₹1,499</div>
                <p className="text-muted-foreground">per month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Comprehensive assessment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Daily monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-medical-primary" />
                    <span className="text-sm">Family health tracking</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" onClick={() => window.location.href = '/professional-dashboard'}>
                  Go Professional
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Shield className="h-6 w-6" />
                Important Medical Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                <strong>This tool is for educational purposes only.</strong> Always consult with healthcare professionals for medical advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;