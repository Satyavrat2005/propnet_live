import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useEventTracking } from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight, User, Home, MessageCircle, Target } from "lucide-react";
import { useLocation } from "wouter";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  route?: string;
  action?: () => void;
}

export default function OnboardingTracker() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { trackOnboarding } = useEventTracking();
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchOnboardingStatus();
    }
  }, [user?.id]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch(`/api/analytics/user/${user?.id}/onboarding`);
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
      }
    } catch (error) {
      console.warn('Failed to fetch onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Complete Your Profile",
      description: "Add your name, agency details, and profile photo",
      icon: User,
      completed: onboardingData?.profileCompleted || false,
      route: "/edit-profile"
    },
    {
      id: 2,
      title: "Add Your First Property",
      description: "List your first property to start attracting clients",
      icon: Home,
      completed: onboardingData?.firstPropertyAdded || false,
      route: "/add-property"
    },
    {
      id: 3,
      title: "Post a Requirement",
      description: "Share what your clients are looking for",
      icon: Target,
      completed: onboardingData?.firstRequirementAdded || false,
      route: "/add-requirement"
    },
    {
      id: 4,
      title: "Start Networking",
      description: "Send your first message to connect with other agents",
      icon: MessageCircle,
      completed: onboardingData?.firstMessageSent || false,
      route: "/messages"
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const handleStepClick = async (step: OnboardingStep) => {
    if (step.completed) return;

    // Track the step attempt
    trackOnboarding(step.title, step.completed);

    if (step.route) {
      setLocation(step.route);
    } else if (step.action) {
      step.action();
    }
  };

  const completeOnboarding = async () => {
    try {
      await fetch('/api/analytics/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      fetchOnboardingStatus();
    } catch (error) {
      console.warn('Failed to complete onboarding');
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (onboardingData?.onboardingCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Welcome to the Platform!
          </h3>
          <p className="text-green-600">
            You've completed the onboarding process. Start exploring and growing your network!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Get Started</span>
          <Badge variant="outline">
            {completedSteps}/{steps.length} Complete
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <Progress value={progressPercentage} className="w-full" />
          <p className="text-sm text-gray-600">
            Complete these steps to make the most of your experience
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${
              step.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleStepClick(step)}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-shrink-0">
              <step.icon className={`w-8 h-8 ${step.completed ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${step.completed ? 'text-green-800' : 'text-gray-900'}`}>
                {step.title}
              </h4>
              <p className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                {step.description}
              </p>
            </div>
            
            {!step.completed && (
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        ))}
        
        {completedSteps === steps.length && (
          <div className="pt-4 border-t">
            <Button 
              onClick={completeOnboarding}
              className="w-full"
            >
              Complete Onboarding
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}