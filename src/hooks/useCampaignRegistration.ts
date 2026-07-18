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
    onMutate: async () => {
      await utils.campaign.myRegistrationStatus.cancel({ id: campaignId });
      await utils.campaign.registrationCount.cancel({ id: campaignId });
      const previousStatus = utils.campaign.myRegistrationStatus.getData({ id: campaignId });
      const previousCount = utils.campaign.registrationCount.getData({ id: campaignId });
      utils.campaign.myRegistrationStatus.setData({ id: campaignId }, 'registered');
      utils.campaign.registrationCount.setData({ id: campaignId }, (old) => (old ?? 0) + 1);
      return { previousStatus, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStatus !== undefined) {
        utils.campaign.myRegistrationStatus.setData({ id: campaignId }, context.previousStatus);
      }
      if (context?.previousCount !== undefined) {
        utils.campaign.registrationCount.setData({ id: campaignId }, context.previousCount);
      }
    },
    onSettled: async () => {
      await utils.campaign.myRegistrationStatus.invalidate({ id: campaignId });
      await utils.campaign.registrationCount.invalidate({ id: campaignId });
      await utils.campaign.myRegistrations.invalidate();
    },
  });

  const unregister = trpc.campaign.unregister.useMutation({
    onMutate: async () => {
      await utils.campaign.myRegistrationStatus.cancel({ id: campaignId });
      await utils.campaign.registrationCount.cancel({ id: campaignId });
      const previousStatus = utils.campaign.myRegistrationStatus.getData({ id: campaignId });
      const previousCount = utils.campaign.registrationCount.getData({ id: campaignId });
      utils.campaign.myRegistrationStatus.setData({ id: campaignId }, undefined);
      utils.campaign.registrationCount.setData({ id: campaignId }, (old) => Math.max((old ?? 1) - 1, 0));
      return { previousStatus, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStatus !== undefined) {
        utils.campaign.myRegistrationStatus.setData({ id: campaignId }, context.previousStatus);
      }
      if (context?.previousCount !== undefined) {
        utils.campaign.registrationCount.setData({ id: campaignId }, context.previousCount);
      }
    },
    onSettled: async () => {
      await utils.campaign.myRegistrationStatus.invalidate({ id: campaignId });
      await utils.campaign.registrationCount.invalidate({ id: campaignId });
      await utils.campaign.myRegistrations.invalidate();
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
