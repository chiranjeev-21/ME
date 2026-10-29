import { useEffect, useState } from 'react';
import type { HiddenQuestResponse } from '@/types';

const FALLBACK_RESPONSE: HiddenQuestResponse = {
  source: 'fallback',
  profile: {
    login: 'chiranjeev-21',
    name: 'Chiranjeev Singh',
    url: 'https://github.com/chiranjeev-21',
  },
  items: [
    {
      id: 'fallback-face-mask-detection',
      name: 'Real-Time Face-Mask Detection',
      description:
        'YOLO-based system for detecting mask offenders in real-time via camera surveillance. Published with Intellectual Property India, 2022.',
      url: 'https://drive.google.com/drive/u/1/folders/1Kzb7cPkzDbj38a8uRQgOvbUnCQTpJK8Z',
      homepageUrl: null,
      primaryLanguage: {
        name: 'Computer Vision',
        color: '#38bdf8',
      },
      stargazerCount: 0,
      forkCount: 0,
      updatedAt: '2022-01-01T00:00:00.000Z',
      topics: ['yolo', 'opencv', 'surveillance'],
    },
  ],
  message: 'Showing the local fallback artifact while the vault connection is unavailable.',
};

export interface UsePinnedQuestsState {
  data: HiddenQuestResponse;
  isLoading: boolean;
  notice?: string;
}

function isWebUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isHiddenQuestResponse(value: unknown): value is HiddenQuestResponse {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<HiddenQuestResponse>;

  return (
    (candidate.source === 'github' || candidate.source === 'fallback') &&
    !!candidate.profile &&
    typeof candidate.profile.login === 'string' &&
    isWebUrl(candidate.profile.url) &&
    (candidate.message === undefined || typeof candidate.message === 'string') &&
    (candidate.selection === undefined ||
      candidate.selection === 'pinned' ||
      candidate.selection === 'recent') &&
    Array.isArray(candidate.items) &&
    candidate.items.length > 0 &&
    candidate.items.every(
      item =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.description === 'string' &&
        isWebUrl(item.url) &&
        (!item.homepageUrl || isWebUrl(item.homepageUrl)) &&
        Number.isFinite(item.stargazerCount) &&
        Number.isFinite(item.forkCount) &&
        typeof item.updatedAt === 'string' &&
        Number.isFinite(Date.parse(item.updatedAt)) &&
        (!item.primaryLanguage ||
          (typeof item.primaryLanguage.name === 'string' &&
            (item.primaryLanguage.color == null ||
              typeof item.primaryLanguage.color === 'string'))) &&
        Array.isArray(item.topics) &&
        item.topics.every((topic: unknown) => typeof topic === 'string')
    )
  );
}

export function usePinnedQuests(): UsePinnedQuestsState {
  const [state, setState] = useState<UsePinnedQuestsState>({
    data: FALLBACK_RESPONSE,
    isLoading: true,
    notice: 'Scanning the vault for hidden artifacts...',
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort('timeout'), 15000);

    const loadPinnedQuests = async () => {
      try {
        const response = await fetch('/api/github-pinned', {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Pinned quest request failed with status ${response.status}.`);
        }

        const payload: unknown = await response.json();

        if (!isHiddenQuestResponse(payload)) {
          throw new Error('Pinned quest response shape was invalid.');
        }

        if (controller.signal.aborted) return;

        setState({
          data: payload,
          isLoading: false,
          notice: payload.message,
        });
      } catch (error) {
        if (controller.signal.aborted && controller.signal.reason !== 'timeout') return;

        const fallbackNotice =
          error instanceof Error
            ? `${FALLBACK_RESPONSE.message} Live sync is currently unavailable.`
            : FALLBACK_RESPONSE.message;

        setState({
          data: FALLBACK_RESPONSE,
          isLoading: false,
          notice: fallbackNotice,
        });
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void loadPinnedQuests();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return state;
}
