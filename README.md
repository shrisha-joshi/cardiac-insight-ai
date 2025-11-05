# Cardiac Insight AI - CVD Risk Assessment# Welcome to your Lovable project



A professional cardiovascular disease (CVD) risk assessment application with Indian population optimization.## Project info



## 🚀 Quick Start**URL**: https://lovable.dev/projects/ce6c9c1a-4008-4e2e-b906-16be20fa5f72



```bash## How can I edit this code?

# Install dependencies

npm installThere are several ways of editing your application.



# Start development server**Use Lovable**

npm run dev

```Simply visit the [Lovable Project](https://lovable.dev/projects/ce6c9c1a-4008-4e2e-b906-16be20fa5f72) and start prompting.



Visit: **http://localhost:8080/**Changes made via Lovable will be committed automatically to this repo.



## 📋 Prerequisites**Use your preferred IDE**



- Node.js 18+If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

- npm or yarn

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## 🏗️ Project Structure

Follow these steps:

```

cardiac-insight-ai/```sh

├── src/# Step 1: Clone the repository using the project's Git URL.

│   ├── components/          # React componentsgit clone <YOUR_GIT_URL>

│   │   ├── EnhancedPatientForm.tsx       # 25-feature form

│   │   ├── MultiModelRiskDisplay.tsx     # Multi-model results# Step 2: Navigate to the project directory.

│   │   └── ...cd <YOUR_PROJECT_NAME>

│   ├── lib/                 # Services & utilities

│   │   ├── enhancedCVDRiskAssessment.ts  # Risk calculation# Step 3: Install the necessary dependencies.

│   │   ├── dataPreprocessingService.ts   # Data preprocessingnpm i

│   │   └── indianCVDDataset.ts           # Sample data

│   ├── __tests__/           # Unit tests# Step 4: Start the development server with auto-reloading and an instant preview.

│   └── ...npm run dev

├── public/                  # Static assets```

├── dist/                    # Production build

└── package.json**Edit a file directly in GitHub**

```

- Navigate to the desired file(s).

## 📦 NPM Scripts- Click the "Edit" button (pencil icon) at the top right of the file view.

- Make your changes and commit the changes.

```bash

npm run dev          # Start development server (http://localhost:8080/)**Use GitHub Codespaces**

npm run build        # Build for production

npm run preview      # Preview production build- Navigate to the main page of your repository.

npm run lint         # Run ESLint- Click on the "Code" button (green button) near the top right.

```- Select the "Codespaces" tab.

- Click on "New codespace" to launch a new Codespace environment.

## ✨ Key Features- Edit files directly within the Codespace and commit and push your changes once you're done.



### 25-Feature CVD Model## What technologies are used for this project?

- Demographics (4), CVD History (3), Clinical (9)

- Lipids (5), Lifestyle (5), Diagnosis (1)This project is built with:



### 4 Risk Models- Vite

- **Framingham**: General 10-year CVD risk- TypeScript

- **ASCVD**: US population pooled cohort- React

- **INTERHEART**: 52-country global data- shadcn-ui

- **Indian-Adjusted**: Population-optimized (NEW!)- Tailwind CSS



### 8 Indian Population Adjustments## How can I deploy this project?

- Age, Triglycerides, Waist Circumference

- Lipoprotein(a), Diabetes, HDL ProtectionSimply open [Lovable](https://lovable.dev/projects/ce6c9c1a-4008-4e2e-b906-16be20fa5f72) and click on Share -> Publish.

- Betel Quid, Systolic BP

## Can I connect a custom domain to my Lovable project?

## 🧪 Testing

Yes, you can!

```bash

npm test     # Run unit tests (requires vitest config)To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

```

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

**Test Suite**: 140+ tests with 95%+ coverage

## 🌍 Environment Variables

See `.env.example` for required variables:
- Supabase credentials
- API keys (OpenAI, Google Gemini)
- Database configuration

## 🚢 Deployment

**Vercel** (pre-configured):
```bash
npm run build
vercel deploy
```

## 🛠️ Tech Stack

- **React** 18.3 + **TypeScript** 5.8
- **Vite** 5.4 (build tool)
- **Tailwind CSS** 3.4 + **shadcn/ui**
- **Vitest** (testing)
- **Supabase** (database)

## 📁 Key Implementation Files

### Components
- `src/components/EnhancedPatientForm.tsx` - 25-feature patient data form
- `src/components/MultiModelRiskDisplay.tsx` - Multi-model risk results

### Services  
- `src/lib/enhancedCVDRiskAssessment.ts` - Risk calculation engine
- `src/lib/dataPreprocessingService.ts` - Data preprocessing pipeline
- `src/lib/indianCVDDataset.ts` - Sample Indian CVD data

### Tests
- `src/__tests__/enhancedCVDRiskAssessment.test.ts` - 140+ unit tests

## 💻 Development Workflow

```bash
# Start coding
npm run dev

# Build when ready for production
npm run build

# Check for linting issues
npm run lint

# Run tests (when configured)
npm test
```

## 📊 Application Status

✅ **Production Ready**  
✅ **Development Server Running** at http://localhost:8080/  
✅ **0 Build Errors**  
✅ **25-Feature Model** Fully Implemented  
✅ **4 Risk Models** Integrated  
✅ **140+ Unit Tests** Created  

---

**Version**: 1.0.0 | **Last Updated**: November 2025
