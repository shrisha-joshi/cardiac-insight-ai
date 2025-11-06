import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Copy,
  RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseTable {
  name: string;
  exists: boolean;
  error?: string;
}

export default function DatabaseStatus() {
  const [checking, setChecking] = useState(false);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [projectUrl, setProjectUrl] = useState('');
  const [showSqlEditorDialog, setShowSqlEditorDialog] = useState(false);
  const [sqlEditorUrl, setSqlEditorUrl] = useState('');
  const { toast } = useToast();

  const requiredTables = ['profiles', 'medical_history', 'ml_datasets'];

  useEffect(() => {
    checkSupabaseConfig();
  }, []);

  const checkSupabaseConfig = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setSupabaseConfigured(!!(url && key && url !== 'https://placeholder.supabase.co'));
    setProjectUrl(url || '');
  };

  const checkDatabaseTables = async () => {
    setChecking(true);
    const tableResults: DatabaseTable[] = [];

    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
          .limit(1);

        tableResults.push({
          name: tableName,
          exists: !error,
          error: error?.message
        });
      } catch (err) {
        tableResults.push({
          name: tableName,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    setTables(tableResults);
    setChecking(false);
  };

  const copySetupScript = async () => {
    try {
      // Instead of fetching, we'll include the SQL directly
      const setupScript = `-- Supabase Database Setup Script
-- Copy and paste this into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE,
    phone TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS public.medical_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    patient_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ml_datasets table
CREATE TABLE IF NOT EXISTS public.ml_datasets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status TEXT DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create storage bucket for datasets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_datasets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own medical history" ON public.medical_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own datasets" ON public.ml_datasets
    FOR ALL USING (auth.uid() = user_id);

-- Insert initial data or configurations if needed
-- (Add any default settings or configurations here)`;
      
      await navigator.clipboard.writeText(setupScript);
      toast({
        title: "Copied!",
        description: "Database setup script copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy setup script. Please copy it manually from the repository.",
        variant: "destructive",
      });
    }
  };

  const allTablesExist = tables.length > 0 && tables.every(table => table.exists);
  const hasErrors = tables.some(table => !table.exists);

  if (!supabaseConfigured) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Supabase Not Configured
          </CardTitle>
          <CardDescription>
            Supabase database connection is not properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The application is using placeholder Supabase credentials. Database features will not work.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-semibold">To set up Supabase:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a new project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">supabase.com</a></li>
              <li>Update the .env file with your project URL and anon key</li>
              <li>Run the database setup script in your Supabase SQL editor</li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Check the status of required database tables and setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={supabaseConfigured ? "default" : "destructive"}>
                {supabaseConfigured ? "Connected" : "Not Connected"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {projectUrl}
              </span>
            </div>
            <Button
              onClick={checkDatabaseTables}
              disabled={checking || !supabaseConfigured}
              size="sm"
              variant="outline"
            >
              {checking ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Check Tables
            </Button>
          </div>

          {tables.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Database Tables</h4>
              <div className="grid gap-2">
                {tables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {table.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">{table.name}</span>
                    </div>
                    <Badge variant={table.exists ? "default" : "destructive"}>
                      {table.exists ? "Exists" : "Missing"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasErrors && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some required database tables are missing. You need to run the database setup script.
              </AlertDescription>
            </Alert>
          )}

          {!allTablesExist && supabaseConfigured && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold">Setup Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to your Supabase project dashboard
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => {
                      const editorUrl = projectUrl.includes('supabase.co') 
                        ? `https://supabase.com/dashboard/project/${projectUrl.split('.')[0].split('//')[1]}/sql/new`
                        : `${projectUrl}/project/default/sql`;
                      setSqlEditorUrl(editorUrl);
                      setShowSqlEditorDialog(true);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open SQL Editor
                  </Button>
                </li>
                <li>
                  Copy the database setup script
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={copySetupScript}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Script
                  </Button>
                </li>
                <li>Paste and run the script in the SQL editor</li>
                <li>Click "Check Tables" above to verify the setup</li>
              </ol>
            </div>
          )}

          {allTablesExist && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All required database tables are properly set up! Your application is ready to use.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* SQL Editor Dialog */}
      <Dialog open={showSqlEditorDialog} onOpenChange={setShowSqlEditorDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-500" />
              Open Supabase SQL Editor
            </DialogTitle>
            <DialogDescription>
              You'll be redirected to your Supabase project's SQL editor to run the database setup script.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold mb-1">Before opening:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Make sure you've copied the database setup script</li>
                    <li>Have your Supabase credentials ready</li>
                    <li>Be ready to paste and execute the script</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  window.open(sqlEditorUrl, '_blank', 'noopener,noreferrer');
                  toast({
                    title: "Opening SQL Editor",
                    description: "Supabase SQL Editor opened in a new tab.",
                  });
                  setShowSqlEditorDialog(false);
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlEditorUrl);
                    toast({
                      title: "URL Copied",
                      description: "SQL Editor URL copied to clipboard",
                    });
                  }}
                  variant="outline"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy URL
                </Button>

                <Button
                  onClick={() => setShowSqlEditorDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}