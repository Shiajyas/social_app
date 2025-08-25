import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { adminSubscriptionService } from '@/services/adminSubscriptionService';
import PlanManagementModal from './PlanManagementModal';

interface Subscription {
  _id: string;
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  planId: string;
  isSubscribed: boolean;
  startDate: Date;
  endDate: Date;
}

interface Plan {
  _id?: string;
  name: string;
  amount: number;
  duration: number;
  description?: string; 
  isActive?: boolean;
}

const ITEMS_PER_PAGE = 6; // 👈 Show 6 plans per page

const SubscriptionManagement: React.FC = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all plans
  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => adminSubscriptionService.getPlans(),
  });

  const plans = plansData?.subscriptions || [];

  // Pagination logic
  const totalPages = Math.ceil(plans.length / ITEMS_PER_PAGE);
  const paginatedPlans = plans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Fetch subscriptions for a selected plan
  const { data: subscriptions, isLoading: isSubsLoading } = useQuery({
    queryKey: ['subscriptions', selectedPlanId],
    queryFn: () => adminSubscriptionService.getSubscriptions({ planId: selectedPlanId }),
    enabled: !!selectedPlanId,
  });

  const handleTogglePlan = async (plan: Plan) => {
    await adminSubscriptionService.togglePlanStatus(plan._id!, plan.isActive);
    refetchPlans();
  };

  const handleSavePlan = async (plan: Plan) => {
    await adminSubscriptionService.createOrUpdatePlan(plan);
    setEditingPlan(null);
    setPlanModalOpen(false);
    refetchPlans();
    alert('Plan saved successfully');
  };

return (
  <div className="p-6 max-w-7xl mx-auto text-gray-800 dark:text-gray-100">
    {/* Header + Add Plan Button */}
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold">📦 Subscription Plans</h2>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
        onClick={() => {
          setEditingPlan(null);
          setPlanModalOpen(true);
        }}
      >
        + Add Plan
      </button>
    </div>

    {/* Plan Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {paginatedPlans.map((plan: Plan) => (
        <div
          key={plan._id}
          className="border rounded-2xl shadow-lg p-5 bg-white dark:bg-gray-800 hover:shadow-xl transition duration-200"
        >
          <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
       
          <span
            className={`px-2 py-1 text-xs rounded ${
              plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}
          >
            {plan.isActive ? 'Active' : 'Inactive'}
          </span>

          <p className="mt-3 text-lg font-semibold text-indigo-600">
            💲{plan.amount}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Duration: {plan.duration} Months
          </p>
               <p>Created on: {format(new Date(plan.createdAt), 'dd/MM/yyyy')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={() =>
                setSelectedPlanId(selectedPlanId === plan._id ? null : plan._id)
              }
            >
              {selectedPlanId === plan._id ? 'Hide Subscribers' : 'View Subscribers'}
            </button>

            <button
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              onClick={() => handleTogglePlan(plan)}
            >
              Toggle Plan
            </button>

            <button
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              onClick={() => {
                setEditingPlan(plan);
                setPlanModalOpen(true);
              }}
            >
              Edit Plan
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Pagination Controls */}
    {totalPages > 1 && (
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 transition"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Previous
        </button>
        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 transition"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    )}

    {/* Subscribers Table */}
    {selectedPlanId && (
      <div className="mt-8 border rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800">
        <h3 className="text-2xl font-semibold mb-4">
          👥 Subscribers for {plans.find((p) => p._id === selectedPlanId)?.name}
        </h3>

        {isSubsLoading ? (
          <p>Loading subscribers...</p>
        ) : subscriptions?.length > 0 ? (
          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                <tr>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Email</th>
                  {/* <th className="px-6 py-3">User ID</th> */}
                  <th className="px-6 py-3">Subscribed</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {subscriptions
                  .filter((sub: Subscription) => sub?.planId?._id === selectedPlanId)
                  .map((sub: Subscription) => (
                    <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">{sub.userId.username}</td>
                      <td className="px-6 py-4">{sub.userId.email}</td>
                      {/* <td className="px-6 py-4">{sub.userId._id}</td> */}
                      <td className="px-6 py-4">
                        {sub.isSubscribed ? (
                          <span className="text-green-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-500 font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{sub.startDate ? format(new Date(sub.startDate), 'PP') : 'N/A'}</td>
                      <td className="px-6 py-4">{sub.endDate ? format(new Date(sub.endDate), 'PP') : 'N/A'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No subscribers found for this plan.</p>
        )}
      </div>
    )}

    {/* Plan Management Modal */}
    <PlanManagementModal
      isOpen={planModalOpen}
      onClose={() => {
        setEditingPlan(null);
        setPlanModalOpen(false);
      }}
      onSave={handleSavePlan}
      initialData={editingPlan}
    />
  </div>
);

};

export default SubscriptionManagement;
