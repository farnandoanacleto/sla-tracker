import { supabase } from '@/services/supabase';

export type TConsentType = 'privacy_policy' | 'terms_of_use';

const getClientIp = async (): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json() as { ip: string };
    return data.ip;
  } catch {
    return null;
  }
};

export const recordUserConsents = async (
  userId: string,
  consentTypes: TConsentType[],
): Promise<void> => {
  const ipAddress = await getClientIp();
  const userAgent = navigator.userAgent;
  const acceptedAt = new Date().toISOString();

  const records = consentTypes.map((consentType) => ({
    user_id: userId,
    consent_type: consentType,
    accepted_at: acceptedAt,
    ip_address: ipAddress,
    user_agent: userAgent,
  }));

  const { error } = await supabase
    .from('user_consents')
    .upsert(records, { onConflict: 'user_id,consent_type' });

  if (error) throw error;
};
