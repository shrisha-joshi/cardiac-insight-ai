import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Dashboard from '@/components/Dashboard';
import heroImage from '@/assets/medical-hero.jpg';
import { Heart, Shield, BarChart3, Users, CheckCircle, ArrowRight, Activity, Stethoscope, TrendingUp } from 'lucide-react';

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <Badge variant="outline" className="mb-6 text-medical-primary border-medical-primary">
            <Heart className="h-3 w-3 mr-1" />
            AI-Powered Healthcare
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Heart Attack
            <span className="text-medical-primary"> Risk</span>
            <br />
            Prediction
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Advanced AI-powered cardiovascular risk assessment using clinical parameters 
            and machine learning to predict heart attack probability with high accuracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => setShowDashboard(true)}
            >
              Start Risk Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Learn More
              <Activity className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-accent/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Advanced Risk Assessment Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive cardiovascular analysis using the latest medical research and AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-medical-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-medical-primary" />
                </div>
                <CardTitle className="text-xl">AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Uses advanced machine learning models trained on extensive cardiovascular datasets 
                  to provide accurate risk predictions with confidence scores.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-medical-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-medical-secondary" />
                </div>
                <CardTitle className="text-xl">Comprehensive Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Analyzes 12+ clinical parameters including blood pressure, cholesterol, ECG results, 
                  and lifestyle factors for thorough risk assessment.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-medical-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-medical-primary" />
                </div>
                <CardTitle className="text-xl">Personalized Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Provides detailed explanations of risk factors and personalized recommendations 
                  for improving cardiovascular health based on your specific profile.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple three-step process to get your comprehensive cardiovascular risk assessment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Enter Patient Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Input comprehensive patient information including vital signs, medical history, 
                and lifestyle factors through our intuitive form interface.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our advanced machine learning model processes the data and calculates 
                risk probability using validated cardiovascular prediction algorithms.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Results</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive detailed risk assessment with explanations, confidence scores, 
                and personalized recommendations for heart health improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-accent/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-medical-primary mb-2">95%</div>
              <p className="text-muted-foreground">Prediction Accuracy</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-medical-secondary mb-2">12+</div>
              <p className="text-muted-foreground">Clinical Parameters</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-medical-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Training Records</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-medical-secondary mb-2">24/7</div>
              <p className="text-muted-foreground">Available Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Shield className="h-6 w-6" />
                Important Medical Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                <strong>This tool is for educational and research purposes only.</strong> The predictions and recommendations 
                provided by this AI system should not be used as a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    This Tool Can Help:
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Identify potential cardiovascular risk factors</li>
                    <li>• Provide educational insights about heart health</li>
                    <li>• Support clinical decision-making as a supplementary tool</li>
                    <li>• Track health metrics over time</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-medical-primary" />
                    Always Consult Your Doctor:
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• For official medical diagnosis</li>
                    <li>• Before making treatment decisions</li>
                    <li>• If you experience chest pain or symptoms</li>
                    <li>• For personalized medical advice</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-24 bg-gradient-to-r from-medical-primary/5 to-medical-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Health Assessment Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select the plan that best fits your health monitoring needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className="text-center hover:shadow-lg transition-shadow relative">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Basic Assessment</CardTitle>
                <div className="text-4xl font-bold text-medical-primary mb-4">Free</div>
                <CardDescription>Essential heart risk evaluation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Basic risk prediction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">10 clinical parameters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">General recommendations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Basic health tips</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  variant="outline"
                  onClick={() => setShowDashboard(true)}
                >
                  Start Free Assessment
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="text-center hover:shadow-lg transition-shadow relative border-medical-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-medical-primary text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Premium Assessment</CardTitle>
                <div className="text-4xl font-bold text-medical-primary mb-4">₹999</div>
                <CardDescription>Comprehensive lifestyle analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Advanced AI prediction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">15+ lifestyle questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Ayurvedic recommendations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Yoga & exercise plans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Dietary supplements advice</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6"
                  onClick={() => alert('Premium assessment requires Supabase integration for payment processing')}
                >
                  Choose Premium
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="text-center hover:shadow-lg transition-shadow relative">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Professional</CardTitle>
                <div className="text-4xl font-bold text-medical-primary mb-4">₹2999</div>
                <CardDescription>Complete health ecosystem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">All Premium features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">AI Health Chatbot</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Monthly health reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Family health tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">24/7 health support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6" 
                  variant="outline"
                  onClick={() => alert('Professional plan requires Supabase integration for full features')}
                >
                  Choose Professional
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Assess Your Heart Health?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Get started with our comprehensive cardiovascular risk assessment tool. 
            Takes just 5 minutes to complete.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-12 py-6"
            onClick={() => setShowDashboard(true)}
          >
            Begin Assessment Now
            <Heart className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;