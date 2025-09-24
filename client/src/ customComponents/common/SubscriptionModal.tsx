import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import SubscriptionPlanPreview from "./SubscriptionPlanPreview";
import StripePayment from "@/features/StripePayment";
import { useSubscriptionHistory } from "@/hooks/stripeHooks/useSubscriptionHistory";
import { userService } from "@/services/userService";
import { usePlanStore } from "@/appStore/usePlanStore";

interface Plan {
  _id: string;
  name: string;
  amount: number;
  duration: number;
  description: string;
}

const SubscriptionStatus: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<"plan" | "payment" | "success">("plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const { selectedPlan, setSelectedPlan } = usePlanStore();
  const [showHistory, setShowHistory] = useState(false);
  const [subscription, setSubscription] = useState<{
    isSubscribed: boolean;
    endDate: string;
    planId?: { name: string; description: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: history, isLoading: isHistoryLoading, refetch: fetchHistory } =
    useSubscriptionHistory(userId!);

  const now = new Date();
  const isExpired = subscription && new Date(subscription.endDate) < now;

  // Fetch current subscription
  const fetchSubscription = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await userService.getSubcriptiontDetails(userId);
      setSubscription(res || null);
    } catch (err) {
      console.error("Failed to fetch subscription", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch plans + subscription on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await userService.getPlans();
        setPlans(res.subscriptions || []);
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };
    fetchPlans();
    fetchSubscription();
  }, [fetchSubscription]);

  // Handle Stripe redirect success
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const redirectStatus = searchParams.get("redirect_status");
        if (redirectStatus === "succeeded") {
          setStep("success");
          await userService.confirmSubscription(
            userId!,
            selectedPlan!._id,
            searchParams.get("payment_intent")!
          );
          fetchSubscription();
        }
      } catch (error) {
        console.error("Redirect handling failed:", error);
      }
    };
    handleRedirect();
  }, [searchParams, fetchSubscription, userId, selectedPlan]);

  const handleToggleHistory = () => {
    if (!showHistory) fetchHistory();
    setShowHistory((prev) => !prev);
  };

  const renderHistory = () => (
    <div className="transition-all duration-300 ease-in-out">
      <button
        className="flex items-center gap-1 text-sm text-purple-600 hover:underline dark:text-purple-400 mt-4"
        onClick={handleToggleHistory}
      >
        {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showHistory ? "Hide Subscription History" : "View Subscription History"}
      </button>

      {showHistory && (
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-900 shadow-inner text-sm relative max-h-48 overflow-y-auto scrollbar-hide">
          {isHistoryLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
          ) : history?.length ? (
            <ul className="space-y-1">
              {history.map((sub: any, idx: number) => (
                <li
                  key={idx}
                  className="flex justify-between border-b border-dashed border-gray-200 dark:border-gray-700 pb-1"
                >
                  <span className="text-gray-800 dark:text-gray-300">
                    {new Date(sub.startDate).toLocaleDateString()} →{" "}
                    {new Date(sub.endDate).toLocaleDateString()}
                  </span>
                  <span
                    className={clsx(
                      "font-semibold",
                      sub.isSubscribed ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {sub.isSubscribed ? "Active" : "Expired"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No subscription history found.</p>
          )}
        </div>
      )}
    </div>
  );

  const renderBackButton = () => {
    if (step === "plan") return null;

    return (
      <button
        onClick={() => setStep("plan")}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>
    );
  };

  // ---------- UI ----------
  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center text-gray-600 dark:text-gray-300">
        <Clock className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  // Active Subscription
  if (subscription?.isSubscribed && !isExpired) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 shadow-md border border-green-200 dark:border-green-600 rounded-lg space-y-6 overflow-y-auto">
        <div className="flex flex-col justify-center items-center space-y-3 text-green-700 dark:text-green-400">
          <CheckCircle className="h-10 w-10 text-green-500 dark:text-green-400" />
          <p className="text-lg font-semibold">You're subscribed until:</p>
          <span className="font-bold text-xl">{new Date(subscription.endDate).toLocaleDateString()}</span>
          <div className="bg-green-50 dark:bg-green-900 px-4 py-2 rounded-lg shadow-sm text-center">
            <p className="font-semibold text-green-800 dark:text-green-300">{subscription.planId?.name}</p>
            <p className="text-sm text-green-600 dark:text-green-400">{subscription.planId?.description}</p>
          </div>
        </div>
        {renderHistory()}
      </div>
    );
  }

  // Expired or Not Subscribed (inside layout, not fixed)
  return (
    <div className="p-6 md:p-12 bg-white dark:bg-gray-900 rounded-lg shadow-md max-w-5xl mx-auto space-y-8 overflow-y-auto">
      {renderBackButton()}

      {step === "plan" && (
        <>
          <div className="space-y-4 text-center">
            <div className="flex justify-center items-center gap-2 text-red-600 dark:text-red-400 font-medium">
              <XCircle className="h-8 w-8" />
              <p className="text-xl">{subscription ? "Subscription expired" : "Not Subscribed"}</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-base">
              {subscription
                ? "Renew your subscription to continue enjoying premium features."
                : "Subscribe to access premium features."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans?.map((plan) => (
              <SubscriptionPlanPreview
                key={plan._id}
                name={plan.name}
                price={`$${plan.amount}/month`}
                description={plan.description}
                isSelected={selectedPlan?._id === plan._id}
                onSelect={() => setSelectedPlan(plan)}
              />
            ))}
          </div>

          <button
            className="w-full md:w-1/2 mx-auto py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 block"
            onClick={() => selectedPlan && setStep("payment")}
            disabled={!selectedPlan}
          >
            Subscribe Now
          </button>

          {renderHistory()}
        </>
      )}

      {step === "payment" && selectedPlan && (
        <StripePayment
          userId={userId!}
          planId={selectedPlan._id}
          onSuccess={() => setStep("success")}
          refreshSubscription={fetchSubscription}
        />
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">🎉 Subscription successful!</p>
          <p className="text-gray-600 dark:text-gray-300 text-base">
            Enjoy all the premium features right away.
          </p>
          <button
            onClick={() => {
              fetchSubscription();
              navigate(`/home/profile/${userId}`);
            }}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow transition"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
