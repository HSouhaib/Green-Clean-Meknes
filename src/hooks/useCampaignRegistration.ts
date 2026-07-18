import { trpc } from '@/lib/trpc';

export function useCampaignRegistration(campaignId: number) {
  const utils = trpc.useUtils();

  const { data: status } = trpc.campaign.myRegistrationStatus.useQuery(
    { id: campaignId },
    { enabled: !!campaignId, retry: false }
  );

  const { data: count } = trpc.campaign.registrationCount.useQuery(
    { id: campaignId },
    { enabled: !!campaignId }
  );

  const register = trpc.campaign.register.useMutation({
    onSuccess: () => {
      utils.campaign.myRegistrationStatus.invalidate({ id: campaignId });
      utils.campaign.registrationCount.invalidate({ id: campaignId });
    },
  });

  const unregister = trpc.campaign.unregister.useMutation({
    onSuccess: () => {
      utils.campaign.myRegistrationStatus.invalidate({ id: campaignId });
      utils.campaign.registrationCount.invalidate({ id: campaignId });
    },
  });

  const isRegistered = status === 'registered';
  const isLoading = register.isPending || unregister.isPending;

  return {
    isRegistered,
    count: count ?? 0,
    isLoading,
    register: () => register.mutate({ id: campaignId }),
    unregister: () => unregister.mutate({ id: campaignId }),
  };
}
