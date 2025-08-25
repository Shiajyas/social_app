import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useSearchParams } from "react-router-dom";
import { userService } from "@/services/userService";
import { usePlanStore } from "@/appStore/usePlanStore";

const stripePromise = loadStripe(
  "pk_test_51R96FJH8pkRmmJ6859FuaBwszQN9xD2Z46Tflj0UAyQ399Jbtas29w20el9NbCvhy2nWqY5y9p0kd9ANqMMe9fKy00X5qntRpU"
);

interface StripePaymentProps {
  userId: string;
  planId: string;
  onSuccess: () => void;
  refreshSubscription: () => void;
}

const CheckoutForm = ({
  userId,
  planId,
  paymentIntentId,
  onSubscriptionConfirmed,
  refreshSubscription,
}: {
  userId: string;
  planId: string;
  paymentIntentId: string;
  onSubscriptionConfirmed: () => void;
  refreshSubscription: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const {selectedPlan} = usePlanStore();

  // 🔑 Call backend to confirm subscription
  const confirmSubscription = async (paymentId: string) => {
    try {
      await userService.confirmSubscription(userId, planId, paymentId);
      onSubscriptionConfirmed();
      refreshSubscription();
      setMessage("✅ Subscription confirmed!");
    } catch (err) {
      setMessage(`❌ Error confirming subscription: ${(err as Error).message}`);
    }
  };

  // 🔑 Handle redirect case after Stripe checkout
  useEffect(() => {
    if (!stripe) return;

    const clientSecret = searchParams.get("payment_intent_client_secret");
    const redirectStatus = searchParams.get("redirect_status");

    if (clientSecret && redirectStatus === "succeeded") {
      (async () => {
        try {
          const { paymentIntent } = await stripe.retrievePaymentIntent(
            clientSecret
          );
          console.log("🔄 Retrieved payment intent:", paymentIntent);

          if (paymentIntent?.status === "succeeded") {
            await confirmSubscription(paymentIntent.id);
          } else if (paymentIntent?.status === "processing") {
            setMessage("⏳ Payment is still processing...");
          } else {
            setMessage("⚠️ Payment failed or was canceled.");
          }
        } catch (error: any) {
          setMessage(`❌ Error: ${error.message}`);
        }
      })();
    }
  }, [stripe, searchParams]);

  // 🔑 Handle direct form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage("");

    console.log("🟦 Submitting payment with Stripe…");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // Stripe will redirect if needed
      },
      redirect: "if_required", // avoid unnecessary redirect unless required
    });

    console.log("🟩 Stripe confirmPayment result:", result);

    if (result.error) {
      setMessage(`❌ ${result.error.message}`);
    } else if (result.paymentIntent?.status === "succeeded") {
      console.log("🎉 Payment succeeded:", result.paymentIntent);
      await confirmSubscription(result.paymentIntent.id);
    } else if (result.paymentIntent?.status === "processing") {
      setMessage("⏳ Payment is processing...");
    } else {
      setMessage("⚠️ Payment was not successful.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <label className="font-semibold text-sm text-gray-700 mb-1 block">
        Payment Details:
      </label>
      <div className="bg-white border rounded-md p-4 shadow-sm">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all"
      >
        {loading ? "Processing..." : `Pay ${selectedPlan?.amount}`}
      </button>

      {message && (
        <p className="text-sm text-center text-red-600 mt-2">{message}</p>
      )}
    </form>
  );
};

const StripePayment: React.FC<StripePaymentProps> = ({
  userId,
  planId,
  onSuccess,
  refreshSubscription,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  console.log(planId, ">>>>>>>>>>>>")

  // Create payment intent on mount
  useEffect(() => {
    userService
      .subscribe(userId, planId)
      .then((res) => {
        if (res.clientSecret) setClientSecret(res.clientSecret);
        if (res.paymentIntentId) setPaymentIntentId(res.paymentIntentId);
      })
      .catch((err) => console.error("❌ Error fetching client secret:", err));
  }, [userId, planId]);

  const handleSubscriptionConfirmed = () => {
    console.log("🔔 Subscription confirmed callback fired!");
    onSuccess();
  };

  if (!clientSecret || !paymentIntentId)
    return <p>Loading payment details...</p>;

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <CheckoutForm
        userId={userId}
        planId={planId}
        paymentIntentId={paymentIntentId}
        onSubscriptionConfirmed={handleSubscriptionConfirmed}
        refreshSubscription={refreshSubscription}
      />
    </Elements>
  );
};

export default StripePayment;
