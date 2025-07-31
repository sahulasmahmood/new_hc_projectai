
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, Activity, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import axios from "axios";

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types for AI analysis response
interface PossibleCondition {
  name: string;
  probability: string;
  description: string;
}

interface SuggestedMedication {
  name: string;
  type: string;
  purpose: string;
  disclaimer: string;
}

interface RecommendedSpecialist {
  type: string;
  reason: string;
  urgency: string;
}

interface AIAnalysis {
  possibleConditions: PossibleCondition[];
  recommendedActions: string[];
  suggestedMedications?: SuggestedMedication[];
  recommendedSpecialist?: RecommendedSpecialist;
  urgencyLevel: string;
  disclaimer: string;
  generalAdvice: string;
  analyzedAt: string;
  inputSymptoms: string;
  fallbackUsed?: boolean;
  aiProvider?: string;
  nonMedicalQuery?: boolean;
  language?: string;
}

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const { toast } = useToast();

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <Zap className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'emergency':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast({
        title: "Error",
        description: "Please enter your symptoms",
        variant: "destructive",
      });
      return;
    }

    if (symptoms.trim().length < 10) {
      toast({
        title: "Error",
        description: "Please provide a more detailed description of your symptoms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const response = await axios.post(`${API_URL}/ai/analyze-symptoms`, {
        symptoms: symptoms.trim()
      });

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        toast({
          title: "Analysis Complete",
          description: "AI has analyzed your symptoms successfully.",
        });
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error analyzing symptoms:", error);
      const errorMessage = error.response?.data?.error || error.message || "Unable to analyze symptoms. Please try again.";
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setSymptoms("");
    setAnalysis(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Stethoscope className="h-8 w-8 text-medical-500" />
        <h1 className="text-3xl font-bold text-gray-900">AI Symptom Analysis</h1>
      </div>

      <Card className="p-8 bg-white border border-gray-100 rounded-xl shadow-lg animate-fadeIn">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-gray-700 font-medium">Describe your symptoms</label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe your symptoms in detail (e.g., fever, headache, cough)..."
              className="min-h-[200px] resize-none"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-medical-500 hover:bg-medical-600 text-white"
            disabled={loading}
          >
            <Stethoscope className="mr-2 h-5 w-5" />
            {loading ? "Analyzing..." : "Analyze Symptoms"}
          </Button>
        </form>
      </Card>

      {analysis && (
        <>
          {/* Non-Medical Query Warning */}
          {analysis.nonMedicalQuery && (
            <Card className="p-6 border-2 border-orange-200 bg-orange-50 rounded-xl shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-800">Non-Medical Query Detected</h3>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-orange-700">
                  I can only provide analysis for health and medical-related symptoms. Your query appears to be about a non-medical topic.
                </p>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">
                    💡 Please describe your health concerns, symptoms, or medical questions for proper analysis.
                  </p>
                </div>
                <div className="text-xs text-orange-600">
                  <strong>Examples of medical queries:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>"I have a headache and feel nauseous"</li>
                    <li>"I've been experiencing chest pain"</li>
                    <li>"I have a fever and sore throat"</li>
                    <li>"I feel dizzy and tired"</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Urgency Level Card - Only show for medical queries */}
          {!analysis.nonMedicalQuery && (
            <Card className={`p-6 border-2 rounded-xl shadow-lg animate-fadeIn ${getUrgencyColor(analysis.urgencyLevel)}`}>
              <div className="flex items-center gap-3 mb-2">
                {getUrgencyIcon(analysis.urgencyLevel)}
                <h3 className="text-lg font-semibold">Urgency Level: {analysis.urgencyLevel}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {analysis.urgencyLevel.toLowerCase() === 'emergency' 
                  ? 'Seek immediate medical attention!' 
                  : analysis.urgencyLevel.toLowerCase() === 'high'
                  ? 'Consider consulting a healthcare provider soon.'
                  : analysis.urgencyLevel.toLowerCase() === 'medium'
                  ? 'Monitor symptoms and consider medical consultation if they worsen.'
                  : 'Symptoms appear to be mild, but monitor for changes.'}
              </p>
            </Card>
          )}

          {/* Fallback Notice */}
          {analysis.fallbackUsed && (
            <Card className="p-4 bg-yellow-50 border-yellow-200 border-2 rounded-xl shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">Fallback Analysis Used</h3>
                  <p className="text-xs text-yellow-700">
                    AI service is temporarily busy. Using backup analysis system. Results may be less detailed.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Analysis Results Card - Only show for medical queries */}
          {!analysis.nonMedicalQuery && (
            <Card className="p-8 bg-white border border-gray-100 rounded-xl shadow-lg animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-6 w-6 text-medical-500" />
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                <div className="flex gap-2">
                  {analysis.aiProvider && (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      analysis.aiProvider === 'GROQ' 
                        ? 'bg-green-100 text-green-800' 
                        : analysis.aiProvider === 'Gemini'
                        ? 'bg-blue-100 text-blue-800'
                        : analysis.aiProvider === 'Medical Filter'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {analysis.aiProvider === 'Fallback' 
                        ? 'Backup System' 
                        : analysis.aiProvider === 'GROQ'
                        ? `⚡ Powered by ${analysis.aiProvider} (Fast)`
                        : analysis.aiProvider === 'Medical Filter'
                        ? 'Medical Filter'
                        : `Powered by ${analysis.aiProvider}`}
                    </span>
                  )}
                  {analysis.language && analysis.language === 'TAMIL' && (
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-purple-100 text-purple-800">
                      🌐 தமிழ் (Tamil)
                    </span>
                  )}
                </div>
              </div>
            
            <div className="space-y-6">
              {/* Possible Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Possible Conditions</h3>
                <div className="space-y-3">
                  {analysis.possibleConditions.map((condition, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{condition.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProbabilityColor(condition.probability)}`}>
                          {condition.probability} Probability
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{condition.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recommended Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Recommended Actions</h3>
                <ul className="space-y-2">
                  {analysis.recommendedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Medications */}
              {analysis.suggestedMedications && analysis.suggestedMedications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">💊 Suggested Medications</h3>
                  <div className="space-y-3">
                    {analysis.suggestedMedications.map((medication, index) => (
                      <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{medication.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {medication.type}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-700"><strong>Purpose:</strong> {medication.purpose}</p>
                    {/*       <p className="text-gray-700"><strong>Dosage:</strong> {medication.dosage}</p> */}
                          <p className="text-orange-600 text-xs font-medium">⚠️ {medication.disclaimer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Specialist */}
              {analysis.recommendedSpecialist && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">🏥 Recommended Specialist</h3>
                  <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{analysis.recommendedSpecialist.type}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        analysis.recommendedSpecialist.urgency.toLowerCase() === 'emergency'
                          ? 'bg-red-100 text-red-800'
                          : analysis.recommendedSpecialist.urgency.toLowerCase() === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : analysis.recommendedSpecialist.urgency.toLowerCase() === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {analysis.recommendedSpecialist.urgency} Priority
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{analysis.recommendedSpecialist.reason}</p>
                    <div className="mt-2 text-xs text-purple-600">
                      💡 Consider booking an appointment with this specialist for proper evaluation
                    </div>
                  </div>
                </div>
              )}

              {/* General Advice */}
              {analysis.generalAdvice && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">General Advice</h3>
                  <p className="text-gray-600 bg-blue-50 p-4 rounded-lg">{analysis.generalAdvice}</p>
                </div>
              )}
              
              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-medical-50 rounded-lg border-l-4 border-medical-500">
                <p className="text-sm text-medical-700 font-medium mb-1">Important Disclaimer</p>
                <p className="text-sm text-medical-600">{analysis.disclaimer}</p>
              </div>

              {/* Analysis Info */}
              <div className="text-xs text-gray-400 border-t pt-4">
                <p>Analysis completed at: {new Date(analysis.analyzedAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          )}

          {/* Clear Results Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleClearForm}
              variant="outline"
              className="px-6"
            >
              Clear Results & Start New Analysis
            </Button>
          </div>
        </>
      )}

      <Card className="p-8 bg-white border border-gray-100 rounded-xl shadow-lg animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical History</h2>
        <p className="text-gray-500">No previous medical records found.</p>
      </Card>
    </div>
  );
}
