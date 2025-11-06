import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Activity,
  Shield,
  Brain,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  HeartbeatAnimation,
  HeartPulse,
  DNAWave,
  MedicalShieldIcon,
  AIChipIcon,
  WaveformBackground,
} from "@/components/ui/animated-medical-icons";
import { HeroVisual } from "@/components/ui/hero-visual";
import { NeuralBackgroundMesh } from "@/components/ui/neural-background-mesh";
import { MedicalFloatingParticles } from "@/components/ui/medical-floating-particles";
import { PremiumTestimonialCarousel } from "@/components/ui/premium-testimonial-carousel";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const scaleInVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
    },
  };

  const testimonials = [
    {
      name: "Sathvik G Bhat",
      role: "Final Year MBBS Student",
      institution:
        "Bangalore Medical College and Research Institute, Bengaluru",
      content:
        "This project is a commendable step toward integrating artificial intelligence with predictive medicine. The model's focus on early risk stratification for heart attacks holds immense clinical potential — especially in preventive cardiology. I particularly appreciate the effort to make data-driven insights accessible to the general population, which could bridge the gap between engineering innovation and patient-centered care.",
      avatar: "SB",
      rating: 5,
    },
    {
      name: "Rohan Nikhil Dubeer",
      role: "Final year MBBS student",
      institution: "Bangalore Medical College & Research Institute, Bengaluru",
      content:
        "This is one of the most meaningful and practical use cases of AI in medicine. The app makes cardiovascular risk prediction simple, usable and clinically relevant. With proper validation and ongoing real-world data feedback, it can scale responsibly. I genuinely believe this has the potential to become a mainstream preventive cardiology tool.",
      avatar: "RD",
      rating: 5,
    },
    {
      name: "C S Pranav Bhat",
      role: "MBBS Phase 3 Part 1",
      institution:
        "Bangalore Medical College and Research Institute, Bengaluru",
      content:
        "After using the AI-assisted cardiovascular risk assessment score, I found it remarkably accurate and insightful. Its modern, data-driven approach outperforms outdated tools like the ASCVD score. The LLM-integrated chatbot makes it patient-friendly, and as a future doctor, I'd confidently use it to guide personalized prevention and treatment decisions.",
      avatar: "PB",
      rating: 4,
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "Medical-Grade AI",
      description:
        "Advanced machine learning trained on verified medical datasets with 98.5% accuracy.",
      gradient: "from-teal-500/20 to-cyan-500/20",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "Your data stays private. No storage. Local compute option available for sensitive information.",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
    {
      icon: Activity,
      title: "Real-Time Analysis",
      description:
        "Instant risk assessment with explainable AI insights and personalized recommendations.",
      gradient: "from-cyan-500/20 to-blue-500/20",
    },
    {
      icon: Heart,
      title: "Holistic Care",
      description:
        "Combines modern cardiology with traditional wellness practices for comprehensive health.",
      gradient: "from-rose-500/20 to-pink-500/20",
    },
  ];

  const stats = [
    { value: "98.5%", label: "Accuracy Rate", icon: TrendingUp },
    { value: "50K+", label: "Assessments", icon: Users },
    { value: "24/7", label: "AI Support", icon: Zap },
    { value: "100%", label: "Privacy", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-[#0A0F14] relative overflow-hidden">
      {/* Premium Background Effects */}
      <NeuralBackgroundMesh />
      <MedicalFloatingParticles />
      <WaveformBackground />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10 dark:from-teal-500/5 dark:to-emerald-500/5" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

        <div className="container mx-auto max-w-7xl relative z-10 px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6 text-center lg:text-left"
            >
              {/* Hero Title */}
              <motion.h1
                variants={fadeInUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.15] tracking-tight"
              >
                <motion.span
                  className="block text-foreground mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Understand your
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500 dark:from-teal-400 dark:via-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  heart health
                </motion.span>
                <motion.span
                  className="block text-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  with medical-grade AI
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.8, delay: 0.9 }}
                className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed pt-2"
              >
                Advanced cardiac risk prediction powered by artificial
                intelligence.
                <span className="block mt-3 text-teal-600 dark:text-teal-400 font-semibold">
                  Know your heart health status in minutes, not days.
                </span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={scaleInVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 1.1 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/basic-dashboard")}
                  className="group relative px-10 py-7 text-lg font-bold bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-600 hover:via-emerald-600 hover:to-teal-600 shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-500 overflow-hidden"
                  style={{ backgroundSize: "200% auto" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span className="flex items-center gap-2 relative z-10">
                    <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Check Heart Risk Now
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="group glass dark:glass-dark px-10 py-7 text-lg font-semibold border-2 border-teal-500/30 hover:border-teal-500/80 hover:bg-teal-500/10 transition-all duration-300"
                >
                  <Activity className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  See How It Works
                </Button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                variants={fadeInUpVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 1.3 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3 pt-6 text-sm"
              >
                <motion.div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full glass dark:glass-dark border border-teal-500/20"
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(20, 184, 166, 0.4)",
                  }}
                >
                  <Shield className="w-4 h-4 text-teal-500" />
                  <span className="font-medium text-foreground">
                    HIPAA-aware
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full glass dark:glass-dark border border-teal-500/20"
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(20, 184, 166, 0.4)",
                  }}
                >
                  <Lock className="w-4 h-4 text-teal-500" />
                  <span className="font-medium text-foreground">
                    Private by default
                  </span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full glass dark:glass-dark border border-teal-500/20"
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(20, 184, 166, 0.4)",
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  <span className="font-medium text-foreground">
                    Instant results
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Side - Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              className="relative lg:pl-8"
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 relative">
        {/* Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-transparent to-transparent dark:from-white/5" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-6xl relative z-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 },
                }}
              >
                <Card className="glass dark:glass-dark border-teal-500/20 text-center shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-500 group relative overflow-hidden">
                  {/* Animated Background Gradient */}
                  <motion.div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="pt-8 pb-8 relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                    >
                      <stat.icon className="w-10 h-10 mx-auto mb-4 text-teal-500 group-hover:text-teal-400 transition-colors" />
                    </motion.div>
                    <motion.div
                      className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2"
                      initial={{ scale: 1 }}
                      whileInView={{ scale: [1, 1.1, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1">
              <Sparkles className="w-3 h-3 mr-2" />
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Clinical precision meets{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                ethical AI
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology designed with your health and privacy in mind
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                whileHover={{
                  y: -12,
                  rotateY: 2,
                  transition: { duration: 0.3 },
                }}
              >
                <Card className="glass dark:glass-dark border-teal-500/20 h-full shadow-xl hover:shadow-2xl hover:shadow-teal-500/20 overflow-hidden group relative">
                  {/* Animated Gradient Background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                    initial={false}
                  />

                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    animate={{
                      background: [
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                      ],
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />

                  <CardContent className="p-10 relative z-10">
                    <motion.div
                      className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/50 group-hover:shadow-emerald-500/50 transition-all duration-500"
                      whileHover={{
                        scale: 1.15,
                        rotate: 360,
                        transition: { duration: 0.6 },
                      }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl md:text-3xl font-black mb-4 group-hover:text-teal-500 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Visual */}
      <section className="py-20 px-4 bg-muted/30 dark:bg-white/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Fast, <span className="text-teal-500">Accurate</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Enter Health Data",
                icon: Activity,
                desc: "Input your medical parameters securely",
              },
              {
                step: "02",
                title: "AI Analysis",
                icon: Brain,
                desc: "Our AI processes your data instantly",
              },
              {
                step: "03",
                title: "Get Results",
                icon: Heart,
                desc: "Receive personalized risk assessment",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <Card className="glass dark:glass-dark border-teal-500/20 p-8 text-center">
                  <div className="text-6xl font-bold text-teal-500/20 mb-4">
                    {item.step}
                  </div>
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-teal-500/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">
              <Heart className="w-3 h-3 mr-2 heartbeat" />
              Trusted by Medical Professionals
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              What future doctors are saying
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Real feedback from medical students at leading institutions
            </p>
          </motion.div>

          <PremiumTestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-24 px-4 relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-teal-500/5 to-background" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1">
              <Sparkles className="w-3 h-3 mr-2" />
              Flexible Plans
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose your{" "}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                health journey
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From basic assessments to advanced clinical tools — find the plan
              that fits your needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card className="glass dark:glass-dark border-teal-500/20 h-full shadow-xl hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-500 relative overflow-hidden group">
                {/* Hover gradient */}
                <motion.div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black mb-2">Basic</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Essential heart health monitoring
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-black">Free</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Basic risk assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Standard AI analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Manual data entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Basic health insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Export PDF reports</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => navigate("/basic-dashboard")}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Plan - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -12, transition: { duration: 0.3 } }}
            >
              <Card className="glass dark:glass-dark border-teal-500 h-full shadow-2xl hover:shadow-3xl hover:shadow-teal-500/30 transition-all duration-500 relative overflow-hidden group">
                {/* Popular Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 shadow-lg">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>

                {/* Premium glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />

                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/50"
                      animate={{
                        boxShadow: [
                          "0 10px 30px rgba(20, 184, 166, 0.3)",
                          "0 10px 40px rgba(20, 184, 166, 0.5)",
                          "0 10px 30px rgba(20, 184, 166, 0.3)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <Heart className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-black mb-2 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    Premium
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Advanced AI-powered insights
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-black">₹99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">
                        Everything in Basic, plus:
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Advanced multi-model AI analysis
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Real-time health monitoring
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Personalized recommendations
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Historical trend analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Priority AI assistant support
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Unlimited assessments</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => navigate("/premium-dashboard")}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300"
                    size="lg"
                  >
                    Upgrade to Premium
                    <Sparkles className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Professional Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card className="glass dark:glass-dark border-teal-500/20 h-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 relative overflow-hidden group">
                {/* Hover gradient */}
                <motion.div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black mb-2">Professional</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Clinical-grade tools for healthcare providers
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-black">₹499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">
                        Everything in Premium, plus:
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Multi-patient management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Clinical decision support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Advanced analytics dashboard
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        HIPAA-compliant data storage
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">API access & integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Dedicated support</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => navigate("/professional-dashboard")}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    Go Professional
                    <Brain className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-sm text-muted-foreground">
              All plans include end-to-end encryption and HIPAA-aware security
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-500" />
                <span className="text-xs text-muted-foreground">
                  Secure & Private
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-500" />
                <span className="text-xs text-muted-foreground">
                  Data Protected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                <span className="text-xs text-muted-foreground">
                  Cancel Anytime
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl"
        >
          <Card className="glass dark:glass-dark border-teal-500/20 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10" />
            <CardContent className="p-12 text-center relative z-10">
              <div className="flex justify-center mb-6">
                <HeartPulse />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Take control of your heart health today
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands who trust our AI-powered platform for accurate
                cardiac risk assessment
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/basic-dashboard")}
                className="px-10 py-7 text-lg font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/50 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Cardiac Insight AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              <strong>Medical Disclaimer:</strong> This tool provides AI-powered
              risk assessments and is not a substitute for professional medical
              advice, diagnosis, or treatment. Always consult qualified
              healthcare providers for medical decisions.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4">
              <span>© 2025 Cardiac Insight AI</span>
              <span>•</span>
              <span>Privacy-focused</span>
              <span>•</span>
              <span>Built by Shrisha & Venu </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
